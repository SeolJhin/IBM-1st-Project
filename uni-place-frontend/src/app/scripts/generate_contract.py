#!/usr/bin/env python3
"""
generate_contract.py
- 템플릿 내 라벨 글자와 동일한 폰트 크기
- 모든 텍스트 셀 수직 중앙 정렬
"""

import argparse, json, sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

IMG_W, IMG_H = 1240, 1753
PDF_W, PDF_H = 595.0, 841.0
BLACK = (0, 0, 0)
BLUE  = (10, 10, 180)

# ── 좌표 변환 ──────────────────────────────────────────────────────
def px_x(v): return int(v * IMG_W / PDF_W)
def px_y(v): return int(v * IMG_H / PDF_H)

def find_font(size):
    for path in [
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/gulim.ttc",
        "C:/Windows/Fonts/batang.ttc",
        "/usr/share/fonts/opentype/unifont/unifont.otf",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleGothic.ttf",
    ]:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()

def draw_in_cell(draw, text, x1, y1, x2, y2, font, fill=BLACK, align="center"):
    """셀(x1,y1)~(x2,y2) 내 수직/수평 중앙 or 좌측 정렬"""
    if not text:
        return
    text = str(text)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # 수직 중앙
    ty = y1 + (y2 - y1 - th) // 2
    # 수평
    if align == "center":
        tx = x1 + (x2 - x1 - tw) // 2
    elif align == "right":
        tx = x2 - tw - 6
    else:  # left
        tx = x1 + 6
    draw.text((tx, ty), text, font=font, fill=fill)


