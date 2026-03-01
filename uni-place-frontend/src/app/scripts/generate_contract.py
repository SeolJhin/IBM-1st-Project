#!/usr/bin/env python3
"""
generate_contract.py
계약서 PNG 템플릿 위에 계약 정보를 합성하여 JPG로 저장

필요 라이브러리: pip install Pillow
"""

import argparse
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

UNIFONT_PATH = "/usr/share/fonts/opentype/unifont/unifont.otf"
IMG_W, IMG_H = 1240, 1753
PDF_W, PDF_H = 595.0, 841.0

BLACK = (0, 0, 0)
BLUE  = (10, 10, 180)
FONT_SM = 12
FONT_MD = 14


def scale(pdf_x, pdf_y):
    return int(pdf_x * IMG_W / PDF_W), int(pdf_y * IMG_H / PDF_H)


def find_font(size):
    candidates = [
        UNIFONT_PATH,
        "C:/Windows/Fonts/malgun.ttf",
        "C:/Windows/Fonts/gulim.ttc",
        "C:/Windows/Fonts/batang.ttc",
        "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
        "/System/Library/Fonts/AppleGothic.ttf",
    ]
    for path in candidates:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    return ImageFont.load_default()


def generate(template_path, output_path, data, sign_img_path=None):
    img = Image.open(template_path).convert("RGB")
    global IMG_W, IMG_H
    IMG_W, IMG_H = img.size

    draw = ImageDraw.Draw(img)
    f_sm = find_font(FONT_SM)
    f_md = find_font(FONT_MD)

    def t(px, py, text, font=None, fill=BLACK):
        if not text:
            return
        x, y = scale(px, py)
        draw.text((x, y), str(text), font=font or f_sm, fill=fill)

    building_addr  = data.get("building_addr", "")
    room_no        = data.get("room_no", "")
    room_size      = data.get("room_size", "")
    deposit        = data.get("deposit", "")
    rent_price     = data.get("rent_price", "")
    payment_day    = data.get("payment_day", "")
    deliver_year   = data.get("deliver_year", "")
    deliver_month  = data.get("deliver_month", "")
    deliver_day    = data.get("deliver_day", "")
    end_year       = data.get("end_year", "")
    end_month      = data.get("end_month", "")
    end_day        = data.get("end_day", "")
    sign_year      = data.get("sign_year", "")
    sign_month     = data.get("sign_month", "")
    sign_day       = data.get("sign_day", "")
    lessor_addr    = data.get("lessor_addr", "")
    lessor_rrn     = data.get("lessor_rrn", "")
    lessor_tel     = data.get("lessor_tel", "")
    lessor_nm      = data.get("lessor_nm", "")
    lessee_addr    = data.get("lessee_addr", "")
    lessee_rrn     = data.get("lessee_rrn", "")
    lessee_tel     = data.get("lessee_tel", "")
    lessee_nm      = data.get("lessee_nm", "")

    addr_text = f"{building_addr}  {room_no}호" if room_no else building_addr
    t(160, 121, addr_text)
    if room_size:
        t(350, 185, f"{room_size}㎡")
    if deposit:
        t(160, 224, f"{deposit}원")
    if rent_price:
        t(160, 283, f"{rent_price}원")
    if payment_day:
        t(474, 283, str(payment_day))
    t(396, 302, deliver_year,  fill=BLUE)
    t(435, 302, deliver_month, fill=BLUE)
    t(465, 302, deliver_day,   fill=BLUE)
    t(256, 312, end_year,  fill=BLUE)
    t(295, 312, end_month, fill=BLUE)
    t(325, 312, end_day,   fill=BLUE)
    t(444, 581, sign_year)
    t(478, 581, sign_month)
    t(506, 581, sign_day)
    t(165, 593, lessor_addr)
    t(165, 608, lessor_rrn)
    t(338, 608, lessor_tel)
    t(450, 608, lessor_nm, font=f_md)
    t(165, 641, lessee_addr)
    t(165, 657, lessee_rrn)
    t(338, 657, lessee_tel)
    t(450, 657, lessee_nm, font=f_md)

    if sign_img_path and Path(sign_img_path).exists():
        try:
            sign_raw = Image.open(sign_img_path).convert("RGBA")
            sx, sy = scale(490, 653)
            sw, sh = scale(60, 22)
            sign_resized = sign_raw.resize((sw, sh), Image.LANCZOS)
            img.paste(sign_resized, (sx, sy), sign_resized.split()[3])
        except Exception as e:
            print(f"[WARN] 서명 이미지 합성 실패: {e}", file=sys.stderr)

    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(str(out), "JPEG", quality=92, optimize=True)
    print(f"OK:{out}", flush=True)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--template",  required=True)
    parser.add_argument("--output",    required=True)
    parser.add_argument("--sign_img",  default=None)
    # ✅ --data (직접 JSON) 와 --data_file (파일 경로) 둘 다 지원
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--data",      help="JSON 문자열 직접 전달")
    group.add_argument("--data_file", help="JSON 파일 경로 전달 (한글/공백 문제 우회)")
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
