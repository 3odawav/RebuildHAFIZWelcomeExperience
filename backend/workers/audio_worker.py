#!/usr/bin/env python3
"""
HAFIZ Isolated Audio & Speech Worker Contract (Python 3.11+)
Supports:
  - Silero VAD (ONNX / PyTorch)
  - Egyptian Arabic TTS & Tashkeel (voicetut-egyptian-tashkeel / Qwen3-TTS)
  - Seed-VC authorized singing & voice conversion (MiniMax strictly excluded)
  - BS-RoFormer (audio-separator) vocal isolation
  - Demucs htdemucs_6s 6-stem separation

Strict Hardware & Honesty Guarantees:
  - Enforces Turing SM75 FP16 / float32 safety (never requires native BF16).
  - Never fabricates fake audio outputs or fake progress; returns structured
    DEPENDENCY_NOT_INSTALLED status when an optional ML engine is not yet installed.
"""
from __future__ import annotations

import importlib.util
import json
import os
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict, List, Optional


SUPPORTED_ENGINES = {
    "silero_vad": {"module": "onnxruntime", "capability": "vad", "vram_mb": 128},
    "egyptian_tts": {"module": "torch", "capability": "tts", "vram_mb": 2600},
    "seed_vc": {"module": "torch", "capability": "voice_conversion", "vram_mb": 4400},
    "bs_roformer": {"module": "audio_separator", "capability": "vocal_isolation", "vram_mb": 3600},
    "demucs_6s": {"module": "demucs", "capability": "six_stems", "vram_mb": 3200},
}


@dataclass
class EngineReadiness:
    engine_id: str
    capability: str
    installed: bool
    required_module: str
    precision_policy: str
    estimated_vram_mb: int
    status: str


def detect_engine_readiness() -> Dict[str, EngineReadiness]:
    results: Dict[str, EngineReadiness] = {}
    for engine_id, meta in SUPPORTED_ENGINES.items():
        mod_name = meta["module"]
        installed = importlib.util.find_spec(mod_name) is not None
        results[engine_id] = EngineReadiness(
            engine_id=engine_id,
            capability=meta["capability"],
            installed=installed,
            required_module=mod_name,
            precision_policy="float16 (Turing SM75 safe; no mandatory BF16)",
            estimated_vram_mb=meta["vram_mb"],
            status="READY" if installed else "DEPENDENCY_NOT_INSTALLED",
        )
    return results


def validate_sm75_precision(requested_dtype: str) -> str:
    """Downgrades BF16 requests to FP16 on NVIDIA Quadro RTX 5000 (Turing SM75)."""
    normalized = (requested_dtype or "float16").strip().lower()
    if normalized in ("bf16", "bfloat16"):
        return "float16"
    if normalized in ("fp16", "float16", "half"):
        return "float16"
    return "float32"


def execute_audio_task(task: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    task = (task or "").strip().lower()

    if task == "probe":
        readiness = {k: asdict(v) for k, v in detect_engine_readiness().items()}
        return {"ok": True, "task": "probe", "engines": readiness}

    if task == "separate":
        input_path = str(payload.get("input_path", "")).strip()
        engine = str(payload.get("engine", "bs_roformer")).strip().lower()
        if engine not in ("bs_roformer", "demucs_6s"):
            return {"ok": False, "code": "UNSUPPORTED_ENGINE", "message": f"Unsupported stem engine: {engine}"}
        if not input_path or not Path(input_path).is_file():
            return {"ok": False, "code": "INPUT_NOT_FOUND", "message": "Input audio file does not exist."}

        readiness = detect_engine_readiness()[engine]
        if not readiness.installed:
            return {
                "ok": False,
                "code": "DEPENDENCY_NOT_INSTALLED",
                "engine": engine,
                "required_module": readiness.required_module,
                "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
                "message": f"Install '{readiness.required_module}' inside the isolated HAFIZ Python audio venv to run {engine}.",
            }
        return {
            "ok": True,
            "code": "READY_TO_DISPATCH",
            "engine": engine,
            "input_path": input_path,
            "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
        }

    if task == "voice_convert":
        if str(payload.get("engine", "seed_vc")).strip().lower() == "minimax":
            return {
                "ok": False,
                "code": "FORBIDDEN_BACKEND",
                "message": "MiniMax cover backend is explicitly disallowed; use authorized local Seed-VC.",
            }
        if not payload.get("authorized_consent", False):
            return {
                "ok": False,
                "code": "CONSENT_REQUIRED",
                "message": "Explicit voice-owner consent is required before voice conversion.",
            }
        source_path = str(payload.get("source_audio", "")).strip()
        reference_path = str(payload.get("reference_voice", "")).strip()
        if not source_path or not Path(source_path).is_file():
            return {"ok": False, "code": "SOURCE_NOT_FOUND", "message": "Source audio file does not exist."}
        if not reference_path or not Path(reference_path).is_file():
            return {"ok": False, "code": "REFERENCE_NOT_FOUND", "message": "Authorized reference voice file does not exist."}

        readiness = detect_engine_readiness()["seed_vc"]
        if not readiness.installed:
            return {
                "ok": False,
                "code": "DEPENDENCY_NOT_INSTALLED",
                "engine": "seed_vc",
                "required_module": readiness.required_module,
                "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
                "message": "Install isolated PyTorch CUDA (cu124 SM75) + Seed-VC weights to run voice conversion.",
            }
        return {
            "ok": True,
            "code": "READY_TO_DISPATCH",
            "engine": "seed_vc",
            "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
        }

    if task == "tts":
        text = str(payload.get("text", "")).strip()
        if not text:
            return {"ok": False, "code": "EMPTY_TEXT", "message": "Text is required for Egyptian TTS."}
        readiness = detect_engine_readiness()["egyptian_tts"]
        if not readiness.installed:
            return {
                "ok": False,
                "code": "DEPENDENCY_NOT_INSTALLED",
                "engine": "egyptian_tts",
                "required_module": readiness.required_module,
                "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
                "message": "Install isolated PyTorch CUDA + voicetut-egyptian-tashkeel weights for local Egyptian speech synthesis.",
            }
        return {"ok": True, "code": "READY_TO_DISPATCH", "engine": "egyptian_tts", "length": len(text)}

    return {"ok": False, "code": "UNKNOWN_TASK", "message": f"Unknown audio worker task: {task}"}


def main() -> int:
    raw = sys.stdin.read().strip() if not sys.stdin.isatty() else ""
    if not raw:
        print(json.dumps(execute_audio_task("probe", {}), ensure_ascii=False, indent=2))
        return 0
    try:
        req = json.loads(raw)
        result = execute_audio_task(req.get("task", "probe"), req.get("payload", {}))
        print(json.dumps(result, ensure_ascii=False))
        return 0 if result.get("ok") else 1
    except Exception as exc:
        print(json.dumps({"ok": False, "code": "WORKER_ERROR", "message": str(exc)}))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
