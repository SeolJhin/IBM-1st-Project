"""
Voice Pipeline 전역 설정 관리
환경변수 기반 — AI/.env 파일에서 로드됨
"""
from pathlib import Path
from dataclasses import dataclass, field
from typing import Literal, Optional
import os

# AI/ 폴더 기준 루트
ROOT_DIR = Path(__file__).parent.parent.parent.parent  # AI/
MODELS_DIR = ROOT_DIR / "models" / "cache"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

# ── 지원 언어 ──────────────────────────────────────────────
SupportedLanguage = Literal["ko", "en", "ja", "zh"]

LANGUAGE_META = {
    "ko": {"name": "Korean",   "whisper_code": "ko", "melo_lang": "KR",    "melo_speaker": "KR"},
    "en": {"name": "English",  "whisper_code": "en", "melo_lang": "EN",    "melo_speaker": "EN-US"},
    "ja": {"name": "Japanese", "whisper_code": "ja", "melo_lang": "JP",    "melo_speaker": "JP"},
    "zh": {"name": "Chinese",  "whisper_code": "zh", "melo_lang": "ZH",    "melo_speaker": "ZH"},
}

# ── STT 설정 ───────────────────────────────────────────────
@dataclass
class STTConfig:
    model_size: str    = os.getenv("WHISPER_MODEL", "base")
    # tiny | base | small | medium | large-v3
    device: str        = os.getenv("WHISPER_DEVICE", "cpu")
    # cpu | cuda
    compute_type: str  = "int8"
    # int8 | float16 | float32
    language: Optional[str] = None
    # None = 자동 감지
    beam_size: int     = 5
    vad_filter: bool   = True
    vad_threshold: float = 0.5
    chunk_length_s: int  = 30

# ── TTS 설정 ───────────────────────────────────────────────
@dataclass
class TTSConfig:
    device: str         = os.getenv("TTS_DEVICE", "cpu")
    default_speed: float = 1.0
    # MeloTTS 사용 (MIT 라이선스, 한국어 포함 다국어)
    engine: str         = os.getenv("TTS_ENGINE", "melo")
    # "melo" | "kokoro"

# ── API 설정 ───────────────────────────────────────────────
@dataclass
class APIConfig:
    host: str             = os.getenv("VOICE_API_HOST", "0.0.0.0")
    port: int             = int(os.getenv("VOICE_API_PORT", "8001"))
    # NOTE: UNI PLACE FastAPI 메인은 8000, voice pipeline은 8001
    workers: int          = int(os.getenv("VOICE_API_WORKERS", "1"))
    max_audio_size_mb: int = 50
    request_timeout_s: int = 120

# ── 전체 파이프라인 설정 ───────────────────────────────────
@dataclass
class PipelineConfig:
    stt: STTConfig   = field(default_factory=STTConfig)
    tts: TTSConfig   = field(default_factory=TTSConfig)
    api: APIConfig   = field(default_factory=APIConfig)
    log_level: str   = os.getenv("LOG_LEVEL", "INFO")
    temp_dir: Path   = ROOT_DIR / "tmp"

    def __post_init__(self):
        self.temp_dir.mkdir(exist_ok=True)

# 싱글톤 인스턴스
config = PipelineConfig()
