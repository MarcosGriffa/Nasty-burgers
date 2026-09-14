import { useMemo, useState } from 'react'
import { clientesDePedidos } from '../../lib/estadisticas'
import { aCSV, descargar, fechaCorta, linkWhatsapp, normalizar, pesos, telefonoWhatsapp } from '../../lib/utils'
import { Boton, Buscador, Chip, Encabezado, FilaKpis, Kpi, Vacio } from '../comp/ui'

const GRUPOS = ['Todos', 'Nuevo', 'Regular', 'Fiel', 'Dormido']

export default function Clientes({ ctrl }) {
  const [busqueda, setBusqueda] = useState('')
  const [grupo, setGrupo] = useState('Todos')
  const [sel, setSel] = useState(null)

  const clientes = useMemo(() => clientesDePedidos(ctrl.pedidos), [ctrl.pedidos])

  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim())
    return clientes
      .filter((c) => (grupo === 'Todos' ? true : c.grupo === grupo))
      .filter((c) =>
        q
          ? normalizar(c.nombre || '').includes(q) ||
            normalizar(c.telefono || '').includes(q) ||
            normalizar(c.email || '').includes(q)
          : true,
      )
  }, [clientes, busqueda, grupo])

  const cuenta = (g) => clientes.filter((c) => c.grupo === g).length
  const cliente = clientes.find((c) => c.id === sel)
  const pedidosDelCliente = cliente
    ? ctrl.pedidos
        .filter((p) => (p.cliente_telefono || '').replace(/\D/g, '') === cliente.id || p.cliente_nombre === cliente.nombre)
        .sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en))
        .slice(0, 12)
    : []

  return (
    <>
      <Encabezado titulo="Clientes" bajada="Se arma solo con los datos de cada pedido.">
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder="Buscar cliente…" />
        <Boton
          onClick={() =>
            descargar(
              'clientes.csv',
              aCSV(
                [
                  { k: 'nombre', label: 'Nombre' },
                  { k: 'telefono', label: 'Teléfono' },
                  { k: 'email', label: 'Email' },
                  { k: 'compras', label: 'Compras' },
                  { k: 'gastado', label: 'Total gastado' },
                  { k: 'ticket', label: 'Ticket promedio' },
                  { k: 'grupo', label: 'Grupo' },
                ],
                visibles,
                (f, c) => f[c.k],
              ),
            )
          }
        >
          Exportar
        </Boton>
      </Encabezado>

      <FilaKpis cols={4}>
        <Kpi label="Clientes nuevos" valor={cuenta('Nuevo')} />
        <Kpi label="Regulares" valor={cuenta('Regular')} />
        <Kpi label="Fieles" valor={cuenta('Fiel')} tono="amber" />
        <Kpi label="Dormidos" valor={cuenta('Dormido')} tono={cuenta('Dormido') ? 'flame' : undefined} />
      </FilaKpis>

      <div className="mb-4 flex flex-wrap gap-2">
        {GRUPOS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGrupo(g)}
            className={`rounded-full border px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest transition-colors ${
              grupo === g ? 'border-amber bg-amber text-ink' : 'border-white/15 text-ash hover:text-paper'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className={`grid gap-5 ${cliente ? 'xl:grid-cols-[1fr_360px]' : ''}`}>
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="bg-white/5">
                {['Nombre', 'Teléfono', 'Origen', 'Última compra', 'Compras', 'Total gastado', 'Grupo'].map((h, i) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-ash ${
                      i === 4 || i === 5 ? 'text-right' : 'text-left'
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibles.slice(0, 200).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSel(c.id)}
                  className={`cursor-pointer border-t border-white/5 hover:bg-white/5 ${sel === c.id ? 'bg-amber/10' : ''}`}
                >
                  <td className="px-4 py-2.5 font-bold text-paper">{c.nombre}</td>
                  <td className="px-4 py-2.5 text-ash">{c.telefono || '-'}</td>
                  <td className="px-4 py-2.5">
                    <Chip>{c.origen}</Chip>
                  </td>
                  <td className="px-4 py-2.5 text-ash">{fechaCorta(c.ultima)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-paper">{c.compras}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-amber">{pesos(c.gastado)}</td>
                  <td className="px-4 py-2.5">
                    <Chip tono={c.grupo === 'Dormido' ? 'alerta' : c.grupo === 'Fiel' ? 'ok' : 'neutro'}>{c.grupo}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visibles.length === 0 && <Vacio>No hay clientes que coincidan.</Vacio>}
        </div>

        {cliente && (
          <aside className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h3 className="display text-xl text-paper">{cliente.nombre}</h3>
            <p className="mt-1 text-xs text-ash">{cliente.telefono}</p>
            {cliente.email && <p className="text-xs text-ash">{cliente.email}</p>}

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl border border-white/10 py-2">
                <p className="display text-xl text-paper">{cliente.compras}</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">Compras</p>
              </div>
              <div className="rounded-xl border border-white/10 py-2">
                <p className="display text-xl text-amber">{pesos(cliente.ticket)}</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">Ticket</p>
              </div>
              <div className="rounded-xl border border-white/10 py-2">
                <p className="display text-xl text-paper">{pesos(cliente.gastado)}</p>
                <p className="text-[10px] uppercase tracking-widest text-ash">Gastado</p>
              </div>
            </div>

            {cliente.telefono && (
              <a
                href={linkWhatsapp(
                  telefonoWhatsapp(cliente.telefono),
                  `Hola ${String(cliente.nombre).split(' ')[0]}, somos Nasty Burgers.`,
                )}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block rounded-full bg-[#25D366] px-4 py-3 text-center text-xs font-extrabold uppercase tracking-widest text-ink"
              >
                Escribirle por WhatsApp
              </a>
            )}

            <h4 className="mt-6 text-[11px] font-extrabold uppercase tracking-widest text-ash">Últimos pedidos</h4>
            <ul className="mt-2 space-y-1.5">
              {pedidosDelCliente.map((p) => (
                <li key={p.id} className="flex justify-between gap-2 text-sm">
                  <span className="text-ash">
                    #{p.numero} · {fechaCorta(p.creado_en)}
                  </span>
                  <span className="text-paper">{pesos(p.total)}</span>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>
  )
}
