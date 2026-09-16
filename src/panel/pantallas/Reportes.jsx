import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import * as E from '../../lib/estadisticas'
import { PRODUCTOS, GASTOS, MEDIOS_PAGO } from '../../data/semillas'
import { comisiones } from '../../lib/cobros'
import { LOCALES } from '../../data/negocio'
import { aCSV, descargar, pesos } from '../../lib/utils'
import { Barras, BarrasH, ConTabla, SERIE } from '../comp/graficos'
import { Boton, Encabezado, FilaKpis, Kpi, Tarjeta, Vacio } from '../comp/ui'

// ------------------------------------------------------------------ filtros
function Filtros({ periodo, setPeriodo, local, setLocal, onExportar }) {
  const clase =
    'rounded-full border border-white/15 bg-ink-2 px-4 py-2 text-xs font-bold uppercase tracking-widest text-paper'
  return (
    <>
      <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className={clase}>
        {E.PERIODOS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>
      {setLocal && (
        <select value={local} onChange={(e) => setLocal(e.target.value)} className={clase}>
          <option value="todos">Todos los locales</option>
          {LOCALES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.nombre}
            </option>
          ))}
        </select>
      )}
      {onExportar && <Boton onClick={onExportar}>Exportar</Boton>}
    </>
  )
}

const variacion = (v) =>
  v === null || v === undefined
    ? undefined
    : `${v > 0 ? '↑' : v < 0 ? '↓' : ''} ${Math.abs(v)}% vs. período anterior`

function usePeriodo(inicial = '30') {
  const [periodo, setPeriodo] = useState(inicial)
  const [local, setLocal] = useState('todos')
  const dias = E.PERIODOS.find((p) => p.id === periodo).dias
  return { periodo, setPeriodo, local, setLocal, dias }
}

// -------------------------------------------------------------- VENTAS
export function EstadisticasVentas({ ctrl }) {
  const f = usePeriodo('7')
  const pedidos = useMemo(
    () => E.filtrar(ctrl.pedidos, { dias: f.dias, local: f.local }),
    [ctrl.pedidos, f.dias, f.local],
  )
  const r = useMemo(() => E.comparar(ctrl.pedidos, f.dias, f.local), [ctrl.pedidos, f.dias, f.local])
  const diaria = useMemo(() => E.serieDiaria(pedidos, Math.min(f.dias, 31)), [pedidos, f.dias])
  const semana = useMemo(() => E.porDiaSemana(pedidos), [pedidos])
  const horas = useMemo(() => E.porHora(pedidos), [pedidos])
  const pagos = useMemo(() => E.porMedioDePago(pedidos), [pedidos])
  const modalidad = useMemo(() => E.porModalidad(pedidos), [pedidos])
  const origen = useMemo(() => E.porOrigen(pedidos), [pedidos])

  const exportar = () =>
    descargar(
      'ventas.csv',
      aCSV(
        [
          { k: 'label', label: 'Día' },
          { k: 'a', label: 'Ventas' },
          { k: 'cantidad', label: 'Pedidos' },
        ],
        diaria,
        (row, c) => row[c.k],
      ),
    )

  return (
    <>
      <Encabezado titulo="Ventas" bajada="Todo se calcula sobre los pedidos cargados en el sistema.">
        <Filtros {...f} onExportar={exportar} />
      </Encabezado>

      <FilaKpis cols={5}>
        <Kpi label="Ventas brutas" valor={pesos(r.brutas)} detalle={variacion(r.vs.brutas)} tono="amber" />
        <Kpi label="Ventas netas" valor={pesos(r.netas)} detalle={variacion(r.vs.netas)} />
        <Kpi label="Descuentos" valor={pesos(r.descuentos)} detalle={variacion(r.vs.descuentos)} />
        <Kpi label="Cantidad de ventas" valor={r.cantidad} detalle={variacion(r.vs.cantidad)} />
        <Kpi label="Promedio por venta" valor={pesos(r.promedio)} detalle={variacion(r.vs.promedio)} />
      </FilaKpis>

      <div className="space-y-5">
        <Tarjeta titulo="Evolución de ventas">
          <ConTabla datos={diaria} series={[{ k: 'a', label: 'Ventas' }]}>
            <Barras datos={diaria} alto={260} />
          </ConTabla>
        </Tarjeta>

        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta titulo="Ventas por día de la semana">
            <Barras datos={semana} alto={200} />
          </Tarjeta>
          <Tarjeta titulo="Ventas por hora">
            <Barras datos={horas} alto={200} />
          </Tarjeta>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Tarjeta titulo="Medio de pago">
            <BarrasH datos={pagos} />
          </Tarjeta>
          <Tarjeta titulo="Modalidad">
            <BarrasH datos={modalidad} />
            <div className="mt-3 flex justify-between text-xs text-ash">
              {modalidad.map((m) => (
                <span key={m.label}>
                  {m.label}: {m.cantidad} pedidos
                </span>
              ))}
            </div>
          </Tarjeta>
          <Tarjeta titulo="Origen del pedido">
            <BarrasH datos={origen} />
          </Tarjeta>
        </div>
      </div>
    </>
  )
}

