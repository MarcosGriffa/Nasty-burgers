import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { CAJAS, MEDIOS_PAGO, USUARIOS } from '../../data/semillas'
import { calcularArqueo, diferenciaDe, mediosDelArqueo, totalDeclarado } from '../../lib/arqueo'
import { fechaHora, pesos } from '../../lib/utils'
import { imprimirArqueo } from '../../lib/imprimir'
import { usuarioActual } from '../../lib/pedidos'
import { Boton, Chip, Encabezado, FilaKpis, Kpi, Modal, Tarjeta, Vacio } from '../comp/ui'

const campoBase =
  'rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper focus:outline-none focus:ring-2 focus:ring-amber'
const campo = `w-full ${campoBase}`
// Sin `w-full`: en la grilla del cierre el ancho lo pone la columna. Mezclarlo
// con w-full hacía que el input se comiera la fila y el nombre de la forma de
// cobro quedara fuera del modal.

/** Una fila de plata: etiqueta a la izquierda, numero a la derecha. */
function Fila({ label, valor, tono, fuerte = false, borde = true }) {
  return (
    <div className={`flex items-baseline justify-between py-2 ${borde ? 'border-b border-white/5' : ''}`}>
      <span className={fuerte ? 'font-bold text-paper' : 'text-sm text-ash'}>{label}</span>
      <span
        className={`tabular-nums ${
          fuerte ? 'display text-xl' : 'text-sm'
        } ${tono === 'amber' ? 'text-amber' : tono === 'flame' ? 'text-flame' : tono === 'ok' ? 'text-[#3ee07f]' : 'text-paper'}`}
      >
        {valor}
      </span>
    </div>
  )
}

/** El cartel de la diferencia, que es lo primero que mira el encargado. */
function Diferencia({ monto }) {
  const tono = monto < 0 ? 'border-flame/40 bg-flame/10 text-flame' : monto > 0 ? 'border-[#3ee07f]/40 bg-[#3ee07f]/10 text-[#3ee07f]' : 'border-white/15 bg-white/5 text-ash'
  return (
    <div className={`mt-4 flex items-baseline justify-between rounded-xl border px-4 py-3 ${tono}`}>
      <span className="text-[11px] font-extrabold uppercase tracking-widest">Diferencia</span>
      <span className="display text-2xl tabular-nums">{pesos(monto)}</span>
    </div>
  )
}

