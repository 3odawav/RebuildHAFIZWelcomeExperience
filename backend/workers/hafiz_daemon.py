#!/usr/bin/env python3
"""
HAFIZ Local Loopback IPC Backend Daemon (Python 3.11 stdlib only)
Binds strictly to 127.0.0.1 (default port 4891) — never exposes public network sockets.

Endpoints:
  GET  /api/v1/health
  GET  /api/v1/gpu/telemetry
  POST /api/v1/gpu/purge-hafiz
  POST /api/v1/models/scan
  POST /api/v1/providers/lmstudio/models
  POST /api/v1/audio/separate
  POST /api/v1/audio/clone
  POST /api/v1/voice/tts
"""
from __future__ import annotations

import argparse
import json
import os
import platform
import subprocess
import urllib.error
import urllib.request
from dataclasses import dataclass, asdict
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from audio_worker import detect_engine_readiness, execute_audio_task

MODEL_EXTENSIONS = {".gguf", ".safetensors", ".onnx", ".ckpt", ".pth", ".pt", ".bin", ".th"}
SKIPPED_DIRS = {
    "$Recycle.Bin", "System Volume Information", "Windows", "Program Files",
    "Program Files (x86)", "ProgramData", "node_modules", ".git", "__pycache__",
    ".venv", "venv", "AppData"
}
PROTECTED_EXTERNAL_GPU_PROCESSES = ("lmstudio", "lms", "unsloth", "comfyui", "ollama")


def probe_nvidia_gpu() -> Dict[str, Any]:
    """Read-only nvidia-smi telemetry. Returns available=False honestly when absent."""
    try:
        gpu_cmd = [
            "nvidia-smi",
            "--query-gpu=name,driver_version,memory.total,memory.used,memory.free,utilization.gpu,temperature.gpu,compute_cap",
            "--format=csv,noheader,nounits",
        ]
        res = subprocess.run(gpu_cmd, capture_output=True, text=True, timeout=4, check=False)
        if res.returncode != 0 or not res.stdout.strip():
            return {"available": False, "reason": "nvidia-smi returned no GPU data."}

        parts = [p.strip() for p in res.stdout.strip().splitlines()[0].split(",")]
        if len(parts) < 8:
            return {"available": False, "reason": "Unexpected nvidia-smi output format."}

        compute_cap = parts[7]
        is_sm75 = compute_cap.startswith("7.5") or "RTX 5000" in parts[0].upper()

        apps_cmd = [
            "nvidia-smi",
            "--query-compute-apps=pid,process_name,used_gpu_memory",
            "--format=csv,noheader,nounits",
        ]
        apps_res = subprocess.run(apps_cmd, capture_output=True, text=True, timeout=4, check=False)
        processes: List[Dict[str, Any]] = []
        if apps_res.returncode == 0 and apps_res.stdout.strip():
            for line in apps_res.stdout.strip().splitlines():
                cols = [c.strip() for c in line.split(",")]
                if len(cols) < 3:
                    continue
                pname = cols[1]
                is_hafiz = "hafiz" in pname.lower()
                processes.append({
                    "pid": int(float(cols[0])),
                    "processName": pname,
                    "usedVramMb": int(float(cols[2])),
                    "isHafizOwned": is_hafiz,
                    "isExternalProtected": not is_hafiz,
                })

        return {
            "available": True,
            "gpuName": parts[0],
            "driverVersion": parts[1],
            "totalVramMb": int(float(parts[2])),
            "usedVramMb": int(float(parts[3])),
            "freeVramMb": int(float(parts[4])),
            "utilizationPercent": int(float(parts[5])),
            "temperatureC": int(float(parts[6])),
            "computeCapability": compute_cap,
            "isTuringSm75": is_sm75,
            "supportsBf16": not is_sm75,
            "activeProcesses": processes,
        }
    except Exception as exc:
        return {"available": False, "reason": f"GPU telemetry unavailable on {platform.system()}: {exc}"}


