#!/usr/bin/env python3
"""
HAFIZ Isolated Audio & Speech Worker Contract (Python 3.11+).

The current repository contains readiness probes and task contracts, not the
actual inference adapters for Seed-VC, BS-RoFormer, Demucs, or Egyptian TTS.
Until a verified adapter is installed, the worker must report that fact and
must never return a successful/queued result that looks like completed work.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any, Dict


SUPPORTED_ENGINES = {
    "silero_vad": {"module": "onnxruntime", "capability": "vad", "vram_mb": 128, "adapter": False},
    "egyptian_tts": {"module": "torch", "capability": "tts", "vram_mb": 2600, "adapter": False},
    "seed_vc": {"module": "torch", "capability": "voice_conversion", "vram_mb": 4400, "adapter": False},
    "bs_roformer": {"module": "audio_separator", "capability": "vocal_isolation", "vram_mb": 3600, "adapter": False},
    "demucs_6s": {"module": "demucs", "capability": "six_stems", "vram_mb": 3200, "adapter": False},
}


@dataclass
class EngineReadiness:
    engine_id: str
    capability: str
    installed: bool
    required_module: str
    precision_policy: str
    estimated_vram_mb: int
    adapter_implemented: bool
    status: str


def detect_engine_readiness() -> Dict[str, EngineReadiness]:
    results: Dict[str, EngineReadiness] = {}
    for engine_id, meta in SUPPORTED_ENGINES.items():
        mod_name = meta["module"]
        installed = importlib.util.find_spec(mod_name) is not None
        adapter_implemented = bool(meta.get("adapter", False))
        if not installed:
            status = "DEPENDENCY_NOT_INSTALLED"
        elif not adapter_implemented:
            status = "ENGINE_ADAPTER_NOT_IMPLEMENTED"
        else:
            status = "READY"
        results[engine_id] = EngineReadiness(
            engine_id=engine_id,
            capability=meta["capability"],
            installed=installed,
            required_module=mod_name,
            precision_policy="float16 where validated (Turing SM75; no mandatory BF16)",
            estimated_vram_mb=meta["vram_mb"],
            adapter_implemented=adapter_implemented,
            status=status,
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


def _engine_not_ready(engine_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    readiness = detect_engine_readiness()[engine_id]
    if not readiness.installed:
        return {
            "ok": False,
            "code": "DEPENDENCY_NOT_INSTALLED",
            "engine": engine_id,
            "required_module": readiness.required_module,
            "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
            "message": f"Install '{readiness.required_module}' in the isolated HAFIZ environment.",
        }
    return {
        "ok": False,
        "code": "ENGINE_ADAPTER_NOT_IMPLEMENTED",
        "engine": engine_id,
        "required_module": readiness.required_module,
        "precision": validate_sm75_precision(str(payload.get("dtype", "float16"))),
        "message": "The Python package is present, but HAFIZ has no verified inference adapter for this engine. No processing was started.",
    }


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
        return _engine_not_ready(engine, payload)

    if task == "voice_convert":
        engine = str(payload.get("engine", "seed_vc")).strip().lower()
        if engine == "minimax":
            return {
                "ok": False,
                "code": "FORBIDDEN_BACKEND",
                "message": "MiniMax cover backend is explicitly disallowed; use authorized local Seed-VC.",
            }
        if engine != "seed_vc":
            return {"ok": False, "code": "UNSUPPORTED_ENGINE", "message": f"Unsupported voice engine: {engine}"}
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
        return _engine_not_ready("seed_vc", payload)

    if task == "tts":
        text = str(payload.get("text", "")).strip()
        if not text:
            return {"ok": False, "code": "EMPTY_TEXT", "message": "Text is required for Egyptian TTS."}
        return _engine_not_ready("egyptian_tts", payload)

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
