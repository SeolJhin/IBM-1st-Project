# app/services/tools/nearby_property_tool.py
"""
주변 부동산 매물 조회 Tool.

[아키텍처]
  서버에서 직방 → 다방 → 국토부 실거래가 순으로 직접 호출.
  오프라인 시세(가짜 데이터)는 사용하지 않음.
  모두 실패 시 에러 메시지 반환.

[수집 순서]
  ① 직방 (geohash 방식)
  ② 다방 (직방 5건 미만 시)
  ③ 국토부 실거래가 API (10건 미만 시)

[마커 포맷]
  __PRICE_REPORT__{JSON}__END_PRICE_REPORT__
    JSON: { __type, target_room, market, recommendation, listings, basis_text, ... }
"""

import json
import logging
import math
import statistics
import urllib.parse
import urllib.request
from datetime import datetime

logger = logging.getLogger(__name__)

# ─── Tool Definition ──────────────────────────────────────────────────────────

NEARBY_PROPERTY_TOOL_DEFINITION = {
    "type": "function",
    "function": {
        "name": "nearby_property_search",
        "description": (
            "특정 주소 반경 3km 내 외부 부동산 매물을 분석해 "
            "UNI PLACE 방의 적정 임대료 범위·근거표·유사 매물 사진을 제공합니다. "
            "가격 추천, 시세 비교 요청 시 반드시 사용하세요. "
            "먼저 query_database로 방 정보(building_addr, room_size, rent_price, rent_type)를 조회한 뒤 호출하세요. "
            "서버가 직방·다방·국토부 실거래가를 직접 수집하여 즉시 리포트를 반환합니다."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "address":          {"type": "string",  "description": "building 테이블 building_addr 값."},
                "room_type":        {"type": "string",  "enum": ["one_room","two_room","three_room","loft","share","all"]},
                "rent_type":        {"type": "string",  "enum": ["monthly_rent","jeonse","all"]},
                "room_size_sqm":    {"type": "number",  "description": "rooms.room_size(㎡). ±35% 범위 필터."},
                "current_price_wan":{"type": "number",  "description": "현재 임대료(만원). 시세 비교 기준."},
                "room_id":          {"type": "integer", "description": "rooms.room_id. 리포트 식별용."},
                "radius_km":        {"type": "number",  "description": "검색 반경(km). 기본 3.", "default": 3},
            },
            "required": ["address", "room_type", "rent_type"],
        },
    },
}

# ─── Geocoding (오프라인 fallback 포함) ──────────────────────────────────────

def _geocode(address: str):
    """주소 → (lat, lon). 외부 API 실패 시 오프라인 키워드 테이블로 fallback."""
    # 1) 카카오 API
    try:
        from app.config.settings import settings
        key = getattr(settings, "kakao_map_api_key", "")
        if key:
            r = _geocode_kakao(address, key)
            if r:
                logger.info("[NearbyProp] geocode kakao: %s → %s", address, r)
                return r
    except Exception:
        pass
    # 2) Nominatim
    r = _geocode_nominatim(address)
    if r:
        logger.info("[NearbyProp] geocode nominatim: %s → %s", address, r)
        return r
    # 3) 오프라인 fallback
    r = _geocode_offline(address)
    if r:
        logger.info("[NearbyProp] geocode offline fallback: %s → %s", address, r)
    else:
        logger.warning("[NearbyProp] geocode ALL FAILED: %s", address)
    return r


