#!/usr/bin/env python3
# ---------------------------------------------------------------------------
# Deja una foto de producto lista para entrar en src/img/.
#
# Las fotos de productos viajan ADENTRO del archivo de la pagina, asi que
# cada KB de mas lo paga el cliente que abre el menu con datos del celular.
# Las que ya estaban pesan entre 4 y 10 KB y son cuadradas de ~256 px: esto
# deja las nuevas igual, para que la grilla no quede despareja.
#
# Que hace con cada una:
#   1. La apoya sobre fondo blanco (las latas vienen con transparencia).
#   2. Recorta el borde blanco sobrante, asi el producto ocupa toda la foto.
#   3. La centra en un cuadrado con un margen chico, SIN recortarla: las latas
#      son altas y cortarlas a cuadrado les come la tapa o la base.
#   4. La achica a 256 px y la guarda como JPG.
#
# Uso:  python3 scripts/preparar-fotos.py origen.png destino.jpg [--recorte-der N]
# ---------------------------------------------------------------------------
import sys

from PIL import Image, ImageChops

LADO = 256
MARGEN = 0.04  # 4 % de aire alrededor del producto


def sobre_blanco(im):
    """Las latas vienen en PNG con transparencia; el menu tiene fondo claro."""
    im = im.convert('RGBA')
    fondo = Image.new('RGBA', im.size, (255, 255, 255, 255))
    return Image.alpha_composite(fondo, im).convert('RGB')


def recortar_blanco(im):
    """Saca el blanco de alrededor. Si la foto es toda blanca, la deja igual."""
    diff = ImageChops.difference(im, Image.new('RGB', im.size, (255, 255, 255)))
    caja = diff.convert('L').point(lambda p: 255 if p > 12 else 0).getbbox()
    return im.crop(caja) if caja else im


def main():
    origen, destino = sys.argv[1], sys.argv[2]

    # Algunas capturas traen un pedazo de otra cosa pegado al costado. Con esto
    # se le saca ese porcentaje del ancho por derecha antes de medir nada: si
    # no, el recorte automatico lo toma como parte del producto y lo descentra.
    recorte_der = 0
    if '--recorte-der' in sys.argv:
        recorte_der = int(sys.argv[sys.argv.index('--recorte-der') + 1])

    im = sobre_blanco(Image.open(origen))
    if recorte_der:
        ancho, alto = im.size
        im = im.crop((0, 0, ancho - ancho * recorte_der // 100, alto))

    im = recortar_blanco(im)

    util = int(LADO * (1 - 2 * MARGEN))
    im.thumbnail((util, util), Image.LANCZOS)

    lienzo = Image.new('RGB', (LADO, LADO), (255, 255, 255))
    lienzo.paste(im, ((LADO - im.width) // 2, (LADO - im.height) // 2))
    lienzo.save(destino, 'JPEG', quality=82, optimize=True, progressive=True)

    print(f'{destino}  {im.size[0]}x{im.size[1]} dentro de {LADO}x{LADO}')


if __name__ == '__main__':
    main()