def classify_model_file(path: Path) -> Optional[Dict[str, Any]]:
    stat = path.stat()
    size_bytes = stat.st_size
    name = path.name
    lower = name.lower()
    full_lower = str(path).lower()

    if size_bytes < 5 * 1024 * 1024 and "silero" not in lower and "tashkeel" not in lower:
        return None

    size_mb = size_bytes / (1024 * 1024)
    if "cohere-transcribe" in lower:
        return {
            "friendlyNameEn": "Cohere Transcribe Speech-to-Text (GGUF)",
            "friendlyNameAr": "نموذج النسخ الصوتي (Cohere Transcribe)",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "speech_to_text",
            "requiredEngine": "transcribe.cpp",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": False,
            "warning": "Requires transcribe.cpp runtime (not standard llama.cpp).",
        }

    if ("songwriter" in lower or "egyptian" in lower) and lower.endswith(".gguf"):
        oversized_f16 = ("f16" in lower or "fp16" in lower) and size_bytes > 12 * 1024 * 1024 * 1024
        return {
            "friendlyNameEn": "Custom Egyptian Songwriter LLM",
            "friendlyNameAr": "نموذج كتابة الأغاني المصرية المخصص",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "songwriting_llm",
            "requiredEngine": "llama.cpp",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": oversized_f16,
            "warning": "F16 checkpoint >12GB exceeds safe 16GB RTX 5000 VRAM budget; convert to Q4_K_M or Q5_K_M." if oversized_f16 else None,
        }

    if lower.endswith(".gguf"):
        is_coder = "coder" in lower
        return {
            "friendlyNameEn": "Code & Analysis LLM (GGUF)" if is_coder else "Assistant & Songwriting LLM (GGUF)",
            "friendlyNameAr": "نموذج الكود والتحليل" if is_coder else "نموذج المحادثة وكتابة الكلمات",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "code_llm" if is_coder else "assistant_llm",
            "requiredEngine": "llama.cpp",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": size_bytes > 13_500_000_000,
            "warning": "Approaches 16GB VRAM limit." if size_bytes > 13_500_000_000 else None,
        }

    if "roformer" in full_lower:
        return {
            "friendlyNameEn": "Vocal Isolation Engine (BS-RoFormer)",
            "friendlyNameAr": "محرك عزل الغناء (BS-RoFormer)",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "stem_separation",
            "requiredEngine": "audio_separator",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": False,
            "warning": None,
        }

    if "demucs" in full_lower or "htdemucs" in lower:
        return {
            "friendlyNameEn": "6-Stem Separator (Demucs htdemucs_6s)",
            "friendlyNameAr": "محرك فصل 6 تراكات (Demucs)",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "stem_separation",
            "requiredEngine": "demucs",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": False,
            "warning": None,
        }

    if "seed-vc" in full_lower or "seed_vc" in full_lower:
        return {
            "friendlyNameEn": "Voice & Singing Conversion (Seed-VC)",
            "friendlyNameAr": "محرك تحويل الصوت والغناء (Seed-VC)",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "voice_conversion",
            "requiredEngine": "seed_vc",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": False,
            "warning": None,
        }

    if "silero" in lower:
        return {
            "friendlyNameEn": "Voice Activity Detector (Silero VAD)",
            "friendlyNameAr": "كاشف النشاط الصوتي (Silero VAD)",
            "technicalFileName": name,
            "fullPath": str(path),
            "capability": "vad",
            "requiredEngine": "onnxruntime",
            "sizeBytes": size_bytes,
            "inPlaceLinked": True,
            "exceedsSafe16GbVramBudget": False,
            "warning": None,
        }

    return None


