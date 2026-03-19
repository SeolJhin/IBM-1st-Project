# 경로: app/ai/room_embed.py
"""
방 설명 Milvus 임베딩 인덱서

역할:
  DB의 방 정보(room_desc, room_options 등)를 벡터로 변환하여 Milvus에 저장.
  이렇게 저장된 벡터를 room_recommend.py에서 의미 유사도 검색에 사용.

실행 방식:
  - 스케줄러(예: APScheduler)로 매일 새벽 실행 권장
  - 또는 방 정보가 변경될 때마다 트리거

Usage:
  python -m app.ai.room_embed          # 전체 재인덱싱
  python -m app.ai.room_embed --incremental  # 신규/변경분만
"""

import argparse
import asyncio
import logging

import aiomysql
from pymilvus import (
    CollectionSchema,
    DataType,
    FieldSchema,
    MilvusClient,
)

from app.ai.room_recommend import _get_embedding
from app.config.settings import settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

COLLECTION_NAME = "room_descriptions"

# BGE-M3 임베딩 차원 수 (BAAI/bge-m3 = 1024)
EMBEDDING_DIM = 1024

ROOM_TYPE_KO = {
    "one_room":   "원룸",
    "two_room":   "투룸",
    "three_room": "쓰리룸",
    "loft":       "복층",
    "share":      "쉐어룸",
}
SUN_KO = {"n": "북향", "s": "남향", "e": "동향", "w": "서향"}


def _room_to_text(row: dict) -> str:
    """
    방 DB 레코드 → 임베딩할 텍스트 문서 생성.
    방의 모든 특징을 자연어 문장으로 변환하여 의미 검색 품질을 높임.
    """
    room_type = ROOM_TYPE_KO.get(row.get("room_type", ""), row.get("room_type", ""))
    sun = SUN_KO.get(row.get("sun_direction", ""), "")
    pet = "반려동물 허용" if row.get("pet_allowed_yn") == "Y" else "반려동물 불가"
    total = int(row.get("rent_price", 0)) + int(row.get("manage_fee") or 0)

    options_str = str(row.get("room_options", "") or "").replace(",", ", ")
    desc_str = str(row.get("room_desc", "") or "")

    text_parts = [
        f"{row.get('building_nm', '')} {row.get('building_addr', '')}",
        f"{room_type} {row.get('floor', '')}층",
        f"{row.get('room_size', '')}㎡ {sun}",
        pet,
        f"월 {total:,}원 (월세 {int(row.get('rent_price', 0)):,}원 + 관리비 {int(row.get('manage_fee') or 0):,}원)",
        f"보증금 {int(row.get('deposit') or 0):,}원",
        f"최소 거주 {row.get('rent_min', '-')}개월",
        f"옵션: {options_str}" if options_str else "",
        desc_str,
    ]
    return " | ".join(p for p in text_parts if p)


async def _fetch_rooms(incremental: bool = False) -> list[dict]:
    """MySQL에서 방 목록 조회."""
    conn = await aiomysql.connect(
        host=settings.db_host,
        port=int(settings.db_port),
        db=settings.db_name,
        user=settings.db_user,
        password=settings.db_password,
        charset="utf8mb4",
    )
    async with conn.cursor(aiomysql.DictCursor) as cur:
        # 활성 방만 (delete_yn='N', 상태 available/contracted/reserved)
        await cur.execute("""
            SELECT
                r.room_id, r.room_no, r.floor, r.room_size, r.room_type,
                r.pet_allowed_yn, r.rent_price, r.manage_fee, r.deposit,
                r.rent_min, r.sun_direction, r.room_options, r.room_desc,
                r.room_st,
                b.building_nm, b.building_addr
            FROM rooms r
            JOIN building b ON r.building_id = b.building_id
            WHERE r.delete_yn = 'N'
              AND b.delete_yn = 'N'
        """)
        rows = await cur.fetchall()
    conn.close()
    return [dict(row) for row in rows]


