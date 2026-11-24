#!/usr/bin/env python3
"""
Executable unit & integration tests for HAFIZ Python backend workers.
Runs cleanly on Linux and Windows without external pip packages.
"""
from __future__ import annotations

import json
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

from audio_worker import execute_audio_task, validate_sm75_precision
from hafiz_daemon import (
    create_server,
    discover_lmstudio_models,
    scan_roots_in_place,
)


class MockLmStudioHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        return

    def do_GET(self):
        if self.path == "/api/v0/models":
            body = json.dumps({
                "data": [
                    {
                        "id": "qwen3.5-9b-q4_k_m",
                        "state": "loaded",
                        "arch": "qwen3",
                        "quantization": "Q4_K_M",
                        "max_context_length": 32768,
                    }
                ]
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()


class HafizBackendWorkerTests(unittest.TestCase):
    def test_sm75_precision_guard_downgrades_bf16_to_fp16(self):
        self.assertEqual(validate_sm75_precision("bf16"), "float16")
        self.assertEqual(validate_sm75_precision("bfloat16"), "float16")
        self.assertEqual(validate_sm75_precision("float16"), "float16")
        self.assertEqual(validate_sm75_precision("float32"), "float32")

    def test_minimax_backend_explicitly_rejected(self):
        res = execute_audio_task("voice_convert", {"engine": "minimax", "authorized_consent": True})
        self.assertFalse(res["ok"])
        self.assertEqual(res["code"], "FORBIDDEN_BACKEND")

    def test_voice_conversion_requires_explicit_consent(self):
        res = execute_audio_task("voice_convert", {"engine": "seed_vc", "authorized_consent": False})
        self.assertFalse(res["ok"])
        self.assertEqual(res["code"], "CONSENT_REQUIRED")

    def test_multi_drive_scanner_indexes_in_place_and_detects_cohere_runtime(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cohere_file = root / "cohere-transcribe-03-2026-q4_0.gguf"
            cohere_file.write_bytes(b"\x00" * (6 * 1024 * 1024))
            index_file = root / "index" / "model-index.json"

            result = scan_roots_in_place([str(root)], str(index_file))
            self.assertTrue(result["ok"])
            self.assertTrue(result["inPlaceOnly"])
            self.assertEqual(result["modelsDiscovered"], 1)
            self.assertEqual(result["models"][0]["requiredEngine"], "transcribe.cpp")
            self.assertTrue(cohere_file.exists())
            self.assertTrue(index_file.exists())

    def test_lmstudio_discovery_queries_local_rest_api(self):
        mock_srv = HTTPServer(("127.0.0.1", 0), MockLmStudioHandler)
        port = mock_srv.server_address[1]
        thread = threading.Thread(target=mock_srv.serve_forever, daemon=True)
        thread.start()
        try:
            res = discover_lmstudio_models(f"http://127.0.0.1:{port}")
            self.assertTrue(res["ok"])
            self.assertTrue(res["reachable"])
            self.assertEqual(len(res["models"]), 1)
            self.assertEqual(res["models"][0]["id"], "qwen3.5-9b-q4_k_m")
        finally:
            mock_srv.shutdown()
            mock_srv.server_close()

    def test_loopback_daemon_enforces_token_and_handles_health_and_purge(self):
        with self.assertRaises(ValueError):
            create_server(host="0.0.0.0", port=0)

        daemon = create_server(host="127.0.0.1", port=0, token="secret-hafiz-session")
        port = daemon.server_address[1]
        thread = threading.Thread(target=daemon.serve_forever, daemon=True)
        thread.start()
        try:
            # Unauthorized request must be rejected with 401
            with self.assertRaises(urllib.error.HTTPError) as ctx:
                urllib.request.urlopen(f"http://127.0.0.1:{port}/api/v1/health", timeout=3)
            self.assertEqual(ctx.exception.code, 401)

            # Authorized health check succeeds
            req = urllib.request.Request(
                f"http://127.0.0.1:{port}/api/v1/health",
                headers={"X-Hafiz-Token": "secret-hafiz-session"},
            )
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(data["ok"])
                self.assertTrue(data["loopbackOnly"])

            # Authorized HAFIZ-only VRAM purge preserves external workloads
            purge_req = urllib.request.Request(
                f"http://127.0.0.1:{port}/api/v1/gpu/purge-hafiz",
                data=b"{}",
                headers={"X-Hafiz-Token": "secret-hafiz-session", "Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(purge_req, timeout=3) as resp:
                purge = json.loads(resp.read().decode("utf-8"))
                self.assertTrue(purge["ok"])
                self.assertTrue(purge["externalWorkloadsPreserved"])
        finally:
            daemon.shutdown()
            daemon.server_close()


if __name__ == "__main__":
    unittest.main()