def scan_roots_in_place(roots: List[str], index_output_path: Optional[str] = None) -> Dict[str, Any]:
    """Scans drives/folders strictly read-only. Never moves, copies, or deletes model files."""
    discovered: List[Dict[str, Any]] = []
    seen: set[str] = set()
    files_scanned = 0

    for root_str in roots:
        root_path = Path(root_str)
        if not root_path.exists() or not root_path.is_dir():
            continue
        for current_dir, dir_names, file_names in os.walk(root_path):
            dir_names[:] = [d for d in dir_names if d not in SKIPPED_DIRS]
            rel_depth = len(Path(current_dir).relative_to(root_path).parts)
            if rel_depth >= 8:
                dir_names.clear()
            for fname in file_names:
                files_scanned += 1
                fpath = Path(current_dir) / fname
                if fpath.suffix.lower() not in MODEL_EXTENSIONS:
                    continue
                resolved = str(fpath.resolve())
                if resolved in seen:
                    continue
                seen.add(resolved)
                try:
                    entry = classify_model_file(fpath)
                except OSError:
                    continue
                if entry is not None:
                    discovered.append(entry)

    if index_output_path:
        out_path = Path(index_output_path)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        tmp = out_path.with_suffix(out_path.suffix + ".tmp")
        tmp.write_text(json.dumps(discovered, ensure_ascii=False, indent=2), encoding="utf-8")
        os.replace(tmp, out_path)

    return {
        "ok": True,
        "filesScanned": files_scanned,
        "modelsDiscovered": len(discovered),
        "inPlaceOnly": True,
        "indexSavedTo": index_output_path,
        "models": discovered,
    }


def discover_lmstudio_models(base_url: str = "http://127.0.0.1:1234", api_token: Optional[str] = None) -> Dict[str, Any]:
    base = base_url.rstrip("/")
    headers = {"Accept": "application/json"}
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"

    for endpoint in (f"{base}/api/v0/models", f"{base}/v1/models"):
        try:
            req = urllib.request.Request(endpoint, headers=headers, method="GET")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.status == 200:
                    data = json.loads(resp.read().decode("utf-8"))
                    models = data.get("data", [])
                    return {
                        "ok": True,
                        "reachable": True,
                        "baseUrl": base,
                        "endpointUsed": endpoint,
                        "models": models,
                    }
        except Exception:
            continue

    return {
        "ok": False,
        "reachable": False,
        "baseUrl": base,
        "models": [],
        "message": f"LM Studio local API not reachable at {base}.",
    }


class HafizDaemonState:
    def __init__(self) -> None:
        self.active_hafiz_workers: Dict[str, Dict[str, Any]] = {}

    def purge_hafiz_only(self) -> Dict[str, Any]:
        before = probe_nvidia_gpu()

        # This daemon currently has no process-stop adapter or registered worker handles.
        # Clearing a dictionary is not model unloading, so never report it as such.
        registered = list(self.active_hafiz_workers.keys())
        after = probe_nvidia_gpu()
        before_mb = before.get("usedVramMb") if before.get("available") else None
        after_mb = after.get("usedVramMb") if after.get("available") else None
        if registered:
            return {
                "ok": False,
                "status": "unload_adapter_missing",
                "unloadedHafizWorkers": [],
                "failedWorkers": registered,
                "vramBeforeMb": before_mb,
                "vramAfterMb": after_mb,
                "reclaimedMb": None,
                "externalWorkloadsPreserved": True,
                "message": "HAFIZ workers are registered, but this daemon has no verified stop adapter. No process was terminated.",
            }

        return {
            "ok": True,
            "status": "nothing_to_unload",
            "unloadedHafizWorkers": [],
            "failedWorkers": [],
            "vramBeforeMb": before_mb,
            "vramAfterMb": after_mb,
            "reclaimedMb": 0 if before_mb is not None and after_mb is not None else None,
            "externalWorkloadsPreserved": True,
            "message": "No HAFIZ-owned workers are registered with this daemon. No process was stopped.",
        }


