"""
통합 Voice Pipeline — STT → (처리) → TTS

UNI PLACE AI 아키텍처 통합 버전
위치: AI/app/voice/pipeline/voice_pipeline.py

음성 입력을 받아 텍스트 변환 후, 다시 음성으로 출력하는 완전한 파이프라인.
번역, 후처리 등 중간 단계를 자유롭게 삽입 가능.
"""
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, Callable

from app.voice.stt.whisper_stt import WhisperSTT, TranscriptionResult
from app.voice.tts.melo_tts import MeloTTS, SynthesisResult
from app.voice.config.settings import STTConfig, TTSConfig, SupportedLanguage

logger = logging.getLogger(__name__)


@dataclass
class PipelineResult:
    """파이프라인 전체 결과"""
    transcription: TranscriptionResult
    synthesis: SynthesisResult
    processed_text: str
    output_path: Optional[Path] = None

    @property
    def total_time_s(self) -> float:
        return (self.transcription.processing_time_s +
                self.synthesis.processing_time_s)


TextProcessor = Callable[[str, str], str]  # (text, language) -> processed_text


class VoicePipeline:
    """
    완전한 음성 → 음성 파이프라인

    사용 예 (FastAPI 엔드포인트에서):
        pipeline = VoicePipeline()
        result = pipeline.run("input.wav", output_path="output.wav")
        print(result.transcription.text)

    routes_ai.py /chat/voice-assistant 연동:
        transcription = pipeline.stt_only(audio_file)
        # transcription.text → AiRequest.extra_data["transcribed_text"]
        # → Spring AiGatewayImpl → FastAPI /api/v1/ai/chat/voice-assistant
    """

    def __init__(
        self,
        stt_config: Optional[STTConfig] = None,
        tts_config: Optional[TTSConfig] = None,
        text_processor: Optional[TextProcessor] = None,
    ):
        stt_cfg = stt_config or STTConfig()
        tts_cfg = tts_config or TTSConfig()

        self.stt = WhisperSTT(
            model_size=stt_cfg.model_size,
            device=stt_cfg.device,
            compute_type=stt_cfg.compute_type,
            language=stt_cfg.language,
            vad_filter=stt_cfg.vad_filter,
        )
        # TTS 엔진 선택 (MeloTTS 기본)
        if tts_cfg.engine == "kokoro":
            from app.voice.tts.kokoro_tts import KokoroTTS
            self.tts = KokoroTTS(device=tts_cfg.device, default_speed=tts_cfg.default_speed)
        else:
            self.tts = MeloTTS(device=tts_cfg.device, default_speed=tts_cfg.default_speed)

        self.text_processor = text_processor

    def run(
        self,
        audio_input: str | Path,
        output_path: Optional[str | Path] = None,
        language: Optional[SupportedLanguage] = None,
        tts_speed: float = 1.0,
        output_format: str = "wav",
    ) -> PipelineResult:
        """
        전체 파이프라인 실행

        Args:
            audio_input: 입력 오디오 경로
            output_path: 출력 오디오 저장 경로 (None = 저장 안 함)
            language: 강제 지정 언어 (None = 자동 감지)
            tts_speed: TTS 속도
            output_format: 출력 포맷 (wav/mp3/ogg)
        """
        logger.info(f"[Pipeline] 시작: {audio_input}")

        # 1. STT
        logger.info("[Pipeline] STT 처리 중...")
        transcription = self.stt.transcribe(audio_input, language=language)
        detected_lang = transcription.language
        logger.info(f"[Pipeline] STT 완료: '{transcription.text[:80]}' ({detected_lang})")

        # 2. 텍스트 후처리 (선택)
        processed_text = transcription.text
        if self.text_processor:
            processed_text = self.text_processor(transcription.text, detected_lang)

        # 3. TTS
        logger.info("[Pipeline] TTS 합성 중...")
        synthesis = self.tts.synthesize(
            processed_text,
            lang=detected_lang,
            speed=tts_speed,
            output_format=output_format,  # type: ignore
        )
        logger.info(f"[Pipeline] TTS 완료: {synthesis.duration_s:.1f}s")

        # 4. 저장 (선택)
        saved_path = None
        if output_path:
            saved_path = Path(output_path)
            saved_path.write_bytes(synthesis.audio_bytes)

        result = PipelineResult(
            transcription=transcription,
            synthesis=synthesis,
            processed_text=processed_text,
            output_path=saved_path,
        )
        logger.info(f"[Pipeline] 전체 완료 | 총 시간: {result.total_time_s:.2f}s")
        return result

    def stt_only(
        self,
        audio_input: str | Path,
        language: Optional[str] = None,
    ) -> TranscriptionResult:
        """STT만 단독 실행 — /chat/voice-assistant 엔드포인트용"""
        return self.stt.transcribe(audio_input, language=language)

    def tts_only(
        self,
        text: str,
        lang: Optional[str] = None,
        speed: float = 1.0,
        output_format: str = "wav",
    ) -> SynthesisResult:
        """TTS만 단독 실행"""
        return self.tts.synthesize(text, lang=lang, speed=speed, output_format=output_format)  # type: ignore
