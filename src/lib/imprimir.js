import { NEGOCIO, LOCALES } from '../data/negocio'
import { pesos, fechaHora, nombreCompleto } from './utils'

/**
 * Impresión de comandas en la térmica del local.
 *
 * Se arma un ticket de 80 mm y se manda a imprimir con el diálogo del navegador.
 * Funciona con cualquier impresora instalada en la PC o la tablet: no hace falta
 * driver especial ni servidor intermedio. Conviene dejarla como impresora
 * predeterminada y tildar "sin márgenes" la primera vez.
 */

const escapar = (s) =>
  String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

const ESTILO = (ancho) => `
  /* El rollo no tiene alto fijo: el ticket mide lo que mide. Sin márgenes de
     página, que en una térmica se comen papel; el aire lo pone el body. */
  @page { size: ${ancho} auto; margin: 0; }

  * { box-sizing: border-box; }

  html, body { width: ${ancho}; margin: 0; padding: 0; }

  body {
    padding: 4mm 3mm 8mm;
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 13px;
    line-height: 1.4;
    color: #000;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .c { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: 700; }

  /* Escala de la comanda. El cocinero lee de lejos: los productos y el número
     de pedido son lo más grande de la hoja. */
  .marca    { font-size: 15px; font-weight: 700; letter-spacing: 2px; }
  .sucursal { font-size: 11px; }
  .numero   { font-size: 40px; font-weight: 700; line-height: 1; letter-spacing: 1px; }
  .modo     { font-size: 17px; font-weight: 700; letter-spacing: 3px; }
  .rotulo   { font-size: 10px; letter-spacing: 2px; }
  .dato     { font-size: 12px; }
  .g        { font-size: 15px; font-weight: 700; }

  /* La banda negra separa de un vistazo delivery de take away. */
  .banda {
    background: #000;
    color: #fff;
    padding: 3px 0;
    margin: 4px 0;
  }

  hr { border: none; border-top: 1px dashed #000; margin: 7px 0; }
  .doble { border-top: 3px double #000; margin: 7px 0; }

  table { width: 100%; border-collapse: collapse; }
  td { vertical-align: top; padding: 1px 0; }
  .prec { text-align: right; white-space: nowrap; }

  /* Productos de la comanda: grandes, con la cantidad destacada. */
  .items td { padding: 3px 0; font-size: 19px; font-weight: 700; line-height: 1.2; }
  .items .cant {
    width: 34px;
    font-size: 19px;
    font-weight: 700;
  }
  /* Lo que el cliente eligió: papas sazonadas, sin cebolla, extra bacon. Va
     más chico que el producto pero igual de legible desde la plancha. */
  .items .opciones {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.25;
    padding-left: 4px;
  }

  .caja {
    margin-top: 6px;
    padding: 5px 6px;
    border: 2px solid #000;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.3;
  }

  .pie { margin-top: 10px; font-size: 11px; }
`