def build_handler(state: HafizDaemonState, expected_token: Optional[str] = None):
    class HafizRequestHandler(BaseHTTPRequestHandler):
        def log_message(self, format: str, *args: Any) -> None:
            return

        def _send_json(self, status: int, body: Dict[str, Any]) -> None:
            encoded = json.dumps(body, ensure_ascii=False).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(encoded)))
            self.end_headers()
            self.wfile.write(encoded)

        def _check_auth(self) -> bool:
            if not expected_token:
                return True
            token = self.headers.get("X-Hafiz-Token")
            if token != expected_token:
                self._send_json(HTTPStatus.UNAUTHORIZED, {"ok": False, "code": "UNAUTHORIZED"})
                return False
            return True

        def _read_json_body(self) -> Dict[str, Any]:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0:
                return {}
            raw = self.rfile.read(length).decode("utf-8")
            return json.loads(raw) if raw.strip() else {}

        def do_GET(self) -> None:
            if not self._check_auth():
                return
            if self.path == "/api/v1/health":
                readiness = {k: asdict(v) for k, v in detect_engine_readiness().items()}
                self._send_json(HTTPStatus.OK, {
                    "ok": True,
                    "service": "hafiz-local-daemon",
                    "platform": platform.system(),
                    "loopbackOnly": True,
                    "engines": readiness,
                })
                return
            if self.path == "/api/v1/gpu/telemetry":
                self._send_json(HTTPStatus.OK, probe_nvidia_gpu())
                return
            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "code": "NOT_FOUND"})

        def do_POST(self) -> None:
            if not self._check_auth():
                return
            try:
                body = self._read_json_body()
            except Exception as exc:
                self._send_json(HTTPStatus.BAD_REQUEST, {"ok": False, "code": "INVALID_JSON", "message": str(exc)})
                return

            if self.path == "/api/v1/models/scan":
                roots = body.get("roots", [])
                index_path = body.get("indexOutputPath")
                self._send_json(HTTPStatus.OK, scan_roots_in_place(roots, index_path))
                return

            if self.path == "/api/v1/providers/lmstudio/models":
                base_url = str(body.get("baseUrl", "http://127.0.0.1:1234"))
                token = body.get("apiToken")
                self._send_json(HTTPStatus.OK, discover_lmstudio_models(base_url, token))
                return

            if self.path == "/api/v1/gpu/purge-hafiz":
                self._send_json(HTTPStatus.OK, state.purge_hafiz_only())
                return

            if self.path == "/api/v1/audio/separate":
                res = execute_audio_task("separate", body)
                self._send_json(HTTPStatus.OK if res.get("ok") else HTTPStatus.UNPROCESSABLE_ENTITY, res)
                return

            if self.path == "/api/v1/audio/clone":
                res = execute_audio_task("voice_convert", body)
                self._send_json(HTTPStatus.OK if res.get("ok") else HTTPStatus.UNPROCESSABLE_ENTITY, res)
                return

            if self.path == "/api/v1/voice/tts":
                res = execute_audio_task("tts", body)
                self._send_json(HTTPStatus.OK if res.get("ok") else HTTPStatus.UNPROCESSABLE_ENTITY, res)
                return

            self._send_json(HTTPStatus.NOT_FOUND, {"ok": False, "code": "NOT_FOUND"})

    return HafizRequestHandler


def create_server(host: str = "127.0.0.1", port: int = 4891, token: Optional[str] = None) -> ThreadingHTTPServer:
    if host not in ("127.0.0.1", "localhost", "::1"):
        raise ValueError("HAFIZ daemon strictly allows loopback binding only (127.0.0.1).")
    state = HafizDaemonState()
    return ThreadingHTTPServer((host, port), build_handler(state, token))


def main() -> int:
    parser = argparse.ArgumentParser(description="HAFIZ Local Loopback IPC Backend Daemon")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4891)
    parser.add_argument("--token", default=os.environ.get("HAFIZ_IPC_TOKEN"))
    args = parser.parse_args()

    server = create_server(args.host, args.port, args.token)
    print(f"HAFIZ local daemon listening on http://{args.host}:{args.port} (loopback-only)", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
