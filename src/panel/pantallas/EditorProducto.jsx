import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { CAT_PRODUCTOS, GRUPOS_MODIFICADORES, INGREDIENTES, PROVEEDORES } from '../../data/semillas'
import { cantidadBruta, costoReceta, descripcionAuto, descripcionDe } from '../../lib/menu'
import { normalizar, pesos } from '../../lib/utils'
import Foto from '../../components/Foto'
import { Boton, Chip, Modal, Vacio } from '../comp/ui'

const VACIO = {
  nombre: '',
  codigo: '',
  categoria: '',
  subcategoria: '',
  area: 'Cocina',
  precio: 0,
  costo: 0,
  costo_manual: false,
  descripcion: '',
  img: '',
  receta: [],
  modificadores: [],
  activo: true,
  visible_web: true,
  destacado: false,
  promo: false,
  permitir_vender_solo: true,
  controlar_stock: true,
  vender_sin_stock: true,
  proveedor: '',
}

const input =
  'w-full rounded-xl border border-white/15 bg-ink px-3 py-2.5 text-sm text-paper placeholder:text-ash/60 focus:outline-none focus:ring-2 focus:ring-amber'

function Campo({ label, children, ayuda }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">{label}</span>
      {children}
      {ayuda && <span className="mt-1 block text-[11px] text-ash/80">{ayuda}</span>}
    </label>
  )
}

function Tilde({ label, valor, onChange, ayuda }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 py-2">
      <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#F5B301]" />
      <span>
        <span className="block text-sm text-paper">{label}</span>
        {ayuda && <span className="block text-[11px] text-ash">{ayuda}</span>}
      </span>
    </label>
  )
}

function Bloque({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
      <h3 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.2em] text-amber">{titulo}</h3>
      {children}
    </section>
  )
}