export function Arqueos({ ctrl }) {
  const { filas: arqueos, crear, actualizar } = useColeccion('arqueos')
  const { filas: movimientos } = useColeccion('movimientos_caja')
  const { filas: cajas } = useColeccion('cajas', CAJAS)
  const { filas: usuarios } = useColeccion('usuarios', USUARIOS)
  const { filas: medios } = useColeccion('medios_pago', MEDIOS_PAGO)

  const [abriendo, setAbriendo] = useState(false)
  const [montoInicial, setMontoInicial] = useState('')
  const [cerrando, setCerrando] = useState(null)
  const [declarado, setDeclarado] = useState({})
  const [detalle, setDetalle] = useState(null)
  const [vista, setVista] = useState('cajas')

  const formas = useMemo(() => mediosDelArqueo(medios), [medios])

  const abierta = arqueos.find((a) => !a.cierre)
  const cerradas = useMemo(
    () => arqueos.filter((a) => a.cierre).sort((a, b) => new Date(b.cierre) - new Date(a.cierre)),
    [arqueos],
  )

  const sistemaActual = abierta
    ? calcularArqueo(abierta, ctrl.pedidos, movimientos, medios)
    : null

  const confirmarApertura = async () => {
    await crear({
      caja: cajas.find((c) => c.activa !== false)?.nombre ?? 'Principal',
      apertura: new Date().toISOString(),
      cierre: null,
      // El monto inicial es efectivo: son los billetes con los que arranca el
      // turno, y por eso cuentan para lo que tiene que haber al cerrar.
      monto_inicial: Number(montoInicial) || 0,
      usuario: usuarioActual() ?? usuarios[0]?.nombre ?? '',
      cerrado_por: null,
      declarado: {},
      sistema: 0,
      usuario_monto: 0,
      conciliado: false,
    })
    setAbriendo(false)
    setMontoInicial('')
  }

  const confirmarCierre = async () => {
    const s = calcularArqueo(cerrando, ctrl.pedidos, movimientos, medios)
    const limpio = Object.fromEntries(
      formas.map((m) => [m.nombre, Number(declarado[m.nombre]) || 0]),
    )
    await actualizar(cerrando.id, {
      cierre: new Date().toISOString(),
      cerrado_por: usuarioActual() ?? cerrando.usuario ?? '',
      declarado: limpio,
      sistema: s.total,
      // Se sigue guardando el total declarado en `usuario_monto` porque de ahi
      // lo leen la conciliacion, el ticket y los reportes de siempre.
      usuario_monto: totalDeclarado(limpio),
    })
    setCerrando(null)
    setDeclarado({})
  }

  const pendientes = cerradas.filter((a) => !a.conciliado)
  const diferenciaTotal = cerradas.reduce(
    (a, x) => a + ((x.usuario_monto || 0) - (x.sistema || 0)),
    0,
  )

  return (
    <>
      <Encabezado titulo="Arqueos de caja" bajada="Apertura, cierre y control de la caja.">
        {['cajas', 'conciliacion'].map((v) => (
          <Boton key={v} variante={vista === v ? 'primario' : 'ghost'} onClick={() => setVista(v)}>
            {v === 'cajas' ? 'Cajas' : 'Conciliación'}
          </Boton>
        ))}
        {!abierta && (
          <Boton variante="primario" onClick={() => setAbriendo(true)}>
            + Abrir caja
          </Boton>
        )}
      </Encabezado>

      {abierta && (
        <Tarjeta titulo={`Caja ${abierta.caja} — abierta`} className="mb-5 border-amber/40">
          <FilaKpis cols={5}>
            <Kpi label="Abierta desde" valor={fechaHora(abierta.apertura)} />
            <Kpi label="Monto inicial" valor={pesos(sistemaActual.inicial)} />
            <Kpi label="Ingresos" valor={pesos(sistemaActual.ingresos)} tono="amber" />
            <Kpi label="Egresos" valor={pesos(sistemaActual.egresos)} />
            <Kpi label="Tendría que haber" valor={pesos(sistemaActual.total)} />
          </FilaKpis>
          <Boton variante="primario" className="py-3" onClick={() => setCerrando(abierta)}>
            Cerrar caja y contar
          </Boton>
        </Tarjeta>
      )}

      {vista === 'cajas' ? (
        <>
          <FilaKpis cols={3}>
            <Kpi label="Arqueos cerrados" valor={cerradas.length} />
            <Kpi label="Sin conciliar" valor={pendientes.length} tono={pendientes.length ? 'flame' : undefined} />
            <Kpi
              label="Diferencia acumulada"
              valor={pesos(diferenciaTotal)}
              tono={diferenciaTotal < 0 ? 'flame' : undefined}
            />
          </FilaKpis>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="bg-white/5">
                  {['Caja', 'Apertura / Cierre', 'Inicial', '$ Sistema', '$ Declarado', 'Diferencia', 'Estado', ''].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                        i >= 2 && i <= 5 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cerradas.map((a) => {
                  const dif = (a.usuario_monto || 0) - (a.sistema || 0)
                  return (
                    <tr key={a.id} className="border-t border-white/5">
                      <td className="px-4 py-2.5 font-bold text-paper">{a.caja}</td>
                      <td className="px-4 py-2.5 text-xs text-ash">
                        {fechaHora(a.apertura)}
                        <br />
                        {fechaHora(a.cierre)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ash">{pesos(a.monto_inicial || 0)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-ash">{pesos(a.sistema)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-paper">{pesos(a.usuario_monto)}</td>
                      <td
                        className={`px-4 py-2.5 text-right tabular-nums ${
                          dif < 0 ? 'font-bold text-flame' : dif > 0 ? 'text-[#3ee07f]' : 'text-ash'
                        }`}
                      >
                        {pesos(dif)}
                      </td>
                      <td className="px-4 py-2.5">
                        <Chip>{a.conciliado ? 'Cerrada' : 'Pendiente'}</Chip>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Boton onClick={() => setDetalle(a)}>Ver</Boton>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {cerradas.length === 0 && <Vacio>Todavía no cerraste ninguna caja.</Vacio>}
          </div>
        </>
      ) : (
        <>
          <FilaKpis cols={4}>
            <Kpi label="Total de cajas" valor={cerradas.length} />
            <Kpi label="Pendientes" valor={pendientes.length} />
            <Kpi label="Conciliadas" valor={cerradas.length - pendientes.length} />
            <Kpi label="Diferencia total" valor={pesos(diferenciaTotal)} />
          </FilaKpis>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-white/5">
                  {['Caja', 'Cierre', '$ Sistema', '$ Declarado', 'Diferencia', 'Cerrado por', ''].map((h, i) => (
                    <th
                      key={h + i}
                      className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                        i >= 2 && i <= 4 ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pendientes.map((a) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="px-4 py-2.5 font-bold text-paper">{a.caja}</td>
                    <td className="px-4 py-2.5 text-xs text-ash">{fechaHora(a.cierre)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-ash">{pesos(a.sistema)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-paper">{pesos(a.usuario_monto)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-paper">
                      {pesos((a.usuario_monto || 0) - (a.sistema || 0))}
                    </td>
                    <td className="px-4 py-2.5 text-ash">{a.cerrado_por || a.usuario || '-'}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Boton variante="primario" onClick={() => actualizar(a.id, { conciliado: true })}>
                        Conciliar
                      </Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pendientes.length === 0 && <Vacio>No queda nada por conciliar.</Vacio>}
          </div>
        </>
      )}

      {/* ----------------------------------------------------- abrir la caja */}
      {abriendo && (
        <Modal
          titulo="Nuevo arqueo de caja"
          bajada="Lo único que hace falta es con cuánto efectivo arrancás."
          onCerrar={() => setAbriendo(false)}
          ancho="max-w-md"
        >
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">
              Monto inicial en efectivo *
            </span>
            <input
              type="number"
              inputMode="numeric"
              value={montoInicial}
              onChange={(e) => setMontoInicial(e.target.value)}
              autoFocus
              placeholder="0"
              className={`${campo} text-lg`}
            />
          </label>
          <p className="mt-2 text-xs text-ash">
            Son los billetes con los que arranca el turno. Al cerrar se cuentan
            también, así que entran en lo que tiene que haber en la caja.
          </p>

          <div className="mt-5 grid gap-2 text-xs text-ash">
            <div className="flex justify-between">
              <span>Caja</span>
              <span className="text-paper">{cajas.find((c) => c.activa !== false)?.nombre ?? 'Principal'}</span>
            </div>
            <div className="flex justify-between">
              <span>Apertura</span>
              <span className="text-paper">{fechaHora(new Date().toISOString())}</span>
            </div>
            <div className="flex justify-between">
              <span>Abre</span>
              <span className="text-paper">{usuarioActual() ?? usuarios[0]?.nombre ?? '-'}</span>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <Boton
              variante="primario"
              disabled={montoInicial === ''}
              className="flex-1 py-3.5"
              onClick={confirmarApertura}
            >
              Iniciar arqueo
            </Boton>
            <Boton className="py-3.5" onClick={() => setAbriendo(false)}>
              Cancelar
            </Boton>
          </div>
        </Modal>
      )}

      {/* ---------------------------------------------------- cerrar la caja */}
      {cerrando && (
        <Modal
          titulo="Cerrar caja"
          bajada={`Caja ${cerrando.caja} — cargá cuánto contaste de cada forma de cobro.`}
          onCerrar={() => setCerrando(null)}
          ancho="max-w-xl"
        >
          {(() => {
            const s = calcularArqueo(cerrando, ctrl.pedidos, movimientos, medios)
            const total = totalDeclarado(declarado)
            const dif = total - s.total
            return (
              <>
                <div className="rounded-xl border border-white/10 bg-ink p-4">
                  <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ash">
                    Según el sistema
                  </p>
                  <Fila label="Monto inicial" valor={pesos(s.inicial)} />
                  <Fila label="Ingresos" valor={pesos(s.ingresos)} />
                  <Fila label="Egresos" valor={`−${pesos(s.egresos)}`} tono={s.egresos ? 'flame' : undefined} />
                  <Fila label="Total" valor={pesos(s.total)} tono="amber" fuerte borde={false} />
                </div>

                <p className="mb-2 mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ash">
                  Según vos
                </p>
                <div className="mb-1 grid grid-cols-[1fr_auto_8rem] gap-3 text-[10px] font-extrabold uppercase tracking-wider text-ash">
                  <span>Forma de cobro</span>
                  <span className="w-24 text-right">Sistema</span>
                  <span className="text-right">Contaste</span>
                </div>
                <div className="space-y-2">
                  {formas.map((m) => (
                    <label key={m.nombre} className="grid grid-cols-[1fr_auto_8rem] items-center gap-3">
                      <span className="min-w-0 text-sm text-paper">
                        {m.nombre}
                        {/* El que no tiene enganche no suma del lado del sistema:
                            se avisa para que nadie busque un error que no existe. */}
                        {!m.clave && (
                          <span className="block text-[10px] uppercase tracking-wider text-ash">
                            no lo calcula el sistema
                          </span>
                        )}
                      </span>
                      <span className="w-24 text-right text-xs tabular-nums text-ash">
                        {m.clave ? pesos(s.porMedio[m.nombre] || 0) : '—'}
                      </span>
                      <input
                        type="number"
                        inputMode="numeric"
                        placeholder="0"
                        value={declarado[m.nombre] ?? ''}
                        onChange={(e) =>
                          setDeclarado((p) => ({ ...p, [m.nombre]: e.target.value }))
                        }
                        className={`${campoBase} w-full py-2 text-right text-sm`}
                      />
                    </label>
                  ))}
                </div>

                <div className="mt-4 border-t border-white/10 pt-2">
                  <Fila label="Total declarado" valor={pesos(total)} fuerte borde={false} />
                </div>

                <Diferencia monto={dif} />
                <p className="mt-2 text-xs text-ash">
                  {dif < 0
                    ? 'Falta plata contra lo que registró el sistema.'
                    : dif > 0
                      ? 'Sobra plata contra lo que registró el sistema.'
                      : 'Cierra justo.'}
                </p>

                <div className="mt-6 flex gap-2">
                  <Boton variante="primario" className="flex-1 py-3.5" onClick={confirmarCierre}>
                    Cerrar caja
                  </Boton>
                  <Boton className="py-3.5" onClick={() => setCerrando(null)}>
                    Cancelar
                  </Boton>
                </div>
              </>
            )
          })()}
        </Modal>
      )}

      {/* ------------------------------------------------- ver un arqueo ya cerrado */}
      {detalle && (
        <Modal
          titulo="Arqueo de caja"
          bajada={fechaHora(detalle.cierre)}
          onCerrar={() => setDetalle(null)}
          ancho="max-w-xl"
        >
          {(() => {
            const s = calcularArqueo(detalle, ctrl.pedidos, movimientos, medios)
            const dif = diferenciaDe(detalle, detalle.sistema ?? s.total)
            const dec = detalle.declarado ?? {}
            return (
              <>
                <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                  {[
                    ['Caja', detalle.caja],
                    ['Estado', detalle.conciliado ? 'Conciliado' : 'Cerrado'],
                    ['Hora de apertura', fechaHora(detalle.apertura)],
                    ['Creado por', detalle.usuario || '-'],
                    ['Hora de cierre', fechaHora(detalle.cierre)],
                    ['Cerrado por', detalle.cerrado_por || detalle.usuario || '-'],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-3 border-b border-white/5 py-1.5">
                      <span className="text-ash">{k}</span>
                      <span className="text-right text-paper">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-ink p-4">
                  <Fila label="Monto inicial" valor={pesos(detalle.monto_inicial || 0)} />
                  <Fila label="Ingresos" valor={pesos(s.ingresos)} />
                  <Fila label="Egresos" valor={`−${pesos(s.egresos)}`} tono={s.egresos ? 'flame' : undefined} />
                  <Fila label="Total" valor={pesos(detalle.sistema ?? s.total)} tono="amber" fuerte borde={false} />
                </div>

                <p className="mb-1 mt-5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-ash">
                  Según usuario
                </p>
                <div className="rounded-xl border border-white/10 bg-ink p-4">
                  {Object.keys(dec).length === 0 ? (
                    <p className="py-2 text-sm text-ash">
                      Este arqueo se cerró con el formato viejo, de un solo total.
                    </p>
                  ) : (
                    Object.entries(dec).map(([nombre, monto]) => (
                      <Fila key={nombre} label={nombre} valor={pesos(Number(monto) || 0)} />
                    ))
                  )}
                  <Fila label="Total" valor={pesos(detalle.usuario_monto || 0)} fuerte borde={false} />
                </div>

                <Diferencia monto={dif} />

                <div className="mt-6 flex gap-2">
                  <Boton
                    className="flex-1 py-3.5"
                    onClick={() =>
                      imprimirArqueo(detalle, [
                        { label: 'Monto inicial', valor: detalle.monto_inicial || 0 },
                        { label: 'Ingresos', valor: s.ingresos },
                        { label: 'Egresos', valor: -s.egresos },
                        ...Object.entries(dec).map(([n, m]) => ({ label: n, valor: Number(m) || 0 })),
                      ])
                    }
                  >
                    Imprimir
                  </Boton>
                  <Boton className="py-3.5" onClick={() => setDetalle(null)}>
                    Cerrar
                  </Boton>
                </div>
              </>
            )
          })()}
        </Modal>
      )}
    </>
  )
}

export default Arqueos
