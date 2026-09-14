import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { CAJAS, USUARIOS } from '../../data/semillas'
import { esVenta } from '../../lib/estadisticas'
import { fechaHora, pesos } from '../../lib/utils'
import { imprimirArqueo } from '../../lib/imprimir'
import { usuarioActual } from '../../lib/pedidos'
import { Boton, Chip, Encabezado, FilaKpis, Kpi, Modal, Tarjeta, Vacio } from '../comp/ui'

/** Efectivo que debería haber en la caja desde que se abrió. */
function calcularSistema(pedidos, movimientos, desdeIso) {
  const desde = new Date(desdeIso).getTime()
  const ventas = pedidos
    .filter((p) => esVenta(p) && p.pago === 'efectivo' && new Date(p.creado_en).getTime() >= desde)
    .reduce((a, p) => a + (p.total || 0), 0)
  const movs = movimientos
    .filter((m) => new Date(m.fecha).getTime() >= desde)
    .reduce((a, m) => a + (m.tipo === 'Ingreso' ? 1 : -1) * (Number(m.monto) || 0), 0)
  return { ventas, movs, total: ventas + movs }
}

export function Arqueos({ ctrl }) {
  const { filas: arqueos, crear, actualizar } = useColeccion('arqueos')
  const { filas: movimientos } = useColeccion('movimientos_caja')
  const { filas: cajas } = useColeccion('cajas', CAJAS)
  const { filas: usuarios } = useColeccion('usuarios', USUARIOS)

  const [cerrando, setCerrando] = useState(null)
  const [contado, setContado] = useState('')
  const [vista, setVista] = useState('cajas')

  const abierta = arqueos.find((a) => !a.cierre)
  const cerradas = useMemo(
    () => arqueos.filter((a) => a.cierre).sort((a, b) => new Date(b.cierre) - new Date(a.cierre)),
    [arqueos],
  )

  const sistemaActual = abierta ? calcularSistema(ctrl.pedidos, movimientos, abierta.apertura) : null

  const abrir = () =>
    crear({
      caja: cajas[0]?.nombre ?? 'Principal',
      apertura: new Date().toISOString(),
      cierre: null,
      usuario: usuarioActual() ?? usuarios[0]?.nombre ?? '',
      sistema: 0,
      usuario_monto: 0,
      conciliado: false,
    })

  const confirmarCierre = async () => {
    const s = calcularSistema(ctrl.pedidos, movimientos, cerrando.apertura)
    await actualizar(cerrando.id, {
      cierre: new Date().toISOString(),
      sistema: s.total,
      usuario_monto: Number(contado) || 0,
    })
    setCerrando(null)
    setContado('')
  }

  const pendientes = cerradas.filter((a) => !a.conciliado)
  const diferenciaTotal = cerradas.reduce((a, x) => a + ((x.usuario_monto || 0) - (x.sistema || 0)), 0)

  return (
    <>
      <Encabezado titulo="Arqueos de caja" bajada="Apertura, cierre y control del efectivo.">
        {['cajas', 'conciliacion'].map((v) => (
          <Boton key={v} variante={vista === v ? 'primario' : 'ghost'} onClick={() => setVista(v)}>
            {v === 'cajas' ? 'Cajas' : 'Conciliación'}
          </Boton>
        ))}
        {!abierta && (
          <Boton variante="primario" onClick={abrir}>
            + Abrir caja
          </Boton>
        )}
      </Encabezado>

      {abierta && (
        <Tarjeta titulo={`Caja ${abierta.caja} — abierta`} className="mb-5 border-amber/40">
          <FilaKpis cols={4}>
            <Kpi label="Abierta desde" valor={fechaHora(abierta.apertura)} />
            <Kpi label="Ventas en efectivo" valor={pesos(sistemaActual.ventas)} tono="amber" />
            <Kpi label="Movimientos" valor={pesos(sistemaActual.movs)} />
            <Kpi label="Debería haber" valor={pesos(sistemaActual.total)} />
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
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="bg-white/5">
                  {['Caja', 'Apertura / Cierre', '$ Sistema', '$ Contado', 'Diferencia', 'Estado', ''].map((h, i) => (
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
                        <Boton
                          onClick={() =>
                            imprimirArqueo(a, [
                              { label: 'Ventas efectivo', valor: a.sistema },
                            ])
                          }
                        >
                          Imprimir
                        </Boton>
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
                  {['Caja', 'Cierre', '$ Sistema', '$ Contado', 'Diferencia', 'Cerrado por', ''].map((h, i) => (
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
                    <td className="px-4 py-2.5 text-ash">{a.usuario || '-'}</td>
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

      {cerrando && (
        <Modal titulo="Cerrar caja" bajada={`Caja ${cerrando.caja}`} onCerrar={() => setCerrando(null)} ancho="max-w-md">
          {(() => {
            const s = calcularSistema(ctrl.pedidos, movimientos, cerrando.apertura)
            const dif = (Number(contado) || 0) - s.total
            return (
              <>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <dt className="text-ash">Ventas en efectivo</dt>
                    <dd className="text-paper">{pesos(s.ventas)}</dd>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <dt className="text-ash">Ingresos / egresos manuales</dt>
                    <dd className="text-paper">{pesos(s.movs)}</dd>
                  </div>
                  <div className="flex justify-between pb-2">
                    <dt className="font-bold text-paper">Debería haber</dt>
                    <dd className="display text-xl text-amber">{pesos(s.total)}</dd>
                  </div>
                </dl>

                <label className="mt-5 block">
                  <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">
                    ¿Cuánto contaste?
                  </span>
                  <input
                    type="number"
                    value={contado}
                    onChange={(e) => setContado(e.target.value)}
                    autoFocus
                    className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-lg text-paper focus:outline-none focus:ring-2 focus:ring-amber"
                  />
                </label>

                {contado !== '' && (
                  <p className={`mt-3 text-sm ${dif < 0 ? 'text-flame' : dif > 0 ? 'text-[#3ee07f]' : 'text-ash'}`}>
                    Diferencia: {pesos(dif)}
                    {dif < 0 ? ' — falta plata en la caja.' : dif > 0 ? ' — sobra plata.' : ' — cierra justo.'}
                  </p>
                )}

                <div className="mt-6 flex gap-2">
                  <Boton variante="primario" disabled={contado === ''} className="flex-1 py-3.5" onClick={confirmarCierre}>
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
    </>
  )
}

export default Arqueos
