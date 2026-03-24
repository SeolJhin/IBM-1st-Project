# app/services/orchestrator/alias_registry.py
"""
동적 Alias 레지스트리 — 서버 시작 시 DB에서 건물명/상품명/공용공간명을 읽어와
메모리에 캐싱. 주기적으로 갱신(기본 10분).

사용처:
  1. 시스템 프롬프트에 현재 목록 주입 → LLM이 한글 입력을 정확한 DB명으로 변환
  2. _space_keywords 동적 확장 → 신규 공간명도 트리거 감지
  3. _normalize_*_in_sql 동적 확장 → 신규 상품 한글↔영문 SQL OR 확장
"""
import logging
import threading
import time
from typing import Optional

logger = logging.getLogger(__name__)

# ── 갱신 주기 ─────────────────────────────────────────────────────────────────
_REFRESH_INTERVAL_SEC = 600  # 10분


# ── 캐시 저장소 ───────────────────────────────────────────────────────────────
class _AliasCache:
    def __init__(self):
        self._lock = threading.RLock()

        # 건물: [{"building_id": 1, "building_nm": "Uniplace A", "aliases": ["유니플레이스 a", ...]}]
        self.buildings: list[dict] = []

        # 상품: [{"prod_id": 1, "prod_nm": "Americano", "aliases": ["아메리카노", ...]}]
        self.products: list[dict] = []

        # 공용공간: [{"space_id": 1, "space_nm": "Fitness", "building_nm": "Uniplace A",
        #             "aliases": ["피트니스", "헬스", ...]}]
        self.spaces: list[dict] = []

        # 마지막 갱신 시각
        self.last_updated: float = 0.0
        self.initialized: bool = False

    # ── 읽기 (snapshot) ───────────────────────────────────────────────────────
    def snapshot(self) -> dict:
        with self._lock:
            return {
                "buildings": list(self.buildings),
                "products":  list(self.products),
                "spaces":    list(self.spaces),
            }

    # ── 쓰기 ──────────────────────────────────────────────────────────────────
    def update(self, buildings, products, spaces):
        with self._lock:
            self.buildings    = buildings
            self.products     = products
            self.spaces       = spaces
            self.last_updated = time.time()
            self.initialized  = True
        logger.info(
            "[AliasRegistry] 갱신 완료 — buildings=%d products=%d spaces=%d",
            len(buildings), len(products), len(spaces),
        )


_cache = _AliasCache()


# ── 한글 alias 생성 헬퍼 ──────────────────────────────────────────────────────
_SPACE_KOR_MAP = {
    # space_nm 영문 → 한글 별칭 목록
    "fitness":    ["피트니스", "헬스", "헬스장", "운동"],
    "gym":        ["헬스", "헬스장", "피트니스", "gym"],
    "lounge":     ["라운지", "휴게실", "휴게공간"],
    "meeting":    ["회의실", "미팅룸", "회의"],
    "study":      ["스터디룸", "스터디", "독서실", "공부방"],
    "coworking":  ["코워킹", "공유오피스", "근무 공간", "작업실"],
    "library":    ["도서관", "독서실"],
    "rooftop":    ["루프탑", "옥상"],
    "cafe":       ["카페", "커피숍"],
    "bbq":        ["바베큐", "bbq", "바베큐장"],
    "garden":     ["정원", "가든"],
    "laundry":    ["세탁실", "빨래방"],
    "parking":    ["주차장", "주차"],
}

def get_space_option_aliases(space_option: str) -> list[str]:
    """
    공용공간 옵션 코드/이름(예: fitness, meeting, Fitness Center)에 대응하는
    한글/동의어 alias 목록을 반환.
    """
    key = (space_option or "").lower().strip()
    if not key:
        return []
    if key in _SPACE_KOR_MAP:
        return list(_SPACE_KOR_MAP[key])
    for eng_key, kor_list in _SPACE_KOR_MAP.items():
        if eng_key in key:
            return list(kor_list)
    return []

def _space_aliases(space_nm: str) -> list[str]:
    """DB에 저장된 space_nm으로 한글 alias 목록 생성."""
    return get_space_option_aliases(space_nm)


