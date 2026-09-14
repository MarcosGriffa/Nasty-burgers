from PIL import Image, ImageFilter
import numpy as np

SRC = '/mnt/user-data/uploads/Fotos Fudo/Fotos Hamburguesas/Critical Doble Mascara.png'
DST = '/home/claude/nasty-burgers/src/img'

im = Image.open(SRC).convert('RGBA')
a = np.asarray(im).copy()

# 1) sacar el hilo naranja del borde: se achica el alfa un par de píxeles
alfa = Image.fromarray(a[..., 3])
alfa = alfa.filter(ImageFilter.MinFilter(9))     # erosiona ~4 px
alfa = alfa.filter(ImageFilter.GaussianBlur(1.2))  # y se suaviza el filo
a[..., 3] = np.asarray(alfa)
im = Image.fromarray(a)

# 2) recorte al objeto
caja = im.getbbox()
obj = im.crop(caja)
print('objeto', obj.size)

# 3) lienzo cuadrado, con aire para que la sombra respire
lado = int(max(obj.size) * 1.14)
esc = min(lado * 0.94 / obj.width, lado * 0.94 / obj.height)
obj = obj.resize((int(obj.width * esc), int(obj.height * esc)), Image.LANCZOS)
lienzo = Image.new('RGBA', (lado, lado), (0, 0, 0, 0))
lienzo.paste(obj, ((lado - obj.width) // 2, int((lado - obj.height) * 0.46)), obj)

# 4) tamaño final para la web
final = lienzo.resize((1100, 1100), Image.LANCZOS)
final.save(f'{DST}/hero.webp', 'WEBP', quality=88, method=6)
final.save('/home/claude/preview/hero-crudo.png')

import os
print('hero.webp', os.path.getsize(f'{DST}/hero.webp') // 1024, 'KB')

# vista previa sobre el amarillo de la marca
fondo = Image.new('RGB', final.size, (245, 179, 1))
fondo.paste(final, (0, 0), final)
fondo.save('/home/claude/preview/hero-amarillo.jpg', quality=88)
# y sobre negro, que es como queda al scrollear
neg = Image.new('RGB', final.size, (11, 11, 11))
neg.paste(final, (0, 0), final)
neg.save('/home/claude/preview/hero-negro.jpg', quality=88)
