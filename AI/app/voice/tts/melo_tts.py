"""
MeloTTS 기반 TTS 모듈

MIT 라이선스 — 상업적 사용 완전 무료
한국어/영어/일본어/중국어/스페인어/프랑스어 지원
CPU 실시간 추론 가능
"""
import io
import time
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Literal

logger = logging.getLogger(__name__)

# 언어 코드 → MeloTTS language / speaker 매핑
MELO_LANG_MAP = {
    "ko":    {"language": "KR", "speaker": "KR"},
    "en":    {"language": "EN", "speaker": "EN-US"},
    "en-us": {"language": "EN", "speaker": "EN-US"},
    "en-gb": {"language": "EN", "speaker": "EN-BR"},
    "ja":    {"language": "JP", "speaker": "JP"},
    "zh":    {"language": "ZH", "speaker": "ZH"},
    "es":    {"language": "ES", "speaker": "ES"},
    "fr":    {"language": "FR", "speaker": "FR"},
}

# 지원 언어 목록
SUPPORTED_LANGUAGES = {
    "ko": "한국어",
    "en": "English (US/BR/India/AU)",
    "ja": "日本語",
    "zh": "中文",
    "es": "Español",
    "fr": "Français",
}

OutputFormat = Literal["wav", "mp3", "ogg"]


@dataclass
class SynthesisResult:
    audio_bytes: bytes
    sample_rate: int
    format: str
    duration_s: float
    processing_time_s: float
    language: str
    speaker: str

    @property
    def rtf(self) -> float:
        return self.processing_time_s / max(self.duration_s, 0.001)


class MeloTTS:
    """
    MeloTTS 클라이언트 — 한국어 포함 다국어 TTS

    사용 예:
        tts = MeloTTS()
        result = tts.synthesize("안녕하세요", lang="ko")
        with open("output.wav", "wb") as f:
            f.write(result.audio_bytes)
    """

    def __init__(
        self,
        device: str = "cpu",
        default_speed: float = 1.0,
    ):
        self.device = device
        self.default_speed = default_speed
        self._models: dict = {}  # language → TTS 모델 캐시

    def _get_model(self, language: str):
        """언어별 모델 지연 로딩 및 캐싱"""
        if language in self._models:
            return self._models[language]
        try:
            from melo.api import TTS
            logger.info(f"MeloTTS 모델 로딩: language={language}...")
            model = TTS(language=language, device=self.device)
            self._models[language] = model
            logger.info(f"MeloTTS '{language}' 모델 로드 완료 ✓")
            return model
        except ImportError:
            raise ImportError(
                "MeloTTS가 설치되지 않았습니다.\n"
                "설치: pip install git+https://github.com/myshell-ai/MeloTTS.git\n"
                "      python -m unidic download"
            )

    def _resolve_lang(self, lang: Optional[str]) -> dict:
        """언어 코드 → MeloTTS language/speaker 변환"""
        if lang:
            normalized = lang.lower().replace("_", "-")
            return MELO_LANG_MAP.get(normalized, MELO_LANG_MAP["en"])
        return MELO_LANG_MAP["en"]

    def synthesize(
        self,
        text: str,
        lang: Optional[str] = None,
        speaker: Optional[str] = None,
        speed: Optional[float] = None,
        output_format: OutputFormat = "wav",
    ) -> SynthesisResult:
        """
        텍스트를 음성으로 합성

        Args:
            text: 합성할 텍스트
            lang: 언어 코드 ("ko", "en", "ja", "zh", "es", "fr")
            speaker: 화자 이름 (None = 언어별 기본값)
            speed: 발화 속도 (0.5 ~ 2.0)
            output_format: "wav" | "mp3" | "ogg"
        """
        lang_info = self._resolve_lang(lang)
        melo_language = lang_info["language"]
        melo_speaker  = speaker or lang_info["speaker"]
        spd = speed if speed is not None else self.default_speed

        model = self._get_model(melo_language)
        speaker_ids = model.hps.data.spk2id

        if melo_speaker not in speaker_ids:
            available = list(speaker_ids.keys())
            logger.warning(f"Speaker '{melo_speaker}' 없음. 사용 가능: {available}")
            melo_speaker = available[0]

        t0 = time.perf_counter()

        # 임시 파일로 저장 후 bytes로 읽기
        import tempfile
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        model.tts_to_file(
            text,
            speaker_ids[melo_speaker],
            str(tmp_path),
            speed=spd,
        )

        processing_time = time.perf_counter() - t0
        audio_bytes = tmp_path.read_bytes()
        tmp_path.unlink(missing_ok=True)

        # 길이 계산
        import soundfile as sf
        import io as _io
        info = sf.info(_io.BytesIO(audio_bytes))
        duration_s = info.duration

        # 포맷 변환 (wav 외)
        if output_format != "wav":
            audio_bytes = self._convert_format(audio_bytes, output_format)

        result = SynthesisResult(
            audio_bytes=audio_bytes,
            sample_rate=info.samplerate,
            format=output_format,
            duration_s=duration_s,
            processing_time_s=processing_time,
            language=lang or "auto",
            speaker=melo_speaker,
        )

        logger.info(
            f"TTS 완료 | lang: {melo_language} | speaker: {melo_speaker} | "
            f"길이: {duration_s:.1f}s | RTF: {result.rtf:.2f}"
        )
        return result

    def synthesize_to_file(
        self,
        text: str,
        output_path: str | Path,
        lang: Optional[str] = None,
        speaker: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> Path:
        """파일로 직접 저장"""
        output_path = Path(output_path)
        fmt = output_path.suffix.lstrip(".") or "wav"
        result = self.synthesize(text, lang=lang, speaker=speaker,
                                  speed=speed, output_format=fmt)  # type: ignore
        output_path.write_bytes(result.audio_bytes)
        logger.info(f"저장 완료: {output_path}")
        return output_path

    def list_speakers(self, lang: Optional[str] = None) -> dict:
        """언어별 사용 가능한 speaker 목록"""
        if lang:
            info = self._resolve_lang(lang)
            model = self._get_model(info["language"])
            return dict(model.hps.data.spk2id)
        return MELO_LANG_MAP

    def _convert_format(self, wav_bytes: bytes, fmt: str) -> bytes:
        import soundfile as sf
        import numpy as np
        buf_in = io.BytesIO(wav_bytes)
        audio, sr = sf.read(buf_in)
        buf_out = io.BytesIO()
        sf.write(buf_out, audio, sr, format=fmt.upper())
        return buf_out.getvalue()

    def unload(self, lang: Optional[str] = None):
        if lang:
            info = self._resolve_lang(lang)
            self._models.pop(info["language"], None)
        else:
            self._models.clear()
        logger.info("MeloTTS 모델 해제")
