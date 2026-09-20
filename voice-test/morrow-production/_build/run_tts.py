# -*- coding: utf-8 -*-
"""Batch-synthesize Morrow lines via DashScope qwen TTS (3-way concurrency).

- Reads DASHSCOPE_API_KEY from english-pet/.env at runtime (never hardcoded/written out).
- Downloads the raw 24kHz WAV to raw/<chapterId>/<eventId>/<lineId>.wav
- Resumable: skips a line if a non-empty raw WAV already exists.
- Retries failures; writes failures.json for manual review.
"""
import json
import os
import sys
import time
import urllib.request
import concurrent.futures
from pathlib import Path

PROD = Path(r"C:\004-MCYY\voice-test\morrow-production")
ENV_PATH = Path(r"C:\004-MCYY\english-pet\.env")
ENDPOINT = "https://dashscope.aliyuncs.com/api/v1/services/audio/tts/SpeechSynthesizer"
VOICE_ID = "qwen-audio-3.0-tts-flash-morrow-4709e7ec2ab7478fa1c98f5e617e936f"
MODEL = "qwen-audio-3.0-tts-flash"
INSTRUCTION = ("Speak clearly and naturally in a restrained, intimate tone. "
    "Keep the same character voice, pitch, resonance, timbre, gender expression, "
    "age, and closeness. Read the complete text once, continuously, with natural "
    "punctuation pauses only. Do not omit, repeat, interrupt, or truncate words. "
    "Avoid announcer, customer-service, theatrical, overexcited, or cutesy delivery. "
    "No music, ambience, or sound effects.")
CONCURRENCY = 3
MAX_RETRY = 4


def load_key() -> str:
    for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line.startswith("DASHSCOPE_API_KEY="):
            val = line.split("=", 1)[1].strip()
            if not val:
                raise SystemExit("DASHSCOPE_API_KEY is empty in .env")
            return val
    raise SystemExit("DASHSCOPE_API_KEY not found in .env")


def synth_one(rec, key):
    rel = Path(rec["chapterId"]) / rec["eventId"] / (rec["lineId"] + ".wav")
    raw_path = PROD / "raw" / rel
    if raw_path.exists() and raw_path.stat().st_size > 10000:
        return {"lineId": rec["lineId"], "status": "skipped", "path": str(raw_path)}

    body = {
        "model": MODEL,
        "input": {
            "text": rec["english"],
            "voice": VOICE_ID,
            "format": "wav",
            "sample_rate": 24000,
            "rate": 1.0,
            "pitch": 1.0,
            "language_hints": ["en"],
            "instruction": INSTRUCTION,
        },
    }
    data = json.dumps(body).encode("utf-8")
    last_err = None
    for attempt in range(1, MAX_RETRY + 1):
        try:
            req = urllib.request.Request(
                ENDPOINT, data=data, method="POST",
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type": "application/json",
                })
            with urllib.request.urlopen(req, timeout=120) as resp:
                payload = json.loads(resp.read().decode("utf-8"))
            url = payload["output"]["audio"]["url"]
            raw_path.parent.mkdir(parents=True, exist_ok=True)
            with urllib.request.urlopen(url, timeout=120) as au:
                audio_bytes = au.read()
            if len(audio_bytes) < 4000 or audio_bytes[:4] != b"RIFF":
                raise RuntimeError(f"downloaded payload not a RIFF WAV ({len(audio_bytes)} bytes)")
            raw_path.write_bytes(audio_bytes)
            return {"lineId": rec["lineId"], "status": "ok", "bytes": len(audio_bytes),
                    "path": str(raw_path)}
        except Exception as e:  # noqa
            last_err = f"{type(e).__name__}: {e}"
            time.sleep(2 * attempt)
    return {"lineId": rec["lineId"], "status": "failed", "error": last_err,
            "path": str(raw_path)}


def main():
    key = load_key()
    inv = json.loads((PROD / "inventory.json").read_text(encoding="utf-8"))
    print(f"Synthesizing {len(inv)} lines with concurrency={CONCURRENCY}")
    results = []
    done = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
        futs = {ex.submit(synth_one, rec, key): rec for rec in inv}
        for fut in concurrent.futures.as_completed(futs):
            res = fut.result()
            results.append(res)
            done += 1
            tag = res["status"]
            print(f"[{done}/{len(inv)}] {tag:8} {res['lineId']}", flush=True)

    ok = [r for r in results if r["status"] in ("ok", "skipped")]
    failed = [r for r in results if r["status"] == "failed"]
    (PROD / "_build" / "synth_failures.json").write_text(
        json.dumps(failed, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"DONE ok/skipped={len(ok)} failed={len(failed)}")
    if failed:
        print("FAILED lineIds:", [r["lineId"] for r in failed])
        sys.exit(2)


if __name__ == "__main__":
    main()
