#!/usr/bin/env python3
"""Independent re-verification of the 145 released Morrow WAV files (2026-09-21).

Recomputes every numeric property from the actual on-disk bytes and compares
against manifest.json. Does NOT trust manifest values; only the manifest path,
expected checksum, expected duration, and status are used as comparison targets.

The active-speech RMS algorithm is reproduced verbatim from
english-pet/scripts/normalize_morrow_audio.py (measure()) so that the recomputed
number is directly comparable:
  - block_samples = int(sample_rate * 0.05) * channels  (800 samples for 16k mono)
  - a block is "active" if 20*log10(block_rms/32767) > -45.0 dBFS
  - active_rms = RMS over the union of all active blocks; falls back to the
    overall RMS when no block is active.
"""

from __future__ import annotations

import hashlib
import json
import math
import struct
import wave
from pathlib import Path

ROOT = Path(r"C:\004-MCYY\voice-test\morrow-production")
MANIFEST = ROOT / "manifest.json"
EXCLUDED = ROOT / "excluded.json"
OUTPUT = ROOT / "_build" / "acceptance_rerun_2026-09-21.json"

FULL_SCALE = 32767.0
RMS_LOW_DB = -21.0
RMS_HIGH_DB = -19.0
PEAK_CEILING_DB = -3.0
DURATION_TOLERANCE_S = 0.05


def linear_to_db(value: float) -> float:
    return 20.0 * math.log10(value) if value > 0 else -120.0


def measure_active(samples: list[int], sample_rate: int, channels: int) -> dict[str, float]:
    """Verbatim port of normalize_morrow_audio.measure()."""
    peak = max((abs(s) for s in samples), default=0)
    rms = math.sqrt(sum(s * s for s in samples) / len(samples)) if samples else 0.0

    block_samples = max(channels, int(sample_rate * 0.05) * channels)
    active: list[int] = []
    for start in range(0, len(samples), block_samples):
        block = samples[start : start + block_samples]
        if not block:
            continue
        block_rms = math.sqrt(sum(s * s for s in block) / len(block))
        if linear_to_db(block_rms / FULL_SCALE) > -45.0:
            active.extend(block)

    active_rms = (
        math.sqrt(sum(s * s for s in active) / len(active)) if active else rms
    )
    return {
        "peak_dbfs": round(linear_to_db(peak / FULL_SCALE), 2),
        "active_rms_dbfs": round(linear_to_db(active_rms / FULL_SCALE), 2),
    }


def verify_file(file_path: Path) -> dict:
    result: dict = {"path": str(file_path.relative_to(ROOT)), "checks": {}, "errors": []}

    raw = file_path.read_bytes()
    result["file_size_bytes"] = len(raw)

    # SHA-256 of the whole file.
    result["sha256"] = hashlib.sha256(raw).hexdigest()

    # --- RIFF/WAVE magic + chunk size fields, parsed straight from bytes ---
    riff_magic = raw[0:4]
    wave_magic = raw[8:12]
    result["checks"]["riff_magic_ok"] = riff_magic == b"RIFF"
    result["checks"]["wave_magic_ok"] = wave_magic == b"WAVE"
    if riff_magic != b"RIFF" or wave_magic != b"WAVE":
        result["errors"].append(f"bad magic: {riff_magic!r}/{wave_magic!r}")

    riff_length_field = struct.unpack_from("<I", raw, 4)[0]
    expected_riff_length = len(raw) - 8
    result["riff_length_field"] = riff_length_field
    result["expected_riff_length"] = expected_riff_length
    result["checks"]["riff_length_ok"] = riff_length_field == expected_riff_length

    data_index = raw.find(b"data")
    if data_index == -1:
        result["errors"].append("no data chunk found")
        return result
    data_length_field = struct.unpack_from("<I", raw, data_index + 4)[0]
    data_payload_start = data_index + 8
    actual_data_payload = len(raw) - data_payload_start
    result["data_length_field"] = data_length_field
    result["actual_data_payload_bytes"] = actual_data_payload
    result["checks"]["data_length_ok"] = data_length_field == actual_data_payload

    # --- Format via wave module ---
    with wave.open(str(file_path), "rb") as w:
        params = w.getparams()
        frames = w.getnframes()
        rate = w.getframerate()
        channels = w.getnchannels()
        sampwidth = w.getsampwidth()
        pcm = w.readframes(frames)

    result["sample_rate_hz"] = rate
    result["channels"] = channels
    result["bits_per_sample"] = sampwidth * 8
    result["frames"] = frames
    result["duration_seconds"] = round(frames / rate, 6)

    result["checks"]["sample_rate_ok"] = rate == 16000
    result["checks"]["channels_ok"] = channels == 1
    result["checks"]["bits_ok"] = sampwidth == 2
    result["checks"]["pcm_uncompressed_ok"] = params.comptype == "NONE"

    sample_count = len(pcm) // 2
    samples = list(struct.unpack("<" + "h" * sample_count, pcm))
    meter = measure_active(samples, rate, channels)
    result["measured_peak_dbfs"] = meter["peak_dbfs"]
    result["measured_active_rms_dbfs"] = meter["active_rms_dbfs"]

    result["checks"]["peak_in_band"] = meter["peak_dbfs"] <= PEAK_CEILING_DB
    result["checks"]["active_rms_in_band"] = (
        RMS_LOW_DB <= meter["active_rms_dbfs"] <= RMS_HIGH_DB
    )

    return result