def generate(template_path, output_path, data, sign_img_path=None):
    img = Image.open(template_path).convert("RGB")
    global IMG_W, IMG_H
    IMG_W, IMG_H = img.size
    draw = ImageDraw.Draw(img)

    # ── 폰트 크기 (라벨 글자 높이 기준으로 측정한 값) ─────────────
    # 소재지 라벨 글자 높이 16px → size=17
    # 보증금 라벨 글자 높이 26px → size=29
    # 차임 라벨 글자 높이 29px → size=33
    # 하단 임대인 라벨 글자 높이 23px → size=25
    # 날짜/작은 텍스트 → size=17 (소재지와 동일)

    F_ADDR  = find_font(17)   # 소재지 주소 (라벨과 같은 크기)
    F_MONEY = find_font(29)   # 보증금/차임 금액
    F_RENT  = find_font(28)   # 차임 금액 (더 큰 행)
    F_BOT   = find_font(22)   # 하단 섹션 (행높이 32px에 맞춤)
    F_AREA  = find_font(25)   # 면적 숫자
    F_DATE  = find_font(17)   # 날짜 숫자

    # ── 데이터 ────────────────────────────────────────────────────
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

    # ── 상단 테이블 행 경계 (픽셀) ────────────────────────────────
    # 수평선: 228,318,361,391,421,470,507,538,568,592,634
    # 수직선: 90(외곽),208(라벨끝),1147(테이블끝)
    R  = [228, 318, 361, 391, 421, 470, 507, 538, 568, 592, 634]
    XL = 208   # 텍스트 입력 시작 x (라벨 오른쪽)
    XR = 1147  # 테이블 오른쪽 끝

    # Row 인덱스:
    # R[0]~R[1] = 소재지 (90px)
    # R[1]~R[2] = 토지/면적 (43px)
    # R[2]~R[3] = 건물구조 (30px)
    # R[3]~R[4] = 임대할부분 (30px)
    # R[4]~R[5] = 2.계약내용 (49px)
    # R[5]~R[6] = 보증금 (37px)
    # R[6]~R[7] = 계약금 (31px)
    # R[7]~R[8] = 중도금 (30px)
    # R[8]~R[9] = 잔금 (24px)
    # R[9]~R[10]= 차임 (42px)

    # ── 1. 소재지 ────────────────────────────────────────────────
    addr_text = f"{building_addr}  {room_no}호" if room_no else building_addr
    draw_in_cell(draw, addr_text, XL, R[0], XR, R[1], F_ADDR, align="left")

    # ── 2. 면적 (토지지목 행 중 면적 칸: 대략 x=340~570) ──────────
    # 면적 칸 수직선: 약 x=338(pdf_x=162), x=570(pdf_x=273)
    if room_size:
        draw_in_cell(draw, f"{room_size}㎡",
                     573, R[1], 690, R[2], F_AREA, align="center")

    # ── 3. 보증금 (R[5]~R[6], 37px) ─────────────────────────────
    # "금 [금액]원정 (W [금액] )"  금액 칸: XL ~ "원정(W" 이전
    # 금액 입력 위치: x=208~580(pdf_x=100~278)
    if deposit:
        draw_in_cell(draw, f"{deposit}원정",
                     XL, R[5], px_x(278), R[6], F_MONEY, align="center")

    # ── 4. 차임 (R[9]~R[10], 42px) ───────────────────────────────
    if rent_price:
        draw_in_cell(draw, f"{rent_price}원",
                     XL, R[9], px_x(278), R[10], F_RENT, align="center")
    # 납부일: "매월 ___일" → x=337~380(pdf)
    if payment_day:
        draw_in_cell(draw, str(payment_day),
                     px_x(337), R[9], px_x(378), R[10], F_DATE, align="center")

    # ── 5. 제2조 인도일 (밑줄 위에 - pdf_y=315.7) ─────────────────
    # 밑줄: 년(368~409), 월(417~445), 일(453~480)
    Y_D1 = px_y(306); Y_D2 = px_y(315)
    if deliver_year:
        draw_in_cell(draw, deliver_year,  px_x(368), Y_D1, px_x(409), Y_D2, F_DATE, fill=BLUE)
    if deliver_month:
        draw_in_cell(draw, deliver_month, px_x(417), Y_D1, px_x(445), Y_D2, F_DATE, fill=BLUE)
    if deliver_day:
        draw_in_cell(draw, deliver_day,   px_x(453), Y_D1, px_x(480), Y_D2, F_DATE, fill=BLUE)

    # ── 6. 제2조 종료일 (밑줄 위에 - pdf_y=326.2) ────────────────
    # 밑줄: 년(225~265), 월(273~301), 일(309~337)
    Y_E1 = px_y(317); Y_E2 = px_y(326)
    if end_year:
        draw_in_cell(draw, end_year,  px_x(225), Y_E1, px_x(265), Y_E2, F_DATE, fill=BLUE)
    if end_month:
        draw_in_cell(draw, end_month, px_x(273), Y_E1, px_x(301), Y_E2, F_DATE, fill=BLUE)
    if end_day:
        draw_in_cell(draw, end_day,   px_x(309), Y_E1, px_x(337), Y_E2, F_DATE, fill=BLUE)

    # ── 7. 서명 날짜 (하단 섹션 직전) ────────────────────────────
    # "매장마다 간인하여, 각각 1통씩 보관한다.  년  월  일"
    Y_S1 = px_y(583); Y_S2 = px_y(594)
    if sign_year:
        draw_in_cell(draw, sign_year,  px_x(415), Y_S1, px_x(460), Y_S2, F_DATE)
    if sign_month:
        draw_in_cell(draw, sign_month, px_x(464), Y_S1, px_x(498), Y_S2, F_DATE)
    if sign_day:
        draw_in_cell(draw, sign_day,   px_x(501), Y_S1, px_x(535), Y_S2, F_DATE)

    # ── 8. 하단 임대인/임차인 섹션 ───────────────────────────────
    # 수평선(px): 1242,1274,1307,1339,1375,1411
    # 수직선(px): 90,128,283,602,710,865,926,1057,1147
    BL = [1242, 1274, 1307, 1339, 1375, 1411]
    B_ADDR_L = 128    # 주소 칸 시작
    B_ADDR_R = 602    # 주소 칸 끝
    B_TEL_L  = 710    # 전화 칸 시작
    B_TEL_R  = 865    # 전화 칸 끝
    B_NM_L   = 926    # 성명 칸 시작
    B_NM_R   = 1057   # 성명 칸 끝
    B_STAMP_L = 1057  # ㊞ 칸 시작
    B_STAMP_R = 1147  # ㊞ 칸 끝

    # 임대인 (건물주 정보)
    draw_in_cell(draw, lessor_addr, B_ADDR_L, BL[0], B_ADDR_R, BL[1], F_BOT, align="left")
    draw_in_cell(draw, lessor_rrn,  B_ADDR_L, BL[1], B_ADDR_R, BL[2], F_BOT, align="center")
    draw_in_cell(draw, lessor_tel,  B_TEL_L,  BL[1], B_TEL_R,  BL[2], F_BOT, align="center")
    draw_in_cell(draw, lessor_nm,   B_NM_L,   BL[0], B_NM_R,   BL[2], F_BOT, align="center")

    # 임차인 (contract.lessor* 컬럼 = 임차인 정보)
    draw_in_cell(draw, lessee_addr, B_ADDR_L, BL[3], B_ADDR_R, BL[4], F_BOT, align="left")
    draw_in_cell(draw, lessee_rrn,  B_ADDR_L, BL[4], B_ADDR_R, BL[5], F_BOT, align="center")
    draw_in_cell(draw, lessee_tel,  B_TEL_L,  BL[4], B_TEL_R,  BL[5], F_BOT, align="center")
    draw_in_cell(draw, lessee_nm,   B_NM_L,   BL[3], B_NM_R,   BL[5], F_BOT, align="center")

    # ── 9. 서명 이미지 (임차인 ㊞ 칸에만 배치 - 성명 칸과 분리) ──
    if sign_img_path and Path(sign_img_path).exists():
        try:
            sign_raw = Image.open(sign_img_path).convert("RGBA")
            pad = 4
            stamp_w = B_STAMP_R - B_STAMP_L - pad * 2
            stamp_h = BL[5] - BL[3] - pad * 2
            sx = B_STAMP_L + pad
            sy = BL[3] + pad
            sign_resized = sign_raw.resize((stamp_w, stamp_h), Image.LANCZOS)
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
    group.add_argument("--data_file", help="JSON 파일 경로")
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
