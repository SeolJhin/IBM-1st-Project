# Voice Pipeline 설치 & 패치 정리

## 최종 구성
- **STT**: faster-whisper (Whisper 기반)
- **TTS**: MeloTTS (MIT 라이선스, 상업용 무료)
- **API**: FastAPI (Swagger: http://dev-host:8000/docs)

---

## 설치한 패키지

```bash
# 핵심
pip install faster-whisper
pip install git+https://github.com/myshell-ai/MeloTTS.git
python -m unidic download

# 의존성 픽스
pip install --upgrade librosa          # 0.9.1 → 0.9.2 (pkg_resources 버그 수정)
pip install --force-reinstall setuptools==69.5.1  # pkg_resources 복원
pip install --force-reinstall mecab-python3       # 1.0.9 → 1.0.12
pip install python-mecab-ko            # 한국어 MeCab (C++ 빌드 불필요)
pip install g2pk                       # 한국어 G2P
pip install importlib-resources
pip install soundfile fastapi uvicorn numpy requests
```

---

## 패치 내용

### 1. MeloTTS 한국어 모듈 패치
**파일**: `C:\Users\user\AppData\Local\Programs\Python\Python310\lib\site-packages\melo\text\korean.py`  
**백업**: 같은 경로에 `korean.py.bak`으로 저장됨

**문제**: MeloTTS 한국어가 `eunjeon` 패키지 필요 → Windows에서 C++ 빌드 실패  
**해결**: `eunjeon` 대신 `konlpy.Okt` + `g2pk` 사용하도록 교체  
**추가**: `ᇂ` 등 symbols에 없는 자모 자동 필터링

패치 재적용이 필요하면:
```bash
python patch_korean3.py
```

---

## 프로젝트 구조

```
voice-pipeline/
├── stt/whisper_stt.py          # WhisperSTT 클래스
├── tts/melo_tts.py             # MeloTTS 클래스 (메인)
├── tts/kokoro_tts.py           # KokoroTTS (영어/일본어/중국어용, 참고용)
├── pipeline/voice_pipeline.py  # STT→TTS 통합
├── api/server.py               # FastAPI 서버
├── config/settings.py          # 설정
├── tests/test_melo.py          # MeloTTS 테스트
├── tests/test_pipeline.py      # STT/TTS 단위 테스트
├── tests/test_integration.py   # 통합 테스트
└── patch_korean3.py            # 한국어 패치 스크립트
```

---

## 테스트 명령어

```bash
# MeloTTS 전체 테스트 (ko/en/ja/zh)
python tests/test_melo.py

# STT만 테스트
python tests/test_pipeline.py --stt-only

# TTS만 테스트 (kokoro 기반)
python tests/test_pipeline.py --tts-only

# 한국어 wav 직접 생성
python -c "
import sys; sys.path.insert(0, '.')
from tts.melo_tts import MeloTTS
tts = MeloTTS()
result = tts.synthesize('안녕하세요', lang='ko')
open('output.wav', 'wb').write(result.audio_bytes)
print('저장 완료')
"

# API 서버 실행
python api/server.py
# → http://dev-host:8000/docs (Swagger UI)
```

---

## 지원 언어 (MeloTTS)

| 언어 | lang 코드 | 비고 |
|------|-----------|------|
| 한국어 | `ko` | Okt G2P 패치 적용 |
| 영어 (US) | `en` or `en-us` | |
| 영어 (BR) | `en-gb` | |
| 일본어 | `ja` | |
| 중국어 | `zh` | |
| 스페인어 | `es` | |
| 프랑스어 | `fr` | |

---

## 알려진 이슈

| 이슈 | 상태 |
|------|------|
| kokoro-onnx 한국어 voice 없음 | ⚠️ voices-v1.0.bin에 kf_alpha 미포함 |
| 한국어 TTS 처리 속도 느림 | ⚠️ CPU 기준 문장당 ~10초 (bert-kor-base 추론) |
| FutureWarning 경고들 | ✅ 무시 가능, 동작에 영향 없음 |
