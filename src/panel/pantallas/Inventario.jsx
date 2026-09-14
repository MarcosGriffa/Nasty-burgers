import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { INGREDIENTES, LISTAS_PRECIOS, PRODUCTOS } from '../../data/semillas'
import { costoReceta } from '../../lib/menu'
import EditorProducto from './EditorProducto'
import * as E from '../../lib/estadisticas'
import { aCSV, descargar, normalizar, pesos } from '../../lib/utils'
import { Boton, Buscador, Chip, Encabezado, FilaKpis, Kpi, Modal, Tarjeta, Vacio } from '../comp/ui'

// ------------------------------------------------------------------- STOCK
export function Stock({ ctrl }) {
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)
  const { filas: productos } = useColeccion('productos', PRODUCTOS)
  const [busqueda, setBusqueda] = useState('')
  const [soloAlertas, setSoloAlertas] = useState(false)

  const consumo = useMemo(
    () => E.consumoIngredientes(E.filtrar(ctrl.pedidos, { dias: 30 }), productos),
    [ctrl.pedidos, productos],
  )

  const filas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return ingredientes
      .map((i) => {
        const usado = consumo.get(i.nombre) || 0
        const promedio = usado / 30
        return {
          ...i,
          consumo30: usado,
          promedio,
          dias: promedio > 0 ? Math.floor((i.stock || 0) / promedio) : null,
          valorizado: (Number(i.costo) || 0) * (Number(i.stock) || 0),
          alerta: (i.stock || 0) <= 0 || (i.stock_minimo > 0 && i.stock <= i.stock_minimo),
        }
      })
      .filter((i) => (q ? normalizar(i.nombre).includes(q) : true))
      .filter((i) => (soloAlertas ? i.alerta : true))
      .sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999))
  }, [ingredientes, consumo, busqueda, soloAlertas])

  const valorTotal = filas.reduce((a, i) => a + i.valorizado, 0)
  const enAlerta = filas.filter((i) => i.alerta).length

  return (
    <>
      <Encabezado titulo="Stock" bajada="Consumo calculado con las fichas técnicas y los pedidos de los últimos 30 días.">
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar ingrediente…" />
        <Boton onClick={() => setSoloAlertas((v) => !v)} variante={soloAlertas ? 'primario' : 'ghost'}>
          Solo alertas
        </Boton>
        <Boton
          onClick={() =>
            descargar(
              'stock.csv',
              aCSV(
                [
                  { k: 'nombre', label: 'Ingrediente' },
                  { k: 'stock', label: 'Stock' },
                  { k: 'unidad', label: 'Unidad' },
                  { k: 'consumo30', label: 'Consumo 30 días' },
                  { k: 'dias', label: 'Días restantes' },
                  { k: 'valorizado', label: 'Valorizado' },
                ],
                filas,
                (f, c) => f[c.k],
              ),
            )
          }
        >
          Exportar
        </Boton>
      </Encabezado>

      <FilaKpis cols={3}>
        <Kpi label="Valorizado del stock" valor={pesos(valorTotal)} tono="amber" />
        <Kpi label="Ingredientes en alerta" valor={enAlerta} tono={enAlerta ? 'flame' : undefined} />
        <Kpi label="Ingredientes cargados" valor={ingredientes.length} />
      </FilaKpis>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-white/5">
              {['Ingrediente', 'Stock', 'Consumo 30 d', 'Promedio diario', 'Días restantes', 'Valorizado'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${i ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((i) => (
              <tr key={i.id} className="border-t border-white/5">
                <td className="px-4 py-2.5">
                  <span className="font-bold text-paper">{i.nombre}</span>
                  <span className="ml-2 text-xs text-ash">{i.categoria}</span>
                </td>
                <td className={`px-4 py-2.5 text-right tabular-nums ${i.alerta ? 'text-flame' : 'text-paper'}`}>
                  {Math.round(i.stock)} {i.unidad}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ash">
                  {Math.round(i.consumo30)} {i.unidad}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ash">
                  {i.promedio ? `${i.promedio.toFixed(1)} ${i.unidad}/día` : '-'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {i.dias === null ? (
                    <span className="text-ash">-</span>
                  ) : (
                    <span className={i.dias < 4 ? 'font-bold text-flame' : 'text-paper'}>{i.dias} días</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-amber">{pesos(i.valorizado)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filas.length === 0 && <Vacio>No hay ingredientes que coincidan.</Vacio>}
    </>
  )
}

// -------------------------------------------------------- CONTEO DE INVENTARIO
export function Inventario() {
  const { filas: ingredientes, actualizar } = useColeccion('ingredientes', INGREDIENTES)
  const movimientos = useColeccion('movimientos_stock')
  const [conteo, setConteo] = useState({})
  const [busqueda, setBusqueda] = useState('')
  const [guardado, setGuardado] = useState(null)

  const filas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return ingredientes.filter((i) => (q ? normalizar(i.nombre).includes(q) : true))
  }, [ingredientes, busqueda])

  const conDiferencia = filas.filter((i) => conteo[i.id] !== undefined && conteo[i.id] !== '')

  const aplicar = async () => {
    for (const i of conDiferencia) {
      const real = Number(conteo[i.id])
      const dif = real - (Number(i.stock) || 0)
      if (dif === 0) continue
      await actualizar(i.id, { stock: real })
      await movimientos.crear({
        fecha: new Date().toISOString(),
        ingrediente: i.nombre,
        tipo: 'Ajuste por conteo',
        cantidad: dif,
        unidad: i.unidad,
      })
    }
    setGuardado(conDiferencia.length)
    setConteo({})
  }

  return (
    <>
      <Encabezado
        titulo="Conteo de inventario"
        bajada="Cargá lo que contaste; el sistema calcula la diferencia y ajusta el stock."
      >
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar ingrediente…" />
        <Boton variante="primario" disabled={!conDiferencia.length} onClick={aplicar}>
          Aplicar ajuste ({conDiferencia.length})
        </Boton>
      </Encabezado>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[620px] text-sm">
          <thead>
            <tr className="bg-white/5">
              {['Ingrediente', 'Stock del sistema', 'Contado', 'Diferencia'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${i ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((i) => {
              const real = conteo[i.id]
              const dif = real === undefined || real === '' ? null : Number(real) - (Number(i.stock) || 0)
              return (
                <tr key={i.id} className="border-t border-white/5">
                  <td className="px-4 py-2 font-bold text-paper">{i.nombre}</td>
                  <td className="px-4 py-2 text-right tabular-nums text-ash">
                    {Math.round(i.stock)} {i.unidad}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <input
                      type="number"
                      value={real ?? ''}
                      onChange={(e) => setConteo((c) => ({ ...c, [i.id]: e.target.value }))}
                      placeholder="—"
                      className="w-28 rounded-lg border border-white/15 bg-ink px-3 py-1.5 text-right text-sm text-paper focus:outline-none focus:ring-2 focus:ring-amber"
                    />
                  </td>
                  <td
                    className={`px-4 py-2 text-right tabular-nums ${
                      dif === null ? 'text-ash' : dif < 0 ? 'text-flame' : 'text-[#3ee07f]'
                    }`}
                  >
                    {dif === null ? '-' : `${dif > 0 ? '+' : ''}${Math.round(dif)}`}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {guardado !== null && (
        <Modal titulo="Inventario ajustado" onCerrar={() => setGuardado(null)} ancho="max-w-sm">
          <p className="text-sm text-ash">
            Se ajustaron <span className="font-bold text-paper">{guardado}</span> ingredientes y quedó registrado el
            movimiento.
          </p>
          <Boton variante="primario" className="mt-5 w-full py-3.5" onClick={() => setGuardado(null)}>
            Listo
          </Boton>
        </Modal>
      )}
    </>
  )
}

// ---------------------------------------------------------------- FICHAS
// La receta vive adentro del producto: esta pantalla es el resumen de costos y
// abre el mismo editor que se usa en Productos.
export function Fichas() {
  const { filas: productos, actualizar, eliminar } = useColeccion('productos', PRODUCTOS)
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [soloSinFicha, setSoloSinFicha] = useState(false)

  const filas = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return productos
      .map((p) => {
        const costo = costoReceta(p.receta, ingredientes)
        return {
          ...p,
          ingredientes: p.receta?.length ?? 0,
          costoReceta: costo,
          cmv: p.precio ? Math.round((costo / p.precio) * 1000) / 10 : 0,
        }
      })
      .filter((p) => (q ? normalizar(p.nombre).includes(q) : true))
      .filter((p) => (soloSinFicha ? p.ingredientes === 0 : true))
      .sort((a, b) => b.ingredientes - a.ingredientes)
  }, [productos, ingredientes, busqueda, soloSinFicha])

  const conFicha = productos.filter((p) => p.receta?.length).length

  return (
    <>
      <Encabezado
        titulo="Fichas técnicas"
        bajada="La receta de cada producto. De acá salen el costo real, el descuento de stock y los ingredientes que muestra la web."
      >
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar producto…" />
        <Boton variante={soloSinFicha ? 'primario' : 'ghost'} onClick={() => setSoloSinFicha((v) => !v)}>
          Solo sin receta
        </Boton>
      </Encabezado>

      <FilaKpis cols={3}>
        <Kpi label="Con receta cargada" valor={conFicha} tono="amber" />
        <Kpi label="Sin receta" valor={productos.length - conFicha} tono={productos.length - conFicha ? 'flame' : undefined} />
        <Kpi label="Ingredientes disponibles" valor={ingredientes.length} />
      </FilaKpis>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-white/5">
              {['Producto', 'Categoría', 'Ingredientes', 'Costo receta', 'Precio', 'CMV %'].map((h, i) => (
                <th
                  key={h}
                  className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${i >= 2 ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((p) => (
              <tr
                key={p.id}
                onClick={() => setEditando(p.id)}
                className="cursor-pointer border-t border-white/5 hover:bg-white/5"
              >
                <td className="px-4 py-2.5 font-bold text-paper">{p.nombre}</td>
                <td className="px-4 py-2.5 text-ash">{p.categoria}</td>
                <td className={`px-4 py-2.5 text-right ${p.ingredientes ? 'text-ash' : 'text-flame'}`}>
                  {p.ingredientes || 'sin receta'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-amber">
                  {p.ingredientes ? pesos(p.costoReceta) : '—'}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ash">{pesos(p.precio)}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-ash">
                  {p.ingredientes ? `${p.cmv} %` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filas.length === 0 && <Vacio>No hay productos que coincidan.</Vacio>}
      </div>

      {editando && (
        <EditorProducto
          producto={productos.find((p) => p.id === editando)}
          onCerrar={() => setEditando(null)}
          onEliminar={async () => {
            await eliminar(editando)
            setEditando(null)
          }}
          onGuardar={async (datos) => {
            await actualizar(editando, datos)
            setEditando(null)
          }}
        />
      )}
    </>
  )
}

// --------------------------------------------------------- LISTA DE PRECIOS
export function ListaPrecios() {
  const { filas: listas, crear, actualizar, eliminar } = useColeccion('listas_precios', LISTAS_PRECIOS)
  const { filas: productos } = useColeccion('productos', PRODUCTOS)
  const [selId, setSelId] = useState(null)

  const lista = listas.find((l) => l.id === selId) ?? listas[0]

  const precioModificado = (p) => {
    if (!lista) return p.precio
    return lista.tipo === 'Porcentaje'
      ? Math.round(p.precio * (1 + Number(lista.ajuste) / 100))
      : p.precio + Number(lista.ajuste)
  }

  return (
    <>
      <Encabezado titulo="Lista de precios" bajada="Precios alternativos por canal o promoción.">
        <Boton
          variante="primario"
          onClick={() => crear({ nombre: 'Nueva lista', ajuste: 0, tipo: 'Monto', activa: true })}
        >
          + Nueva lista
        </Boton>
      </Encabezado>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="space-y-2">
          {listas.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelId(l.id)}
              className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                lista?.id === l.id ? 'border-amber bg-amber/10 text-paper' : 'border-white/10 text-ash hover:border-white/30'
              }`}
            >
              <span className="block font-bold">{l.nombre}</span>
              <span className="text-xs">
                {l.tipo === 'Porcentaje' ? `${l.ajuste} %` : pesos(l.ajuste)}
              </span>
            </button>
          ))}
        </aside>

        <div>
          {lista && (
            <Tarjeta className="mb-4">
              <div className="grid gap-3 sm:grid-cols-4">
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-ash">Nombre</span>
                  <input
                    value={lista.nombre}
                    onChange={(e) => actualizar(lista.id, { nombre: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-ink px-3 py-2 text-sm text-paper"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-ash">Tipo</span>
                  <select
                    value={lista.tipo}
                    onChange={(e) => actualizar(lista.id, { tipo: e.target.value })}
                    className="w-full rounded-xl border border-white/15 bg-ink px-3 py-2 text-sm text-paper"
                  >
                    <option>Monto</option>
                    <option>Porcentaje</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-[11px] font-bold uppercase tracking-widest text-ash">Ajuste</span>
                  <input
                    type="number"
                    value={lista.ajuste}
                    onChange={(e) => actualizar(lista.id, { ajuste: Number(e.target.value) })}
                    className="w-full rounded-xl border border-white/15 bg-ink px-3 py-2 text-sm text-paper"
                  />
                </label>
                <div className="flex items-end">
                  <Boton variante="peligro" className="w-full py-2.5" onClick={() => { eliminar(lista.id); setSelId(null) }}>
                    Eliminar lista
                  </Boton>
                </div>
              </div>
            </Tarjeta>
          )}

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-white/5">
                  {['Producto', 'Precio original', 'Precio modificado'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${i ? 'text-right' : 'text-left'}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => (
                  <tr key={p.id} className="border-t border-white/5">
                    <td className="px-4 py-2 text-paper">{p.nombre}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-ash">{pesos(p.precio)}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-amber">{pesos(precioModificado(p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export { Chip }
