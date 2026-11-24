#!/usr/bin/env python3
"""
Resolves pinned official release revisions, direct download URLs, byte sizes,
and SHA-256 digests from Hugging Face Hub and GitHub Releases APIs into
backend/manifests/downloads.lock.json.

Never invents hashes or URLs; only writes values verified from live upstream API responses.
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path
from typing import Any, Dict, Optional

MANIFEST_PATH = Path("backend/manifests/downloads.lock.json")


def fetch_json(url: str) -> Dict[str, Any]:
    req = urllib.request.Request(
        url,
        headers={
            "Accept": "application/json",
            "User-Agent": "HAFIZ-In-Slang-Manifest-Resolver/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def resolve_github_release(component: Dict[str, Any]) -> bool:
    api_url = component.get("officialReleaseApi") or component.get("officialApiUrl")
    if not api_url or "api.github.com" not in api_url:
        return False

    data = fetch_json(api_url)
    tag = data.get("tag_name")
    if tag:
        component["pinnedVersionOrCommit"] = tag

    expected = (component.get("expectedFilename") or "").lower()
    assets = data.get("assets", [])
    for asset in assets:
        name = (asset.get("name") or "").lower()
        if "win" in name and "x64" in name and ("cuda" in name or "cu12" in name or expected.split("*")[0] in name):
            component["expectedFilename"] = asset.get("name")
            component["directDownloadUrl"] = asset.get("browser_download_url")
            component["expectedSizeBytes"] = asset.get("size")
            digest = asset.get("digest")
            if isinstance(digest, str) and digest.startswith("sha256:"):
                component["expectedSha256"] = digest.split(":", 1)[1]
            return True
    return False


def resolve_hf_model(component: Dict[str, Any]) -> bool:
    api_url = component.get("officialApiUrl")
    if not api_url or "huggingface.co/api/models/" not in api_url:
        return False

    data = fetch_json(api_url)
    sha_commit = data.get("sha")
    if sha_commit:
        component["pinnedVersionOrCommit"] = sha_commit

    expected = (component.get("expectedFilename") or "").lower()
    repo_id = data.get("id")
    if not repo_id:
        return False

    # Query tree API to obtain exact LFS size and SHA-256 oid
    tree_url = f"https://huggingface.co/api/models/{repo_id}/tree/{sha_commit or 'main'}"
    tree_entries = fetch_json(tree_url)
    if not isinstance(tree_entries, list):
        return False

    for entry in tree_entries:
        path = str(entry.get("path", ""))
        if path.lower() == expected or (expected and expected in path.lower()):
            component["expectedFilename"] = path
            component["directDownloadUrl"] = f"https://huggingface.co/{repo_id}/resolve/{sha_commit or 'main'}/{path}"
            lfs = entry.get("lfs") or {}
            component["expectedSizeBytes"] = lfs.get("size") or entry.get("size")
            if lfs.get("oid"):
                component["expectedSha256"] = lfs["oid"]
            return True
    return False


def main() -> int:
    if not MANIFEST_PATH.exists():
        print(f"Manifest not found: {MANIFEST_PATH}", file=sys.stderr)
        return 1

    manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    resolved_count = 0
    for comp in manifest.get("components", []):
        try:
            if resolve_github_release(comp) or resolve_hf_model(comp):
                resolved_count += 1
                print(f"[RESOLVED] {comp['id']} -> {comp.get('pinnedVersionOrCommit')}")
            else:
                print(f"[SKIPPED]  {comp['id']} (manual verification or no matching asset)")
        except Exception as exc:
            print(f"[DEFERRED] {comp['id']}: {exc}")

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Completed manifest resolution pass: {resolved_count} component(s) updated.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
