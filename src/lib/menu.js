import { useMemo } from 'react'
import { useColeccion } from './almacen'
import { CAT_PRODUCTOS, INGREDIENTES, PRODUCTOS } from '../data/semillas'

/**
 * El menú que ve el cliente sale de la MISMA tabla de productos que edita el
 * empleado en el panel. Si el panel agrega una hamburguesa nueva, aparece en la
 * web; si le cambia el precio o la receta, cambia en la web.
 */

// Ingredientes que no se le cuentan al cliente: envases, bolsas, gas, aceite.
const NO_SE_MUESTRAN = ['Papelería', 'Cocinar']

const SUBCATS = ['Simple', 'Doble', 'Triple']

/** Cantidad bruta = neta + merma. Es lo que realmente se consume. */
export const cantidadBruta = (linea) =>
  Math.round((Number(linea.neta) || 0) * (1 + (Number(linea.merma) || 0) / 100) * 1000) / 1000

/** Costo de una receta según el precio actual de cada ingrediente. */
export function costoReceta(receta = [], ingredientes = []) {
  return Math.round(
    receta.reduce((total, l) => {
      const ing = ingredientes.find((i) => i.nombre === l.ingrediente)
      return total + (Number(ing?.costo) || 0) * cantidadBruta(l)
    }, 0),
  )
}

/**
 * La descripción que ve el cliente. Si el empleado escribió una a mano, esa
 * manda. Si no, se arma sola con los ingredientes de la receta — que es
 * justamente lo que se quiere: cargás la receta y la web ya la muestra.
 */
export function descripcionAuto(receta = [], ingredientes = []) {
  const partes = receta
    .filter((l) => l.mostrar_web !== false)
    .filter((l) => {
      const ing = ingredientes.find((i) => i.nombre === l.ingrediente)
      return !NO_SE_MUESTRAN.includes(ing?.categoria)
    })
    .map((l) => {
      const n = cantidadBruta(l)
      const ing = ingredientes.find((i) => i.nombre === l.ingrediente)
      // "Cheddar en fetas x2" queda mejor que "2 un. de Cheddar en fetas"
      if (ing?.unidad === 'un.' && n > 1) return `${l.ingrediente} x${Math.round(n)}`
      return l.ingrediente
    })
  return partes.length ? `${partes.join(' + ')}.` : ''
}

export const descripcionDe = (producto, ingredientes) =>
  producto.descripcion?.trim() || descripcionAuto(producto.receta, ingredientes)

/** "Nasty Doble" dentro de la sección "Dobles" se muestra como "Nasty". */
export const nombreCorto = (nombre, subcategoria) =>
  subcategoria && nombre.endsWith(` ${subcategoria}`)
    ? nombre.slice(0, -(subcategoria.length + 1))
    : nombre

const slug = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Arma las secciones de la carta pública. Las categorías que usan
 * subcategorías (Simple / Doble / Triple) se abren en una sección por cada una,
 * igual que en la carta de hoy.
 */
export function armarMenu(productos, categorias, ingredientes) {
  const activos = productos.filter((p) => p.activo !== false && p.visible_web !== false)
  const orden = new Map(categorias.map((c, i) => [c.nombre, i]))

  const secciones = []

  const porCategoria = new Map()
  activos.forEach((p) => {
    const k = p.categoria || 'Otros'
    if (!porCategoria.has(k)) porCategoria.set(k, [])
    porCategoria.get(k).push(p)
  })

  const catsOrdenadas = [...porCategoria.entries()].sort(
    (a, b) => (orden.get(a[0]) ?? 99) - (orden.get(b[0]) ?? 99),
  )

  const item = (p) => ({
    id: p.id,
    codigo: p.codigo,
    nombre: p.nombre,
    nombreCorto: nombreCorto(p.nombre, p.subcategoria),
    desc: descripcionDe(p, ingredientes),
    precio: Number(p.precio) || 0,
    img: p.img,
    destacado: !!p.destacado,
    promo: !!p.promo,
    categoriaId: slug(p.categoria || 'otros'),
    categoriaNombre: p.categoria,
    subcategoria: p.subcategoria,
  })

  catsOrdenadas.forEach(([nombreCat, lista]) => {
    const conSub = lista.filter((p) => SUBCATS.includes(p.subcategoria))
    const sinSub = lista.filter((p) => !SUBCATS.includes(p.subcategoria))

    if (sinSub.length) {
      secciones.push({
        id: slug(nombreCat),
        nombre: nombreCat,
        bajada: categorias.find((c) => c.nombre === nombreCat)?.bajada ?? '',
        items: sinSub.map(item),
      })
    }

    SUBCATS.forEach((sub) => {
      const delSub = conSub.filter((p) => p.subcategoria === sub)
      if (!delSub.length) return
      secciones.push({
        id: slug(`${nombreCat}-${sub}`),
        nombre: `${sub}s`,
        bajada:
          sub === 'Simple'
            ? 'Un medallón. Todas con papas fritas.'
            : sub === 'Doble'
              ? 'Dos medallones. Todas con papas fritas.'
              : 'Tres medallones. Para valientes.',
        items: delSub.map(item),
      })
    })
  })

  return secciones
}

/** Hook que usan la web pública y el panel para leer la carta vigente. */
export function useMenuPublico() {
  const { filas: productos, cargando } = useColeccion('productos', PRODUCTOS)
  const { filas: categorias } = useColeccion('cat_productos', CAT_PRODUCTOS)
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)

  const secciones = useMemo(
    () => armarMenu(productos, categorias, ingredientes),
    [productos, categorias, ingredientes],
  )

  const todos = useMemo(() => secciones.flatMap((s) => s.items), [secciones])

  return { secciones, todos, productos, ingredientes, cargando }
}