def _ensure_collection(client: MilvusClient) -> None:
    """
    Milvus 컬렉션(Collection — 벡터 데이터를 저장하는 테이블과 유사한 구조) 생성.
    이미 존재하면 건너뜀.
    """
    existing = client.list_collections()
    if COLLECTION_NAME in existing:
        logger.info("[Embed] 기존 컬렉션 '%s' 사용", COLLECTION_NAME)
        return

    schema = CollectionSchema(
        fields=[
            FieldSchema(name="id",       dtype=DataType.INT64,        is_primary=True, auto_id=True),
            FieldSchema(name="room_id",  dtype=DataType.INT64),
            FieldSchema(name="vector",   dtype=DataType.FLOAT_VECTOR, dim=EMBEDDING_DIM),
            FieldSchema(name="text",     dtype=DataType.VARCHAR,      max_length=2000),
        ],
        description="UniPlace 방 설명 벡터 인덱스",
    )
    client.create_collection(
        collection_name=COLLECTION_NAME,
        schema=schema,
        index_params=client.prepare_index_params(
            field_name="vector",
            index_type="HNSW",   # HNSW = 고속 근사 최근접 이웃 검색 알고리즘
            metric_type="COSINE",
            params={"M": 16, "efConstruction": 200},
        ),
    )
    logger.info("[Embed] 컬렉션 '%s' 생성 완료", COLLECTION_NAME)


def _get_indexed_ids(client: MilvusClient) -> set[int]:
    """이미 인덱싱된 room_id 집합 반환 (증분 업데이트용)."""
    try:
        results = client.query(
            collection_name=COLLECTION_NAME,
            filter="room_id > 0",
            output_fields=["room_id"],
            limit=100_000,
        )
        return {r["room_id"] for r in results}
    except Exception:
        return set()


async def run_indexing(incremental: bool = False) -> None:
    """
    메인 인덱싱 함수.
    
    방 데이터를 DB에서 읽어 → 텍스트 변환 → 벡터 임베딩 → Milvus 저장.
    """
    logger.info("[Embed] 인덱싱 시작 (incremental=%s)", incremental)

    # Milvus 연결
    client = MilvusClient(
        uri=settings.milvus_uri,
        token=settings.milvus_token or "",
    )
    _ensure_collection(client)

    # 방 목록 조회
    rooms = await _fetch_rooms(incremental)
    logger.info("[Embed] DB에서 %d개 방 조회", len(rooms))

    if incremental:
        indexed_ids = _get_indexed_ids(client)
        rooms = [r for r in rooms if r["room_id"] not in indexed_ids]
        logger.info("[Embed] 신규 방 %d개만 인덱싱", len(rooms))

    if not rooms:
        logger.info("[Embed] 인덱싱할 방 없음. 종료.")
        return

    # 배치(Batch) 임베딩 — 한 번에 여러 개 처리하여 속도 향상
    BATCH_SIZE = 16
    total_indexed = 0

    for i in range(0, len(rooms), BATCH_SIZE):
        batch = rooms[i: i + BATCH_SIZE]
        vectors = []
        valid_rooms = []

        for room in batch:
            text = _room_to_text(room)
            vec = _get_embedding(text)
            if vec is None:
                logger.warning("[Embed] room_id=%d 임베딩 실패, 건너뜀", room["room_id"])
                continue
            vectors.append(vec)
            valid_rooms.append((room["room_id"], text))

        if not vectors:
            continue

        data = [
            {
                "room_id": rid,
                "vector":  vec,
                "text":    txt[:2000],  # Milvus VARCHAR 길이 제한
            }
            for (rid, txt), vec in zip(valid_rooms, vectors)
        ]
        client.insert(collection_name=COLLECTION_NAME, data=data)
        total_indexed += len(data)
        logger.info("[Embed] %d/%d 인덱싱 완료", min(i + BATCH_SIZE, len(rooms)), len(rooms))

    logger.info("[Embed] 전체 인덱싱 완료: %d개 방", total_indexed)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="방 설명 Milvus 임베딩 인덱서")
    parser.add_argument("--incremental", action="store_true", help="신규 방만 인덱싱")
    args = parser.parse_args()
    asyncio.run(run_indexing(incremental=args.incremental))