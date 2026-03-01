#!/usr/bin/env python3
"""
generate_contract.py - 정확한 셀 중앙 정렬 + 적정 폰트 크기
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

IMG_W, IMG_H = 1240, 1753
PDF_W, PDF_H = 595.0, 841.0
BLACK = (0, 0, 0)
BLUE  = (10, 10, 180)


def to_px(pdf_x, pdf_y=None):
    if pdf_y is None:
        return int(pdf_x * IMG_W / PDF_W)
    return int(pdf_x * IMG_W / PDF_W), int(pdf_y * IMG_H / PDF_H)


def px_x(v): return int(v * IMG_W / PDF_W)
def px_y(v): return int(v * IMG_H / PDF_H)


def find_font(size):
    candidates = [
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/gulim.ttc",
        "C:/Windows/Fonts/batang.ttc",
        "/usr/share/fonts/opentype/unifont/unifont.otf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleGothic.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def draw_cell(draw, text, x1, y1, x2, y2, font, fill=BLACK, align="center"):
    """셀 영역 내에 텍스트 배치 (center 또는 left)"""
    if not text:
        return
    text = str(text)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    cy = (y1 + y2) // 2 - th // 2

    if align == "center":
        cx = (x1 + x2) // 2 - tw // 2
    else:  # left
        cx = x1 + 6

    # 셀을 넘치면 폰트 크기 자동 축소
    cell_w = x2 - x1 - 10
    if tw > cell_w:
        # 텍스트가 셀보다 넓으면 왼쪽 정렬
        cx = x1 + 4

    draw.text((cx, cy), text, font=font, fill=fill)


def generate(template_path, output_path, data, sign_img_path=None):
    img = Image.open(template_path).convert("RGB")
    global IMG_W, IMG_H
    IMG_W, IMG_H = img.size
    draw = ImageDraw.Draw(img)

    # ── 폰트 ─────────────────────────────────────────────────────
    F16 = find_font(16)   # 주소, 금액
    F15 = find_font(15)   # 기본
    F14 = find_font(14)   # 작은 텍스트
    F18 = find_font(18)   # 성명 강조

    # ── 데이터 ───────────────────────────────────────────────────
    d = data
    building_addr = d.get("building_addr", "")
    room_no       = d.get("room_no", "")
    room_size     = d.get("room_size", "")
    deposit       = d.get("deposit", "")
    rent_price    = d.get("rent_price", "")
    payment_day   = d.get("payment_day", "")
    deliver_year  = d.get("deliver_year", "")
    deliver_month = d.get("deliver_month", "")
    deliver_day   = d.get("deliver_day", "")
    end_year      = d.get("end_year", "")
    end_month     = d.get("end_month", "")
    end_day       = d.get("end_day", "")
    sign_year     = d.get("sign_year", "")
    sign_month    = d.get("sign_month", "")
    sign_day      = d.get("sign_day", "")
    lessor_nm     = d.get("lessor_nm", "")
    lessor_tel    = d.get("lessor_tel", "")
    lessor_addr   = d.get("lessor_addr", "")
    lessor_rrn    = d.get("lessor_rrn", "")
    lessee_nm     = d.get("lessee_nm", "")
    lessee_tel    = d.get("lessee_tel", "")
    lessee_addr   = d.get("lessee_addr", "")
    lessee_rrn    = d.get("lessee_rrn", "")

    # ── 테이블 행 경계 (PDF 좌표 → 픽셀) ─────────────────────────
    # 수평선: 109.4, 152.6, 173.2, 187.6, 202.0, 225.5, 243.2, 258.1, 272.5, 284.0, 304.2
    RL = [px_y(v) for v in [109.4, 152.6, 173.2, 187.6, 202.0, 225.5, 243.2, 258.1, 272.5, 284.0, 304.2]]
    # RL[0]=소재지상단, RL[1]=소재지하단=면적상단, ..., RL[5]=보증금상단, RL[6]=보증금하단
    # 행 매핑:
    #   소재지: RL[0]~RL[1]
    #   면적:   RL[1]~RL[2]
    #   보증금: RL[5]~RL[6]  (인덱스 5: pdf 225.5, 인덱스 6: pdf 243.2)
    #   잔금:   RL[8]~RL[9]  (pdf 272.5~284.0)
    #   차임:   RL[9]~RL[10] (pdf 284.0~304.2)

    # 열 경계 (라벨 영역 오른쪽 x=100, 테이블 오른쪽 x=550)
    X0 = px_x(100)   # 라벨 끝 / 텍스트 시작
    X1 = px_x(550)   # 테이블 끝

    # ── 1. 소재지 ─────────────────────────────────────────────────
    addr_text = f"{building_addr}  {room_no}호" if room_no else building_addr
    draw_cell(draw, addr_text, X0, RL[0], X1, RL[1], F16, align="left")

    # ── 2. 면적 (토지지목 행의 면적 칸, x: 135~190) ───────────────
    if room_size:
        draw_cell(draw, f"{room_size}㎡",
                  px_x(135), RL[1], px_x(190), RL[2], F14, align="center")

    # ── 3. 보증금 (RL[5]~RL[6]) ──────────────────────────────────
    # "금 [금액]원정 (W [금액] )"
    # 금액은 "금" 다음~"원정" 전 영역: x=100~280
    if deposit:
        draw_cell(draw, f"{deposit}원정",
                  px_x(100), RL[5], px_x(280), RL[6], F16, align="center")

    # ── 4. 차임 금액 (RL[9]~RL[10]) ──────────────────────────────
    # "금 [금액] 원정은 (선불로·후불로) 매월 [납부일]일에 지급"
    if rent_price:
        draw_cell(draw, f"{rent_price}원",
                  px_x(100), RL[9], px_x(280), RL[10], F16, align="center")

    # 납부일: "매월" 뒤 빈칸 (pdf_x ≈ 337~380)
    if payment_day:
        draw_cell(draw, str(payment_day),
                  px_x(337), RL[9], px_x(380), RL[10], F15, align="center")

    # ── 5. 제2조 인도일 (밑줄 pdf_y=315.7, 텍스트는 밑줄 바로 위) ──
    # 밑줄: 년(368.5~408.8), 월(416.5~444.8), 일(452.5~480.3)
    Y_DEL1 = px_y(305); Y_DEL2 = px_y(315)
    if deliver_year:
        draw_cell(draw, deliver_year,  px_x(368), Y_DEL1, px_x(409), Y_DEL2, F14, fill=BLUE)
    if deliver_month:
        draw_cell(draw, deliver_month, px_x(416), Y_DEL1, px_x(445), Y_DEL2, F14, fill=BLUE)
    if deliver_day:
        draw_cell(draw, deliver_day,   px_x(452), Y_DEL1, px_x(480), Y_DEL2, F14, fill=BLUE)

    # ── 6. 제2조 종료일 (밑줄 pdf_y≈326, 텍스트는 바로 위) ────────
    # 밑줄: 년(225~265), 월(273~301), 일(309~337)
    Y_END1 = px_y(317); Y_END2 = px_y(326)
    if end_year:
        draw_cell(draw, end_year,  px_x(225), Y_END1, px_x(265), Y_END2, F14, fill=BLUE)
    if end_month:
        draw_cell(draw, end_month, px_x(273), Y_END1, px_x(301), Y_END2, F14, fill=BLUE)
    if end_day:
        draw_cell(draw, end_day,   px_x(309), Y_END1, px_x(337), Y_END2, F14, fill=BLUE)

    # ── 7. 서명 날짜 (하단 서명 섹션 직전, pdf_y ≈ 585~595) ───────
    # "매장마다 간인하여, 각각 1통씩 보관한다. 년  월  일"
    # 날짜 밑줄: 오른쪽 끝에 있음
    Y_SGN1 = px_y(584); Y_SGN2 = px_y(596)
    if sign_year:
        draw_cell(draw, sign_year,  px_x(415), Y_SGN1, px_x(460), Y_SGN2, F14)
    if sign_month:
        draw_cell(draw, sign_month, px_x(465), Y_SGN1, px_x(498), Y_SGN2, F14)
    if sign_day:
        draw_cell(draw, sign_day,   px_x(502), Y_SGN1, px_x(535), Y_SGN2, F14)

    # ── 8. 하단 임대인/임차인 섹션 ───────────────────────────────
    # 수평선: 595.8, 611.2, 627.0, 642.4, 659.7, 676.9
    # 수직선: 43, 54, 61, 136, 289, 341, 415, 444, 507, 550
    BL = [px_y(v) for v in [595.8, 611.2, 627.0, 642.4, 659.7, 676.9]]

    # 임대인 (BL[0]~BL[3])
    # 주소: BL[0]~BL[1], x: 61~289
    draw_cell(draw, lessor_addr, px_x(61), BL[0], px_x(289), BL[1], F14, align="left")
    # 주민번호: BL[1]~BL[2], x: 61~289
    draw_cell(draw, lessor_rrn, px_x(61), BL[1], px_x(289), BL[2], F14, align="center")
    # 전화: BL[1]~BL[2], x: 341~415
    draw_cell(draw, lessor_tel, px_x(341), BL[1], px_x(415), BL[2], F14, align="center")
    # 성명: BL[0]~BL[2], x: 444~507 (2행 걸쳐 중앙)
    draw_cell(draw, lessor_nm, px_x(444), BL[0], px_x(507), BL[2], F18, align="center")

    # 임차인 (BL[3]~BL[5])
    # 주소: BL[3]~BL[4], x: 61~289
    draw_cell(draw, lessee_addr, px_x(61), BL[3], px_x(289), BL[4], F14, align="left")
    # 주민번호: BL[4]~BL[5], x: 61~289
    draw_cell(draw, lessee_rrn, px_x(61), BL[4], px_x(289), BL[5], F14, align="center")
    # 전화: BL[4]~BL[5], x: 341~415
    draw_cell(draw, lessee_tel, px_x(341), BL[4], px_x(415), BL[5], F14, align="center")
    # 성명: BL[3]~BL[5], x: 444~507
    draw_cell(draw, lessee_nm, px_x(444), BL[3], px_x(507), BL[5], F18, align="center")

    # ── 9. 서명 이미지 ──────────────────────────────────────────
    if sign_img_path and Path(sign_img_path).exists():
        try:
            sign_raw = Image.open(sign_img_path).convert("RGBA")
            sx = px_x(444); sy = BL[4]
            sw = px_x(507) - px_x(444)
            sh = BL[5] - BL[4]
            sign_resized = sign_raw.resize((sw, sh), Image.LANCZOS)
            img.paste(sign_resized, (sx, sy), sign_resized.split()[3])
        except Exception as e:
            print(f"[WARN] 서명 이미지 합성 실패: {e}", file=sys.stderr)

    # ── 저장 ────────────────────────────────────────────────────
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(out), "JPEG", quality=92, optimize=True)
    print(f"OK:{out}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--template",  required=True)
    parser.add_argument("--output",    required=True)
    parser.add_argument("--sign_img",  default=None)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--data",      help="JSON 문자열")
    group.add_argument("--data_file", help="JSON 파일 경로 (한글/공백 문제 우회)")
    args = parser.parse_args()

    try:
        if args.data_file:
            with open(args.data_file, encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = json.loads(args.data)
    except Exception as e:
        print(f"[ERROR] 데이터 파싱 실패: {e}", file=sys.stderr)
        sys.exit(1)

    generate(args.template, args.output, data, args.sign_img)


if __name__ == "__main__":
    main()
