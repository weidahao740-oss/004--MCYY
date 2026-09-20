#!/usr/bin/env python3
"""Prepare Morrow WAV files for release.

The source voice identity is fixed elsewhere. This script downmixes to mono,
resamples to 16 kHz, normalizes level, and writes a valid 16-bit PCM WAV header.
It does not intentionally alter pitch, tempo, wording, or voice identity.
"""

from __future__ import annotations

import argparse
import json
import math
import struct
import wave
from pathlib import Path


def db_to_linear(db: float) -> float:
    return 10 ** (db / 20)


def linear_to_db(value: float) -> float:
    return 20 * math.log10(value) if value > 0 else -120.0


def downmix_to_mono(samples: list[int], channels: int) -> list[int]:
    if channels == 1:
        return samples
    if channels < 1:
        raise ValueError("channels must be positive")
    frame_count = len(samples) // channels
    return [
        round(sum(samples[index * channels : (index + 1) * channels]) / channels)
        for index in range(frame_count)
    ]


def resample_linear(samples: list[int], source_rate: int, target_rate: int) -> list[int]:
    if source_rate == target_rate or len(samples) < 2:
        return samples
    target_length = max(1, round(len(samples) * target_rate / source_rate))
    scale = source_rate / target_rate
    result: list[int] = []
    for target_index in range(target_length):
        position = target_index * scale
        left = min(int(position), len(samples) - 1)
        right = min(left + 1, len(samples) - 1)
        fraction = position - left
        value = round(samples[left] * (1 - fraction) + samples[right] * fraction)
        result.append(max(-32768, min(32767, value)))
    return result


def measure(samples: list[int], sample_rate: int, channels: int) -> dict[str, float]:
    full_scale = 32767.0
    peak = max((abs(sample) for sample in samples), default=0)
    rms = math.sqrt(sum(sample * sample for sample in samples) / len(samples)) if samples else 0.0

    block_samples = max(channels, int(sample_rate * 0.05) * channels)
    active: list[int] = []
    for start in range(0, len(samples), block_samples):
        block = samples[start : start + block_samples]
        if not block:
            continue
        block_rms = math.sqrt(sum(sample * sample for sample in block) / len(block))
        if linear_to_db(block_rms / full_scale) > -45.0:
            active.extend(block)

    active_rms = (
        math.sqrt(sum(sample * sample for sample in active) / len(active)) if active else rms
    )
    return {
        "peak_dbfs": round(linear_to_db(peak / full_scale), 2),
        "rms_dbfs": round(linear_to_db(rms / full_scale), 2),
        "active_rms_dbfs": round(linear_to_db(active_rms / full_scale), 2),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Prepare a Morrow WAV release asset")
    parser.add_argument("input", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--sample-rate", type=int, default=16000)
    parser.add_argument("--target-active-rms-dbfs", type=float, default=-20.0)
    parser.add_argument("--peak-ceiling-dbfs", type=float, default=-3.0)
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()

    with wave.open(str(args.input), "rb") as source:
        params = source.getparams()
        if params.sampwidth != 2 or params.comptype != "NONE":
            raise SystemExit("Only uncompressed 16-bit PCM WAV is supported")
        raw = source.readframes(params.nframes)

    sample_count = len(raw) // 2
    source_samples = list(struct.unpack("<" + "h" * sample_count, raw))
    mono_samples = downmix_to_mono(source_samples, params.nchannels)
    samples = resample_linear(mono_samples, params.framerate, args.sample_rate)
    before = measure(samples, args.sample_rate, 1)

    gain_db = args.target_active_rms_dbfs - before["active_rms_dbfs"]
    gain = db_to_linear(gain_db)
    predicted_peak = before["peak_dbfs"] + gain_db
    if predicted_peak > args.peak_ceiling_dbfs:
        gain_db -= predicted_peak - args.peak_ceiling_dbfs
        gain = db_to_linear(gain_db)

    processed = [max(-32768, min(32767, round(sample * gain))) for sample in samples]
    output_raw = struct.pack("<" + "h" * len(processed), *processed)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.output), "wb") as target:
        # Do not reuse params.nframes: Seed Audio streaming WAV files may leave
        # RIFF/data length placeholders in the source header. writeframes()
        # calculates a valid frame count from the actual PCM payload.
        target.setnchannels(1)
        target.setsampwidth(2)
        target.setframerate(args.sample_rate)
        target.setcomptype("NONE", "not compressed")
        target.writeframes(output_raw)

    after = measure(processed, args.sample_rate, 1)
    with wave.open(str(args.output), "rb") as check:
        output_format = {
            "container": "WAV",
            "codec": "PCM",
            "sample_rate_hz": check.getframerate(),
            "channels": check.getnchannels(),
            "bits_per_sample": check.getsampwidth() * 8,
            "frames": check.getnframes(),
            "duration_seconds": round(check.getnframes() / check.getframerate(), 3),
        }
    output_bytes = args.output.read_bytes()
    riff_length_field = struct.unpack_from("<I", output_bytes, 4)[0]
    data_index = output_bytes.find(b"data")
    data_length_field = struct.unpack_from("<I", output_bytes, data_index + 4)[0]
    output_format["riff_length_field"] = riff_length_field
    output_format["expected_riff_length"] = len(output_bytes) - 8
    output_format["data_length_field"] = data_length_field
    output_format["expected_data_length"] = len(output_raw)
    output_format["length_fields_valid"] = (
        riff_length_field == len(output_bytes) - 8 and data_length_field == len(output_raw)
    )
    required_format_valid = (
        output_format["container"] == "WAV"
        and output_format["codec"] == "PCM"
        and output_format["sample_rate_hz"] == 16000
        and output_format["channels"] == 1
        and output_format["bits_per_sample"] == 16
        and output_format["length_fields_valid"]
    )
    output_format["required_format_valid"] = required_format_valid
    if not required_format_valid:
        raise RuntimeError("Output does not meet the required WAV/PCM/16 kHz/mono/16-bit specification")
    report = {
        "input": str(args.input),
        "output": str(args.output),
        "target_active_rms_dbfs": args.target_active_rms_dbfs,
        "peak_ceiling_dbfs": args.peak_ceiling_dbfs,
        "applied_gain_db": round(gain_db, 2),
        "source_format": {
            "sample_rate_hz": params.framerate,
            "channels": params.nchannels,
            "bits_per_sample": params.sampwidth * 8,
        },
        "output_format": output_format,
        "before": before,
        "after": after,
    }
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