def _building_aliases(building_nm: str) -> list[str]:
    """
    DB 영문 building_nm → 사용자가 입력할 한글/축약 alias 목록.
    예: 'Uniplace A'    → ['유니플레이스 a', '유니플레이스a', '유니플 a', ...]
    예: 'Uniplace 청담점' → ['유니플레이스 청담점', '유니플레이스청담점', '유니플 청담점', ...]
    예: 'Uniplace 마포점' → ['유니플레이스 마포점', '유니플레이스마포점', ...]
    """
    nm_stripped = building_nm.strip()
    nm_lower    = nm_stripped.lower()
    aliases: list[str] = [nm_lower]  # 영문 소문자 기본 포함

    if nm_lower.startswith("uniplace"):
        # suffix: 원문 그대로 + 소문자 두 가지 모두 사용
        suffix_raw   = nm_stripped[len("Uniplace"):].strip()   # 원문 (예: "A", "청담점")
        suffix_lower = nm_lower[len("uniplace"):].strip()      # 소문자 (예: "a", "청담점")

        # suffix가 없으면 (그냥 "Uniplace") 브랜드명만 alias
        if not suffix_raw:
            aliases += ["유니플레이스", "유니플"]
        else:
            # 원문 suffix 기반 (대소문자 보존)
            aliases += [
                f"유니플레이스 {suffix_raw}",
                f"유니플레이스{suffix_raw}",
                f"유니플 {suffix_raw}",
                f"유니플{suffix_raw}",
            ]
            # 소문자 suffix 기반 (suffix_raw와 다를 때만 추가 — 중복 방지)
            if suffix_lower != suffix_raw:
                aliases += [
                    f"유니플레이스 {suffix_lower}",
                    f"유니플레이스{suffix_lower}",
                    f"유니플 {suffix_lower}",
                    f"유니플{suffix_lower}",
                ]
    else:
        # 비 Uniplace 건물: 소문자 원문만 (LLM이 시스템 프롬프트 목록 보고 LIKE 검색)
        pass

    # 중복 제거 후 반환
    seen: set[str] = set()
    result: list[str] = []
    for a in aliases:
        a = a.strip()
        if a and a not in seen:
            seen.add(a)
            result.append(a)
    return result


# ── DB 조회 ───────────────────────────────────────────────────────────────────
def _fetch_all() -> tuple[list, list, list]:
    """Spring을 통해 건물/상품/공용공간 목록 조회."""
    from app.services.tools.tool_executor import execute_tool

    buildings, products, spaces = [], [], []

    # 1) 건물 목록
    try:
        r = execute_tool("query_database", {
            "sql": "SELECT building_id, building_nm FROM building WHERE delete_yn='N' ORDER BY building_id",
            "description": "alias_registry: 건물 목록",
        }, None)
        for row in (r.get("data") or []):
            nm = row.get("building_nm", "")
            if nm:
                buildings.append({
                    "building_id": row.get("building_id"),
                    "building_nm": nm,
                    "aliases":     _building_aliases(nm),
                })
    except Exception as e:
        logger.debug("[AliasRegistry] 건물 조회 실패: %s", e)

    # 2) 상품 목록
    try:
        r = execute_tool("query_database", {
            "sql": "SELECT prod_id, prod_nm FROM product ORDER BY prod_id",
            "description": "alias_registry: 상품 목록",
        }, None)
        for row in (r.get("data") or []):
            nm = row.get("prod_nm", "")
            if nm:
                products.append({
                    "prod_id":  row.get("prod_id"),
                    "prod_nm":  nm,
                    "aliases":  [],   # 상품은 LLM이 직접 처리 — 목록만 제공
                })
    except Exception as e:
        logger.debug("[AliasRegistry] 상품 조회 실패: %s", e)

    # 3) 공용공간 목록 (건물명 포함)
    try:
        r = execute_tool("query_database", {
            "sql": (
                "SELECT cs.space_id, cs.space_nm, b.building_nm "
                "FROM common_space cs "
                "JOIN building b ON cs.building_id=b.building_id "
                "WHERE b.delete_yn='N' "
                "ORDER BY b.building_id, cs.space_id"
            ),
            "description": "alias_registry: 공용공간 목록",
        }, None)
        for row in (r.get("data") or []):
            nm = row.get("space_nm", "")
            if nm:
                spaces.append({
                    "space_id":    row.get("space_id"),
                    "space_nm":    nm,
                    "building_nm": row.get("building_nm", ""),
                    "aliases":     _space_aliases(nm),
                })
    except Exception as e:
        logger.debug("[AliasRegistry] 공용공간 조회 실패: %s", e)

    return buildings, products, spaces


# ── 공개 API ──────────────────────────────────────────────────────────────────
def refresh() -> None:
    """DB에서 다시 읽어와 캐시 갱신. 실패해도 예외 안 던짐."""
    try:
        buildings, products, spaces = _fetch_all()
        # 하나라도 성공적으로 조회됐으면 업데이트
        if buildings or products or spaces:
            _cache.update(buildings, products, spaces)
        else:
            logger.debug("[AliasRegistry] 조회 결과 전부 빈값 — 캐시 유지")
    except Exception as e:
        logger.debug("[AliasRegistry] refresh 실패 (캐시 유지): %s", e)