// ------------------------------------------------------------------- receta
function Receta({ receta, ingredientes, onCambiar }) {
  const [buscar, setBuscar] = useState('')

  const disponibles = useMemo(() => {
    const q = normalizar(buscar.trim())
    const usados = new Set(receta.map((l) => l.ingrediente))
    return ingredientes
      .filter((i) => !usados.has(i.nombre))
      .filter((i) => (q ? normalizar(i.nombre).includes(q) : true))
  }, [ingredientes, receta, buscar])

  const set = (idx, cambios) => onCambiar(receta.map((l, i) => (i === idx ? { ...l, ...cambios } : l)))
  const quitar = (idx) => onCambiar(receta.filter((_, i) => i !== idx))
  const agregar = (nombre) => {
    onCambiar([...receta, { ingrediente: nombre, neta: 1, merma: 0, mostrar_web: true }])
    setBuscar('')
  }

  const total = costoReceta(receta, ingredientes)

  return (
    <Bloque titulo="Receta">
      {receta.length === 0 ? (
        <Vacio>Sin receta. Agregá los ingredientes y el costo se calcula solo.</Vacio>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Ingrediente', 'Cant. neta', 'Merma %', 'Cant. bruta', 'Costo', 'Web', ''].map((h, i) => (
                  <th
                    key={h + i}
                    className={`px-2 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                      i >= 1 && i <= 4 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {receta.map((linea, idx) => {
                const ing = ingredientes.find((i) => i.nombre === linea.ingrediente)
                const bruta = cantidadBruta(linea)
                return (
                  <tr key={linea.ingrediente + idx} className="border-b border-white/5">
                    <td className="px-2 py-1.5">
                      <span className="text-paper">{linea.ingrediente}</span>
                      {!ing && <span className="ml-2 text-[10px] text-flame">no existe</span>}
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <input
                          type="number"
                          step="any"
                          value={linea.neta}
                          onChange={(e) => set(idx, { neta: Number(e.target.value) })}
                          className="w-20 rounded-lg border border-white/15 bg-ink px-2 py-1 text-right text-sm text-paper"
                        />
                        <span className="w-8 text-left text-[11px] text-ash">{ing?.unidad ?? ''}</span>
                      </div>
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <input
                        type="number"
                        step="any"
                        value={linea.merma ?? 0}
                        onChange={(e) => set(idx, { merma: Number(e.target.value) })}
                        className="w-16 rounded-lg border border-white/15 bg-ink px-2 py-1 text-right text-sm text-paper"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-ash">
                      {bruta} {ing?.unidad ?? ''}
                    </td>
                    <td className="px-2 py-1.5 text-right tabular-nums text-amber">
                      {pesos(Math.round((Number(ing?.costo) || 0) * bruta))}
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="checkbox"
                        checked={linea.mostrar_web !== false}
                        onChange={(e) => set(idx, { mostrar_web: e.target.checked })}
                        title="Mostrar este ingrediente en la web"
                        className="h-4 w-4 accent-[#F5B301]"
                      />
                    </td>
                    <td className="px-2 py-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => quitar(idx)}
                        aria-label={`Quitar ${linea.ingrediente}`}
                        className="text-ash hover:text-flame"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="px-2 py-3 text-right text-[11px] font-bold uppercase tracking-widest text-ash">
                  Total receta
                </td>
                <td className="px-2 py-3 text-right">
                  <span className="display text-lg text-amber">{pesos(total)}</span>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="mt-4">
        <input
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="+ Agregar ingrediente…"
          className={input}
        />
        {buscar.trim() && (
          <div className="mt-2 max-h-52 overflow-y-auto rounded-xl border border-white/10">
            {disponibles.length === 0 ? (
              <p className="px-3 py-3 text-xs text-ash">No hay ingredientes que coincidan.</p>
            ) : (
              disponibles.slice(0, 25).map((i) => (
                <button
                  key={i.id ?? i.nombre}
                  type="button"
                  onClick={() => agregar(i.nombre)}
                  className="flex w-full items-center justify-between gap-3 border-b border-white/5 px-3 py-2 text-left text-sm last:border-0 hover:bg-white/5"
                >
                  <span className="text-paper">{i.nombre}</span>
                  <span className="text-xs text-ash">
                    {pesos(i.costo || 0)} / {i.unidad}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Bloque>
  )
}

// ------------------------------------------------------------------- editor
export default function EditorProducto({ producto, onGuardar, onEliminar, onCerrar }) {
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)
  const { filas: categorias } = useColeccion('cat_productos', CAT_PRODUCTOS)
  const { filas: grupos } = useColeccion('grupos_modificadores', GRUPOS_MODIFICADORES)
  const { filas: proveedores } = useColeccion('proveedores', PROVEEDORES)

  const [d, setD] = useState(() => ({ ...VACIO, ...(producto ?? {}) }))
  const [error, setError] = useState(null)
  const set = (cambios) => setD((x) => ({ ...x, ...cambios }))

  const costoCalculado = costoReceta(d.receta, ingredientes)
  const costo = d.costo_manual ? Number(d.costo) || 0 : costoCalculado
  const precio = Number(d.precio) || 0
  const margen = precio - costo
  const cmv = precio ? Math.round((costo / precio) * 1000) / 10 : 0
  const markup = costo ? Math.round((margen / costo) * 100) : null

  const descripcionFinal = descripcionDe({ ...d, receta: d.receta }, ingredientes)

  const guardar = () => {
    if (!d.nombre.trim()) return setError('Poné un nombre.')
    if (!d.categoria) return setError('Elegí una categoría.')
    if (!precio) return setError('Poné un precio.')
    onGuardar({ ...d, costo, precio })
  }

  return (
    <Modal
      titulo={producto ? d.nombre || 'Editar producto' : 'Nuevo producto'}
      bajada={producto ? 'Los cambios se ven en la web apenas guardás.' : 'Va a aparecer en la carta apenas lo guardes.'}
      onCerrar={onCerrar}
      ancho="max-w-6xl"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        {/* ------------------------------------------------------ izquierda */}
        <div className="space-y-5">
          <Bloque titulo="Detalles">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Campo label="Nombre *">
                  <input value={d.nombre} onChange={(e) => set({ nombre: e.target.value })} className={input} />
                </Campo>
              </div>
              <Campo label="Categoría *">
                <select value={d.categoria} onChange={(e) => set({ categoria: e.target.value })} className={input}>
                  <option value="">—</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.nombre}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Sub-categoría" ayuda="Simple, Doble o Triple arma las secciones de la carta.">
                <select value={d.subcategoria} onChange={(e) => set({ subcategoria: e.target.value })} className={input}>
                  <option value="">—</option>
                  {['Simple', 'Doble', 'Triple', 'Dark'].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Precio *">
                <input type="number" value={d.precio} onChange={(e) => set({ precio: Number(e.target.value) })} className={input} />
              </Campo>
              <Campo label="Código">
                <input value={d.codigo} onChange={(e) => set({ codigo: e.target.value })} className={input} />
              </Campo>
              <Campo label="Área de impresión">
                <select value={d.area} onChange={(e) => set({ area: e.target.value })} className={input}>
                  {['Cocina', 'Mostrador'].map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Costo">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={d.costo_manual ? d.costo : costoCalculado}
                    disabled={!d.costo_manual}
                    onChange={(e) => set({ costo: Number(e.target.value) })}
                    className={`${input} disabled:opacity-60`}
                  />
                  <Boton onClick={() => set({ costo_manual: !d.costo_manual, costo: costoCalculado })}>
                    {d.costo_manual ? 'Usar receta' : 'A mano'}
                  </Boton>
                </div>
              </Campo>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-white/10 p-3 text-center">
              <div>
                <p className="display text-lg text-paper">{pesos(margen)}</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">Margen</p>
              </div>
              <div>
                <p className="display text-lg text-amber">{cmv} %</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">CMV</p>
              </div>
              <div>
                <p className="display text-lg text-paper">{markup === null ? '—' : `${markup} %`}</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">Markup</p>
              </div>
            </div>
          </Bloque>

          <Bloque titulo="Venta">
            <Tilde label="Activo" valor={d.activo} onChange={(v) => set({ activo: v })} />
            <Tilde
              label="Visible en la web"
              ayuda="Si lo destildás, se sigue pudiendo cargar desde el mostrador pero el cliente no lo ve."
              valor={d.visible_web}
              onChange={(v) => set({ visible_web: v })}
            />
            <Tilde label="Permitir venderlo solo" valor={d.permitir_vender_solo} onChange={(v) => set({ permitir_vender_solo: v })} />
            <Tilde label="Destacado en la home" ayuda="Aparece en «Las que más salen»." valor={d.destacado} onChange={(v) => set({ destacado: v })} />
            <Tilde label="Marcarlo como promo" valor={d.promo} onChange={(v) => set({ promo: v })} />
          </Bloque>

          <Bloque titulo="Qué ven tus clientes">
            <Campo
              label="Descripción"
              ayuda="Si la dejás vacía, la web muestra los ingredientes de la receta."
            >
              <textarea
                rows={3}
                value={d.descripcion}
                onChange={(e) => set({ descripcion: e.target.value })}
                placeholder={descripcionAuto(d.receta, ingredientes) || 'Cargá la receta y se arma sola…'}
                className={`${input} resize-none`}
              />
            </Campo>
            <div className="mt-2 flex flex-wrap gap-2">
              <Boton onClick={() => set({ descripcion: descripcionAuto(d.receta, ingredientes) })} disabled={!d.receta.length}>
                Generar desde la receta
              </Boton>
              {d.descripcion && <Boton onClick={() => set({ descripcion: '' })}>Volver a la automática</Boton>}
            </div>

            <div className="mt-4">
              <Campo
                label="Foto"
                ayuda="Nombre del archivo, con el .jpg. Ya están cargadas nasty, dirty, sick, critical, gross, muddy, stinky y melt, cada una en sus tres tamaños: -s (simple), -d (doble) y -t (triple). Por ejemplo: gross-d.jpg. Para una nueva, dejala en la carpeta img y escribí acá su nombre."
              >
                <input value={d.img} onChange={(e) => set({ img: e.target.value })} placeholder="nasty.jpg" className={input} />
              </Campo>
            </div>
          </Bloque>

          <Bloque titulo="Control de stock">
            <Campo label="Proveedor">
              <select value={d.proveedor} onChange={(e) => set({ proveedor: e.target.value })} className={input}>
                <option value="">—</option>
                {proveedores.map((p) => (
                  <option key={p.id} value={p.nombre}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </Campo>
            <Tilde
              label="Descontar stock al venderlo"
              ayuda="Usa la receta para descontar cada ingrediente."
              valor={d.controlar_stock}
              onChange={(v) => set({ controlar_stock: v })}
            />
            <Tilde label="Vender sin stock" valor={d.vender_sin_stock} onChange={(v) => set({ vender_sin_stock: v })} />
          </Bloque>
        </div>

        {/* -------------------------------------------------------- derecha */}
        <div className="space-y-5">
          <Receta receta={d.receta} ingredientes={ingredientes} onCambiar={(r) => set({ receta: r })} />

          <Bloque titulo="Grupos modificadores">
            <p className="mb-3 text-xs text-ash">
              Asociá grupos para ofrecer opciones al cliente (bebida, extras, papas sí o no).
            </p>
            <div className="flex flex-wrap gap-2">
              {grupos.map((g) => {
                const puesto = (d.modificadores ?? []).includes(g.nombre)
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() =>
                      set({
                        modificadores: puesto
                          ? d.modificadores.filter((x) => x !== g.nombre)
                          : [...(d.modificadores ?? []), g.nombre],
                      })
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                      puesto ? 'border-amber bg-amber text-ink' : 'border-white/15 text-ash hover:text-paper'
                    }`}
                  >
                    {g.nombre}
                  </button>
                )
              })}
            </div>
          </Bloque>

          <Bloque titulo="Así se va a ver en la web">
            <article className="flex gap-4 rounded-2xl border border-white/10 bg-ink p-3">
              <Foto img={d.img} alt={d.nombre} className="h-24 w-24 shrink-0 rounded-xl" />
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="display text-lg text-paper">{d.nombre || 'Sin nombre'}</h4>
                  {d.promo ? <Chip tono="alerta">Promo</Chip> : d.destacado ? <Chip tono="aviso">Top</Chip> : null}
                </div>
                <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ash">
                  {descripcionFinal || 'Sin descripción todavía.'}
                </p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <span className="display text-lg text-amber">{pesos(precio)}</span>
                  <span className="rounded-full bg-amber px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-widest text-ink">
                    Agregar
                  </span>
                </div>
              </div>
            </article>
            {!d.visible_web && (
              <p className="mt-3 text-xs text-flame">Ahora mismo está oculto en la web (Venta → Visible en la web).</p>
            )}
          </Bloque>
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-flame/10 px-4 py-3 text-sm text-flame">{error}</p>}

      <div className="mt-6 flex flex-wrap gap-2">
        <Boton variante="primario" className="px-8 py-3.5" onClick={guardar}>
          Guardar
        </Boton>
        <Boton className="py-3.5" onClick={onCerrar}>
          Cancelar
        </Boton>
        {producto && onEliminar && (
          <Boton variante="peligro" className="ml-auto py-3.5" onClick={onEliminar}>
            Eliminar producto
          </Boton>
        )}
      </div>
    </Modal>
  )
}
