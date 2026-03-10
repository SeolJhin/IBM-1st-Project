"""
Whisper 기반 STT (Speech-to-Text) 모듈

faster-whisper 사용 (OpenAI Whisper 대비 4x 빠름, 메모리 효율적)
"""
import time
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Iterator

logger = logging.getLogger(__name__)


@dataclass
class TranscriptSegment:
    """단일 전사 세그먼트"""
    start: float
    end: float
    text: str
    confidence: float = 1.0


@dataclass
class TranscriptionResult:
    """STT 전체 결과"""
    text: str
    language: str
    language_probability: float
    segments: list[TranscriptSegment]
    duration_s: float
    processing_time_s: float

    @property
    def rtf(self) -> float:
        """Real-Time Factor (처리시간 / 오디오길이) — 낮을수록 빠름"""
        return self.processing_time_s / max(self.duration_s, 0.001)


class WhisperSTT:
    """
    Whisper STT 클라이언트

    사용 예:
        stt = WhisperSTT(model_size="base", device="cpu")
        result = stt.transcribe("audio.wav")
        print(result.text, result.language)
    """

    def __init__(
        self,
        model_size: str = "base",
        device: str = "cpu",
        compute_type: str = "int8",
        language: Optional[str] = None,
        vad_filter: bool = True,
    ):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.language = language  # None = 자동 감지
        self.vad_filter = vad_filter
        self._model = None

    def _load_model(self):
        """지연 로딩 — 처음 호출 시에만 모델 로드"""
        if self._model is not None:
            return
        try:
            from faster_whisper import WhisperModel
            logger.info(f"Loading Whisper model: {self.model_size} on {self.device}")
            self._model = WhisperModel(
                self.model_size,
                device=self.device,
                compute_type=self.compute_type,
            )
            logger.info("Whisper model loaded ✓")
        except ImportError:
            raise ImportError(
                "faster-whisper가 설치되지 않았습니다.\n"
                "설치: pip install faster-whisper"
            )

    def transcribe(
        self,
        audio_path: str | Path,
        language: Optional[str] = None,
        beam_size: int = 5,
    ) -> TranscriptionResult:
        """
        오디오 파일을 텍스트로 변환

        Args:
            audio_path: 오디오 파일 경로 (wav, mp3, m4a, flac 등)
            language: 언어 코드 (None = 자동 감지, "ko", "en", "ja", "zh")
            beam_size: 빔 서치 크기 (높을수록 정확하지만 느림)

        Returns:
            TranscriptionResult
        """
        self._load_model()
        audio_path = Path(audio_path)

        if not audio_path.exists():
            raise FileNotFoundError(f"오디오 파일 없음: {audio_path}")

        lang = language or self.language  # 인자 우선, 없으면 기본값
        t0 = time.perf_counter()

        segments_iter, info = self._model.transcribe(
            str(audio_path),
            language=lang,
            beam_size=beam_size,
            vad_filter=self.vad_filter,
            vad_parameters={"threshold": 0.5, "min_silence_duration_ms": 500},
        )

        segments = []
        full_text_parts = []
        for seg in segments_iter:
            segments.append(TranscriptSegment(
                start=seg.start,
                end=seg.end,
                text=seg.text.strip(),
                confidence=getattr(seg, "avg_logprob", 0.0),
            ))
            full_text_parts.append(seg.text.strip())

        processing_time = time.perf_counter() - t0

        result = TranscriptionResult(
            text=" ".join(full_text_parts),
            language=info.language,
            language_probability=info.language_probability,
            segments=segments,
            duration_s=info.duration,
            processing_time_s=processing_time,
        )

        logger.info(
            f"STT 완료 | 언어: {result.language} ({result.language_probability:.0%}) | "
            f"RTF: {result.rtf:.2f} | 텍스트: {result.text[:60]}..."
        )
        return result

    def transcribe_stream(
        self,
        audio_path: str | Path,
        language: Optional[str] = None,
    ) -> Iterator[TranscriptSegment]:
        """세그먼트 단위 스트리밍 전사 (실시간 자막 등에 활용)"""
        self._load_model()
        lang = language or self.language

        segments_iter, _ = self._model.transcribe(
            str(audio_path),
            language=lang,
            vad_filter=self.vad_filter,
        )
        for seg in segments_iter:
            yield TranscriptSegment(
                start=seg.start,
                end=seg.end,
                text=seg.text.strip(),
            )

    def detect_language(self, audio_path: str | Path) -> tuple[str, float]:
        """
        언어만 감지 (전사 없이)

        Returns:
            (language_code, probability) 예: ("ko", 0.98)
        """
        self._load_model()
        _, info = self._model.transcribe(str(audio_path), beam_size=1)
        return info.language, info.language_probability

    def unload(self):
        """메모리에서 모델 해제"""
        self._model = None
        logger.info("Whisper model unloaded")
