export const pesos = (n) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)

export const linkWhatsapp = (numero, texto) =>
  `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`

// Quita tildes y pasa a minusculas, para que el buscador sea tolerante.
export const normalizar = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

// "Nasty" en la categoria Dobles se muestra como "Nasty Doble" en el carrito
// y en el mensaje de WhatsApp, para que no queden pedidos ambiguos.
export const nombreCompleto = (item) =>
  ['simples', 'dobles', 'triples'].includes(item.categoriaId)
    ? `${item.nombre} ${item.categoriaNombre.slice(0, -1)}`
    : item.nombre

export const soloDigitos = (s) => (s || '').replace(/\D/g, '')

/** 11 4094 0880 -> 5491140940880 (formato que espera wa.me en Argentina) */
export const telefonoWhatsapp = (tel) => {
  let d = soloDigitos(tel)
  if (d.startsWith('54')) return d.startsWith('549') ? d : `549${d.slice(2)}`
  if (d.startsWith('0')) d = d.slice(1)
  if (d.startsWith('15')) d = d.slice(2)
  return `549${d}`
}

export const hora = (iso) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export const minutosDesde = (iso) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))

// --------------------------------------------------------------------- fechas
export const fechaCorta = (iso) =>
  new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })

export const fechaHora = (iso) =>
  new Date(iso).toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

export const inicioDelDia = (d = new Date()) => {
  const f = new Date(d)
  f.setHours(0, 0, 0, 0)
  return f
}

/** "hace 12 min" */
export function haceCuanto(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  return `hace ${h} h ${min % 60} min`
}

/** Numero corto para los ejes de los graficos: 1.2 M, 340 k */
export const numeroCorto = (n) => {
  const a = Math.abs(n)
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} M`
  if (a >= 1_000) return `${Math.round(n / 1000)} k`
  return String(Math.round(n))
}

export const aCSV = (columnas, filas, obtener) => {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const cab = columnas.map((c) => esc(c.label)).join(';')
  const cuerpo = filas.map((f) => columnas.map((c) => esc(obtener(f, c))).join(';'))
  return [cab, ...cuerpo].join('\n')
}

export function descargar(nombre, contenido, tipo = 'text/csv;charset=utf-8') {
  const blob = new Blob([`﻿${contenido}`], { type: tipo })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