def main() -> None:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    excluded = json.loads(EXCLUDED.read_text(encoding="utf-8"))
    included = manifest["included"]

    per_file: list[dict] = []
    seen_audio_ids: dict[str, str] = {}
    duplicate_audio_ids: list[str] = []
    fileref_set: set[str] = set()

    for item in included:
        ref = item["fileRef"]
        fileref_set.add(ref)
        audio_id = item["audioId"]
        target_path = ROOT / ref

        entry = {
            "fileRef": ref,
            "audioId": audio_id,
            "status": item.get("status"),
            "expected": {
                "checksumSha256": item.get("checksumSha256"),
                "durationSeconds": item.get("durationSeconds"),
                "activeRmsDbfs": item.get("activeRmsDbfs"),
                "peakDbfs": item.get("peakDbfs"),
            },
        }

        # Duplicate audioId detection.
        if audio_id in seen_audio_ids:
            entry["errors"] = entry.get("errors", []) + [
                f"duplicate audioId, also used by {seen_audio_ids[audio_id]}"
            ]
            duplicate_audio_ids.append(audio_id)
        else:
            seen_audio_ids[audio_id] = ref

        if not target_path.exists():
            entry["errors"] = entry.get("errors", []) + ["file missing on disk"]
            per_file.append(entry)
            continue

        v = verify_file(target_path)
        entry["measured"] = {
            "sha256": v.get("sha256"),
            "duration_seconds": v.get("duration_seconds"),
            "measured_active_rms_dbfs": v.get("measured_active_rms_dbfs"),
            "measured_peak_dbfs": v.get("measured_peak_dbfs"),
            "sample_rate_hz": v.get("sample_rate_hz"),
            "channels": v.get("channels"),
            "bits_per_sample": v.get("bits_per_sample"),
            "file_size_bytes": v.get("file_size_bytes"),
        }
        entry["checks"] = v.get("checks", {})
        entry["errors"] = v.get("errors", [])

        # Cross-checks against manifest expected values.
        if entry["checks"].get("riff_magic_ok") and entry["measured"].get("sha256") is not None:
            if v.get("sha256") != item.get("checksumSha256"):
                entry["errors"].append("sha256 mismatch vs manifest")
        exp_dur = item.get("durationSeconds")
        if exp_dur is not None and v.get("duration_seconds") is not None:
            entry["checks"]["duration_vs_manifest"] = (
                abs(v["duration_seconds"] - exp_dur) <= DURATION_TOLERANCE_S
            )
        if item.get("status") != "ready":
            entry["errors"].append(f"status is {item.get('status')!r}, expected 'ready'")

        per_file.append(entry)

    # --- Set-level checks ---
    disk_wavs = sorted(p.relative_to(ROOT).as_posix() for p in (ROOT / "tts").rglob("audio.wav"))
    manifest_refs = sorted(fileref_set)

    extra_on_disk = sorted(set(disk_wavs) - set(manifest_refs))
    missing_on_disk = sorted(set(manifest_refs) - set(disk_wavs))

    # excluded.json must have NO audio.wav next to them.
    excluded_with_audio: list[str] = []
    for ex in excluded:
        # locate any audio.wav in a folder named after the lineId under tts
        hits = list((ROOT / "tts").rglob(ex["lineId"]))
        for h in hits:
            if (h / "1.0.0" / "audio.wav").exists() or (h / "audio.wav").exists():
                excluded_with_audio.append(ex["lineId"])

    # Aggregate pass/fail.
    failures = []
    n_pass = 0
    for e in per_file:
        hard_fail = bool(e.get("errors")) or any(v is False for v in (e.get("checks") or {}).values())
        if hard_fail:
            failures.append({"fileRef": e["fileRef"], "errors": e.get("errors"), "checks": e.get("checks")})
        else:
            n_pass += 1

    rms_values = [e["measured"]["measured_active_rms_dbfs"] for e in per_file if e.get("measured", {}).get("measured_active_rms_dbfs") is not None]
    peak_values = [e["measured"]["measured_peak_dbfs"] for e in per_file if e.get("measured", {}).get("measured_peak_dbfs") is not None]

    summary = {
        "manifest_total": manifest.get("total"),
        "manifest_included_count": len(included),
        "per_file_pass_count": n_pass,
        "per_file_fail_count": len(failures),
        "disk_tts_audio_wav_count": len(disk_wavs),
        "duplicate_audioIds": sorted(set(duplicate_audio_ids)),
        "extra_audio_on_disk_not_in_manifest": extra_on_disk,
        "manifest_refs_missing_on_disk": missing_on_disk,
        "excluded_lines_that_should_have_no_audio_but_do": excluded_with_audio,
        "measured_active_rms_range_dbfs": [min(rms_values), max(rms_values)] if rms_values else None,
        "measured_peak_range_dbfs": [min(peak_values), max(peak_values)] if peak_values else None,
        "all_sha256_match_manifest": all(
            not any("sha256" in err for err in e.get("errors", [])) for e in per_file
        ),
    }

    report = {
        "generated_by": "verify_release_audio_2026-09-21.py",
        "scope": "Independent re-verification of all 145 released Morrow WAV files",
        "acceptance_band": {
            "format": "WAV/PCM/16kHz/mono/16-bit, RIFF & data length fields consistent",
            "active_rms_dbfs": [RMS_LOW_DB, RMS_HIGH_DB],
            "peak_dbfs_max": PEAK_CEILING_DB,
            "duration_tolerance_seconds": DURATION_TOLERANCE_S,
        },
        "summary": summary,
        "failures": failures,
        "per_file": per_file,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
