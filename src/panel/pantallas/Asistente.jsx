import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { PRODUCTOS, DESCUENTOS, INGREDIENTES, GRUPOS_MODIFICADORES } from '../../data/semillas'
import {
  camposDelCambio,
  camposParaDeshacer,
  contextoDelNegocio,
  describir,
  esDePrecio,
  interpretarIA,
  interpretarLocal,
  REDONDEOS,
  simular,
  validar,
} from '../../lib/asistente'
import { fechaHora, pesos } from '../../lib/utils'
import { Boton, Chip, Encabezado, FilaKpis, Kpi, Tarjeta, Vacio } from '../comp/ui'

const EJEMPLOS = [
  'Subí todas las hamburguesas un 10%',
  'Las gaseosas 2000 pesos menos',
  'Agregale bacon a la Nasty Doble',
  'Sacale pickles a la Sick Doble',
  'Que las simples también ofrezcan el grupo Extras',
  'Dejá las papas en $5.000',
]

export default function Asistente() {
  const { filas: productos, actualizar } = useColeccion('productos', PRODUCTOS)
  const { filas: descuentos, actualizar: actualizarDescuento } = useColeccion('descuentos', DESCUENTOS)
  const { filas: ingredientes } = useColeccion('ingredientes', INGREDIENTES)
  const { filas: grupos } = useColeccion('grupos_modificadores', GRUPOS_MODIFICADORES)
  const historial = useColeccion('historial_precios')

  const [texto, setTexto] = useState('')
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState(null)
  const [plan, setPlan] = useState(null)
  const [redondeo, setRedondeo] = useState('50')

  const catalogo = useMemo(() => ({ ingredientes, grupos }), [ingredientes, grupos])

  const cambios = useMemo(
    () => (plan ? simular({ ...plan, redondeo }, productos, catalogo) : []),
    [plan, redondeo, productos, catalogo],
  )

  const dePrecio = plan ? esDePrecio(plan.operacion) : false

  const interpretar = async (frase) => {
    const consulta = (frase ?? texto).trim()
    if (!consulta) return
    setError(null)
    setPlan(null)

    // 1) Primero se intenta resolver sin IA. Gratis y sin internet.
    const local = interpretarLocal(consulta, productos, catalogo)
    if (local) {
      const problema = validar(local, catalogo)
      if (problema) return setError(problema)
      setRedondeo(local.redondeo ?? 'ninguno')
      setPlan({ ...local, resumen: consulta })
      return
    }

    // 2) Si la frase es más rebuscada, ahí sí se le pregunta al modelo.
    setPensando(true)
    try {
      const p = await interpretarIA(
        consulta,
        contextoDelNegocio(productos, descuentos, ingredientes, grupos),
      )
      if (p.operacion === 'ninguna') {
        setError(p.aclaracion || 'No entendí el pedido. Probá diciéndolo de otra forma.')
        return
      }
      const problema = validar(p, catalogo)
      if (problema) return setError(problema)
      setRedondeo(p.redondeo ?? 'ninguno')
      setPlan(p)
    } catch (e) {
      setError(
        e.message === 'sin-ia'
          ? 'Con las reglas de siempre no me alcanza para esa frase, y la IA todavía no está encendida. Decilo más directo — «subí las hamburguesas un 10%», «agregale bacon a la Critical Doble», «dejá las papas en $5.000» — o cargá la clave en Configuración → Asistente IA para que entienda cualquier forma de pedirlo.'
          : e.message === 'clave-mala'
            ? 'La clave de Gemini no es válida. Revisala en Configuración → Asistente IA.'
            : e.message || 'La IA no respondió. Probá de nuevo en un momento.',
      )
    } finally {
      setPensando(false)
    }
  }

  const aplicar = async () => {
    if (plan.operacion === 'activar_promo' || plan.operacion === 'desactivar_promo') {
      const d = descuentos.find((x) => x.nombre === plan.nombre_promo)
      if (d) await actualizarDescuento(d.id, { activo: plan.operacion === 'activar_promo' })
    } else {
      for (const c of cambios) await actualizar(c.id, camposDelCambio(c, ingredientes))
    }
    await historial.crear({
      fecha: new Date().toISOString(),
      pedido: plan.resumen,
      detalle: describir({ ...plan, redondeo }, cambios),
      fuente: plan.fuente,
      cambios,
      deshecho: false,
    })
    setPlan(null)
    setTexto('')
  }

  const deshacer = async (entrada) => {
    for (const c of entrada.cambios ?? []) {
      // Las entradas viejas del historial no traen `campo`: eran todas de precio.
      await actualizar(c.id, camposParaDeshacer({ campo: 'precio', ...c }, ingredientes))
    }
    await historial.actualizar(entrada.id, { deshecho: true })
  }

  const ordenado = [...historial.filas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  const subaPromedio = dePrecio && cambios.length
    ? Math.round(
        (cambios.reduce((a, c) => a + (c.despues - c.antes) / (c.antes || 1), 0) / cambios.length) * 1000,
      ) / 10
    : 0

  // Lo que sube o baja el costo cuando el cambio es de receta.
  const difCosto = cambios.reduce((a, c) => a + ((c.costoDespues ?? 0) - (c.costoAntes ?? 0)), 0)

  return (
    <>
      <Encabezado
        titulo="Asistente"
        bajada="Pedile el cambio en castellano: precios, recetas o qué puede elegir el cliente. Antes de tocar nada te muestra exactamente qué va a pasar."
      />

      <Tarjeta className="mb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            interpretar()
          }}
          className="flex flex-wrap gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Ej: agregale cebolla crispy a todas las dobles"
            className="min-w-[240px] flex-1 rounded-full border border-white/15 bg-ink px-5 py-3.5 text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber"
          />
          <Boton type="submit" variante="primario" className="px-7 py-3.5" disabled={pensando || !texto.trim()}>
            {pensando ? 'Pensando…' : 'Ver qué cambia'}
          </Boton>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setTexto(e)
                interpretar(e)
              }}
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-ash transition-colors hover:border-amber hover:text-amber"
            >
              {e}
            </button>
          ))}
        </div>

        {error && <p className="mt-4 rounded-xl bg-flame/10 px-4 py-3 text-sm text-flame">{error}</p>}
      </Tarjeta>

      {plan && (
        <Tarjeta
          className="mb-5 border-amber/40"
          titulo="Antes de aplicar"
          extra={
            <Chip tono={plan.fuente === 'ia' ? 'aviso' : 'ok'}>
              {plan.fuente === 'ia' ? 'Resuelto con IA' : 'Resuelto sin IA'}
            </Chip>
          }
        >
          <p className="text-sm text-paper">{plan.resumen}</p>
          <p className="display mt-1 text-2xl text-amber">{describir({ ...plan, redondeo }, cambios)}</p>

          {cambios.length === 0 ? (
            <p className="mt-4 rounded-xl bg-flame/10 px-4 py-3 text-sm text-flame">
              Ese cambio no afecta a ningún producto — o ya está así. Revisá a qué te referías.
            </p>
          ) : (
            <>
              {dePrecio ? (
                <FilaKpis cols={3}>
                  <Kpi label="Productos afectados" valor={cambios.length} />
                  <Kpi label="Variación promedio" valor={`${subaPromedio > 0 ? '+' : ''}${subaPromedio} %`} tono="amber" />
                  <Kpi
                    label="Precio promedio nuevo"
                    valor={pesos(Math.round(cambios.reduce((a, c) => a + c.despues, 0) / cambios.length))}
                  />
                </FilaKpis>
              ) : (
                <FilaKpis cols={2}>
                  <Kpi label="Productos afectados" valor={cambios.length} />
                  <Kpi
                    label="Impacto en el costo"
                    valor={`${difCosto >= 0 ? '+' : ''}${pesos(Math.round(difCosto))}`}
                    tono="amber"
                  />
                </FilaKpis>
              )}

              {dePrecio && (
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-ash">Redondear</span>
                  {REDONDEOS.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRedondeo(r.id)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                        redondeo === r.id ? 'border-amber bg-amber text-ink' : 'border-white/15 text-ash hover:text-paper'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              )}

              <div className="max-h-80 overflow-y-auto rounded-2xl border border-white/10">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-ink-2">
                    <tr>
                      {(dePrecio
                        ? ['Producto', 'Antes', 'Después', 'Dif.']
                        : ['Producto', 'Qué cambia', 'Costo antes', 'Costo después']
                      ).map((h, i) => (
                        <th
                          key={h}
                          className={`px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                            i && dePrecio ? 'text-right' : i >= 2 ? 'text-right' : 'text-left'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cambios.map((c) =>
                      dePrecio ? (
                        <tr key={c.id} className="border-t border-white/5">
                          <td className="px-4 py-2 text-paper">{c.nombre}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-ash line-through">{pesos(c.antes)}</td>
                          <td className="px-4 py-2 text-right tabular-nums font-bold text-amber">{pesos(c.despues)}</td>
                          <td
                            className={`px-4 py-2 text-right tabular-nums ${
                              c.despues > c.antes ? 'text-[#3ee07f]' : 'text-flame'
                            }`}
                          >
                            {c.despues > c.antes ? '+' : ''}
                            {pesos(c.despues - c.antes)}
                          </td>
                        </tr>
                      ) : (
                        <tr key={c.id} className="border-t border-white/5">
                          <td className="px-4 py-2 text-paper">{c.nombre}</td>
                          <td className="px-4 py-2 text-amber">{c.detalle}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-ash">
                            {c.campo === 'receta' ? pesos(Math.round(c.costoAntes)) : '—'}
                          </td>
                          <td className="px-4 py-2 text-right tabular-nums text-paper">
                            {c.campo === 'receta' ? pesos(Math.round(c.costoDespues)) : '—'}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {!dePrecio && plan.operacion !== 'quitar_modificador' && (
                <p className="mt-3 text-xs text-ash">
                  El precio de venta no se toca. Si querés cobrarlo, pedímelo aparte.
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                <Boton variante="primario" className="px-8 py-3.5" onClick={aplicar}>
                  {cambios.length === 1 ? 'Aplicar el cambio' : `Aplicar los ${cambios.length} cambios`}
                </Boton>
                <Boton className="py-3.5" onClick={() => setPlan(null)}>
                  Cancelar
                </Boton>
              </div>
            </>
          )}
        </Tarjeta>
      )}

      <Tarjeta titulo="Historial de cambios">
        {ordenado.length === 0 ? (
          <Vacio>Todavía no se hizo ningún cambio desde acá.</Vacio>
        ) : (
          <ul className="space-y-2">
            {ordenado.map((h) => (
              <li
                key={h.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 ${
                  h.deshecho ? 'opacity-50' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-sm text-paper">{h.detalle}</p>
                  <p className="text-xs text-ash">
                    {fechaHora(h.fecha)} · «{h.pedido}»
                    {h.deshecho && <span className="ml-2 text-flame">deshecho</span>}
                  </p>
                </div>
                {!h.deshecho && (
                  <Boton onClick={() => deshacer(h)} className="py-2">
                    Deshacer
                  </Boton>
                )}
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </>
  )
}
