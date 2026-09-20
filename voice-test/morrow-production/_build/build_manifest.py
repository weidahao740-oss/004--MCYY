# -*- coding: utf-8 -*-
"""Build manifest.json and run hard acceptance checks.

For every inventory record: read report.json (rms/peak/duration/format),
sha256 the final audio.wav, build an AudioBinding. Plus the two excluded lines.
Then self-check:
  - exactly 145 ready audio.wav, unique lineIds, no gaps vs inventory
  - each WAV = PCM/16k/mono/16-bit, activeRmsDbfs in [-21,-19], peak <= -3
  - manifest checksum matches file
  - no DASHSCOPE key string anywhere under PROD
  - no slow / 0.8x / 0.6x files
"""
import hashlib
import json
import re
import wave
from pathlib import Path

PROD = Path(r"C:\004-MCYY\voice-test\morrow-production")
SRC_MODEL = "qwen-audio-3.0-tts-flash"


def sha256_of(p: Path) -> str:
    h = hashlib.sha256()
    with p.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def main():
    inv = json.loads((PROD / "inventory.json").read_text(encoding="utf-8"))
    excluded = json.loads((PROD / "excluded.json").read_text(encoding="utf-8"))

    bindings = []
    problems = []
    counts = {"chapter_01_birth": 0, "chapter_02_childhood": 0}

    for rec in inv:
        ch, ev, li = rec["chapterId"], rec["eventId"], rec["lineId"]
        rel = Path("tts") / ch / ev / li / "1.0.0"
        audio = PROD / rel / "audio.wav"
        report = PROD / rel / "report.json"
        if not audio.exists():
            problems.append(f"missing audio {li}")
            continue
        if not report.exists():
            problems.append(f"missing report {li}")
            continue
        rep = json.loads(report.read_text(encoding="utf-8"))
        of = rep["output_format"]
        digest = sha256_of(audio)

        # verify format from the actual file
        with wave.open(str(audio), "rb") as w:
            nframes = w.getnframes()
            fr = w.getframerate()
            chn = w.getnchannels()
            sw = w.getsampwidth()
        dur = round(nframes / fr, 3)

        binding = {
            "audioId": rec["audioId"],
            "lineId": li,
            "contentId": rec["contentId"],
            "textVersion": rec["textVersion"],
            "translationVersion": rec["translationVersion"],
            "voiceProfileId": rec["voiceProfileId"],
            "fileRef": (rel / "audio.wav").as_posix(),
            "checksumSha256": digest,
            "durationSeconds": dur,
            "activeRmsDbfs": rep["after"]["active_rms_dbfs"],
            "peakDbfs": rep["after"]["peak_dbfs"],
            "status": "ready",
            "sourceModel": SRC_MODEL,
            "sourceRate": 1.0,
            "pitch": 1.0,
            "note": "",
        }
        bindings.append(binding)
        counts[ch] = counts.get(ch, 0) + 1

        # ---- per-file acceptance ----
        if not (of["container"] == "WAV" and of["codec"] == "PCM"
                and of["sample_rate_hz"] == 16000 and of["channels"] == 1
                and of["bits_per_sample"] == 16):
            problems.append(f"{li}: format not WAV/PCM/16k/mono/16bit -> {of}")
        if chn != 1 or fr != 16000 or sw != 2:
            problems.append(f"{li}: file fmt mismatch ch={chn} sr={fr} sw={sw}")
        ar = rep["after"]["active_rms_dbfs"]
        if not (-21.0 <= ar <= -19.0):
            problems.append(f"{li}: activeRms {ar} outside [-21,-19]")
        if rep["after"]["peak_dbfs"] > -3.0:
            problems.append(f"{li}: peak {rep['after']['peak_dbfs']} > -3 dBFS")

    # assemble manifest
    manifest = {
        "version": "1.0.0",
        "voiceProfileId": "morrow_voice_v1",
        "sourceModel": SRC_MODEL,
        "rate": 1.0,
        "pitch": 1.0,
        "total": len(bindings),
        "included": bindings,
        "excluded": [
            {
                "audioId": e["audioId"], "lineId": e["lineId"],
                "contentId": e["contentId"], "chapterId": e["chapterId"],
                "eventId": e["eventId"], "status": "planned",
                "reason": e["reason"],
            } for e in excluded
        ],
    }
    (PROD / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    # ---- global checks ----
    line_ids = [b["lineId"] for b in bindings]
    inv_ids = [r["lineId"] for r in inv]
    if len(line_ids) != len(set(line_ids)):
        problems.append("duplicate lineIds in manifest")
    if set(line_ids) != set(inv_ids):
        problems.append("manifest lineIds != inventory lineIds")
    # count
    if len(bindings) != 145:
        problems.append(f"expected 145 ready, got {len(bindings)}")

    # no key leak anywhere under PROD (text files)
    key = None
    for ln in (Path(r"C:\004-MCYY\english-pet\.env").read_text(encoding="utf-8").splitlines()):
        if ln.strip().startswith("DASHSCOPE_API_KEY="):
            key = ln.strip().split("=", 1)[1].strip()
    if key:
        for p in PROD.rglob("*"):
            if p.is_file() and p.suffix in (".json", ".py", ".md", ".txt"):
                try:
                    if key in p.read_text(encoding="utf-8", errors="ignore"):
                        problems.append(f"API KEY LEAK in {p}")
                except Exception:
                    pass

    # no slow / 0.8x / 0.6x playback-variant files. A legitimate lineId may
    # contain the substring "slow" (e.g. bfl_result_slow), so only flag an
    # actual variant token: a path component equal to a variant name, or a
    # WAV basename (without extension) equal to a variant name.
    VARIANT_TOKENS = {"slow", "slow_0.8x", "slow_0.6x", "0.8x", "0.6x", "slow.wav"}
    for p in PROD.rglob("*.wav"):
        parts = {seg.lower() for seg in p.parts}
        stem = p.stem.lower()
        if parts & VARIANT_TOKENS or stem in {"slow", "0.8x", "0.6x", "slow_0.8x", "slow_0.6x"}:
            problems.append(f"slow/variant file present: {p}")

    print("COUNTS:", counts)
    print("manifest included:", len(bindings), "excluded:", len(manifest["excluded"]))
    if problems:
        print("PROBLEMS:")
        for x in problems:
            print("  -", x)
    else:
        print("ALL HARD CHECKS PASSED")


if __name__ == "__main__":
    main()