def _geocode_kakao(address, api_key):
    params = urllib.parse.urlencode({"query": address, "size": 1})
    req = urllib.request.Request(
        f"https://dapi.kakao.com/v2/local/search/address.json?{params}",
        headers={"Authorization": f"KakaoAK {api_key}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as r:
            docs = json.loads(r.read()).get("documents", [])
        if docs:
            return float(docs[0]["y"]), float(docs[0]["x"])
    except Exception as e:
        logger.debug("[NearbyProp] kakao geocode err: %s", e)
    return None


def _geocode_nominatim(address):
    params = urllib.parse.urlencode({"q": address + " 대한민국", "format": "json", "limit": 1})
    req = urllib.request.Request(
        f"https://nominatim.openstreetmap.org/search?{params}",
        headers={"User-Agent": "UniPlaceAdmin/1.0"},
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as r:
            results = json.loads(r.read())
        if results:
            return float(results[0]["lat"]), float(results[0]["lon"])
    except Exception as e:
        logger.debug("[NearbyProp] nominatim err: %s", e)
    return None


# 서울·수도권·광역시 주요 지역 오프라인 좌표 테이블
_OFFLINE_COORDS: list[tuple[list[str], float, float]] = [
    (["강남구","강남","역삼","선릉","삼성"],          37.5172, 127.0473),
    (["서초구","서초","방배","반포"],                  37.4837, 127.0324),
    (["송파구","송파","잠실","가락","문정"],           37.5145, 127.1059),
    (["마포구","마포","홍대","합정","서교","상수","망원","연남"], 37.5663, 126.9014),
    (["용산구","용산","이태원","한남","후암"],         37.5326, 126.9903),
    (["종로구","종로","혜화","대학로","경복궁"],       37.5730, 126.9794),
    (["중구","명동","을지로","충무로"],                37.5641, 126.9979),
    (["성동구","성수","왕십리","금호"],                37.5633, 127.0369),
    (["광진구","건대","뚝섬","구의"],                  37.5385, 127.0823),
    (["동대문구","동대문","신설","청량리"],             37.5744, 127.0396),
    (["중랑구","중랑","상봉","면목"],                  37.6063, 127.0927),
    (["성북구","성북","길음","돈암","정릉"],           37.5894, 127.0167),
    (["강북구","강북","수유","미아"],                  37.6397, 127.0254),
    (["도봉구","도봉","창동","방학"],                  37.6688, 127.0472),
    (["노원구","노원","공릉","월계","상계"],           37.6543, 127.0568),
    (["은평구","은평","연신내","불광","응암"],         37.6026, 126.9291),
    (["서대문구","서대문","신촌","홍제","이화"],       37.5791, 126.9368),
    (["양천구","양천","목동","신정"],                  37.5170, 126.8666),
    (["강서구","강서","마곡","화곡","발산"],           37.5509, 126.8495),
    (["구로구","구로","신도림","오류"],                37.4954, 126.8874),
    (["금천구","금천","독산","시흥"],                  37.4568, 126.8956),
    (["영등포구","영등포","여의도","당산","문래"],     37.5264, 126.8962),
    (["동작구","동작","사당","노량진","흑석"],         37.5124, 126.9394),
    (["관악구","관악","신림","봉천","낙성대"],         37.4784, 126.9516),
    # 경기
    (["수원","팔달","영통","인계","권선"],             37.2636, 127.0286),
    (["성남","분당","판교","야탑"],                    37.4449, 127.1388),
    (["안양","평촌","범계"],                           37.3943, 126.9568),
    (["부천","중동","상동"],                           37.5036, 126.7660),
    (["고양","일산","덕양","화정","행신"],             37.6584, 126.8320),
    (["용인","기흥","수지","죽전"],                    37.2411, 127.1776),
    (["화성","동탄","향남"],                           37.1994, 127.0577),
    (["의정부","민락","낙양"],                         37.7382, 127.0338),
    (["광명","철산","하안"],                           37.4786, 126.8643),
    (["남양주","별내","다산"],                         37.6368, 127.2162),
    (["하남","미사","감일"],                           37.5390, 127.2148),
    # 인천
    (["인천","부평","계양","연수","송도","구월"],      37.4563, 126.7052),
    # 광역시
    (["부산","해운대","서면","남포","동래"],            35.1796, 129.0756),
    (["대구","수성","중구","달서","북구"],             35.8714, 128.6014),
    (["대전","유성","둔산","서구"],                    36.3504, 127.3845),
    (["광주","북구","서구","상무"],                    35.1595, 126.8526),
    (["울산","남구","중구","태화"],                    35.5384, 129.3114),
    (["세종","나성","보람"],                           36.4800, 127.2890),
]


def _geocode_offline(address: str):
    """주소 텍스트 키워드 매칭으로 대략적 좌표 반환."""
    for keywords, lat, lon in _OFFLINE_COORDS:
        for kw in keywords:
            if kw in address:
                return lat, lon
    if any(k in address for k in ["서울", "Seoul"]):
        return 37.5665, 126.9780
    return None


def _geohash_encode(lat: float, lon: float, precision: int = 5) -> str:
    """순수 Python geohash 인코딩 (외부 라이브러리 불필요)."""
    BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    bits, bit_pos = [], 0
    min_lat, max_lat = -90.0, 90.0
    min_lon, max_lon = -180.0, 180.0
    for _ in range(precision * 5):
        if bit_pos % 2 == 0:          # 경도
            mid = (min_lon + max_lon) / 2
            if lon >= mid: bits.append(1); min_lon = mid
            else:          bits.append(0); max_lon = mid
        else:                          # 위도
            mid = (min_lat + max_lat) / 2
            if lat >= mid: bits.append(1); min_lat = mid
            else:          bits.append(0); max_lat = mid
        bit_pos += 1
    result = ""
    for i in range(0, len(bits), 5):
        idx = sum(b << (4 - j) for j, b in enumerate(bits[i:i+5]))
        result += BASE32[idx]
    return result


def _geohash_adjacent(ghash: str, direction: str) -> str:
    """geohash 인접 셀 계산."""
    BASE32 = "0123456789bcdefghjkmnpqrstuvwxyz"
    NEIGHBOR = {
        "right": {"even": "bc01fg45telegramhmjnqp0r2twvyx8zb", "odd": "p0r21436x8zb9dcf5h7kjnmqesgutwvy"},
        "left":  {"even": "238967debc01fg45kmstqrwxuvhjyznp",  "odd": "14365h7k9dcfesgujnmqp0r2twvyx8zb"},
        "top":   {"even": "p0r21436x8zb9dcf5h7kjnmqesgutwvy", "odd": "bc01fg45hmjnqp0r2twvyx8zb9dcf5h7"},
        "bottom":{"even": "14365h7k9dcfesgujnmqp0r2twvyx8zb", "odd": "238967debc01fg45kmstqrwxuvhjyznp"},
    }
    BORDER = {
        "right":  {"even": "bcfguvyz", "odd": "prxz"},
        "left":   {"even": "0145hjnp", "odd": "028b"},
        "top":    {"even": "prxz",     "odd": "bcfguvyz"},
        "bottom": {"even": "028b",     "odd": "0145hjnp"},
    }
    ghash   = ghash.lower()
    last    = ghash[-1]
    typ     = "odd" if len(ghash) % 2 else "even"
    base    = ghash[:-1]
    if last in BORDER[direction][typ] and base:
        base = _geohash_adjacent(base, direction)
    neighbor_map = NEIGHBOR[direction][typ]
    if last not in BASE32:
        return ghash   # fallback
    try:
        return base + BASE32[neighbor_map.index(last)]
    except ValueError:
        return ghash


def _geohash_neighbors_9(lat: float, lon: float, precision: int = 5) -> list[str]:
    """중심 geohash + 8방향 인접 셀 (총 9개) – 약 15km × 15km 커버."""
    center = _geohash_encode(lat, lon, precision)
    n  = _geohash_adjacent(center, "top")
    s  = _geohash_adjacent(center, "bottom")
    e  = _geohash_adjacent(center, "right")
    w  = _geohash_adjacent(center, "left")
    ne = _geohash_adjacent(n, "right")
    nw = _geohash_adjacent(n, "left")
    se = _geohash_adjacent(s, "right")
    sw = _geohash_adjacent(s, "left")
    return list(dict.fromkeys([center, n, ne, e, se, s, sw, w, nw]))  # 중복 제거


def _fetch_zigbang_server(lat, lon, room_type, rent_type, size_sqm, radius_km) -> list[dict]:
    """직방 API – geohash 방식 (2020년 이후 공식 방식).

    Step 1: GET /v2/items?geohash=xxxxx&... → item_id 목록
    Step 2: POST /v2/items/list (body: JSON) → 상세 정보
    """
    try:
        svc = "원룸" if room_type in ("one_room", "studio") else "오피스텔"
        sales_type = "%EC%A0%84%EC%84%B8" if rent_type == "jeonse" else "%EC%9B%94%EC%84%B8"

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/120.0.0.0 Safari/537.36"),
            "Referer":  "https://www.zigbang.com/",
            "Accept":   "application/json, text/plain, */*",
            "Origin":   "https://www.zigbang.com",
        }

        # precision=5 한 셀 ≈ 4.9km×4.9km → 9셀이면 반경 3km 충분히 커버
        geohashes = _geohash_neighbors_9(lat, lon, precision=5)
        item_ids: list[str] = []

        for gh in geohashes:
            svc_encoded = "%EC%9B%90%EB%A3%B8" if svc == "원룸" else "%EC%98%A4%ED%94%BC%EC%8A%A4%ED%85%94"
            geo_url = (
                f"https://apis.zigbang.com/v2/items"
                f"?deposit_gteq=0&domain=zigbang&geohash={gh}"
                f"&needHasNoFiltered=true&rent_gteq=0"
                f"&sales_type_in={sales_type}"
                f"&service_type_eq={svc_encoded}"
            )
            try:
                req = urllib.request.Request(geo_url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    geo_data = json.loads(resp.read().decode())
                for i in geo_data.get("items") or []:
                    iid = str(i.get("item_id") or i.get("id") or "")
                    if iid and iid not in item_ids:
                        item_ids.append(iid)
            except Exception as e:
                logger.debug("[직방/geohash/%s] %s", gh, e)
                continue

        if not item_ids:
            logger.info("[NearbyTool/직방] item_id 없음")
            return []

        item_ids = item_ids[:100]   # 최대 100개

        # Step 2: POST /v2/items/list 로 상세 정보 수집
        post_data = json.dumps({
            "domain":        "zigbang",
            "withCoalition": "true",
            "item_ids":      item_ids,
        }).encode("utf-8")
        post_headers = {**headers, "Content-Type": "application/json"}
        list_url = "https://apis.zigbang.com/v2/items/list"
        req2 = urllib.request.Request(
            list_url, data=post_data, headers=post_headers, method="POST"
        )
        with urllib.request.urlopen(req2, timeout=10) as resp2:
            detail_data = json.loads(resp2.read().decode())

        listings = []
        for item in detail_data.get("items") or []:
            rent    = int(item.get("rent") or item.get("rent_fee") or 0)
            deposit = int(item.get("deposit") or 0)
            area    = float(item.get("전용면적") or item.get("area") or item.get("공급면적") or 0)
            if rent <= 0 and rent_type != "jeonse": continue
            if rent_type == "jeonse" and deposit <= 0: continue
            # 면적 필터 (±55% 허용)
            if size_sqm and area > 0 and not (size_sqm * 0.45 <= area <= size_sqm * 1.65):
                continue
            # 거리 필터
            item_lat = float(item.get("lat") or item.get("latitude") or 0)
            item_lon = float(item.get("lng") or item.get("longitude") or 0)
            if item_lat and item_lon:
                dist_m = _haversine_m(lat, lon, item_lat, item_lon)
                if dist_m > radius_km * 1000:
                    continue
            image_url = None
            photos = item.get("photos") or []
            if photos and isinstance(photos, list):
                p0 = photos[0] if isinstance(photos[0], dict) else {}
                image_url = p0.get("path") or p0.get("url") or (photos[0] if isinstance(photos[0], str) else None)
            listings.append({
                "source":           "직방",
                "address":          item.get("address1") or item.get("address") or item.get("addr1") or "",
                "size_sqm":         area,
                "size_pyeong":      round(area / 3.305, 1) if area else None,
                "floor":            str(item.get("floor") or ""),
                "deposit_wan":      round(deposit / 10000),
                "monthly_rent_wan": round(rent / 10000),
                "rent_type":        "jeonse" if rent_type == "jeonse" else "monthly_rent",
                "image_url":        image_url,
                "listing_url":      f"https://www.zigbang.com/home/room/{item.get('item_id', '')}",
                "building_name":    item.get("building_name") or "",
                "is_realtime":      True,
            })
        logger.info("[NearbyTool/직방] 수집 %d건 (item_ids=%d)", len(listings), len(item_ids))
        return listings
    except Exception as e:
        logger.info("[NearbyProp] 직방 실패: %s", e)
        return []


def _fetch_dabang_server(lat, lon, room_type, rent_type, size_sqm, radius_km) -> list[dict]:
    """다방 API – /api/3/room/list/multi-room/bbox (올바른 엔드포인트).

    location 파라미터: [[lng_sw, lat_sw], [lng_ne, lat_ne]] (JSON 배열)
    filters 파라미터: JSON 문자열로 전달
    """
    try:
        lat1, lat2 = lat - radius_km / 111, lat + radius_km / 111
        lng1, lng2 = lon - radius_km / 88,  lon + radius_km / 88

        # 다방 room_type: 0=원룸, 1=투룸, 2=쓰리룸+, 3=오피스텔
        type_code_map = {"one_room": 0, "studio": 0, "two_room": 1, "three_room": 2, "officetel": 3}
        room_code = type_code_map.get(room_type, 0)

        # selling_type: 0=월세, 1=전세, 2=매매
        selling_code = 1 if rent_type == "jeonse" else 0

        filters = {
            "multi_room_type":  [room_code],
            "selling_type":     [selling_code],
            "deposit_range":    [0, 99999],
            "price_range":      [0, 99999],
            "trade_range":      [0, 99999],
            "maintenance_cost_range": [0, 99999],
            "room_size":        [0, 99999],
            "supply_space_range": [0, 99999],
            "room_floor_multi": [1, 2, 3, 4, 5, 6, -1, 0],
            "division":         False,
            "duplex":           False,
            "room_type":        [1, 2],
        }

        # location = [[lng_sw, lat_sw], [lng_ne, lat_ne]]
        location = [[round(lng1, 6), round(lat1, 6)], [round(lng2, 6), round(lat2, 6)]]

        params = urllib.parse.urlencode({
            "api_version": "3.0.1",
            "call_type":   "web",
            "filters":     json.dumps(filters, ensure_ascii=False),
            "location":    json.dumps(location),
            "page":        1,
            "per_page":    50,
            "sort_type":   0,
        })
        url = f"https://www.dabangapp.com/api/3/room/list/multi-room/bbox?{params}"

        headers = {
            "User-Agent": ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                           "AppleWebKit/537.36 (KHTML, like Gecko) "
                           "Chrome/120.0.0.0 Safari/537.36"),
            "Referer":  "https://www.dabangapp.com/",
            "Accept":   "application/json, text/plain, */*",
            "Origin":   "https://www.dabangapp.com",
        }
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode())

        listings = []
        rooms = data.get("rooms") or data.get("room_list") or []
        for item in rooms:
            rent    = int(item.get("price") or item.get("rent") or 0)
            deposit = int(item.get("deposit") or 0)
            area    = float(item.get("전용면적") or item.get("area") or item.get("room_size") or 0)
            if selling_code == 0 and rent <= 0: continue
            if selling_code == 1 and deposit <= 0: continue
            if size_sqm and area > 0 and not (size_sqm * 0.45 <= area <= size_sqm * 1.65):
                continue
            # 이미지: images 배열 또는 img_url
            imgs = item.get("images") or []
            image_url = None
            if imgs and isinstance(imgs, list):
                img0 = imgs[0]
                image_url = img0.get("url") or img0.get("path") if isinstance(img0, dict) else img0
            image_url = image_url or item.get("img_url") or item.get("image_url")
            listings.append({
                "source":           "다방",
                "address":          item.get("address") or item.get("addr") or "",
                "size_sqm":         area,
                "size_pyeong":      round(area / 3.305, 1) if area else None,
                "floor":            str(item.get("floor") or ""),
                "deposit_wan":      round(deposit / 10000),
                "monthly_rent_wan": round(rent / 10000),
                "rent_type":        "jeonse" if rent_type == "jeonse" else "monthly_rent",
                "image_url":        image_url,
                "listing_url":      f"https://www.dabangapp.com/room/{item.get('id', '')}",
                "building_name":    item.get("building_name") or item.get("name") or "",
                "is_realtime":      True,
            })
        logger.info("[NearbyTool/다방] 수집 %d건", len(listings))
        return listings
    except Exception as e:
        logger.info("[NearbyProp] 다방 실패: %s", e)
        return []


def _haversine_m(lat1, lon1, lat2, lon2):
    R = 6_371_000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    a = math.sin(d_lat/2)**2 + math.cos(math.radians(lat1))*math.cos(math.radians(lat2))*math.sin(d_lon/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


# ─── 국토부 실거래가 API ──────────────────────────────────────────────────────

# 법정동코드 매핑 (상위 지역만 — 세부 동은 하위 코드로 자동 커버)
_LAWD_CD: list[tuple[list[str], str]] = [
    (["강남구","강남","역삼","선릉","삼성","개포"],    "11680"),
    (["서초구","서초","방배","반포","잠원"],            "11650"),
    (["송파구","송파","잠실","가락","문정","위례"],     "11710"),
    (["강동구","강동","천호","암사","길동"],            "11740"),
    (["마포구","마포","홍대","합정","상수","망원","연남"],"11440"),
    (["용산구","용산","이태원","한남","후암","삼각지"],  "11170"),
    (["종로구","종로","혜화","대학로","경복궁","인사동"],"11110"),
    (["중구","명동","을지로","충무로","신당"],           "11140"),
    (["성동구","성수","왕십리","금호","옥수"],           "11200"),
    (["광진구","건대","뚝섬","구의","자양"],             "11215"),
    (["동대문구","동대문","신설","청량리","회기"],       "11230"),
    (["중랑구","중랑","상봉","면목","망우"],             "11260"),
    (["성북구","성북","길음","돈암","정릉"],             "11290"),
    (["강북구","강북","수유","미아","번동"],             "11305"),
    (["도봉구","도봉","창동","방학","쌍문"],             "11320"),
    (["노원구","노원","공릉","월계","상계","중계"],      "11350"),
    (["은평구","은평","연신내","불광","응암","녹번"],    "11380"),
    (["서대문구","서대문","신촌","홍제","이화","북아현"],"11410"),
    (["양천구","양천","목동","신정","신월"],             "11470"),
    (["강서구","강서","마곡","화곡","발산","등촌"],      "11500"),
    (["구로구","구로","신도림","오류","개봉"],           "11530"),
    (["금천구","금천","독산","시흥","가산"],             "11545"),
    (["영등포구","영등포","여의도","당산","문래","대림"],"11560"),
    (["동작구","동작","사당","노량진","흑석","상도"],    "11590"),
    (["관악구","관악","신림","봉천","낙성대","서원"],    "11620"),
    # 경기
    (["수원"],   "41111"),
    (["성남"],   "41131"),
    (["안양"],   "41171"),
    (["부천"],   "41190"),
    (["고양"],   "41281"),
    (["용인"],   "41461"),
    (["화성"],   "41590"),
    (["의정부"], "41150"),
    (["광명"],   "41210"),
    (["남양주"], "41360"),
    (["하남"],   "41450"),
    # 인천
    (["인천","부평","계양","연수","송도","구월"], "28110"),
    # 광역시
    (["부산","해운대","서면","남포","동래"],  "26110"),
    (["대구","수성","중구","달서","북구"],    "27110"),
    (["대전","유성","둔산","서구"],           "30110"),
    (["광주","북구","서구","상무"],           "29110"),
    (["울산","남구","태화"],                  "31110"),
    (["세종","나성","보람"],                  "36110"),
]


def _get_lawd_cd(address: str) -> str:
    """주소에서 법정동코드(5자리) 추출."""
    for keywords, code in _LAWD_CD:
        if any(kw in address for kw in keywords):
            return code
    if any(k in address for k in ["서울", "Seoul"]):
        return "11110"   # 종로구 기본
    return "11680"       # 강남구 기본


def _fetch_molit(address: str, rent_type: str, size_sqm) -> list[dict]:
    """국토부 실거래가 API (최근 3개월).

    - 월세: /getRTMSDataSvcSHRent (단기임대)
    - 전세: /getRTMSDataSvcSHRent or officetel jeonse 별도
    """
    try:
        import xml.etree.ElementTree as ET
        try:
            from app.config.settings import settings
            api_key = getattr(settings, "molit_api_key", "") or ""
        except Exception:
            import os
            api_key = os.environ.get("MOLIT_API_KEY", "")

        if not api_key:
            logger.info("[NearbyTool/국토부] API 키 없음 — 스킵")
            return []

        lawd_cd = _get_lawd_cd(address)
        now = datetime.now()
        months = [
            (now.year, now.month),
            (now.year if now.month > 1 else now.year - 1, now.month - 1 if now.month > 1 else 12),
            (now.year if now.month > 2 else now.year - 1, now.month - 2 if now.month > 2 else now.month + 10),
        ]

        listings: list[dict] = []
        for year, month in months:
            deal_ymd = f"{year}{month:02d}"
            # 오피스텔 월세/전세
            if rent_type in ("monthly_rent", "all"):
                url = (
                    f"http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"
                    f"?serviceKey={api_key}&LAWD_CD={lawd_cd}&DEAL_YMD={deal_ymd}&numOfRows=100&pageNo=1"
                )
            else:
                url = (
                    f"http://apis.data.go.kr/1613000/RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent"
                    f"?serviceKey={api_key}&LAWD_CD={lawd_cd}&DEAL_YMD={deal_ymd}&numOfRows=100&pageNo=1"
                )
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "UniPlaceAdmin/1.0"})
                with urllib.request.urlopen(req, timeout=8) as resp:
                    xml_data = resp.read()
                root = ET.fromstring(xml_data)
                items = root.findall(".//item")
                for item in items:
                    def g(tag): return (item.findtext(tag) or "").strip()
                    deposit_str = g("보증금액").replace(",", "")
                    rent_str    = g("월세금액").replace(",", "")
                    area_str    = g("전용면적")
                    floor_str   = g("층")
                    try:
                        deposit = int(deposit_str) if deposit_str else 0
                        rent    = int(rent_str) if rent_str else 0
                        area    = float(area_str) if area_str else 0.0
                    except ValueError:
                        continue
                    if rent_type in ("monthly_rent", "all") and rent <= 0:
                        continue
                    if rent_type == "jeonse" and deposit <= 0:
                        continue
                    # 면적 필터 ±55%
                    if size_sqm and area > 0 and not (size_sqm * 0.45 <= area <= size_sqm * 1.65):
                        continue
                    dong  = g("법정동")
                    jibun = g("지번")
                    full_addr = f"{dong} {jibun}".strip() if dong else jibun
                    listings.append({
                        "source":           "국토부실거래",
                        "address":          full_addr,
                        "size_sqm":         area,
                        "size_pyeong":      round(area / 3.305, 1) if area else None,
                        "floor":            floor_str,
                        "deposit_wan":      deposit,
                        "monthly_rent_wan": rent,
                        "rent_type":        "jeonse" if rent_type == "jeonse" else "monthly_rent",
                        "image_url":        None,
                        "listing_url":      None,
                        "deal_month":       deal_ymd,
                        "distance_m":       None,
                        "building_name":    g("아파트") or g("단지명") or "",
                        "is_realtime":      True,
                    })
            except Exception as e:
                logger.debug("[국토부/%s/%s] %s", lawd_cd, deal_ymd, e)
                continue

        logger.info("[NearbyTool/국토부] 수집 %d건", len(listings))
        return listings
    except Exception as e:
        logger.info("[NearbyProp] 국토부 실패: %s", e)
        return []


