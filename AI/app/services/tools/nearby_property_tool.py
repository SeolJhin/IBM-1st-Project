# app/services/tools/nearby_property_tool.py
"""
주변 부동산 매물 조회 Tool.

[아키텍처]
  국토부 실거래가 API를 사용해 주변 매물 데이터를 수집.
  오프라인 시세(가짜 데이터)는 사용하지 않음.
  실패 시 에러 메시지 반환.

[마커 포맷]
  __PRICE_REPORT__{JSON}__END_PRICE_REPORT__
    JSON: { __type, target_room, market, recommendation, listings, basis_text, ... }
"""

import json
import logging
import os
import statistics
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
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
            "서버가 국토부 실거래가를 직접 수집하여 즉시 리포트를 반환합니다."
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


def _fetch_molit(address: str, rent_type: str, size_sqm, room_type: str = "all") -> list[dict]:
    """국토부 실거래가 API (최근 3개월).

    엔드포인트:
    - 오피스텔 전월세: /RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent
    - 아파트 전월세:   /RTMSDataSvcAptRent/getRTMSDataSvcAptRent
    - 연립/다가구:     /RTMSDataSvcRHRent/getRTMSDataSvcRHRent

    실제 XML 태그:
    - 오피스텔: 보증금(만원), 월세(만원), 전용면적, 층, 법정동, 지번, 단지
    - 아파트:   보증금액, 월세, 전용면적, 층, 법정동, 지번, 아파트
    - 연립:     보증금액, 월세, 전용면적, 층, 법정동, 지번, 연립다세대
    """
    import os
    import xml.etree.ElementTree as ET

    # ── API 키 로드 (settings → os.environ 순서) ─────────────────────────
    api_key = ""
    try:
        from app.config.settings import settings
        api_key = getattr(settings, "molit_api_key", "") or ""
    except Exception:
        pass
    if not api_key:
        api_key = os.environ.get("MOLIT_API_KEY", "")

    if not api_key:
        logger.warning("[NearbyTool/국토부] MOLIT_API_KEY 없음 — 조회 불가")
        return []

    lawd_cd = _get_lawd_cd(address)
    logger.info("[NearbyTool/국토부] address=%s → lawd_cd=%s rent_type=%s size=%s", address, lawd_cd, rent_type, size_sqm)
    now = datetime.now()
    # 최근 3개월
    months = []
    y, m = now.year, now.month
    for _ in range(3):
        months.append((y, m))
        m -= 1
        if m == 0:
            m = 12
            y -= 1

    # 엔드포인트 정의
    _EP_OFFI = {
        "url_path": "RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent",
        "tag_deposit": "deposit", "tag_rent": "monthlyRent",
        "tag_area": "excluUseAr", "tag_floor": "floor",
        "tag_dong": "umdNm", "tag_jibun": "jibun",
        "tag_name": "offiNm", "label": "오피스텔",
    }
    _EP_APT = {
        "url_path": "RTMSDataSvcAptRent/getRTMSDataSvcAptRent",
        "tag_deposit": "deposit", "tag_rent": "monthlyRent",
        "tag_area": "excluUseAr", "tag_floor": "floor",
        "tag_dong": "umdNm", "tag_jibun": "jibun",
        "tag_name": "aptNm", "label": "아파트",
    }
    _EP_RH = {
        "url_path": "RTMSDataSvcRHRent/getRTMSDataSvcRHRent",
        "tag_deposit": "deposit", "tag_rent": "monthlyRent",
        "tag_area": "excluUseAr", "tag_floor": "floor",
        "tag_dong": "umdNm", "tag_jibun": "jibun",
        "tag_name": "mhouseNm", "label": "연립다세대",
    }
    # 단독/다가구 — 원룸·고시원·다가구주택 거래 포함, 소형 방 데이터가 많음
    # 활용신청: https://www.data.go.kr/data/15126472/openapi.do
    _EP_SH = {
        "url_path": "RTMSDataSvcSHRent/getRTMSDataSvcSHRent",
        "tag_deposit": "deposit", "tag_rent": "monthlyRent",
        "tag_area": "excluUseAr", "tag_floor": "floor",
        "tag_dong": "umdNm", "tag_jibun": "jibun",
        "tag_name": "umdNm", "label": "단독다가구",
    }

    # room_type 기반 유사 건물 유형 선택
    # one_room/loft → 단독다가구+오피스텔+연립 (소형 위주, 아파트 제외)
    # two_room/three_room → 아파트+오피스텔
    # share → 단독다가구+연립+오피스텔
    # all → 전체
    _room_type_ep_map = {
        "one_room":   [_EP_SH, _EP_OFFI, _EP_RH],
        "loft":       [_EP_SH, _EP_OFFI, _EP_RH],
        "two_room":   [_EP_APT, _EP_OFFI],
        "three_room": [_EP_APT],
        "share":      [_EP_SH, _EP_RH, _EP_OFFI],
        "all":        [_EP_SH, _EP_OFFI, _EP_APT, _EP_RH],
    }
    endpoints = _room_type_ep_map.get(room_type, [_EP_SH, _EP_OFFI, _EP_APT, _EP_RH])
    logger.info("[NearbyTool/국토부] room_type=%s → 엔드포인트: %s", room_type, [e["label"] for e in endpoints])

    listings: list[dict] = []

    for ep in endpoints:
        for year, month in months:
            deal_ymd = f"{year}{month:02d}"
            # serviceKey는 이미 인코딩된 인증키이므로 quote_plus 방지
            # 나머지 파라미터는 일반 urlencode, serviceKey만 따로 append
            base_url = f"http://apis.data.go.kr/1613000/{ep['url_path']}"
            other_params = urllib.parse.urlencode({
                "LAWD_CD":   lawd_cd,
                "DEAL_YMD":  deal_ymd,
                "numOfRows": "100",
                "pageNo":    "1",
            })
            url = f"{base_url}?serviceKey={api_key}&{other_params}"

            try:
                req = urllib.request.Request(url, headers={"User-Agent": "UniPlaceAdmin/1.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    xml_data = resp.read()

                root = ET.fromstring(xml_data)

                # API 오류 응답 체크
                result_code = root.findtext(".//resultCode") or root.findtext(".//errMsg") or ""
                if result_code and result_code not in ("000", "00", "0", ""):
                    logger.warning("[국토부/%s/%s/%s] API 오류코드: %s", ep["label"], lawd_cd, deal_ymd, result_code)
                    continue

                items = root.findall(".//item")
                logger.info("[국토부/%s/%s/%s] %d건 수신", ep["label"], lawd_cd, deal_ymd, len(items))
                if len(items) == 0 and not listings:
                    logger.warning("[국토부/%s/%s/%s] 0건 — XML: %s", ep["label"], lawd_cd, deal_ymd, xml_data[:400])

                for item in items:
                    def g(tag): return (item.findtext(tag) or "").strip()

                    deposit_str = g(ep["tag_deposit"]).replace(",", "").strip()
                    rent_str    = g(ep["tag_rent"]).replace(",", "").strip()
                    area_str    = g(ep["tag_area"]).strip()
                    floor_str   = g(ep["tag_floor"]).strip()

                    try:
                        deposit = int(float(deposit_str)) if deposit_str else 0
                        rent    = int(float(rent_str)) if rent_str else 0
                        area    = float(area_str) if area_str else 0.0
                    except (ValueError, TypeError):
                        continue

                    # rent_type 필터
                    if rent_type == "monthly_rent" and rent <= 0:
                        continue
                    if rent_type == "jeonse" and (deposit <= 0 or rent > 0):
                        continue
                    # "all" → 데이터 있으면 수집

                    # 면적 필터 ±25%
                    if size_sqm and area > 0:
                        if not (size_sqm * 0.75 <= area <= size_sqm * 1.25):
                            continue

                    dong  = g(ep["tag_dong"])
                    jibun = g(ep["tag_jibun"])
                    bldg  = g(ep["tag_name"])
                    full_addr = f"{dong} {jibun}".strip() if dong else jibun

                    # 전세/월세 판별
                    actual_rent_type = "jeonse" if rent == 0 and deposit > 0 else "monthly_rent"

                    build_year_str = g("buildYear").strip()
                    try:
                        build_year = int(build_year_str) if build_year_str else None
                    except ValueError:
                        build_year = None

                    listings.append({
                        "source":           f"국토부실거래({ep['label']})",
                        "address":          full_addr,
                        "size_sqm":         area,
                        "size_pyeong":      round(area / 3.305, 1) if area else None,
                        "floor":            floor_str,
                        "deposit_wan":      deposit,
                        "monthly_rent_wan": rent,
                        "rent_type":        actual_rent_type,
                        "build_year":       build_year,
                        "image_url":        None,
                        "listing_url":      None,
                        "deal_month":       deal_ymd,
                        "distance_m":       None,
                        "building_name":    bldg,
                        "is_realtime":      True,
                    })

            except urllib.error.HTTPError as e:
                logger.warning("[국토부/%s/%s/%s] HTTP%s: %s | url=%s", ep["label"], lawd_cd, deal_ymd, e.code, e.reason, url[:120])
                continue
            except urllib.error.URLError as e:
                logger.warning("[국토부/%s/%s/%s] 연결실패(아웃바운드차단?): %s | url=%s", ep["label"], lawd_cd, deal_ymd, e.reason, url[:120])
                continue
            except ET.ParseError as e:
                logger.warning("[국토부/%s/%s/%s] XML파싱오류: %s", ep["label"], lawd_cd, deal_ymd, e)
                continue
            except Exception as e:
                logger.warning("[국토부/%s/%s/%s] 기타오류: %s", ep["label"], lawd_cd, deal_ymd, e)
                continue

    logger.info("[NearbyTool/국토부] 최종 수집 %d건 (lawd_cd=%s)", len(listings), lawd_cd)
    return listings

# ════════════════════════════════════════════════════════════════════════════
# 보정 계수
# ════════════════════════════════════════════════════════════════════════════

_JEONWOL_RATE  = 0.06   # 전월세전환율 연 6%

# 공유주거 room_type별 할인율 (방법 1용)
# UniPlace는 전체가 공유주거 플랫폼이므로 모든 room_type에 적용
# one_room/loft: 1인 1실이지만 화장실·주방 공유 → 0.75
# two_room/three_room: 넓은 공용공간 공유 → 0.65
# share: 방까지 공유 → 0.50
_ROOM_TYPE_DISCOUNT = {
    "one_room":   0.75,
    "loft":       0.75,
    "two_room":   0.65,
    "three_room": 0.65,
    "share":      0.50,
}
_SHARE_AREA_COEFF = 0.80   # 공유주거 ㎡당 단가 보정 (방법 2용)


def _normalize_rent(deposit_wan: int, monthly_wan: int) -> float:
    """보증금 → 월세 환산 (전월세전환율 6%)."""
    return monthly_wan + (deposit_wan * _JEONWOL_RATE / 12)


def _floor_factor(floor_str: str) -> float:
    """층수 보정계수: 1층 0.92 / 2층 0.97 / 10층+ 1.03 / 그 외 1.0."""
    try:
        f = int(str(floor_str).strip())
        if f == 1:   return 0.92
        if f == 2:   return 0.97
        if f >= 10:  return 1.03
    except (ValueError, TypeError):
        pass
    return 1.0


def _age_factor(build_year, current_year: int = 2026) -> float:
    """건축연도 보정계수: 신축(5년↓) 1.08 / 중간 1.0 / 노후(20년+) 0.93."""
    if not build_year:
        return 1.0
    age = current_year - int(build_year)
    if age <= 5:   return 1.08
    if age <= 10:  return 1.04
    if age <= 20:  return 1.0
    return 0.93


# ════════════════════════════════════════════════════════════════════════════
# 통계 계산
# ════════════════════════════════════════════════════════════════════════════

def _trimmed_mean(values: list[float], trim_pct: float = 0.10) -> float:
    """상하위 trim_pct% 제거 후 평균."""
    if not values:
        return 0.0
    ps = sorted(values)
    n  = len(ps)
    cut = max(1, int(n * trim_pct))
    trimmed = ps[cut: n - cut] if n > cut * 2 else ps
    return statistics.mean(trimmed)


def _compute_stats(
    listings: list[dict],
    current_wan,
    deposit_wan: int = 0,
    target_floor: str = "",
    room_type: str = "all",
    room_capacity: int = 1,
    size_sqm=None,
) -> dict:
    """
    보정 환산월세 기준 통계.
    share 타입은 방법1(할인율) + 방법2(㎡단가) 평균으로 추천가 산출.
    그 외는 trimmed mean 기반.
    """
    if not listings:
        return {}

    # ── 보정 환산월세 목록 ────────────────────────────────────────────────
    normalized = []
    for p in listings:
        raw_rent    = p.get("monthly_rent_wan", 0) or 0
        raw_deposit = p.get("deposit_wan", 0) or 0
        floor_f     = _floor_factor(p.get("floor", ""))
        age_f       = _age_factor(p.get("build_year"))
        equiv = _normalize_rent(raw_deposit, raw_rent) * floor_f * age_f
        if equiv > 0:
            normalized.append(round(equiv, 1))

    if not normalized:
        return {}

    ps  = sorted(normalized)
    n   = len(ps)
    avg = round(statistics.mean(ps))
    med = round(statistics.median(ps))
    mn, mx = ps[0], ps[-1]
    p25 = ps[max(0, int(n * 0.25) - 1)]
    p75 = ps[min(n - 1, int(n * 0.75))]
    opt_base = round(_trimmed_mean(normalized))   # 이상치 제거 기준가

    confidence = "high" if n >= 20 else ("medium" if n >= 8 else "low")
    confidence_label = {"high": "높음(20건+)", "medium": "보통(8~19건)", "low": "낮음(~7건)"}[confidence]

    # ── 공유주거 이중 추정 (UniPlace 전체가 공유주거 플랫폼) ──────────────
    # 모든 room_type에 할인율 적용
    discount = _ROOM_TYPE_DISCOUNT.get(room_type, 0.70)
    method1_opt = method2_opt = None
    share_detail = {}

    # 방법 1: 인근 시세 × room_type별 할인율
    method1_opt = round(opt_base * discount)

    # 방법 2: ㎡당 단가 × 대상 면적 × 공유보정
    if size_sqm:
        area_prices = [
            _normalize_rent(p.get("deposit_wan", 0), p.get("monthly_rent_wan", 0))
            / p["size_sqm"]
            for p in listings
            if p.get("size_sqm") and p["size_sqm"] > 0
            and p.get("monthly_rent_wan", 0) > 0
        ]
        if area_prices:
            sqm_price = _trimmed_mean(area_prices)
            method2_opt = round(sqm_price * size_sqm * _SHARE_AREA_COEFF)

    # 10㎡ 이하 극소형: method2(㎡단가×면적)를 주 추천가로 사용
    # 이유: 수집된 데이터가 더 넓은 면적 매물이라 절대가(method1)는 왜곡됨
    #       ㎡당 단가로 환산하면 면적 차이를 보정할 수 있어 정확도가 높음
    is_small_room = size_sqm and size_sqm <= 10

    if method1_opt and method2_opt:
        if is_small_room:
            # 소형: method2 주(70%) + method1 보조(30%)
            opt = round(method2_opt * 0.7 + method1_opt * 0.3)
            note = f"㎡단가방식({method2_opt}만)×0.7 + 시세할인({method1_opt}만)×0.3 [소형방 보정]"
        else:
            opt = round((method1_opt + method2_opt) / 2)
            note = f"방법1({method1_opt}만)+방법2({method2_opt}만) 평균"
        share_detail = {
            "method1_opt": method1_opt,
            "method2_opt": method2_opt,
            "discount_rate": discount,
            "room_type": room_type,
            "is_small_room": is_small_room,
            "note": note,
        }
    elif method2_opt and is_small_room:
        # 소형이고 method2만 있으면 method2 단독 사용
        opt = method2_opt
        share_detail = {
            "method2_opt": method2_opt,
            "discount_rate": discount,
            "room_type": room_type,
            "is_small_room": True,
            "note": f"㎡단가방식({method2_opt}만) 단독 적용 [소형방]",
        }
    elif method1_opt:
        opt = method1_opt
        share_detail = {
            "method1_opt": method1_opt,
            "discount_rate": discount,
            "room_type": room_type,
            "note": f"방법1({method1_opt}만) 단독 적용 (면적 정보 없음)",
        }

    rec_low  = round(opt * 0.93)
    rec_high = round(opt * 1.07)

    # ── 현재가 비교 ───────────────────────────────────────────────────────
    _tf = _floor_factor(target_floor) if target_floor else 1.0
    current_equiv = (_normalize_rent(deposit_wan, current_wan) / _tf) if current_wan else 0

    rec = {
        "low": rec_low, "high": rec_high, "optimal": opt,
        "confidence": confidence,
        "confidence_label": confidence_label,
        "is_share": True,   # UniPlace 전체가 공유주거
        "discount_rate": discount,
        "room_type": room_type,
    }
    if share_detail:
        rec["share_detail"] = share_detail

    if current_equiv > 0:
        gap = round((current_equiv - opt) / opt * 100, 1)
        rec["gap_pct"]          = gap
        rec["current_equiv_wan"] = round(current_equiv, 1)
        rec["verdict"]          = "underpriced" if gap < -10 else ("overpriced" if gap > 10 else "fair")
        rec["verdict_label"]    = {
            "underpriced": f"시세 대비 {abs(gap):.1f}% 저평가 (인상 여지)",
            "overpriced":  f"시세 대비 {abs(gap):.1f}% 고평가 (인하 권고)",
            "fair":        "시세 적정",
        }[rec["verdict"]]
    else:
        rec["gap_pct"]     = 0
        rec["verdict"]     = "unknown"
        rec["verdict_label"] = "현재가 미입력"

    return {
        "market": {
            "min": mn, "max": mx, "avg": avg, "median": med,
            "p25": p25, "p75": p75,
            "recommended_low": rec_low, "recommended_high": rec_high,
            "recommended_optimal": opt,
            "sample_count": n,
            "base_market_opt": opt_base,
        },
        "recommendation": rec,
    }


# ════════════════════════════════════════════════════════════════════════════
# 분석 근거 텍스트
# ════════════════════════════════════════════════════════════════════════════

def _build_basis(listings, stats, current_wan, deposit_wan, radius_km, room_type, rent_type, room_capacity=1):
    if not stats:
        return "주변 매물 데이터 부족 — 통계 산출 불가"
    mkt, rec = stats["market"], stats["recommendation"]
    sources = {}
    for p in listings:
        k = p.get("source", "기타")
        sources[k] = sources.get(k, 0) + 1
    _TYPE_LABEL = {
        "one_room": "원룸(1인 1실)", "loft": "복층(1인 1실)",
        "two_room": "투룸", "three_room": "쓰리룸", "share": "쉐어(다인 1실)",
    }
    tp = _TYPE_LABEL.get(room_type, room_type)
    discount = rec.get("discount_rate", 0.70)
    sd = rec.get("share_detail", {})

    lines = [
        f"■ 분석 기준: 반경 {radius_km}km 내 인근 월세 실거래 {mkt['sample_count']}건",
        f"  출처: {', '.join(f'{k} {v}건' for k, v in sources.items())}",
        f"■ 보정 방식: 보증금→월세 환산(전환율 6%), 층수·건축연도 보정, 상하위 10% 이상치 제거",
        f"■ 인근 시세(보정 전): {mkt['min']}~{mkt['max']}만원 / 평균 {mkt['avg']}만 / 중위 {mkt['median']}만",
        f"  사분위(25~75%): {mkt['p25']}~{mkt['p75']}만원",
        f"■ 공유주거 보정 ({tp}, 할인율 {int(discount*100)}%)",
    ]

    if sd.get("method1_opt"):
        lines.append(f"  방법1 (인근시세×{discount}): {sd['method1_opt']}만원")
    if sd.get("method2_opt"):
        lines.append(f"  방법2 (㎡단가×면적×0.80): {sd['method2_opt']}만원")
    if sd.get("method1_opt") and sd.get("method2_opt"):
        lines.append(f"  → 두 방법 평균: {mkt['recommended_optimal']}만원")
    elif sd.get("method1_opt"):
        lines.append(f"  → 방법1 적용: {mkt['recommended_optimal']}만원")

    if current_wan:
        equiv = rec.get("current_equiv_wan", current_wan)
        lines.append(f"■ 현재가: 월세 {current_wan}만 + 보증금 {deposit_wan}만 → 환산 {equiv}만원/월")
        lines.append(f"  → {rec['verdict_label']}")

    lines.append(f"■ 추천 임대가: {rec['low']}~{rec['high']}만원 (최적 {rec['optimal']}만원)")
    lines.append(f"  신뢰도: {rec['confidence_label']}")
    return "\n".join(lines)


# ════════════════════════════════════════════════════════════════════════════
# 메인 실행
# ════════════════════════════════════════════════════════════════════════════

def execute_nearby_property_search(args: dict) -> dict:
    address        = args.get("address", "")
    room_type      = args.get("room_type", "all")
    rent_type_raw  = args.get("rent_type", "all")
    size_sqm       = args.get("room_size_sqm")
    current_wan    = args.get("current_price_wan")
    deposit_wan    = int(args.get("deposit_wan", 0) or 0)
    room_capacity  = int(args.get("room_capacity", 1) or 1)
    room_id        = args.get("room_id")
    target_floor   = str(args.get("floor") or "")
    radius_km      = float(args.get("radius_km", 3))

    _rent_type_map = {
        "stay": "monthly_rent", "monthly_rent": "monthly_rent",
        "jeonse": "jeonse", "all": "all",
    }
    rent_type = _rent_type_map.get(str(rent_type_raw).lower(), "all")

    if not address:
        return {"__type": "error", "error": "address 필수"}

    logger.info("[NearbyTool] 국토부 호출 시작 address=%s room_type=%s capacity=%s", address, room_type, room_capacity)
    market_data = _fetch_molit(address, rent_type, size_sqm, room_type)
    logger.info("[NearbyTool] 국토부 결과: %d건", len(market_data))

    if not market_data:
        logger.warning("[NearbyTool] 국토부 0건 — address=%s", address)
        return {
            "__type": "error",
            "error": "국토부 실거래가 데이터를 가져오지 못했습니다. MOLIT_API_KEY 환경변수와 apis.data.go.kr 아웃바운드 연결을 확인하세요.",
        }

    listings = []
    for item in market_data:
        monthly = item.get("monthly_rent_wan", 0) or 0
        dep     = item.get("deposit_wan", 0) or 0
        isize   = item.get("size_sqm") or 0
        listings.append({
            "source":           item.get("source", "국토부실거래"),
            "address":          item.get("address", ""),
            "size_sqm":         float(isize) if isize else None,
            "size_pyeong":      round(float(isize) / 3.305, 1) if isize else None,
            "floor":            str(item.get("floor", "")),
            "deposit_wan":      int(dep),
            "monthly_rent_wan": int(monthly),
            "rent_type":        item.get("rent_type", "monthly_rent"),
            "build_year":       item.get("build_year"),
            "deal_month":       item.get("deal_month", ""),
            "building_name":    item.get("building_name", ""),
            "is_realtime":      True,
        })

    stats = _compute_stats(
        listings, current_wan, deposit_wan,
        target_floor=target_floor,
        room_type=room_type,
        room_capacity=room_capacity,
        size_sqm=size_sqm,
    )
    basis = _build_basis(listings, stats, current_wan, deposit_wan, radius_km, room_type, rent_type, room_capacity)

    return {
        "__type": "price_report",
        "target_room": {
            "room_id": room_id, "address": address,
            "size_sqm": size_sqm,
            "size_pyeong": round(size_sqm / 3.305, 1) if size_sqm else None,
            "current_price_wan": current_wan,
            "deposit_wan": deposit_wan,
            "rent_type": rent_type,
            "room_type": room_type,
            "room_capacity": room_capacity,
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
            "build_year":       p.get("build_year"),
            "deal_month":       p.get("deal_month"),
            "building_name":    p.get("building_name", ""),
        } for p in listings[:12]],
        "basis_text":      basis,
        "total_collected": len(listings),
        "search_params": {"address": address, "radius_km": radius_km, "size_sqm": size_sqm},
    }


def format_nearby_property_result(result: dict) -> str:
    """LLM tool result 텍스트 + 프론트용 마커."""
    if result.get("__type") == "error":
        return f"[주변 매물 조회 오류] {result.get('error')}"

    mkt    = result.get("market", {})
    rec    = result.get("recommendation", {})
    target = result.get("target_room", {})

    is_share = rec.get("is_share", False)
    sd       = rec.get("share_detail", {})

    lines = [
        f"[가격 리포트] 총 {result.get('total_collected', 0)}건 분석",
        f"기준: {target.get('address')} | {target.get('size_pyeong')}평 | "
        f"현재 월세 {target.get('current_price_wan')}만 / 보증금 {target.get('deposit_wan', 0)}만",
    ]

    if is_share and sd:
        lines.append(f"공유주거 추정 ({sd.get('room_capacity', 1)}인 기준):")
        if sd.get("method1_opt"):
            lines.append(f"  방법1(원룸시세×할인율): {sd['method1_opt']}만원")
        if sd.get("method2_opt"):
            lines.append(f"  방법2(㎡단가×면적): {sd['method2_opt']}만원")
        lines.append(f"  → 평균 추천가: {rec.get('optimal')}만원")
    else:
        lines.append(f"인근 시세: 최저 {mkt.get('min')}만 / 최고 {mkt.get('max')}만 / 평균 {mkt.get('avg')}만")
        lines.append(f"추천 임대가: {rec.get('low')}~{rec.get('high')}만원 (최적 {rec.get('optimal')}만)")

    lines.append(f"평가: {rec.get('verdict_label', '')} | 신뢰도: {rec.get('confidence_label', '')}")
    lines.append(result.get("basis_text", ""))

    summary = "\n".join(lines)
    report_json = json.dumps(result, ensure_ascii=False)
    return f"{summary}\n\n__PRICE_REPORT__{report_json}__END_PRICE_REPORT__"