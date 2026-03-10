from __future__ import annotations

import base64
import os
from pathlib import Path
from typing import Any
from uuid import uuid4

from app.config.settings import BASE_DIR, settings
from app.schemas.ai_request import AiRequest
from app.services.rag.generator import generate_answer
from app.services.rag.retriever import retrieve_context


def _resolve_runtime_dir(path_value: str) -> Path:
    path = Path(path_value)
    if not path.is_absolute():
        path = BASE_DIR / path
    return path.resolve()


VOICE_INPUT_DIR = _resolve_runtime_dir(settings.voice_input_dir)
VOICE_OUTPUT_DIR = _resolve_runtime_dir(settings.voice_output_dir)
_TTS_CACHE: dict[str, Any] = {}


def run_voice_chatbot(req: AiRequest) -> tuple[str, dict[str, Any]]:
    _ensure_voice_dirs()
    text_input = str(req.prompt or req.get_slot("prompt") or "").strip()
    transcript = text_input

    audio_path = _resolve_audio_path(req)
    if not transcript and audio_path is not None:
        transcript = _transcribe_with_faster_whisper(audio_path)

    voice_req = AiRequest(
        intent="AI_AGENT_CHATBOT",
        user_id=req.user_id,
        user_segment=req.user_segment,
        prompt=transcript,
        slots=req.slots,
    )
    docs = retrieve_context(voice_req)
    answer = generate_answer(voice_req, docs)
    tts_enabled = _to_bool(req.get_slot("tts_enabled"), default=True)

    metadata: dict[str, Any] = {
        "transcript": transcript,
        "docs": len(docs),
        "tts_enabled": tts_enabled,
        "voice_locale": str(req.get_slot("voice_locale") or "ko"),
    }
    if tts_enabled:
        audio_out = _synthesize_with_melotts(answer, locale=metadata["voice_locale"])
        if audio_out:
            metadata["tts_audio_path"] = audio_out
        else:
            metadata["tts_audio_path"] = ""
            metadata["tts_status"] = "melotts_not_available"

    return answer, metadata


def _resolve_audio_path(req: AiRequest) -> Path | None:
    raw_path = str(req.get_slot("audio_path") or "").strip()
    if raw_path:
        try:
            path = Path(raw_path).expanduser().resolve()
        except Exception:
            path = None
        if path is not None and path.exists() and _is_under(path, VOICE_INPUT_DIR):
            return path

    raw_b64 = req.get_slot("audio_base64")
    if not isinstance(raw_b64, str) or not raw_b64.strip():
        return None
    try:
        data = base64.b64decode(raw_b64, validate=True)
    except Exception:
        return None

    file_path = _next_file_path(VOICE_INPUT_DIR, prefix="stt_in", suffix=".wav")
    try:
        with file_path.open("wb") as fp:
            fp.write(data)
        _apply_permissions(file_path, is_dir=False)
        return file_path
    except Exception:
        return None


def _transcribe_with_faster_whisper(path: Path) -> str:
    try:
        from faster_whisper import WhisperModel  # type: ignore
    except Exception:
        return ""

    try:
        model = WhisperModel("small", device="cpu", compute_type="int8")
        segments, _ = model.transcribe(str(path), language="ko")
        text = "".join(segment.text for segment in segments).strip()
        return text
    except Exception:
        return ""


def _synthesize_with_melotts(text: str, locale: str = "ko") -> str:
    if not text.strip():
        return ""

    _ensure_voice_dirs()
    out_path = _next_file_path(VOICE_OUTPUT_DIR, prefix="tts_out", suffix=".wav")
    model_language = "EN" if locale.lower().startswith("en") else "KR"

    try:
        from melo.api import TTS  # type: ignore
    except Exception:
        return ""

    try:
        tts = _TTS_CACHE.get(model_language)
        if tts is None:
            tts = TTS(language=model_language)
            _TTS_CACHE[model_language] = tts

        spk2id = dict(getattr(tts.hps.data, "spk2id", {}) or {})
        default_speaker = "EN-US" if model_language == "EN" else "KR"
        speaker_name = default_speaker
        if speaker_name not in spk2id and spk2id:
            speaker_name = next(iter(spk2id.keys()))
        speaker_id = int(spk2id.get(speaker_name, 0))

        tts.tts_to_file(text=text, speaker_id=speaker_id, output_path=str(out_path), quiet=True)
        _apply_permissions(out_path, is_dir=False)
        return str(out_path)
    except Exception:
        return ""


def _to_bool(value: object, default: bool = False) -> bool:
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    text = str(value).strip().lower()
    if text in {"1", "true", "y", "yes"}:
        return True
    if text in {"0", "false", "n", "no"}:
        return False
    return default


def _ensure_voice_dirs() -> None:
    VOICE_INPUT_DIR.mkdir(parents=True, exist_ok=True)
    VOICE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    _apply_permissions(VOICE_INPUT_DIR, is_dir=True)
    _apply_permissions(VOICE_OUTPUT_DIR, is_dir=True)


def _apply_permissions(path: Path, *, is_dir: bool) -> None:
    mode = 0o750 if is_dir else 0o640
    try:
        os.chmod(path, mode)
    except OSError:
        pass


def _is_under(path: Path, base: Path) -> bool:
    try:
        path.resolve().relative_to(base.resolve())
        return True
    except Exception:
        return False


def _next_file_path(base: Path, *, prefix: str, suffix: str) -> Path:
    return base / f"{prefix}_{uuid4().hex}{suffix}"