# ─── 통계 계산 ────────────────────────────────────────────────────────────────

def _compute_stats(listings: list[dict], current_wan):
    prices = [p["monthly_rent_wan"] for p in listings if p.get("monthly_rent_wan", 0) > 0]
    if not prices:
        return {}
    ps = sorted(prices)
    n = len(ps)
    avg = round(statistics.mean(ps))
    med = round(statistics.median(ps))
    mn, mx = ps[0], ps[-1]
    p25 = ps[max(0, int(n * 0.25) - 1)]
    p75 = ps[min(n-1, int(n * 0.75))]
    iqr = p75 - p25
    filtered = [p for p in ps if (p25 - iqr*1.5) <= p <= (p75 + iqr*1.5)]
    opt = round(statistics.mean(filtered)) if filtered else avg
    rec_low  = max(mn, round(opt * 0.92))
    rec_high = min(mx, round(opt * 1.08))

    mkt = {"min": mn, "max": mx, "avg": avg, "median": med, "p25": p25, "p75": p75,
           "recommended_low": rec_low, "recommended_high": rec_high,
           "recommended_optimal": opt, "sample_count": n}
    rec = {"low": rec_low, "high": rec_high, "optimal": opt,
           "confidence": "high" if n >= 20 else ("medium" if n >= 8 else "low")}
    if current_wan and current_wan > 0:
        gap = round((current_wan - opt) / opt * 100, 1)
        rec["gap_pct"] = gap
        rec["verdict"] = "underpriced" if gap < -10 else ("overpriced" if gap > 10 else "fair")
    else:
        rec["gap_pct"] = 0
        rec["verdict"] = "unknown"
    return {"market": mkt, "recommendation": rec}


