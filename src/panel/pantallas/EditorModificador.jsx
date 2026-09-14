import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { INGREDIENTES, PRODUCTOS } from '../../data/semillas'
import { pesos } from '../../lib/utils'
import { Boton, Modal, Vacio } from '../comp/ui'

/**
 * El editor de un grupo de opciones: «Papas», «Extras», «Sin qué».
 *
 * Lo importante acá son las opciones, y cada opción puede descontar un
 * ingrediente (las papas sazonadas se llevan 8 g de Sazonado Nasty). Por eso no
 * alcanza con el formulario genérico: hace falta una tabla propia.
 */

const VACIO = {
  nombre: '',
  bajada: '',
  minimo: 0,
  maximo: 1,
  opciones: [],
}

const input =
  'w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-ash/60 focus:outline-none focus:ring-2 focus:ring-amber'

function Campo({ label, children, ayuda }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">
        {label}
      </span>
      {children}
      {ayuda && <span className="mt-1 block text-[11px] text-ash/80">{ayuda}</span>}
    </label>
  )
}

function Bloque({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
      <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

export default function EditorModificador({ grupo, onGuardar, onEliminar, onCerrar }) {
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)
  const { filas: productos } = useColeccion('productos', PRODUCTOS)

  const [d, setD] = useState(() => ({ ...VACIO, ...(grupo ?? {}), opciones: grupo?.opciones ?? [] }))
  const [error, setError] = useState(null)
  const set = (cambios) => setD((x) => ({ ...x, ...cambios }))

  // Los productos que hoy ofrecen este grupo. Sirve para no borrar sin querer
  // algo que están usando 28 hamburguesas.
  const usanEsto = useMemo(
    () => productos.filter((p) => (p.modificadores ?? []).includes(grupo?.nombre)),
    [productos, grupo],
  )

  const setOp = (idx, cambios) =>
    set({ opciones: d.opciones.map((o, i) => (i === idx ? { ...o, ...cambios } : o)) })
  const quitarOp = (idx) => set({ opciones: d.opciones.filter((_, i) => i !== idx) })
  const agregarOp = () =>
    set({ opciones: [...d.opciones, { nombre: '', precio: 0, ingrediente: '', cantidad: 0 }] })
  const mover = (idx, paso) => {
    const j = idx + paso
    if (j < 0 || j >= d.opciones.length) return
    const copia = [...d.opciones]
    ;[copia[idx], copia[j]] = [copia[j], copia[idx]]
    set({ opciones: copia })
  }

  const guardar = () => {
    if (!d.nombre.trim()) return setError('Poné un nombre al grupo.')
    if (!d.opciones.length) return setError('Un grupo sin opciones no le muestra nada al cliente.')
    if (d.opciones.some((o) => !o.nombre.trim())) return setError('Hay una opción sin nombre.')
    const maximo = Number(d.maximo) || 1
    const minimo = Number(d.minimo) || 0
    if (minimo > maximo) return setError('El mínimo no puede ser mayor que el máximo.')
    onGuardar({
      ...d,
      minimo,
      maximo,
      // se limpian los campos vacíos para que la opción no arrastre basura
      opciones: d.opciones.map((o) => ({
        nombre: o.nombre.trim(),
        precio: Number(o.precio) || 0,
        ...(o.ingrediente ? { ingrediente: o.ingrediente, cantidad: Number(o.cantidad) || 0 } : {}),
      })),
    })
  }

  const obligatorio = (Number(d.minimo) || 0) >= 1

  return (
    <Modal
      titulo={grupo ? d.nombre || 'Editar grupo' : 'Nuevo grupo de opciones'}
      bajada="Lo que el cliente elige antes de agregar el producto al pedido."
      onCerrar={onCerrar}
      ancho="max-w-4xl"
    >
      <div className="space-y-5">
        <Bloque titulo="El grupo">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo label="Nombre *" ayuda="Es el título que ve el cliente: Papas, Extras, Sin qué.">
                <input
                  value={d.nombre}
                  onChange={(e) => set({ nombre: e.target.value })}
                  className={input}
                />
              </Campo>
            </div>
            <div className="sm:col-span-2">
              <Campo label="Bajada" ayuda="Una línea de aclaración abajo del título. Opcional.">
                <input
                  value={d.bajada ?? ''}
                  onChange={(e) => set({ bajada: e.target.value })}
                  placeholder="Todas las burgas vienen con papas. Elegí cómo las querés."
                  className={input}
                />
              </Campo>
            </div>
            <Campo
              label="Cantidad mínima"
              ayuda={obligatorio ? 'Obligatorio: no puede agregar sin elegir.' : 'Opcional: puede no elegir nada.'}
            >
              <input
                type="number"
                min="0"
                value={d.minimo}
                onChange={(e) => set({ minimo: Number(e.target.value) })}
                className={input}
              />
            </Campo>
            <Campo
              label="Cantidad máxima"
              ayuda={(Number(d.maximo) || 1) === 1 ? 'Elige una sola (redondeles).' : 'Puede marcar varias.'}
            >
              <input
                type="number"
                min="1"
                value={d.maximo}
                onChange={(e) => set({ maximo: Number(e.target.value) })}
                className={input}
              />
            </Campo>
          </div>
        </Bloque>

        <Bloque titulo="Opciones">
          {d.opciones.length === 0 ? (
            <Vacio>Todavía no hay opciones. Agregá la primera.</Vacio>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    {['Opción', 'Precio extra', 'Descuenta', 'Cantidad', ''].map((h, i) => (
                      <th
                        key={h + i}
                        className={`px-2 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                          i === 1 || i === 3 ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {d.opciones.map((o, idx) => {
                    const ing = ingredientes.find((i) => i.nombre === o.ingrediente)
                    return (
                      <tr key={idx} className="border-b border-white/5">
                        <td className="px-2 py-1.5">
                          <input
                            value={o.nombre}
                            onChange={(e) => setOp(idx, { nombre: e.target.value })}
                            placeholder="Papas sazonadas"
                            className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1 text-sm text-paper"
                          />
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <input
                            type="number"
                            step="any"
                            value={o.precio ?? 0}
                            onChange={(e) => setOp(idx, { precio: Number(e.target.value) })}
                            className="w-24 rounded-lg border border-white/15 bg-ink px-2 py-1 text-right text-sm text-paper"
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <select
                            value={o.ingrediente ?? ''}
                            onChange={(e) => setOp(idx, { ingrediente: e.target.value })}
                            className="w-full rounded-lg border border-white/15 bg-ink px-2 py-1 text-sm text-paper"
                          >
                            <option value="">— nada —</option>
                            {ingredientes.map((i) => (
                              <option key={i.id ?? i.nombre} value={i.nombre}>
                                {i.nombre}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-2 py-1.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="any"
                              disabled={!o.ingrediente}
                              value={o.cantidad ?? 0}
                              onChange={(e) => setOp(idx, { cantidad: Number(e.target.value) })}
                              className="w-20 rounded-lg border border-white/15 bg-ink px-2 py-1 text-right text-sm text-paper disabled:opacity-40"
                            />
                            <span className="w-8 text-left text-[11px] text-ash">
                              {ing?.unidad ?? ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-2 py-1.5">
                          <div className="flex justify-end gap-1 text-ash">
                            <button
                              type="button"
                              onClick={() => mover(idx, -1)}
                              aria-label="Subir"
                              className="px-1 hover:text-paper"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => mover(idx, 1)}
                              aria-label="Bajar"
                              className="px-1 hover:text-paper"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => quitarOp(idx)}
                              aria-label="Quitar opción"
                              className="px-1 hover:text-flame"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Boton onClick={agregarOp}>+ Agregar opción</Boton>
            <p className="text-[11px] text-ash">
              Si el grupo es obligatorio, la primera de la lista viene marcada de entrada.
              «Descuenta» saca ese ingrediente del stock cuando aceptás el pedido.
            </p>
          </div>
        </Bloque>

        {grupo && (
          <Bloque titulo={`Lo usan ${usanEsto.length} productos`}>
            {usanEsto.length === 0 ? (
              <Vacio>Ningún producto lo ofrece todavía. Se asocia desde la ficha del producto.</Vacio>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {usanEsto.slice(0, 40).map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-ash"
                  >
                    {p.nombre}
                  </span>
                ))}
                {usanEsto.length > 40 && (
                  <span className="px-2 py-1 text-[11px] text-ash">y {usanEsto.length - 40} más</span>
                )}
              </div>
            )}
          </Bloque>
        )}

        <Bloque titulo="Así lo ve el cliente">
          <p className="text-sm font-bold text-paper">{d.nombre || 'Sin nombre'}</p>
          {d.bajada && <p className="mt-0.5 text-xs text-ash">{d.bajada}</p>}
          <div className="mt-2 space-y-1.5">
            {d.opciones.map((o, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  obligatorio && i === 0 ? 'border-amber bg-amber/10' : 'border-white/15'
                }`}
              >
                <span
                  className={`h-4 w-4 shrink-0 border border-white/40 ${
                    (Number(d.maximo) || 1) === 1 ? 'rounded-full' : 'rounded'
                  } ${obligatorio && i === 0 ? 'bg-amber' : ''}`}
                />
                <span className="flex-1 text-sm text-paper">{o.nombre || '—'}</span>
                {Number(o.precio) > 0 && (
                  <span className="text-sm font-bold text-amber">+{pesos(Number(o.precio))}</span>
                )}
              </div>
            ))}
          </div>
        </Bloque>
      </div>

      {error && <p className="mt-4 rounded-xl bg-flame/10 px-4 py-3 text-sm text-flame">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Boton variante="primario" className="px-8 py-3.5" onClick={guardar}>
          Guardar
        </Boton>
        <Boton className="py-3.5" onClick={onCerrar}>
          Cancelar
        </Boton>
        {grupo && onEliminar && (
          <Boton variante="peligro" className="ml-auto py-3.5" onClick={onEliminar}>
            Eliminar grupo
          </Boton>
        )}
      </div>
    </Modal>
  )
}
