import { useMemo, useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { ENTIDADES } from '../entidades'
import { aCSV, descargar, normalizar, pesos } from '../../lib/utils'
import Tabla, { valorCelda } from '../comp/Tabla'
import { Boton, Buscador, Campo, Chip, Encabezado, Modal } from '../comp/ui'
import EditorProducto from './EditorProducto'

function Formulario({ def, inicial, onGuardar, onCerrar }) {
  const [datos, setDatos] = useState(() => {
    const base = {}
    def.campos.forEach((c) => {
      base[c.k] = inicial?.[c.k] ?? (c.tipo === 'bool' ? true : '')
    })
    return base
  })
  const [error, setError] = useState(null)

  const guardar = () => {
    const falta = def.campos.find((c) => c.requerido && (datos[c.k] === '' || datos[c.k] == null))
    if (falta) {
      setError(`Falta completar «${falta.label}».`)
      return
    }
    onGuardar(datos)
  }

  return (
    <Modal
      titulo={inicial ? `Editar ${def.singular}` : `Nuevo ${def.singular}`}
      onCerrar={onCerrar}
    >
      <div className="space-y-3">
        {def.campos.map((c) => (
          <Campo key={c.k} campo={c} valor={datos[c.k]} onChange={(v) => setDatos((d) => ({ ...d, [c.k]: v }))} />
        ))}
      </div>
      {error && <p className="mt-3 text-xs text-flame">{error}</p>}
      <div className="mt-6 flex gap-2">
        <Boton variante="primario" onClick={guardar} className="flex-1 py-3.5">
          Guardar
        </Boton>
        <Boton onClick={onCerrar} className="py-3.5">
          Cancelar
        </Boton>
      </div>
    </Modal>
  )
}

function Detalle({ def, fila, conteo, onEditar, onEliminar, onCerrar }) {
  return (
    <aside className="rounded-2xl border border-white/10 bg-ink-2 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="display text-xl text-paper">{fila[def.campos[0].k]}</h3>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar detalle"
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/15 text-ash lg:hidden"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <dl className="space-y-2.5 text-sm">
        {def.campos.map((c) => (
          <div key={c.k} className="flex justify-between gap-3 border-b border-white/5 pb-2">
            <dt className="text-ash">{c.label}</dt>
            <dd className="text-right font-semibold text-paper">
              {c.tipo === 'bool'
                ? fila[c.k]
                  ? 'Sí'
                  : 'No'
                : c.tipo === 'moneda'
                  ? pesos(fila[c.k] || 0)
                  : fila[c.k] || '—'}
            </dd>
          </div>
        ))}
        {def.contarEn && (
          <div className="flex justify-between gap-3 pt-1">
            <dt className="text-ash">{def.contarEn.label}</dt>
            <dd className="display text-xl text-amber">{conteo}</dd>
          </div>
        )}
      </dl>

      <div className="mt-6 flex gap-2">
        <Boton variante="primario" onClick={onEditar} className="flex-1 py-3">
          Editar
        </Boton>
        <Boton variante="peligro" onClick={onEliminar} className="py-3">
          Eliminar
        </Boton>
      </div>
    </aside>
  )
}

export default function Crud({ coleccion }) {
  const def = ENTIDADES[coleccion]
  const { filas, crear, actualizar, eliminar } = useColeccion(coleccion, def.semilla)
  const relacionada = useColeccion(def.contarEn?.coleccion ?? 'noop', undefined)

  const [busqueda, setBusqueda] = useState('')
  const [sel, setSel] = useState(null)
  const [form, setForm] = useState(null) // {modo:'nuevo'|'editar'}
  const [confirmar, setConfirmar] = useState(false)

  const visibles = useMemo(() => {
    let lista = filas
    const q = normalizar(busqueda.trim())
    if (q) {
      lista = lista.filter((f) =>
        (def.buscar ?? Object.keys(f)).some((k) => normalizar(String(f[k] ?? '')).includes(q)),
      )
    }
    if (def.ordenar) {
      const { campo, desc } = def.ordenar
      lista = [...lista].sort((a, b) => (a[campo] > b[campo] ? 1 : -1) * (desc ? -1 : 1))
    }
    return lista
  }, [filas, busqueda, def])

  const total = def.totalizar
    ? visibles.reduce((a, f) => a + (Number(f[def.totalizar]) || 0), 0)
    : null

  const conteo = (fila) =>
    def.contarEn
      ? relacionada.filas.filter((r) => r[def.contarEn.campo] === fila[def.campos[0].k]).length
      : 0

  const exportar = () =>
    descargar(
      `${coleccion}.csv`,
      aCSV(def.columnas, visibles, (f, c) => valorCelda(f, c)),
    )

  const seleccionada = sel ? filas.find((f) => f.id === sel) : null

  return (
    <>
      <Encabezado
        titulo={def.titulo}
        bajada={`${visibles.length} ${visibles.length === 1 ? 'registro' : 'registros'}${
          total !== null ? ` · total ${pesos(total)}` : ''
        }`}
      >
        <Buscador valor={busqueda} onChange={setBusqueda} placeholder={`Buscar ${def.singular}…`} />
        <Boton onClick={exportar}>Exportar CSV</Boton>
        <Boton variante="primario" onClick={() => setForm({ modo: 'nuevo' })}>
          + Nuevo
        </Boton>
      </Encabezado>

      <div className={`grid gap-5 ${seleccionada && !def.editor ? 'xl:grid-cols-[1fr_340px]' : ''}`}>
        <Tabla
          columnas={def.columnas}
          filas={visibles}
          agrupar={def.agrupar}
          onSeleccionar={(f) => {
            setSel(f.id)
            if (def.editor === 'producto') setForm({ modo: 'editar' })
          }}
          seleccionadaId={sel}
          vacio={busqueda ? `No encontramos nada con «${busqueda}».` : `Todavía no hay ${def.titulo.toLowerCase()}.`}
        />

        {seleccionada && !def.editor && (
          <Detalle
            def={def}
            fila={seleccionada}
            conteo={conteo(seleccionada)}
            onCerrar={() => setSel(null)}
            onEditar={() => setForm({ modo: 'editar' })}
            onEliminar={() => setConfirmar(true)}
          />
        )}
      </div>

      {form && def.editor === 'producto' && (
        <EditorProducto
          producto={form.modo === 'editar' ? seleccionada : null}
          onCerrar={() => setForm(null)}
          onEliminar={() => {
            setForm(null)
            setConfirmar(true)
          }}
          onGuardar={async (datos) => {
            if (form.modo === 'editar') await actualizar(seleccionada.id, datos)
            else await crear(datos)
            setForm(null)
          }}
        />
      )}

      {form && def.editor !== 'producto' && (
        <Formulario
          def={def}
          inicial={form.modo === 'editar' ? seleccionada : null}
          onCerrar={() => setForm(null)}
          onGuardar={async (datos) => {
            if (form.modo === 'editar') await actualizar(seleccionada.id, datos)
            else await crear(datos)
            setForm(null)
          }}
        />
      )}

      {confirmar && seleccionada && (
        <Modal titulo="¿Eliminar?" onCerrar={() => setConfirmar(false)} ancho="max-w-sm">
          <p className="text-sm text-ash">
            Se va a borrar <span className="font-bold text-paper">{seleccionada[def.campos[0].k]}</span>. No se
            puede deshacer.
          </p>
          <div className="mt-6 flex gap-2">
            <Boton
              variante="peligro"
              className="flex-1 py-3.5"
              onClick={async () => {
                await eliminar(seleccionada.id)
                setSel(null)
                setConfirmar(false)
              }}
            >
              Sí, eliminar
            </Boton>
            <Boton className="py-3.5" onClick={() => setConfirmar(false)}>
              Cancelar
            </Boton>
          </div>
        </Modal>
      )}
    </>
  )
}

export { Chip }