// ----------------------------------------------------------- PRODUCTOS
export function ReporteProductos({ ctrl }) {
  const f = usePeriodo('90')
  const { filas: productos } = useColeccion('productos', PRODUCTOS)
  const pedidos = useMemo(
    () => E.filtrar(ctrl.pedidos, { dias: f.dias, local: f.local }),
    [ctrl.pedidos, f.dias, f.local],
  )
  const ranking = useMemo(() => E.rankingProductos(pedidos, productos), [pedidos, productos])
  const categorias = useMemo(() => E.porCategoria(pedidos), [pedidos])

  const vendidos = ranking.reduce((a, p) => a + p.cantidad, 0)
  const cmv = ranking.reduce((a, p) => a + p.costo, 0)
  const venta = ranking.reduce((a, p) => a + p.venta, 0)
  const top3 = ranking.slice(0, 3).reduce((a, p) => a + p.venta, 0)

  const exportar = () =>
    descargar(
      'productos.csv',
      aCSV(
        [
          { k: 'nombre', label: 'Producto' },
          { k: 'cantidad', label: 'Cantidad vendida' },
          { k: 'venta', label: 'Venta $' },
          { k: 'costo', label: 'Costo $' },
          { k: 'cmv', label: 'CMV %' },
          { k: 'markup', label: 'Markup %' },
        ],
        ranking,
        (row, c) => row[c.k],
      ),
    )

  return (
    <>
      <Encabezado titulo="Productos" bajada="Qué se vende, cuánto deja y con qué costo.">
        <Filtros {...f} onExportar={exportar} />
      </Encabezado>

      <FilaKpis cols={4}>
        <Kpi label="Productos vendidos" valor={vendidos.toLocaleString('es-AR')} />
        <Kpi label="Costo de mercadería (CMV)" valor={pesos(cmv)} />
        <Kpi label="CMV sobre ventas" valor={`${venta ? Math.round((cmv / venta) * 100) : 0} %`} />
        <Kpi
          label="Top 3 por ventas"
          valor={`${venta ? Math.round((top3 / venta) * 100) : 0} %`}
          detalle="de los ingresos totales"
          tono="amber"
        />
      </FilaKpis>

      <div className="space-y-5">
        <Tarjeta titulo="Rentabilidad de productos" extra={<span className="text-xs text-ash">Top 15</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  {['Producto', 'Cantidad', 'Venta $', 'CMV %', 'Costo $', 'Markup %'].map((h, i) => (
                    <th
                      key={h}
                      className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                        i ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ranking.slice(0, 15).map((p) => (
                  <tr key={p.nombre} className="border-b border-white/5">
                    <td className="px-3 py-2 font-bold text-paper">{p.nombre}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ash">{p.cantidad}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-amber">{pesos(p.venta)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ash">{p.cmv} %</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ash">{pesos(p.costo)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-ash">
                      {p.markup === null ? '-' : `${p.markup} %`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Tarjeta>

        <div className="grid gap-5 lg:grid-cols-2">
          <Tarjeta titulo="Productos por cantidad vendida">
            <BarrasH
              datos={ranking.slice(0, 10).map((p) => ({ label: p.nombre, valor: p.cantidad }))}
              formato={(v) => `${v} u.`}
            />
          </Tarjeta>
          <Tarjeta titulo="Ventas por categoría">
            <BarrasH datos={categorias} />
          </Tarjeta>
        </div>
      </div>
    </>
  )
}

// -------------------------------------------------------------- GASTOS
export function ReporteGastos() {
  const f = usePeriodo('90')
  const { filas: gastos } = useColeccion('gastos', GASTOS)

  const enPeriodo = useMemo(() => {
    const desde = Date.now() - f.dias * 86400000
    return gastos.filter((g) => new Date(g.fecha).getTime() >= desde)
  }, [gastos, f.dias])

  const total = enPeriodo.reduce((a, g) => a + (Number(g.importe) || 0), 0)
  const aPagar = enPeriodo.filter((g) => g.estado === 'A pagar').reduce((a, g) => a + Number(g.importe || 0), 0)

  const porCategoria = useMemo(() => {
    const m = new Map()
    enPeriodo.forEach((g) => m.set(g.categoria || 'Sin categoría', (m.get(g.categoria) || 0) + Number(g.importe || 0)))
    return [...m.entries()].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor)
  }, [enPeriodo])

  const porProveedor = useMemo(() => {
    const m = new Map()
    enPeriodo.forEach((g) => m.set(g.proveedor || '—', (m.get(g.proveedor) || 0) + Number(g.importe || 0)))
    return [...m.entries()].map(([label, valor]) => ({ label, valor })).sort((a, b) => b.valor - a.valor).slice(0, 10)
  }, [enPeriodo])

  return (
    <>
      <Encabezado titulo="Gastos" bajada="Lo que sale, por categoría y por proveedor.">
        <Filtros periodo={f.periodo} setPeriodo={f.setPeriodo} />
      </Encabezado>

      <FilaKpis cols={3}>
        <Kpi label="Total del período" valor={pesos(total)} tono="flame" />
        <Kpi label="Pendiente de pago" valor={pesos(aPagar)} />
        <Kpi label="Comprobantes" valor={enPeriodo.length} />
      </FilaKpis>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Por categoría">
          <BarrasH datos={porCategoria} color={SERIE.b} />
        </Tarjeta>
        <Tarjeta titulo="Por proveedor">
          <BarrasH datos={porProveedor} color={SERIE.b} />
        </Tarjeta>
      </div>
    </>
  )
}

// ------------------------------------------------------------- BALANCE
export function Balance({ ctrl }) {
  const { filas: gastos } = useColeccion('gastos', GASTOS)
  const meses = useMemo(() => E.serieMensual(ctrl.pedidos.filter(E.esVenta), gastos, 9), [ctrl.pedidos, gastos])

  const ingresos = meses.reduce((a, m) => a + m.a, 0)
  const egresos = meses.reduce((a, m) => a + m.b, 0)

  return (
    <>
      <Encabezado titulo="Balance" bajada="Ingresos contra egresos, mes a mes." />

      <FilaKpis cols={3}>
        <Kpi label="Ingresos" valor={pesos(ingresos)} tono="amber" />
        <Kpi label="Egresos" valor={pesos(egresos)} />
        <Kpi label="Ganancia" valor={pesos(ingresos - egresos)} tono={ingresos - egresos < 0 ? 'flame' : undefined} />
      </FilaKpis>

      <Tarjeta titulo="Evolución del balance">
        <ConTabla
          datos={meses}
          series={[
            { k: 'a', label: 'Ingresos' },
            { k: 'b', label: 'Egresos' },
          ]}
        >
          <Barras
            datos={meses}
            alto={260}
            series={[
              { k: 'a', label: 'Ingresos', color: SERIE.a },
              { k: 'b', label: 'Egresos', color: SERIE.b },
            ]}
          />
        </ConTabla>
      </Tarjeta>

      <Tarjeta titulo="Detalle por período" className="mt-5">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10">
              {['Período', 'Ingresos', 'Egresos', 'Ganancia'].map((h, i) => (
                <th
                  key={h}
                  className={`px-3 py-2 text-[10px] font-extrabold uppercase tracking-widest text-ash ${i ? 'text-right' : 'text-left'}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meses.map((m) => (
              <tr key={m.label} className="border-b border-white/5">
                <td className="px-3 py-2 text-paper">{m.label}</td>
                <td className="px-3 py-2 text-right tabular-nums text-amber">{pesos(m.a)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ash">{pesos(m.b)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-paper">{pesos(m.a - m.b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Tarjeta>
    </>
  )
}

// -------------------------------------------------- ESTADO DE RESULTADOS
export function EstadoResultados({ ctrl }) {
  const f = usePeriodo('90')
  const { filas: gastos } = useColeccion('gastos', GASTOS)
  const { filas: productos } = useColeccion('productos', PRODUCTOS)
  const { filas: medios } = useColeccion('medios_pago', MEDIOS_PAGO)

  const pedidos = useMemo(() => E.filtrar(ctrl.pedidos, { dias: f.dias }), [ctrl.pedidos, f.dias])
  const gastosPeriodo = useMemo(() => {
    const desde = Date.now() - f.dias * 86400000
    return gastos.filter((g) => new Date(g.fecha).getTime() >= desde)
  }, [gastos, f.dias])

  const r = E.estadoResultados(pedidos, gastosPeriodo, productos, medios)

  const filas = [
    ['(+) Ventas brutas', r.brutas, true],
    ['(−) Descuentos', -r.descuentos],
    ['(=) Ventas netas', r.netas, true],
    ['(−) Costo de mercadería vendida', -r.cmv],
    ['(=) Ganancia bruta', r.gananciaBruta, true],
    ['(−) Gastos', -r.gastos],
    // La comisión del medio de pago nunca llega a la caja: va acá abajo, con
    // los gastos, y no arriba en la ganancia bruta.
    ['(−) Comisiones de medios de pago', -r.comisiones],
    ['(=) Ganancia neta', r.gananciaNeta, true],
  ]

  return (
    <>
      <Encabezado titulo="Estado de resultados">
        <Filtros periodo={f.periodo} setPeriodo={f.setPeriodo} />
      </Encabezado>

      <FilaKpis cols={4}>
        <Kpi label="Ventas brutas" valor={pesos(r.brutas)} tono="amber" />
        <Kpi label="CMV" valor={pesos(r.cmv)} detalle={`${r.netas ? Math.round((r.cmv / r.netas) * 100) : 0} % de las ventas`} />
        <Kpi label="Ganancia bruta" valor={pesos(r.gananciaBruta)} detalle={`${r.margenBruto} %`} />
        <Kpi label="Ganancia neta" valor={pesos(r.gananciaNeta)} detalle={`${r.margenNeto} %`} />
      </FilaKpis>

      <Tarjeta>
        <table className="w-full text-sm">
          <tbody>
            {filas.map(([label, valor, fuerte]) => (
              <tr key={label} className={`border-b border-white/5 ${fuerte ? 'bg-white/[0.03]' : ''}`}>
                <td className={`px-3 py-3 ${fuerte ? 'font-bold text-paper' : 'text-ash'}`}>{label}</td>
                <td
                  className={`px-3 py-3 text-right tabular-nums ${
                    fuerte ? 'display text-lg text-amber' : valor < 0 ? 'text-flame' : 'text-paper'
                  }`}
                >
                  {pesos(valor)}
                </td>
                <td className="w-20 px-3 py-3 text-right text-xs text-ash">
                  {r.brutas ? `${Math.round((Math.abs(valor) / r.brutas) * 100)} %` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {r.comisionesSinAsignar.length > 0 && (
          <p className="mt-3 text-xs text-ash">
            Ojo: las ventas con <b>{r.comisionesSinAsignar.join(' y ')}</b> no tienen un medio de pago
            asignado, así que su comisión no está descontada acá y la ganancia neta queda un poco
            arriba de la real. Se asigna en Configuración → Medios de Pago.
          </p>
        )}
      </Tarjeta>
    </>
  )
}

// ------------------------------------------------------------ FLUJO DE CAJA
export function FlujoCaja({ ctrl }) {
  const { filas: gastos } = useColeccion('gastos', GASTOS)
  const { filas: movimientos } = useColeccion('movimientos_caja')

  const dias = 14
  const serie = useMemo(() => {
    const mapa = new Map()
    for (let i = dias - 1; i >= 0; i--) {
      const f = new Date(Date.now() - i * 86400000)
      f.setHours(0, 0, 0, 0)
      mapa.set(f.toDateString(), {
        label: f.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric' }),
        a: 0,
        b: 0,
      })
    }
    const sumar = (iso, campo, monto) => {
      const f = new Date(iso)
      f.setHours(0, 0, 0, 0)
      const e = mapa.get(f.toDateString())
      if (e) e[campo] += monto
    }
    ctrl.pedidos.filter(E.esVenta).forEach((p) => sumar(p.creado_en, 'a', p.total || 0))
    gastos.forEach((g) => sumar(g.fecha, 'b', Number(g.importe) || 0))
    movimientos.forEach((m) =>
      sumar(m.fecha, m.tipo === 'Ingreso' ? 'a' : 'b', Number(m.monto) || 0),
    )
    return [...mapa.values()]
  }, [ctrl.pedidos, gastos, movimientos])

  const ingresos = serie.reduce((a, d) => a + d.a, 0)
  const egresos = serie.reduce((a, d) => a + d.b, 0)

  return (
    <>
      <Encabezado titulo="Flujo de caja" bajada="Últimos 14 días, incluyendo gastos y movimientos manuales." />

      <FilaKpis cols={3}>
        <Kpi label="Ingresos" valor={pesos(ingresos)} tono="amber" />
        <Kpi label="Egresos" valor={pesos(-egresos)} />
        <Kpi label="Saldo final" valor={pesos(ingresos - egresos)} />
      </FilaKpis>

      <Tarjeta titulo="Evolución diaria">
        <Barras
          datos={serie}
          alto={240}
          series={[
            { k: 'a', label: 'Ingresos', color: SERIE.a },
            { k: 'b', label: 'Egresos', color: SERIE.b },
          ]}
        />
      </Tarjeta>
    </>
  )
}

// ---------------------------------------------------------- CUENTAS A COBRAR
export function CuentasCobrar({ ctrl }) {
  const pendientes = ctrl.pedidos.filter(
    (p) =>
      E.esVenta(p) &&
      p.estado === 'entregado' &&
      p.pago === 'efectivo' &&
      !p.efectivo_cobrado,
  )
  const { filas: medios } = useColeccion('medios_pago', MEDIOS_PAGO)
  const delMes = useMemo(() => E.filtrar(ctrl.pedidos, { dias: 30 }), [ctrl.pedidos])
  const cob = useMemo(() => comisiones(delMes, medios), [delMes, medios])

  return (
    <>
      <Encabezado titulo="Cuentas a cobrar" bajada="Efectivo sin rendir y lo que se llevan los medios de pago." />

      <FilaKpis cols={3}>
        <Kpi label="Efectivo sin contar" valor={pendientes.length} tono={pendientes.length ? 'flame' : undefined} />
        <Kpi
          label="Monto sin rendir"
          valor={pesos(pendientes.reduce((a, p) => a + (p.total || 0), 0))}
        />
        <Kpi
          label="Comisiones (30 d)"
          valor={pesos(cob.total)}
          detalle="según Configuración → Medios de Pago"
        />
      </FilaKpis>

      <Tarjeta titulo="Qué se lleva cada medio de pago (30 días)">
        {cob.filas.length === 0 ? (
          <Vacio>Todavía no hay ventas en el período.</Vacio>
        ) : (
          <>
            {cob.sinAsignar.length > 0 && (
              // Preferimos decir "no lo sé" antes que estimar un arancel: una
              // comisión inventada ensucia la ganancia neta y nadie se entera.
              <p className="mb-3 rounded-xl border border-flame/40 bg-flame/10 px-4 py-3 text-xs text-paper">
                <b>{cob.sinAsignar.join(' y ')}</b> {cob.sinAsignar.length > 1 ? 'no tienen' : 'no tiene'} un
                medio de pago asignado, así que {pesos(cob.brutoSinAsignar)} figuran sin comisión. Se
                arregla en Configuración → Medios de Pago, con el campo «Cobra los pedidos pagados con».
              </p>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-[11px] uppercase tracking-widest text-ash">
                  <th className="px-3 py-2 text-left font-bold">Medio</th>
                  <th className="px-3 py-2 text-right font-bold">Vendido</th>
                  <th className="px-3 py-2 text-right font-bold">Arancel</th>
                  <th className="px-3 py-2 text-right font-bold">Comisión</th>
                  <th className="px-3 py-2 text-right font-bold">Neto</th>
                </tr>
              </thead>
              <tbody>
                {cob.filas.map((f) => (
                  <tr key={f.clave} className="border-b border-white/5">
                    <td className="px-3 py-2.5 font-bold text-paper">
                      {f.label}
                      <span className="block text-[11px] font-semibold text-ash">
                        {f.cantidad} {f.cantidad === 1 ? 'pedido' : 'pedidos'}
                        {f.medio && f.medio !== f.label ? ` · ${f.medio}` : ''}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-paper">{pesos(f.bruto)}</td>
                    <td className="px-3 py-2.5 text-right text-xs tabular-nums text-ash">
                      {f.sinAsignar ? 'sin asignar' : `${f.porcentaje.toLocaleString('es-AR')} %`}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        f.sinAsignar ? 'text-flame' : 'text-ash'
                      }`}
                    >
                      {f.sinAsignar ? '?' : pesos(f.comision ? -f.comision : 0)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-amber">{pesos(f.neto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Tarjeta>

      <Tarjeta titulo="Pedidos en efectivo sin contar">
        {pendientes.length === 0 ? (
          <Vacio>No queda efectivo sin rendir.</Vacio>
        ) : (
          <table className="w-full text-sm">
            <tbody>
              {pendientes.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-3 py-2 font-bold text-paper">#{p.numero}</td>
                  <td className="px-3 py-2 text-ash">{p.cliente_nombre}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-amber">{pesos(p.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Tarjeta>
    </>
  )
}