def get_buildings() -> list[dict]:
    return _cache.snapshot()["buildings"]


def get_products() -> list[dict]:
    return _cache.snapshot()["products"]


def get_spaces() -> list[dict]:
    return _cache.snapshot()["spaces"]


def is_initialized() -> bool:
    return _cache.initialized


def get_space_keywords() -> list[str]:
    """
    공용공간 트리거 키워드 목록.
    고정 기본값 + DB에서 읽어온 공간명/한글alias 합집합.
    """
    base = [
        "공용공간", "공용 공간", "공용시설", "공간 예약", "시설 예약",
        "헬스", "헬스장", "라운지", "회의실", "스터디룸", "스터디",
        "피트니스", "근무 공간", "코워킹",
    ]
    extra: set[str] = set()
    for sp in _cache.snapshot()["spaces"]:
        nm = sp.get("space_nm", "")
        if nm:
            extra.add(nm.lower())
            extra.add(nm)
        for alias in sp.get("aliases", []):
            if alias:
                extra.add(alias)
    return base + [k for k in sorted(extra) if k not in base]


def build_system_prompt_section() -> str:
    """
    시스템 프롬프트에 주입할 동적 alias 섹션 생성.
    초기화 안 됐으면 빈 문자열 반환 (하드코딩 fallback 유지).
    """
    if not _cache.initialized:
        return ""

    snap = _cache.snapshot()
    lines = ["\n[동적 데이터 목록 — DB 기준 최신 정보]\n"]

    # 건물
    if snap["buildings"]:
        lines.append("★ 건물 목록 (SQL LIKE 키워드는 반드시 아래 'DB명' 값 그대로 사용):")
        for b in snap["buildings"]:
            alias_str = ", ".join(b["aliases"]) if b["aliases"] else ""
            lines.append(
                f"  - building_id={b['building_id']} | DB명(SQL LIKE용): \"{b['building_nm']}\" "
                f"| 사용자 입력 표현: {alias_str}"
            )
        lines.append(
            "  ★★ SQL 작성 규칙:\n"
            "  1. 사용자가 어떤 표현을 쓰든 위 목록에서 building_id 또는 DB명을 찾아 SQL에 사용할 것.\n"
            "  2. LIKE 키워드는 반드시 위 'DB명' 값 그대로 사용. 사용자 입력을 그대로 쓰면 0건이 나올 수 있음.\n"
            "  3. 확실하지 않으면 building_id로 조회: WHERE b.building_id=N\n"
            "  → 목록에 없는 건물명은 query_database로 building 테이블 조회 후 확인."
        )

    # 공용공간
    if snap["spaces"]:
        lines.append("\n★ 공용공간 목록 (building_id 기준으로 전체 조회됨 — 이름 직접 검색 불필요):")
        # 건물별 그룹
        by_building: dict[str, list] = {}
        for sp in snap["spaces"]:
            bnm = sp.get("building_nm", "기타")
            by_building.setdefault(bnm, []).append(sp)
        for bnm, sp_list in by_building.items():
            names = ", ".join(
                f"\"{sp['space_nm']}\""
                + (f"(={', '.join(sp['aliases'][:2])})" if sp.get("aliases") else "")
                for sp in sp_list
            )
            lines.append(f"  - {bnm}: {names}")
        lines.append(
            "  → 사용자가 위 한글 별칭을 말하면 공용공간 플로우로 진입."
        )

    # 상품
    if snap["products"]:
        prod_names = ", ".join(f"\"{p['prod_nm']}\"" for p in snap["products"][:30])
        if len(snap["products"]) > 30:
            prod_names += f" 외 {len(snap['products'])-30}개"
        lines.append(f"\n★ 룸서비스 상품 목록: {prod_names}")
        lines.append(
            "  → 상품명은 DB에 영문/한글 혼용 저장. 사용자 입력과 가장 유사한 상품을 LIKE로 검색."
        )

    return "\n".join(lines)


