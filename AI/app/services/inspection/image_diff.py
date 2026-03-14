# app/services/inspection/image_diff.py
"""
OpenCV 기반 Before/After 이미지 비교 서비스

- image_diff  : 두 이미지의 차이를 감지하고, 차이 영역을 빨간 사각형으로 강조한 이미지를 반환
- change_percent : 전체 픽셀 중 변화된 픽셀의 비율(%)
"""

import base64
import logging
from dataclasses import dataclass

import cv2
import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class DiffResult:
    """이미지 비교 결과"""
    change_percent: float        # 변화율 (0.0 ~ 100.0)
    diff_image_b64: str          # 차이 강조 이미지 (base64 PNG)
    has_significant_change: bool # 의미 있는 변화 여부 (기준: 1% 이상)


def _decode_b64_to_bgr(b64_str: str) -> np.ndarray:
    """
    base64 문자열 → OpenCV BGR 이미지(numpy 배열)로 변환

    base64: 이진 데이터를 문자열로 표현하는 인코딩 방식.
    Spring Boot가 이미지 파일을 읽어서 base64로 변환 후 전송함.
    """
    img_bytes = base64.b64decode(b64_str)
    np_arr = np.frombuffer(img_bytes, dtype=np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("이미지 디코딩에 실패했습니다. 유효한 이미지 파일인지 확인하세요.")
    return img


def _encode_bgr_to_b64(img: np.ndarray) -> str:
    """OpenCV BGR 이미지 → base64 PNG 문자열로 변환"""
    success, buffer = cv2.imencode(".png", img)
    if not success:
        raise ValueError("이미지 인코딩에 실패했습니다.")
    return base64.b64encode(buffer).decode("utf-8")


def compare_images(before_b64: str, after_b64: str) -> DiffResult:
    """
    Before / After 이미지를 비교하여 변화 영역을 감지합니다.

    처리 흐름:
    1. base64 → OpenCV 이미지 변환
    2. 두 이미지를 동일한 크기로 맞춤 (리사이즈)
    3. 그레이스케일(흑백)로 변환 → 색상 정보 제거, 밝기 차이만 비교
    4. absdiff: 픽셀별 절댓값 차이 계산
    5. threshold: 일정 수준 이상의 차이만 '변화'로 인정 (노이즈 제거)
    6. morphology(팽창): 작은 점들을 연결하여 덩어리로 만듦
    7. findContours: 변화된 영역의 윤곽선 찾기
    8. 변화 영역에 빨간 사각형(bounding box) 그리기
    9. 변화율(%) 계산

    Args:
        before_b64: 이전 점검 이미지 (base64)
        after_b64:  금번 점검 이미지 (base64)

    Returns:
        DiffResult: 변화율, 강조 이미지(base64), 유의미 변화 여부
    """
    logger.info("[IMAGE_DIFF] 이미지 비교 시작")

    # ── 1. 디코딩 ───────────────────────────────────────────────────────────
    before_bgr = _decode_b64_to_bgr(before_b64)
    after_bgr  = _decode_b64_to_bgr(after_b64)

    # ── 2. 크기 통일 ────────────────────────────────────────────────────────
    # 두 이미지 크기가 다르면 비교 불가 → after 크기 기준으로 before를 맞춤
    h, w = after_bgr.shape[:2]
    if before_bgr.shape[:2] != (h, w):
        logger.warning("[IMAGE_DIFF] 이미지 크기 불일치 → 리사이즈 적용")
        before_bgr = cv2.resize(before_bgr, (w, h), interpolation=cv2.INTER_AREA)

    # ── 3. 그레이스케일 변환 ────────────────────────────────────────────────
    before_gray = cv2.cvtColor(before_bgr, cv2.COLOR_BGR2GRAY)
    after_gray  = cv2.cvtColor(after_bgr,  cv2.COLOR_BGR2GRAY)

    # ── 4. 픽셀 차이 계산 (absdiff = absolute difference) ──────────────────
    diff = cv2.absdiff(before_gray, after_gray)

    # ── 5. 이진화 (threshold) ───────────────────────────────────────────────
    # 30 이상의 차이만 '변화'로 인정 → 조명 변화 등 미세한 노이즈 무시
    # THRESH_BINARY: 30 이상 → 255(흰색), 미만 → 0(검정)
    _, thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)

    # ── 6. 모폴로지 팽창 (Dilation) ─────────────────────────────────────────
    # 작은 점들을 연결해서 하나의 덩어리로 만듦 → 더 정확한 영역 감지
    kernel  = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=2)

    # ── 7. 윤곽선 찾기 (findContours) ───────────────────────────────────────
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # ── 8. 변화 영역 강조 ────────────────────────────────────────────────────
    # after 이미지에 빨간 사각형(bounding box)을 그려서 변화 영역 표시
    result_img = after_bgr.copy()
    MIN_CONTOUR_AREA = 200  # 너무 작은 점(노이즈)은 무시

    for contour in contours:
        if cv2.contourArea(contour) < MIN_CONTOUR_AREA:
            continue
        x, y, cw, ch = cv2.boundingRect(contour)
        cv2.rectangle(result_img, (x, y), (x + cw, y + ch), (0, 0, 255), 2)  # 빨간 사각형

    # ── 9. 변화율 계산 ────────────────────────────────────────────────────────
    total_pixels   = h * w
    changed_pixels = int(np.sum(thresh > 0))
    change_percent = round((changed_pixels / total_pixels) * 100, 2)

    logger.info(f"[IMAGE_DIFF] 변화율: {change_percent}%, 변화 픽셀: {changed_pixels}/{total_pixels}")

    return DiffResult(
        change_percent=change_percent,
        diff_image_b64=_encode_bgr_to_b64(result_img),
        has_significant_change=(change_percent >= 1.0),  # 1% 이상을 유의미한 변화로 판단
    )
