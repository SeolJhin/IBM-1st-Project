"""
Kokoro 기반 TTS (Text-to-Speech) 모듈

kokoro-onnx 사용 — 경량, 빠른 추론, 다국어 지원
"""
import io
import time
import logging
import numpy as np
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Literal

logger = logging.getLogger(__name__)

# Kokoro 지원 Voice 목록 (주요)
KOKORO_VOICES = {
    # 영어 (American)
    "af_heart":   {"lang": "en-us", "gender": "F", "note": "기본 영어 여성"},
    "af_sky":     {"lang": "en-us", "gender": "F"},
    "am_adam":    {"lang": "en-us", "gender": "M"},
    "am_michael": {"lang": "en-us", "gender": "M"},
    # 영어 (British)
    "bf_emma":    {"lang": "en-gb", "gender": "F"},
    "bm_george":  {"lang": "en-gb", "gender": "M"},
    # 일본어
    "jf_alpha":   {"lang": "ja",    "gender": "F"},
    "jm_kumo":    {"lang": "ja",    "gender": "M"},
    # 한국어 (Kokoro v1.0+)
    "kf_alpha":   {"lang": "ko",    "gender": "F", "note": "한국어 여성"},
    "km_alpha":   {"lang": "ko",    "gender": "M", "note": "한국어 남성"},
    # 중국어
    "zf_xiaobei": {"lang": "zh",    "gender": "F"},
    "zm_yunxi":   {"lang": "zh",    "gender": "M"},
}

# 언어 코드 → 기본 voice 매핑
DEFAULT_VOICE_BY_LANG = {
    "ko":    "kf_alpha",
    "en":    "af_heart",
    "en-us": "af_heart",
    "en-gb": "bf_emma",
    "ja":    "jf_alpha",
    "zh":    "zf_xiaobei",
}

OutputFormat = Literal["wav", "mp3", "ogg"]


@dataclass
class SynthesisResult:
    """TTS 합성 결과"""
    audio_bytes: bytes
    sample_rate: int
    format: str
    duration_s: float
    processing_time_s: float
    voice: str
    language: str

    @property
    def rtf(self) -> float:
        return self.processing_time_s / max(self.duration_s, 0.001)


class KokoroTTS:
    """
    Kokoro TTS 클라이언트

    사용 예:
        tts = KokoroTTS()
        result = tts.synthesize("안녕하세요", lang="ko")
        with open("output.wav", "wb") as f:
            f.write(result.audio_bytes)
    """

    def __init__(
        self,
        device: str = "cpu",
        default_speed: float = 1.0,
        sample_rate: int = 24000,
    ):
        self.device = device
        self.default_speed = default_speed
        self.sample_rate = sample_rate
        self._pipeline = None

    def _load_model(self):
        """지연 로딩"""
        if self._pipeline is not None:
            return
        try:
            from kokoro import KPipeline
            logger.info("Loading Kokoro TTS model...")
            # KPipeline은 내부적으로 onnx 모델 자동 다운로드
            self._pipeline = KPipeline(lang_code="a")  # 'a' = auto/multilingual
            logger.info("Kokoro TTS model loaded ✓")
        except ImportError:
            raise ImportError(
                "kokoro가 설치되지 않았습니다.\n"
                "설치: pip install kokoro>=0.9.4 soundfile"
            )

    def _resolve_voice(self, lang: Optional[str], voice: Optional[str]) -> str:
        """언어코드 또는 voice 이름으로 실제 voice 결정"""
        if voice:
            return voice
        if lang:
            normalized = lang.lower().replace("_", "-")
            return DEFAULT_VOICE_BY_LANG.get(normalized, "af_heart")
        return "af_heart"

    def synthesize(
        self,
        text: str,
        lang: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
        output_format: OutputFormat = "wav",
    ) -> SynthesisResult:
        """
        텍스트를 음성으로 합성

        Args:
            text: 합성할 텍스트
            lang: 언어 코드 ("ko", "en", "ja", "zh")
            voice: Kokoro voice 이름 (지정 시 lang보다 우선)
            speed: 발화 속도 (0.5 ~ 2.0, 기본 1.0)
            output_format: 출력 포맷 ("wav", "mp3", "ogg")

        Returns:
            SynthesisResult
        """
        self._load_model()

        resolved_voice = self._resolve_voice(lang, voice)
        spd = speed or self.default_speed
        t0 = time.perf_counter()

        # Kokoro 합성 — 제너레이터로 청크 반환
        audio_chunks = []
        for _, _, audio_np in self._pipeline(
            text,
            voice=resolved_voice,
            speed=spd,
            split_pattern=r"[.!?。！？\n]",  # 문장 단위 분할
        ):
            if audio_np is not None:
                audio_chunks.append(audio_np)

        if not audio_chunks:
            raise RuntimeError("TTS 합성 결과 없음 (빈 오디오)")

        audio_array = np.concatenate(audio_chunks, axis=-1)
        duration_s = len(audio_array) / self.sample_rate
        processing_time = time.perf_counter() - t0

        audio_bytes = self._encode(audio_array, output_format)

        result = SynthesisResult(
            audio_bytes=audio_bytes,
            sample_rate=self.sample_rate,
            format=output_format,
            duration_s=duration_s,
            processing_time_s=processing_time,
            voice=resolved_voice,
            language=lang or "auto",
        )

        logger.info(
            f"TTS 완료 | voice: {resolved_voice} | "
            f"길이: {duration_s:.1f}s | RTF: {result.rtf:.2f}"
        )
        return result

    def synthesize_to_file(
        self,
        text: str,
        output_path: str | Path,
        lang: Optional[str] = None,
        voice: Optional[str] = None,
        speed: Optional[float] = None,
    ) -> Path:
        """파일로 직접 저장하는 편의 메서드"""
        output_path = Path(output_path)
        fmt = output_path.suffix.lstrip(".") or "wav"
        result = self.synthesize(text, lang=lang, voice=voice, speed=speed,
                                  output_format=fmt)  # type: ignore
        output_path.write_bytes(result.audio_bytes)
        logger.info(f"저장 완료: {output_path}")
        return output_path

    def list_voices(self, lang: Optional[str] = None) -> dict:
        """사용 가능한 voice 목록 반환"""
        if lang:
            return {k: v for k, v in KOKORO_VOICES.items()
                    if v["lang"].startswith(lang)}
        return KOKORO_VOICES

    def _encode(self, audio_array: np.ndarray, fmt: OutputFormat) -> bytes:
        """numpy array → bytes 변환"""
        import soundfile as sf
        buf = io.BytesIO()
        sf.write(buf, audio_array, self.sample_rate, format=fmt.upper())
        return buf.getvalue()

    def unload(self):
        self._pipeline = None
        logger.info("Kokoro TTS model unloaded")