# ── 백그라운드 갱신 스레드 ────────────────────────────────────────────────────
# ── 상품명 한글↔영문 alias (신규 상품 추가 시 여기에만 추가하면 됨) ────────────
# 두 orchestrator가 이 목록을 공유. tool_orchestrator/admin_tool_orchestrator의
# 중복 _PROD_NAME_ALIASES는 이 목록으로 대체됨.
# 형식: ([키워드...], 한글명, 영문명)
PROD_NAME_ALIASES: list[tuple[list[str], str, str]] = [
    (["아메리카노", "americano"],                              "아메리카노",   "Americano"),
    (["라떼", "카페라떼", "latte"],                          "라떼",         "Latte"),
    (["샌드위치", "sandwich"],                                 "샌드위치",     "Sandwich"),
    (["룸청소", "룸클리닝", "room cleaning", "청소서비스"],   "룸클리닝",     "Room Cleaning"),
    (["세탁서비스", "laundry", "laundry service"],            "세탁서비스",   "Laundry Service"),
    (["컵라면", "신라면", "라면"],                            "컵라면",       "컵라면"),
    (["생수", "water"],                                        "생수",         "생수"),
    (["도시락", "비빔밥"],                                     "도시락",       "도시락"),
    (["세탁세제", "리큐"],                                     "세탁세제",     "세탁세제"),
    (["화장지", "휴지", "toilet paper"],                      "화장지",       "화장지"),
    (["주방세제", "퐁퐁", "dish soap"],                       "주방세제",     "주방세제"),
    (["청소포", "물걸레"],                                     "청소포",       "청소포"),
    # ── 신규 상품 추가 시 여기에 한 줄 추가 ──────────────────────────────────
    # (["콜드브루", "cold brew", "coldbrew"], "콜드브루", "Cold Brew"),
]


def normalize_prod_query(user_input: str) -> str:
    """
    사용자가 입력한 상품명에서 공백 제거.
    '카페 라떼' → '카페라떼', '룸 클리닝' → '룸클리닝'
    LLM이 SQL 생성 전에 이 함수로 정규화된 키워드를 사용하도록 시스템 프롬프트에서 안내.
    """
    return user_input.replace(" ", "").strip()


def get_dynamic_prod_aliases() -> list[tuple[list[str], str, str]]:
    """
    DB 상품 목록을 읽어 _normalize_prod_nm_in_sql 에 주입할 동적 alias 튜플 생성.
    형식: ([키워드1, 키워드2, ...], 한글명, 영문명)

    전략:
    - 상품 목록을 한글 / 영문으로 분류
    - 이름이 유사한 한글명↔영문명 쌍을 자동 매핑 (소문자 비교)
    - 매핑된 쌍은 OR 확장, 매핑 못된 단일 상품은 단일 LIKE
    """
    products = _cache.snapshot()["products"]
    if not products:
        return []

    def _is_ascii(s: str) -> bool:
        return all(ord(c) < 128 for c in s.replace(" ", ""))

    kor_prods = [p for p in products if not _is_ascii(p.get("prod_nm", ""))]
    eng_prods = [p for p in products if _is_ascii(p.get("prod_nm", "")) and p.get("prod_nm", "")]

    # 한글명 → 영문명 자동 매핑 (prod_nm 소문자 제거 공백 비교)
    def _normalize_key(s: str) -> str:
        import unicodedata
        s = s.lower().replace(" ", "").replace("-", "").replace("_", "")
        return s

    # 영문 상품 키: 정규화 키 → prod_nm
    eng_map = {_normalize_key(p["prod_nm"]): p["prod_nm"] for p in eng_prods}

    result: list[tuple[list[str], str, str]] = []
    matched_eng: set[str] = set()

    for kp in kor_prods:
        kor_nm = kp["prod_nm"]
        kor_key = _normalize_key(kor_nm)
        # 영문 상품과 키가 일치하는 것 찾기
        matched = eng_map.get(kor_key)
        if matched:
            keywords = [kor_nm.lower(), matched.lower()]
            result.append((keywords, kor_nm, matched))
            matched_eng.add(matched)
        else:
            # 띄어쓰기 제거 버전도 키워드에 포함 (예: '콜드 브루' → ['콜드 브루', '콜드브루'])
            kor_no_space = kor_nm.replace(' ', '')
            keywords = list({kor_nm.lower(), kor_no_space.lower()})
            result.append((keywords, kor_nm, kor_nm))

    # 매핑 못된 영문 상품은 단독으로 추가
    for ep in eng_prods:
        eng_nm = ep["prod_nm"]
        if eng_nm not in matched_eng:
            result.append(([eng_nm.lower()], eng_nm, eng_nm))

    return result


def start_refresh_daemon(interval_sec: int = _REFRESH_INTERVAL_SEC) -> None:
    """주기적으로 alias 캐시를 갱신하는 백그라운드 스레드 시작."""
    def _loop():
        while True:
            time.sleep(interval_sec)
            logger.info("[AliasRegistry] 주기 갱신 시작 (interval=%ds)", interval_sec)
            refresh()

    t = threading.Thread(target=_loop, daemon=True, name="alias-registry-refresh")
    t.start()
    logger.info("[AliasRegistry] 갱신 데몬 시작 (interval=%ds)", interval_sec)
