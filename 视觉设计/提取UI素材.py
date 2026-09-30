from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import shutil

SRC = Path(r"C:\004-MCYY\视觉设计\陪伴首页-确认底图-原尺寸融合气泡-状态框恢复版.png")
OUT = Path(r"C:\004-MCYY\视觉设计\UI拆分素材")
OVERVIEW = Path(r"C:\004-MCYY\视觉设计\UI拆分素材总览.png")
ZIP_BASE = Path(r"C:\004-MCYY\视觉设计\UI拆分素材")
OUT.mkdir(parents=True, exist_ok=True)

im = Image.open(SRC).convert("RGBA")
if im.size != (1536, 2752):
    raise ValueError(f"输入尺寸发生变化：{im.size}，脚本坐标基于 1536×2752")

# 坐标基于原图。对带底框的 UI 保留框内已融合的玻璃质感，只把轮廓外处理为透明。
def crop_with_mask(name, box, mask_builder=None):
    tile = im.crop(box)
    if mask_builder:
        mask = Image.new("L", tile.size, 0)
        d = ImageDraw.Draw(mask)
        mask_builder(d, tile.size)
        tile.putalpha(mask)
    path = OUT / f"{name}.png"
    tile.save(path)
    return name, path, tile

# 无底框的白色状态图标：用 RGB 最暗通道估算“接近白色”的程度，避免蓝色窗景高光被误提取。
def extract_light_ui(name, box, threshold=105, softness=125):
    tile = im.crop(box).convert("RGBA")
    px = tile.load()
    for y in range(tile.height):
        for x in range(tile.width):
            r, g, b, _ = px[x, y]
            white_level = min(r, g, b)
            a = int(max(0, min(255, (white_level - threshold) * 255 / softness)))
            if a < 24:
                a = 0
            px[x, y] = (r, g, b, a)
    path = OUT / f"{name}.png"
    tile.save(path)
    return name, path, tile

items = []
items.append(extract_light_ui("01_顶部系统状态栏", (70, 48, 1465, 125), 105, 125))

items.append(crop_with_mask(
    "02_正在聆听标签", (57, 176, 516, 307),
    lambda d, s: d.rounded_rectangle((1, 1, s[0]-2, s[1]-2), radius=65, fill=255)
))

items.append(extract_light_ui("03_右上角功能图标", (1360, 215, 1485, 335), 105, 125))

# 中央气泡：圆角主体 + 尾巴。
def bubble_mask(d, s):
    d.rounded_rectangle((2, 2, s[0]-3, 400), radius=82, fill=255)
    d.polygon([(304, 378), (432, 378), (307, s[1]-3), (356, 398)], fill=255)

items.append(crop_with_mask("04_中央对话气泡", (586, 470, 1485, 1048), bubble_mask))

items.append(crop_with_mask(
    "05_和我一起听听按钮", (145, 2224, 695, 2388),
    lambda d, s: d.rounded_rectangle((2, 2, s[0]-3, s[1]-3), radius=80, fill=255)
))

items.append(crop_with_mask(
    "06_稍后再说按钮", (842, 2224, 1345, 2388),
    lambda d, s: d.rounded_rectangle((2, 2, s[0]-3, s[1]-3), radius=80, fill=255)
))

# 底部导航的上边是拱形圆角，底部贴屏幕边缘。
def nav_mask(d, s):
    d.rounded_rectangle((0, 0, s[0]-1, s[1]+120), radius=95, fill=255)

items.append(crop_with_mask("07_底部导航栏", (0, 2480, 1536, 2752), nav_mask))

# 制作透明棋盘格总览图，便于检查各素材边缘和透明区。
def checker(size, cell=18):
    bg = Image.new("RGB", size, (238, 238, 238))
    dd = ImageDraw.Draw(bg)
    for y in range(0, size[1], cell):
        for x in range(0, size[0], cell):
            if (x // cell + y // cell) % 2:
                dd.rectangle((x, y, x+cell-1, y+cell-1), fill=(207, 207, 207))
    return bg.convert("RGBA")

font_path = Path(r"C:\Windows\Fonts\msyh.ttc")
font = ImageFont.truetype(str(font_path), 30) if font_path.exists() else ImageFont.load_default()
small = ImageFont.truetype(str(font_path), 22) if font_path.exists() else ImageFont.load_default()
canvas = Image.new("RGB", (1200, 2550), (27, 31, 40))
draw = ImageDraw.Draw(canvas)
draw.text((60, 38), "UI 拆分素材总览", fill="white", font=font)
y = 105
for name, path, tile in items:
    max_w, max_h = 1040, 300
    scale = min(max_w / tile.width, max_h / tile.height, 1.0)
    show = tile.resize((max(1, int(tile.width*scale)), max(1, int(tile.height*scale))), Image.Resampling.LANCZOS)
    panel_h = max(150, show.height + 70)
    panel = checker((1080, panel_h))
    px = (1080-show.width)//2
    py = 48
    panel.alpha_composite(show, (px, py))
    canvas.paste(panel.convert("RGB"), (60, y))
    draw.text((76, y+12), f"{name}  {tile.width}×{tile.height}", fill=(28, 33, 42), font=small)
    y += panel_h + 28
canvas = canvas.crop((0, 0, 1200, min(canvas.height, y+30)))
canvas.save(OVERVIEW)

# 打包素材 PNG；总览图和脚本单独保留在同目录，方便复查与再次生成。
zip_path = shutil.make_archive(str(ZIP_BASE), "zip", root_dir=OUT)
print(f"source={SRC}")
print(f"output_dir={OUT}")
print(f"overview={OVERVIEW}")
print(f"zip={zip_path}")
for name, path, tile in items:
    alpha = tile.getchannel("A")
    extrema = alpha.getextrema()
    print(f"{path.name}\t{tile.width}x{tile.height}\talpha={extrema}")
