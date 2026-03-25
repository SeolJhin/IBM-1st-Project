/**
 * 건물 주소(buildingAddr)를 기반으로 지점명을 추출합니다.
 * 예) '경기도 성남시 분당구 판교역로 235' → '판교점'
 *     '서울특별시 강남구 테헤란로 427'    → '강남점'
 *     '경기도 수원시 영통구 광교중앙로 145' → '수원점'
 *
 * @param {{ buildingAddr?: string, buildingNm?: string }} building
 * @returns {string}  지점명 (주소 파싱 실패 시 buildingNm 그대로)
 */
export function getBranchLabel(building) {
  const addr = building?.buildingAddr || '';

  // 1) 서울: 구 단위 추출  (강남구 → 강남점)
  if (addr.includes('서울')) {
    const m = addr.match(/([가-힣]+)구/);
    if (m) return `${m[1]}점`;
  }

  // 2) 도로명에 '역'이 포함된 경우  (판교역로 → 판교점)
  const roadM = addr.match(/([가-힣]+)역/);
  if (roadM) return `${roadM[1]}점`;

  // 3) 시 단위 추출  (수원시 → 수원점)
  //    특별시·광역시·특별자치시는 제외
  const siM = addr.match(/([가-힣]{2,5})시/);
  const METRO = [
    '서울특별',
    '부산광역',
    '인천광역',
    '대구광역',
    '광주광역',
    '대전광역',
    '울산광역',
    '세종특별자치',
  ];
  if (siM && !METRO.some((ex) => siM[1].includes(ex))) {
    return `${siM[1]}점`;
  }

  // 4) fallback: 건물명 그대로
  return building?.buildingNm ?? '';
}

/**
 * "판교점 (Uniplace A)" 형태의 풀 표시 문자열을 반환합니다.
 * 지점명과 건물명이 같으면(파싱 실패) 건물명만 반환합니다.
 *
 * @param {{ buildingAddr?: string, buildingNm?: string }} building
 * @returns {string}
 */
export function formatBuildingDisplay(building) {
  const branchLabel = getBranchLabel(building);
  const nm = building?.buildingNm ?? '';
  // 파싱 실패(지점명 = 건물명)이면 그냥 건물명만
  if (!nm || branchLabel === nm) return nm;
  return `${branchLabel} (${nm})`;
}
