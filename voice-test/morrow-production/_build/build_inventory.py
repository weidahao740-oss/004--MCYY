# -*- coding: utf-8 -*-
"""Parse Morrow chapter content MD files into an inventory of TTS lines.

Only lines carrying an inline "音频：`<id>_audio`" annotation are extracted.
Excluded runtime-template lines (brw_prompt_line, brc_prompt_line) are dropped.
Writes inventory.json and prints a self-check summary. Does NOT touch the API key.
"""
import json
import re
from pathlib import Path

PROD = Path(r"C:\004-MCYY\voice-test\morrow-production")
CH_FILES = {
    "chapter_01_birth": Path(r"C:\004-MCYY\CHAPTER_01_BIRTH_CONTENT.md"),
    "chapter_02_childhood": Path(r"C:\004-MCYY\CHAPTER_02_CHILDHOOD_CONTENT.md"),
}
EXCLUDE_LINE_IDS = {"brw_prompt_line", "brc_prompt_line"}
VOICE_PROFILE_ID = "morrow_voice_v1"
TEXT_VERSION = "1.0.0"
TRANSLATION_VERSION = "1.0.0"

ANNO_RE = re.compile(r"音频[：:]\s*`([A-Za-z0-9_]+)_audio`")
EVENT_ID_RE = re.compile(r"事件\s*ID[：:]\s*`([A-Za-z0-9_]+)`")
TIP_RE = re.compile(r"译文[：:]\s*(.+)")
# backtick spans in a line
BT_RE = re.compile(r"`([^`]+)`")


def extract_chapter(chapter_id: str, path: Path):
    lines = path.read_text(encoding="utf-8").splitlines()
    records = []
    event_id = None
    pending = []  # buffer of recent (line_no, text)
    max_window = 20

    for idx, raw in enumerate(lines):
        line = raw.rstrip("\n")
        # Track current event id
        m_ev = EVENT_ID_RE.search(line)
        if m_ev:
            event_id = m_ev.group(1)

        m_ann = ANNO_RE.search(line)
        if not m_ann:
            pending.append((idx, line))
            pending = pending[-max_window:]
            continue

        audio_id = m_ann.group(1) + "_audio"
        line_id = m_ann.group(1)

        # find nearest 译文 line going back in pending buffer
        zh = None
        zh_pos = None
        for (p, t) in reversed(pending):
            mt = TIP_RE.search(t)
            if mt:
                zh = mt.group(1).strip()
                zh_pos = p
                break

        # English line = the line immediately above the 译文 line
        english = None
        if zh_pos is not None:
            for (p, t) in reversed(pending):
                if p < zh_pos:
                    spans = BT_RE.findall(t)
                    if spans:
                        # pick the longest backtick span (the actual Morrow sentence)
                        english = max(spans, key=len).strip()
                    break

        records.append({
            "chapterId": chapter_id,
            "eventId": event_id,
            "lineId": line_id,
            "audioId": audio_id,
            "contentId": line_id + "_content",
            "textVersion": TEXT_VERSION,
            "translationVersion": TRANSLATION_VERSION,
            "voiceProfileId": VOICE_PROFILE_ID,
            "english": english,
            "textZh": zh,
        })
        pending.append((idx, line))
        pending = pending[-max_window:]

    return records


def main():
    all_records = []
    excluded = []
    counts = {}
    for ch, path in CH_FILES.items():
        recs = extract_chapter(ch, path)
        kept, drop = [], []
        for r in recs:
            if r["lineId"] in EXCLUDE_LINE_IDS:
                drop.append(r)
            else:
                kept.append(r)
        counts[ch] = {"kept": len(kept), "raw": len(recs), "dropped": len(drop)}
        all_records.extend(kept)
        for r in drop:
            excluded.append({
                "chapterId": r["chapterId"],
                "eventId": r["eventId"],
                "lineId": r["lineId"],
                "audioId": r["audioId"],
                "contentId": r["contentId"],
                "status": "planned",
                "reason": ("Runtime template line with injected user sentence; "
                           "blueprint says do not regenerate the full-sentence audio."),
                "english": r["english"],
            })

    # uniqueness check
    ids = [r["lineId"] for r in all_records]
    dup = {x for x in ids if ids.count(x) > 1}

    # completeness checks
    missing_english = [r["lineId"] for r in all_records if not r["english"]]
    missing_zh = [r["lineId"] for r in all_records if not r["textZh"]]

    PROD.mkdir(parents=True, exist_ok=True)
    inv_path = PROD / "inventory.json"
    inv_path.write_text(json.dumps(all_records, ensure_ascii=False, indent=2), encoding="utf-8")

    excl_path = PROD / "excluded.json"
    excl_path.write_text(json.dumps(excluded, ensure_ascii=False, indent=2), encoding="utf-8")

    print("COUNTS:")
    for ch, c in counts.items():
        print(f"  {ch}: raw={c['raw']} kept={c['kept']} excluded={c['dropped']}")
    print("TOTAL KEPT:", len(all_records))
    print("DUPLICATE lineIds:", sorted(dup))
    print("MISSING english:", missing_english)
    print("MISSING zh:", missing_zh)
    print("EXCLUDED:", [(e['lineId'], e['audioId']) for e in excluded])
    # print any line whose english contains a template placeholder
    tmpl = [r["lineId"] for r in all_records if "{{" in (r["english"] or "")]
    print("KEPT lines still containing {{placeholder}}:", tmpl)


if __name__ == "__main__":
    main()
