from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, shutil, json

ROOT = Path(r"C:\004-MCYY\视觉设计")
OUT = ROOT / "UI重绘透明素材"
OVERVIEW = ROOT / "UI重绘透明素材总览.png"
OUT.mkdir(parents=True, exist_ok=True)

FONT_CJK = Path(r"C:\Windows\Fonts\msyh.ttc")
FONT_CJK_BOLD = Path(r"C:\Windows\Fonts\msyhbd.ttc")
FONT_LATIN = Path(r"C:\Windows\Fonts\arialbd.ttf")

def font(path, size):
    return ImageFont.truetype(str(path if path.exists() else FONT_CJK), size)

def rgba(size): return Image.new("RGBA", size, (0,0,0,0))

def rounded_mask(size, radius, box=None):
    m = Image.new("L", size, 0); d = ImageDraw.Draw(m)
    b = box or (0,0,size[0]-1,size[1]-1)
    d.rounded_rectangle(b, radius=radius, fill=255)
    return m

def shadow_layer(size, mask, blur=14, offset=(0,8), color=(0,0,0,110)):
    a = Image.new("L", size, 0); a.paste(mask, offset)
    a = a.filter(ImageFilter.GaussianBlur(blur))
    lay = Image.new("RGBA", size, color); lay.putalpha(a.point(lambda v: v*color[3]//255))
    return lay

def gradient_fill(size, mask, stops):
    w,h=size; layer=rgba(size); px=layer.load();
    for y in range(h):
        t=y/max(1,h-1)
        # linear interpolation across ordered stops (position, RGBA)
        a,b=stops[0],stops[-1]
        for i in range(len(stops)-1):
            if stops[i][0] <= t <= stops[i+1][0]: a,b=stops[i],stops[i+1]; break
        q=(t-a[0])/max(1e-6,b[0]-a[0])
        c=tuple(round(a[1][k]*(1-q)+b[1][k]*q) for k in range(4))
        for x in range(w): px[x,y]=c
    layer.putalpha(Image.composite(layer.getchannel('A'), Image.new('L',size,0), mask))
    return layer

def fit_text(draw, text, box, fp, max_size, min_size=16, fill=(255,255,255,255), anchor='mm'):
    for s in range(max_size, min_size-1, -1):
        f=font(fp,s); bb=draw.textbbox((0,0),text,font=f)
        if bb[2]-bb[0] <= box[2]-box[0] and bb[3]-bb[1] <= box[3]-box[1]:
            x=(box[0]+box[2])//2; y=(box[1]+box[3])//2
            draw.text((x,y),text,font=f,fill=fill,anchor=anchor,stroke_width=1,stroke_fill=(0,0,0,50)); return

def save(name, image, svg):
    # 清除阴影卷积产生的极低透明度噪点，保证组件轮廓外是真正的全透明像素。
    alpha = image.getchannel("A").point(lambda v: 0 if v < 8 else v)
    image.putalpha(alpha)
    p=OUT/f"{name}.png"; image.save(p)
    (OUT/f"{name}.svg").write_text(svg,encoding='utf-8')
    return name,p,image

items=[]

# 01 顶部系统状态栏，纯白矢量图形。
size=(1395,77); img=rgba(size); d=ImageDraw.Draw(img)
d.text((8,36),'9:44',font=font(FONT_LATIN,43),fill=(255,255,255,255),anchor='lm')
# cellular bars
x0=1154
for i,h in enumerate([12,20,29,39]): d.rounded_rectangle((x0+i*16,58-h,x0+10+i*16,58),radius=4,fill='white')
# wifi arcs
cx,cy=1246,52
for r,wid in [(34,6),(24,6),(14,6)]: d.arc((cx-r,cy-r,cx+r,cy+r),205,335,fill='white',width=wid)
d.ellipse((cx-4,cy-1,cx+4,cy+7),fill='white')
# battery
bx,by,bw,bh=1310,18,68,34
d.rounded_rectangle((bx,by,bx+bw,by+bh),radius=9,outline='white',width=4)
d.rounded_rectangle((bx+5,by+5,bx+bw-8,by+bh-5),radius=5,fill='white')
d.rounded_rectangle((bx+bw+3,by+10,bx+bw+8,by+bh-10),radius=2,fill='white')
svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="1395" height="77" viewBox="0 0 1395 77"><text x="8" y="52" font-family="Arial" font-size="43" font-weight="700" fill="white">9:44</text><g fill="white"><rect x="1154" y="46" width="10" height="12" rx="4"/><rect x="1170" y="38" width="10" height="20" rx="4"/><rect x="1186" y="29" width="10" height="29" rx="4"/><rect x="1202" y="19" width="10" height="39" rx="4"/></g><path d="M1213 36 Q1246 8 1279 36 M1222 44 Q1246 23 1270 44 M1232 51 Q1246 39 1260 51" fill="none" stroke="white" stroke-width="6" stroke-linecap="round"/><circle cx="1246" cy="57" r="4" fill="white"/><rect x="1310" y="18" width="68" height="34" rx="9" fill="none" stroke="white" stroke-width="4"/><rect x="1315" y="23" width="55" height="24" rx="5" fill="white"/><rect x="1381" y="28" width="5" height="14" rx="2" fill="white"/></svg>'''
items.append(save('01_顶部系统状态栏_重绘',img,svg))

# 公共玻璃胶囊
def glass_pill(size, stroke, tint_top, tint_bottom, text, text_color, max_font, name):
    w,h=size; img=rgba(size); m=rounded_mask(size,h//2-3,(6,6,w-7,h-7))
    img.alpha_composite(shadow_layer(size,m,10,(0,5),(0,0,0,100)))
    img.alpha_composite(gradient_fill(size,m,[(0,tint_top),(1,tint_bottom)]))
    d=ImageDraw.Draw(img); d.rounded_rectangle((7,7,w-8,h-8),radius=h//2-6,outline=stroke,width=4)
    fit_text(d,text,(28,13,w-28,h-10),FONT_CJK_BOLD,max_font,22,text_color)
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgb{tint_top[:3]}" stop-opacity="{tint_top[3]/255:.3f}"/><stop offset="1" stop-color="rgb{tint_bottom[:3]}" stop-opacity="{tint_bottom[3]/255:.3f}"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="5" stdDeviation="7" flood-opacity=".38"/></filter></defs><rect x="7" y="7" width="{w-14}" height="{h-14}" rx="{h//2-6}" fill="url(#g)" stroke="rgb{stroke[:3]}" stroke-opacity="{stroke[3]/255:.3f}" stroke-width="4" filter="url(#s)"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="Microsoft YaHei" font-size="{max_font}" font-weight="700" fill="rgb{text_color[:3]}">{text}</text></svg>'''
    return save(name,img,svg)

items.append(glass_pill((459,131),(255,224,162,220),(65,76,96,150),(16,26,48,188),'正在听窗边的声音',(244,240,232,255),42,'02_正在聆听标签_重绘'))

# 03 右上功能图标：白色线框，不带底图。
size=(125,120); img=rgba(size); d=ImageDraw.Draw(img)
d.rounded_rectangle((23,18,101,102),radius=22,outline='white',width=5)
d.line((37,14,51,7,83,7,98,16),fill='white',width=5)
d.line((47,55,82,55),fill='white',width=5)
d.line((73,45,85,56,70,71),fill='white',width=5,joint='curve')
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="125" height="120" viewBox="0 0 125 120"><path d="M37 14 L51 7 H83 L98 16" fill="none" stroke="white" stroke-width="5" stroke-linecap="round"/><rect x="23" y="18" width="78" height="84" rx="22" fill="none" stroke="white" stroke-width="5"/><path d="M47 55 H82 M73 45 L85 56 L70 71" fill="none" stroke="white" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>'''
items.append(save('03_右上角功能图标_重绘',img,svg))

# 04 对话气泡：半透明蓝灰纯色，不包含背景纹理。
size=(899,578); img=rgba(size); mask=Image.new('L',size,0); md=ImageDraw.Draw(mask)
md.rounded_rectangle((6,6,893,399),radius=78,fill=255); md.polygon([(307,376),(436,376),(305,570),(355,397)],fill=255)
img.alpha_composite(shadow_layer(size,mask,18,(0,8),(0,0,0,120)))
img.alpha_composite(gradient_fill(size,mask,[(0,(184,210,232,185)),(.65,(130,164,198,178)),(1,(90,128,166,190))]))
d=ImageDraw.Draw(img); d.rounded_rectangle((8,8,890,398),radius=76,outline=(247,250,255,235),width=4)
d.line((307,376,305,570,436,376),fill=(247,250,255,235),width=4,joint='curve')
d.text((70,68),'I hear something\nnear the window.',font=font(FONT_LATIN,54),fill=(12,27,52,255),spacing=12)
# play button
d.ellipse((70,276,150,356),fill=(220,235,250,210)); d.polygon([(101,296),(101,337),(133,316)],fill=(18,38,68,255))
d.text((167,317),'重听',font=font(FONT_CJK_BOLD,35),fill=(18,38,68,255),anchor='lm')
# translate button
d.rounded_rectangle((534,279,825,351),radius=36,fill=(237,246,255,220))
d.text((680,315),'查看中文',font=font(FONT_CJK_BOLD,30),fill=(18,38,68,255),anchor='mm')
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="899" height="578" viewBox="0 0 899 578"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b8d2e8" stop-opacity=".73"/><stop offset=".65" stop-color="#82a4c6" stop-opacity=".70"/><stop offset="1" stop-color="#5a80a6" stop-opacity=".75"/></linearGradient><filter id="s"><feDropShadow dx="0" dy="8" stdDeviation="12" flood-opacity=".45"/></filter></defs><path d="M84 8 H817 Q891 8 891 82 V324 Q891 398 817 398 H436 L305 570 L355 398 H84 Q8 398 8 322 V84 Q8 8 84 8Z" fill="url(#g)" stroke="#f7faff" stroke-opacity=".92" stroke-width="4" filter="url(#s)"/><text x="70" y="120" font-family="Arial" font-size="54" font-weight="700" fill="#0c1b34"><tspan x="70">I hear something</tspan><tspan x="70" dy="68">near the window.</tspan></text><circle cx="110" cy="316" r="40" fill="#dcebfA" fill-opacity=".82"/><path d="M101 296 L101 337 L133 316Z" fill="#122644"/><text x="167" y="329" font-family="Microsoft YaHei" font-size="35" font-weight="700" fill="#122644">重听</text><rect x="534" y="279" width="291" height="72" rx="36" fill="#edf6ff" fill-opacity=".86"/><text x="680" y="326" font-family="Microsoft YaHei" font-size="30" font-weight="700" text-anchor="middle" fill="#122644">查看中文</text></svg>'''
items.append(save('04_中央对话气泡_重绘',img,svg))

items.append(glass_pill((550,164),(255,224,150,235),(118,99,111,138),(30,43,72,188),'和我一起听听',(255,231,178,255),45,'05_和我一起听听按钮_重绘'))
items.append(glass_pill((503,164),(231,243,255,225),(98,130,170,145),(31,40,72,190),'稍后再说',(237,243,253,255),45,'06_稍后再说按钮_重绘'))

# 07 底部导航栏：纯透明深蓝玻璃层。
size=(1536,272); img=rgba(size); m=rounded_mask(size,90,(0,0,1535,360))
img.alpha_composite(shadow_layer(size,m,18,(0,-3),(0,0,0,130)))
img.alpha_composite(gradient_fill(size,m,[(0,(18,40,72,220)),(1,(8,22,48,235))]))
d=ImageDraw.Draw(img); d.rounded_rectangle((1,1,1534,360),radius=90,outline=(159,199,238,125),width=3)
labels=[('陪伴',380,(255,231,158,255)),('成长',775,(174,193,220,255)),('词语回声',1240,(174,193,220,255))]
for text,x,c in labels: d.text((x,108),text,font=font(FONT_CJK_BOLD,48),fill=c,anchor='mm')
d.rounded_rectangle((270,188,360,196),radius=4,fill=(255,231,158,255))
d.rounded_rectangle((505,232,1030,248),radius=8,fill='white')
svg='''<svg xmlns="http://www.w3.org/2000/svg" width="1536" height="272" viewBox="0 0 1536 272"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#122848" stop-opacity=".86"/><stop offset="1" stop-color="#081630" stop-opacity=".92"/></linearGradient></defs><path d="M90 1 H1446 Q1535 1 1535 90 V272 H1 V90 Q1 1 90 1Z" fill="url(#g)" stroke="#9fc7ee" stroke-opacity=".5" stroke-width="3"/><g font-family="Microsoft YaHei" font-size="48" font-weight="700" text-anchor="middle"><text x="380" y="124" fill="#ffe79e">陪伴</text><text x="775" y="124" fill="#aec1dc">成长</text><text x="1240" y="124" fill="#aec1dc">词语回声</text></g><rect x="270" y="188" width="90" height="8" rx="4" fill="#ffe79e"/><rect x="505" y="232" width="525" height="16" rx="8" fill="white"/></svg>'''
items.append(save('07_底部导航栏_重绘',img,svg))

# 校验清单与素材说明
manifest=[]
for name,p,img in items:
    manifest.append({'name':name,'png':p.name,'svg':name+'.svg','size':list(img.size),'alpha_extrema':list(img.getchannel('A').getextrema()),'source_pixels_used':False})
(OUT/'素材说明.json').write_text(json.dumps({'source_reference':'仅参考用户图片的布局、尺寸、文案与视觉风格','background_pixels':'未使用原图像素；所有形状、颜色、文字、图标均重新绘制','items':manifest},ensure_ascii=False,indent=2),encoding='utf-8')

# 总览：棋盘格表示透明。每项等比缩放展示。
def checker(size,cell=20):
    bg=Image.new('RGB',size,(238,238,238)); dd=ImageDraw.Draw(bg)
    for y in range(0,size[1],cell):
        for x in range(0,size[0],cell):
            if (x//cell+y//cell)%2: dd.rectangle((x,y,x+cell-1,y+cell-1),fill=(207,207,207))
    return bg.convert('RGBA')
canvas=Image.new('RGB',(1200,2550),(25,29,38)); dr=ImageDraw.Draw(canvas)
dr.text((60,40),'透明 UI 重绘版总览',font=font(FONT_CJK_BOLD,34),fill='white')
y=110
for name,p,tile in items:
    scale=min(1040/tile.width,310/tile.height,1)
    show=tile.resize((int(tile.width*scale),int(tile.height*scale)),Image.Resampling.LANCZOS)
    ph=max(150,show.height+72); panel=checker((1080,ph)); panel.alpha_composite(show,((1080-show.width)//2,48))
    canvas.paste(panel.convert('RGB'),(60,y)); dr.text((76,y+12),f'{name}  {tile.width}×{tile.height}',font=font(FONT_CJK,22),fill=(25,30,40))
    y+=ph+28
canvas.crop((0,0,1200,min(2550,y+30))).save(OVERVIEW)

zip_path=shutil.make_archive(str(ROOT/'UI重绘透明素材'),'zip',root_dir=OUT)
print(f'overview={OVERVIEW}\nzip={zip_path}\nitems={len(items)}')
for m in manifest: print(m)
