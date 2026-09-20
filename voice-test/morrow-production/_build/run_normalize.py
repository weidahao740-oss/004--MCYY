# -*- coding: utf-8 -*-
"""Run normalize_morrow_audio.py for every raw WAV in inventory.

raw:   raw/<chapterId>/<eventId>/<lineId>.wav
final: tts/<chapterId>/<eventId>/<lineId>/1.0.0/audio.wav
report:tts/<chapterId>/<eventId>/<lineId>/1.0.0/report.json
"""
import json
import subprocess
import sys
from pathlib import Path

PROD = Path(r"C:\004-MCYY\voice-test\morrow-production")
NORM = Path(r"C:\004-MCYY\english-pet\scripts\normalize_morrow_audio.py")


def main():
    inv = json.loads((PROD / "inventory.json").read_text(encoding="utf-8"))
    fails = []
    for i, rec in enumerate(inv, 1):
        ch, ev, li = rec["chapterId"], rec["eventId"], rec["lineId"]
        raw = PROD / "raw" / ch / ev / (li + ".wav")
        out_dir = PROD / "tts" / ch / ev / li / "1.0.0"
        out = out_dir / "audio.wav"
        rep = out_dir / "report.json"
        if out.exists() and rep.exists():
            print(f"[{i}/{len(inv)}] skipped {li}", flush=True)
            continue
        if not raw.exists():
            fails.append({"lineId": li, "error": "raw missing"})
            print(f"[{i}/{len(inv)}] MISSING raw {li}", flush=True)
            continue
        r = subprocess.run(
            [sys.executable, str(NORM), str(raw), str(out), "--report", str(rep)],
            capture_output=True, text=True)
        if r.returncode != 0:
            fails.append({"lineId": li, "error": (r.stderr or r.stdout)[-500:]})
            print(f"[{i}/{len(inv)}] FAIL {li}: {(r.stderr or r.stdout)[-200:]}", flush=True)
        else:
            print(f"[{i}/{len(inv)}] ok {li}", flush=True)
    (PROD / "_build" / "normalize_failures.json").write_text(
        json.dumps(fails, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"NORMALIZE DONE total={len(inv)} fails={len(fails)}")
    if fails:
        print([f["lineId"] for f in fails])
        sys.exit(2)


if __name__ == "__main__":
    main()
