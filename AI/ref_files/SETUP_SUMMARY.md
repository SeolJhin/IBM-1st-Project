# Voice Pipeline ?ㅼ튂 & ?⑥튂 ?뺣━

## 理쒖쥌 援ъ꽦
- **STT**: faster-whisper (Whisper 湲곕컲)
- **TTS**: MeloTTS (MIT ?쇱씠?좎뒪, ?곸뾽??臾대즺)
- **API**: FastAPI (Swagger: http://dev-host:8000/docs)

---

## ?ㅼ튂???⑦궎吏

```bash
# ?듭떖
pip install faster-whisper
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download

# ?섏〈???쎌뒪
pip install --upgrade librosa          # 0.9.1 ??0.9.2 (pkg_resources 踰꾧렇 ?섏젙)
pip install --force-reinstall setuptools==69.5.1  # pkg_resources 蹂듭썝
pip install --force-reinstall mecab-python3       # 1.0.9 ??1.0.12
pip install python-mecab-ko            # ?쒓뎅??MeCab (C++ 鍮뚮뱶 遺덊븘??
pip install g2pk                       # ?쒓뎅??G2P
pip install importlib-resources
pip install soundfile fastapi uvicorn numpy requests
```

---

## ?⑥튂 ?댁슜

### 1. MeloTTS ?쒓뎅??紐⑤뱢 ?⑥튂
**?뚯씪**: `C:\Users\user\AppData\Local\Programs\Python\Python310\lib\site-packages\melo\text\korean.py`  
**諛깆뾽**: 媛숈? 寃쎈줈??`korean.py.bak`?쇰줈 ??λ맖

**臾몄젣**: MeloTTS ?쒓뎅?닿? `eunjeon` ?⑦궎吏 ?꾩슂 ??Windows?먯꽌 C++ 鍮뚮뱶 ?ㅽ뙣  
**?닿껐**: `eunjeon` ???`konlpy.Okt` + `g2pk` ?ъ슜?섎룄濡?援먯껜  
**異붽?**: `?? ??symbols???녿뒗 ?먮え ?먮룞 ?꾪꽣留?
?⑥튂 ?ъ쟻?⑹씠 ?꾩슂?섎㈃:
```bash
python patch_korean3.py
```

---

## ?꾨줈?앺듃 援ъ“

```
voice-pipeline/
?쒋?? stt/whisper_stt.py          # WhisperSTT ?대옒???쒋?? tts/melo_tts.py             # MeloTTS ?대옒??(硫붿씤)
?쒋?? tts/kokoro_tts.py           # KokoroTTS (?곸뼱/?쇰낯??以묎뎅?댁슜, 李멸퀬??
?쒋?? pipeline/voice_pipeline.py  # STT?뭈TS ?듯빀
?쒋?? api/server.py               # FastAPI ?쒕쾭
?쒋?? config/settings.py          # ?ㅼ젙
?쒋?? tests/test_melo.py          # MeloTTS ?뚯뒪???쒋?? tests/test_pipeline.py      # STT/TTS ?⑥쐞 ?뚯뒪???쒋?? tests/test_integration.py   # ?듯빀 ?뚯뒪???붴?? patch_korean3.py            # ?쒓뎅???⑥튂 ?ㅽ겕由쏀듃
```

---

## ?뚯뒪??紐낅졊??
```bash
# MeloTTS ?꾩껜 ?뚯뒪??(ko/en/ja/zh)
python tests/test_melo.py

# STT留??뚯뒪??python tests/test_pipeline.py --stt-only

# TTS留??뚯뒪??(kokoro 湲곕컲)
python tests/test_pipeline.py --tts-only

# ?쒓뎅??wav 吏곸젒 ?앹꽦
python -c "
import sys; sys.path.insert(0, '.')
from tts.melo_tts import MeloTTS
tts = MeloTTS()
result = tts.synthesize('?덈뀞?섏꽭??, lang='ko')
open('output.wav', 'wb').write(result.audio_bytes)
print('????꾨즺')
"

# API ?쒕쾭 ?ㅽ뻾
python api/server.py
# ??http://dev-host:8000/docs (Swagger UI)
```

---

## 吏???몄뼱 (MeloTTS)

| ?몄뼱 | lang 肄붾뱶 | 鍮꾧퀬 |
|------|-----------|------|
| ?쒓뎅??| `ko` | Okt G2P ?⑥튂 ?곸슜 |
| ?곸뼱 (US) | `en` or `en-us` | |
| ?곸뼱 (BR) | `en-gb` | |
| ?쇰낯??| `ja` | |
| 以묎뎅??| `zh` | |
| ?ㅽ럹?몄뼱 | `es` | |
| ?꾨옉?ㅼ뼱 | `fr` | |

---

## ?뚮젮吏??댁뒋

| ?댁뒋 | ?곹깭 |
|------|------|
| kokoro-onnx ?쒓뎅??voice ?놁쓬 | ?좑툘 voices-v1.0.bin??kf_alpha 誘명룷??|
| ?쒓뎅??TTS 泥섎━ ?띾룄 ?먮┝ | ?좑툘 CPU 湲곗? 臾몄옣??~10珥?(bert-kor-base 異붾줎) |
| FutureWarning 寃쎄퀬??| ??臾댁떆 媛?? ?숈옉???곹뼢 ?놁쓬 |