function lanzar(html, ancho = '80mm') {
  const marco = document.createElement('iframe')
  marco.setAttribute('aria-hidden', 'true')
  marco.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(marco)

  const doc = marco.contentDocument
  doc.open()
  doc.write(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Comanda</title><style>${ESTILO(ancho)}</style></head><body>${html}</body></html>`,
  )
  doc.close()

  const imprimir = () => {
    try {
      marco.contentWindow.focus()
      marco.contentWindow.print()
    } finally {
      setTimeout(() => marco.remove(), 1500)
    }
  }
  if (doc.readyState === 'complete') setTimeout(imprimir, 120)
  else marco.onload = () => setTimeout(imprimir, 120)
}

const cabecera = (pedido, titulo) => {
  const local = LOCALES.find((l) => l.id === pedido.local)
  return `
    <div class="c marca">${escapar(NEGOCIO.nombre.toUpperCase())}</div>
    <div class="c sucursal">${escapar(local?.nombre ?? '')}${
      local?.direccion ? ` · ${escapar(local.direccion)}` : ''
    }</div>
    <hr>
    <div class="c rotulo">${escapar(titulo)}</div>
    <div class="c numero">#${pedido.numero}</div>
    <div class="c modo">${pedido.modalidad === 'delivery' ? 'DELIVERY' : 'RETIRA'}</div>
    <div class="c dato">${escapar(fechaHora(pedido.creado_en))}</div>
  `
}

const lineas = (pedido, conPrecio) =>
  `<table>${(pedido.items || [])
    .map(
      (i) => `<tr>
        <td class="cant b">${i.cantidad}x</td>
        <td>${escapar(i.nombre)}${
          i.opciones?.length
            ? `<br><span style="font-size:11px">${i.opciones
                .map((o) => escapar(o.opcion))
                .join(', ')}</span>`
            : ''
        }</td>
        ${conPrecio ? `<td class="prec">${pesos(i.precio * i.cantidad)}</td>` : ''}
      </tr>`,
    )
    .join('')}</table>`

/**
 * Comanda de cocina. Sin precios: lo que hay que cocinar, en letra grande, y
 * lo que el cocinero necesita saber (delivery o retiro, la demora prometida y
 * las aclaraciones del cliente).
 */
export function imprimirComandaCocina(pedido) {
  const local = LOCALES.find((l) => l.id === pedido.local)
  const entrega = pedido.modalidad === 'delivery' ? 'DELIVERY' : 'RETIRA EN LOCAL'

  lanzar(`
    <div class="c marca">${escapar(NEGOCIO.nombre.toUpperCase())}</div>
    <div class="c sucursal">${escapar(local?.nombre ?? '')}</div>

    <div class="c banda modo">${entrega}</div>

    <div class="c rotulo">PEDIDO</div>
    <div class="c numero">#${pedido.numero}</div>
    <div class="c dato">${escapar(fechaHora(pedido.creado_en))}</div>

    <div class="doble"></div>

    <table class="items">
      ${(pedido.items || [])
        .map(
          (i) => `<tr>
            <td class="cant">${i.cantidad}</td>
            <td>${escapar(i.nombre).toUpperCase()}${
              i.opciones?.length
                ? `<div class="opciones">${i.opciones
                    .map((o) => `&gt; ${escapar(o.opcion).toUpperCase()}`)
                    .join('<br>')}</div>`
                : ''
            }</td>
          </tr>`,
        )
        .join('')}
    </table>

    <div class="doble"></div>

    ${pedido.nota ? `<div class="caja">${escapar(pedido.nota).toUpperCase()}</div>` : ''}

    ${
      pedido.demora_min
        ? `<div class="c g" style="margin-top:6px">DEMORA: ${pedido.demora_min} MIN</div>`
        : ''
    }

    <hr>
    <div class="dato b">${escapar(pedido.cliente_nombre ?? '')}</div>
    ${pedido.cliente_telefono ? `<div class="dato">${escapar(pedido.cliente_telefono)}</div>` : ''}
    ${pedido.direccion ? `<div class="dato">${escapar(pedido.direccion)}</div>` : ''}
    <div class="pie c">- - -  FIN DE LA COMANDA  - - -</div>
  `)
}

/** Ticket para el cliente / repartidor: con precios, total y dirección. */
export function imprimirTicket(pedido) {
  const pago = { efectivo: 'Efectivo', mercadopago: 'Mercado Pago', transferencia: 'Transferencia', tarjeta: 'Tarjeta' }
  lanzar(`
    ${cabecera(pedido, 'TICKET DEL PEDIDO')}
    <hr>
    ${lineas(pedido, true)}
    <hr>
    <table>
      <tr><td>Subtotal</td><td class="prec">${pesos(pedido.subtotal ?? pedido.total)}</td></tr>
      ${pedido.descuento ? `<tr><td>Descuento</td><td class="prec">-${pesos(pedido.descuento)}</td></tr>` : ''}
      ${pedido.envio ? `<tr><td>Envío</td><td class="prec">${pesos(pedido.envio)}</td></tr>` : ''}
      <tr class="g"><td>TOTAL</td><td class="prec">${pesos(pedido.total)}</td></tr>
      <tr><td>Pago</td><td class="prec">${escapar(pago[pedido.pago] ?? pedido.pago ?? '-')}</td></tr>
    </table>
    <hr>
    <div class="b">${escapar(pedido.cliente_nombre ?? '')}</div>
    <div>${escapar(pedido.cliente_telefono ?? '')}</div>
    ${pedido.direccion ? `<div>${escapar(pedido.direccion)}</div>` : ''}
    ${pedido.nota ? `<div class="nota">${escapar(pedido.nota)}</div>` : ''}
    <div class="pie c">
      ¡Gracias!<br>@${escapar(NEGOCIO.instagram)}
    </div>
  `)
}

/** Cierre de caja / arqueo. */
export function imprimirArqueo(arqueo, detalle = []) {
  lanzar(`
    <div class="c">
      <div class="marca">${escapar(NEGOCIO.nombre.toUpperCase())}</div>
      <div class="g">ARQUEO DE CAJA</div>
    </div>
    <hr>
    <div>Caja: ${escapar(arqueo.caja)}</div>
    <div>Apertura: ${escapar(fechaHora(arqueo.apertura))}</div>
    <div>Cierre: ${arqueo.cierre ? escapar(fechaHora(arqueo.cierre)) : '—'}</div>
    <div>Responsable: ${escapar(arqueo.usuario ?? '-')}</div>
    <hr>
    <table>
      ${detalle.map((d) => `<tr><td>${escapar(d.label)}</td><td class="prec">${pesos(d.valor)}</td></tr>`).join('')}
      <tr><td>Sistema</td><td class="prec">${pesos(arqueo.sistema)}</td></tr>
      <tr><td>Contado</td><td class="prec">${pesos(arqueo.usuario_monto)}</td></tr>
      <tr class="g"><td>DIFERENCIA</td><td class="prec">${pesos((arqueo.usuario_monto || 0) - (arqueo.sistema || 0))}</td></tr>
    </table>
    <div class="pie c">Firma: ______________________</div>
  `)
}

export { nombreCompleto }