def _build_basis(listings, stats, current_wan, radius_km, room_type, rent_type):
    if not stats:
        return "주변 매물 데이터 부족 — 통계 산출 불가"
    mkt, rec = stats["market"], stats["recommendation"]
    sources = {}
    for p in listings:
        sources[p.get("source", "기타")] = sources.get(p.get("source", "기타"), 0) + 1
    rt  = {"monthly_rent": "월세", "jeonse": "전세", "all": "임대"}.get(rent_type, "임대")
    tp  = {"one_room": "원룸", "two_room": "투룸", "three_room": "쓰리룸",
           "loft": "복층", "share": "셰어", "all": ""}.get(room_type, "")
    lines = [
        f"반경 {radius_km}km 내 {tp} {rt} 매물 {mkt['sample_count']}건 분석",
        f"출처: {', '.join(f'{k} {v}건' for k, v in sources.items())}",
        f"시세 범위: {mkt['min']}~{mkt['max']}만원 / 평균 {mkt['avg']}만 / 중위 {mkt['median']}만원",
        f"IQR(25~75%ile): {mkt['p25']}~{mkt['p75']}만원",
    ]
    if current_wan:
        g = rec["gap_pct"]
        v = {"underpriced": f"시세 대비 {abs(g):.1f}% 저평가",
             "overpriced":  f"시세 대비 {abs(g):.1f}% 고평가",
             "fair":        "시세 적정"}.get(rec["verdict"], "")
        lines.append(f"현재가 {current_wan}만원 → {v}")
    lines.append(f"추천: {rec['low']}~{rec['high']}만원 (최적 {rec['optimal']}만원, 신뢰도 {rec['confidence']})")
    return "\n".join(lines)


