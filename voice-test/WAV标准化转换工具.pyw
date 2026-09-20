from __future__ import annotations

import struct
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox

TARGET_RATE = 16000
TARGET_CHANNELS = 1
TARGET_BITS = 16


def parse_pcm16_wav(path: Path) -> tuple[int, int, bytes]:
    raw = path.read_bytes()
    if len(raw) < 12 or raw[:4] not in (b"RIFF", b"RF64") or raw[8:12] != b"WAVE":
        raise ValueError("不是有效的 WAV 文件")

    pos = 12
    fmt = None
    data = None
    while pos + 8 <= len(raw):
        chunk_id = raw[pos : pos + 4]
        chunk_size = struct.unpack_from("<I", raw, pos + 4)[0]
        payload = pos + 8

        if chunk_id == b"fmt ":
            if payload + 16 > len(raw):
                raise ValueError("fmt 区块不完整")
            fmt = struct.unpack_from("<HHIIHH", raw, payload)
        elif chunk_id == b"data":
            # 兼容流式 WAV：data 长度可能为 0xFFFFFFFF，此时以文件结尾为准。
            available = len(raw) - payload
            actual_size = available if chunk_size == 0xFFFFFFFF else min(chunk_size, available)
            data = raw[payload : payload + actual_size]
            break

        next_pos = payload + chunk_size + (chunk_size & 1)
        if next_pos <= pos or next_pos > len(raw):
            break
        pos = next_pos

    if fmt is None or data is None:
        raise ValueError("缺少 fmt 或 data 区块")

    audio_format, channels, sample_rate, _byte_rate, _block_align, bits = fmt
    if audio_format != 1 or bits != 16:
        raise ValueError(f"仅支持 16-bit PCM WAV（当前格式={audio_format}, 位深={bits}）")
    if channels < 1:
        raise ValueError("无效的声道数")

    return channels, sample_rate, data


def pcm16_to_mono(data: bytes, channels: int) -> list[int]:
    frame_bytes = 2 * channels
    usable = len(data) - (len(data) % frame_bytes)
    frame_count = usable // frame_bytes
    mono = [0] * frame_count
    offset = 0

    for frame in range(frame_count):
        total = 0
        for _ in range(channels):
            total += struct.unpack_from("<h", data, offset)[0]
            offset += 2
        mono[frame] = max(-32768, min(32767, round(total / channels)))

    return mono


def resample_linear(samples: list[int], source_rate: int, target_rate: int) -> list[int]:
    if source_rate <= 0:
        raise ValueError("无效的采样率")
    if not samples or source_rate == target_rate:
        return samples.copy()

    output_length = max(1, round(len(samples) * target_rate / source_rate))
    output = [0] * output_length
    ratio = source_rate / target_rate
    last = len(samples) - 1

    for i in range(output_length):
        position = i * ratio
        left = int(position)
        if left >= last:
            output[i] = samples[last]
        else:
            fraction = position - left
            output[i] = round(samples[left] + (samples[left + 1] - samples[left]) * fraction)

    return output


def pack_pcm16(samples: list[int]) -> bytes:
    output = bytearray(len(samples) * 2)
    for i, sample in enumerate(samples):
        struct.pack_into("<h", output, i * 2, int(sample))
    return bytes(output)


def build_standard_wav(pcm_data: bytes) -> bytes:
    block_align = TARGET_CHANNELS * TARGET_BITS // 8
    byte_rate = TARGET_RATE * block_align
    fmt_data = struct.pack(
        "<HHIIHH",
        1,
        TARGET_CHANNELS,
        TARGET_RATE,
        byte_rate,
        block_align,
        TARGET_BITS,
    )
    riff_size = 4 + (8 + len(fmt_data)) + (8 + len(pcm_data))
    return (
        b"RIFF"
        + struct.pack("<I", riff_size)
        + b"WAVE"
        + b"fmt "
        + struct.pack("<I", len(fmt_data))
        + fmt_data
        + b"data"
        + struct.pack("<I", len(pcm_data))
        + pcm_data
    )


def convert_file(source: Path, destination: Path) -> None:
    channels, sample_rate, pcm_data = parse_pcm16_wav(source)
    mono = pcm16_to_mono(pcm_data, channels)
    mono_16k = resample_linear(mono, sample_rate, TARGET_RATE)
    destination.write_bytes(build_standard_wav(pack_pcm16(mono_16k)))


def unique_destination(output_dir: Path, source: Path) -> Path:
    candidate = output_dir / source.name
    if candidate.resolve() == source.resolve():
        candidate = output_dir / f"{source.stem}_standard.wav"
    if not candidate.exists():
        return candidate

    index = 1
    while True:
        candidate = output_dir / f"{source.stem}_standard_{index}.wav"
        if not candidate.exists():
            return candidate
        index += 1


def main() -> None:
    root = tk.Tk()
    root.withdraw()
    root.update()

    selected = filedialog.askopenfilenames(
        title="选择需要转换的 WAV 文件（可多选）",
        filetypes=[("WAV 音频", "*.wav"), ("所有文件", "*.*")],
    )
    if not selected:
        root.destroy()
        return

    output = filedialog.askdirectory(title="选择转换后文件的保存文件夹")
    if not output:
        root.destroy()
        return

    output_dir = Path(output)
    successes: list[Path] = []
    failures: list[str] = []

    for item in selected:
        source = Path(item)
        try:
            destination = unique_destination(output_dir, source)
            convert_file(source, destination)
            successes.append(destination)
        except Exception as exc:
            failures.append(f"{source.name}: {exc}")

    summary = [
        f"转换完成：{len(successes)} 个",
        f"失败：{len(failures)} 个",
        "",
        "输出规格：WAV / PCM / 16 kHz / 单声道 / 16-bit",
        f"保存位置：{output_dir}",
    ]
    if failures:
        summary.extend(["", "失败详情：", *failures])
        messagebox.showwarning("转换完成（部分失败）", "\n".join(summary))
    else:
        messagebox.showinfo("转换完成", "\n".join(summary))

    root.destroy()


if __name__ == "__main__":
    main()