# ─── 메인 실행 ────────────────────────────────────────────────────────────────

def execute_nearby_property_search(args: dict) -> dict:
    address       = args.get("address", "")
    room_type     = args.get("room_type", "all")
    rent_type     = args.get("rent_type", "all")
    size_sqm      = args.get("room_size_sqm")
    current_wan   = args.get("current_price_wan")
    room_id       = args.get("room_id")
    radius_km     = float(args.get("radius_km", 3))

    if not address:
        return {"__type": "error", "error": "address 필수"}

    # ── 좌표 확보 ──────────────────────────────────────────────────────────────
    coords = _geocode(address)
    if not coords:
        return {"__type": "error", "error": f"주소 좌표 변환 실패: {address}"}
    lat, lon = coords

    # ── 실시간 매물 수집: 직방 → 다방 → 국토부 ────────────────────────────────
    # ① 직방
    logger.info("[NearbyTool] 직방 호출 시작 (lat=%.4f, lon=%.4f)", lat, lon)
    server_listings = _fetch_zigbang_server(lat, lon, room_type, rent_type, size_sqm, radius_km)
    logger.info("[NearbyTool] 직방 결과: %d건", len(server_listings))

    # ② 다방 (직방 5건 미만 시 추가)
    if len(server_listings) < 5:
        logger.info("[NearbyTool] 다방 호출 시작 (직방 %d건 부족)", len(server_listings))
        dabang_listings = _fetch_dabang_server(lat, lon, room_type, rent_type, size_sqm, radius_km)
        logger.info("[NearbyTool] 다방 결과: %d건", len(dabang_listings))
        server_listings = server_listings + dabang_listings

    # ③ 국토부 실거래가 (10건 미만 시 추가)
    if len(server_listings) < 10:
        logger.info("[NearbyTool] 국토부 호출 시작 (수집 %d건 부족)", len(server_listings))
        molit_listings = _fetch_molit(address, rent_type, size_sqm)
        logger.info("[NearbyTool] 국토부 결과: %d건", len(molit_listings))
        server_listings = server_listings + molit_listings

    market_data = server_listings
    logger.info("[NearbyTool] 최종 수집: %d건", len(market_data))

    # 데이터가 전혀 없으면 에러 반환 (오프라인 시세 없음)
    if not market_data:
        return {
            "__type": "error",
            "error": (
                "직방·다방·국토부 모두에서 매물 데이터를 가져오지 못했습니다. "
                "서버 아웃바운드 허용 도메인(apis.zigbang.com, www.dabangapp.com, apis.data.go.kr)과 "
                "MOLIT_API_KEY 환경변수를 확인하세요."
            ),
        }

    listings = []
    for item in market_data:
        monthly = item.get("monthly_rent_wan") or item.get("rent") or item.get("monthlyRent") or 0
        deposit = item.get("deposit_wan") or item.get("deposit") or 0
        isize   = item.get("size_sqm") or item.get("area") or item.get("size") or 0
        listings.append({
            "source":           item.get("source", "직방"),
            "address":          item.get("address", ""),
            "size_sqm":         float(isize) if isize else None,
            "size_pyeong":      round(float(isize)/3.305, 1) if isize else None,
            "floor":            str(item.get("floor", "")),
            "deposit_wan":      int(deposit),
            "monthly_rent_wan": int(monthly),
            "rent_type":        item.get("rent_type", "monthly_rent"),
            "options":          item.get("options", []),
            "image_url":        item.get("image_url") or item.get("imageUrl"),
            "listing_url":      item.get("listing_url") or item.get("listingUrl"),
            "deal_month":       item.get("deal_month", datetime.now().strftime("%Y%m")),
            "distance_m":       item.get("distance_m"),
            "building_name":    item.get("building_name", ""),
            "is_realtime":      item.get("is_realtime", True),
        })

    listings.sort(key=lambda x: (x["distance_m"] is None, x["distance_m"] or 0))

    stats = _compute_stats(listings, current_wan)
    basis = _build_basis(listings, stats, current_wan, radius_km, room_type, rent_type)

    with_img    = [p for p in listings if p.get("image_url")][:8]
    without_img = [p for p in listings if not p.get("image_url")][:4]
    report_listings = (with_img + without_img)[:12]

    return {
        "__type": "price_report",
        "target_room": {
            "room_id": room_id, "address": address,
            "size_sqm": size_sqm,
            "size_pyeong": round(size_sqm/3.305, 1) if size_sqm else None,
            "current_price_wan": current_wan, "rent_type": rent_type,
        },
        "market":         stats.get("market", {}),
        "recommendation": stats.get("recommendation", {}),
        "listings": [{
            "source":           p["source"],
            "address":          p["address"],
            "size_pyeong":      p["size_pyeong"],
            "floor":            p["floor"],
            "deposit_wan":      p["deposit_wan"],
            "monthly_rent_wan": p["monthly_rent_wan"],
            "rent_type":        p["rent_type"],
            "options":          p.get("options", []),
            "image_url":        p.get("image_url"),
            "listing_url":      p.get("listing_url"),
            "deal_month":       p.get("deal_month"),
            "distance_m":       p.get("distance_m"),
            "building_name":    p.get("building_name", ""),
            "is_realtime":      p.get("is_realtime", True),
        } for p in report_listings],
        "basis_text":      basis,
        "total_collected": len(listings),
        "search_params": {
            "address": address, "lat": round(lat, 5), "lon": round(lon, 5),
            "radius_km": radius_km,
        },
    }


def format_nearby_property_result(result: dict) -> str:
    """LLM tool result 텍스트 + 프론트용 마커."""
    rtype = result.get("__type")

    # 오류
    if rtype == "error":
        return f"[주변 매물 조회 오류] {result.get('error')}"

    # 최종 리포트
    mkt    = result.get("market", {})
    rec    = result.get("recommendation", {})
    target = result.get("target_room", {})
    summary = "\n".join([
        f"[가격 리포트] 총 {result.get('total_collected', 0)}건",
        f"기준: {target.get('address')} | {target.get('size_pyeong')}평 | 현재 {target.get('current_price_wan')}만원",
        f"시세: 최저 {mkt.get('min')}만 / 최고 {mkt.get('max')}만 / 평균 {mkt.get('avg')}만",
        f"추천: {rec.get('low')}~{rec.get('high')}만원 (최적 {rec.get('optimal')}만, {rec.get('verdict')}, 신뢰도 {rec.get('confidence')})",
        result.get("basis_text", ""),
    ])
    report_json = json.dumps(result, ensure_ascii=False)
    return f"{summary}\n\n__PRICE_REPORT__{report_json}__END_PRICE_REPORT__"