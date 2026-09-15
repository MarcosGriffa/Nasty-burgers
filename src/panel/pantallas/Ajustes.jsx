import { useState } from 'react'
import { useColeccion } from '../../lib/almacen'
import { LOCALES } from '../../data/negocio'
import { AJUSTES_INICIALES } from '../../data/semillas'
import { pesos } from '../../lib/utils'
import { Boton, Encabezado, FilaKpis, Kpi, Tarjeta, Vacio } from '../comp/ui'
import { imprimirComandaCocina, imprimirTicket } from '../../lib/imprimir'
import { claveGuardada, claveOculta, guardarClave, probarClave } from '../../lib/ia'


export function useAjustes() {
  const { filas, actualizar, crear } = useColeccion('ajustes', AJUSTES_INICIALES)
  const a = filas[0]
  const guardar = (cambios) => (a ? actualizar(a.id, cambios) : crear({ ...AJUSTES_INICIALES[0], ...cambios }))
  return { a: a ?? AJUSTES_INICIALES[0], guardar }
}

// ------------------------------------------------------------- componentes
function Interruptor({ label, bajada, valor, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 border-b border-white/5 py-3 last:border-0">
      <input type="checkbox" checked={!!valor} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#F5B301]" />
      <span>
        <span className="block text-sm text-paper">{label}</span>
        {bajada && <span className="block text-xs text-ash">{bajada}</span>}
      </span>
    </label>
  )
}

function Texto({ label, valor, onChange, tipo = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">{label}</span>
      <input
        type={tipo}
        value={valor ?? ''}
        onChange={(e) => onChange(tipo === 'number' ? Number(e.target.value) : e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper focus:outline-none focus:ring-2 focus:ring-amber"
      />
    </label>
  )
}

// ---------------------------------------------------------- TIENDA: INICIO
export function TiendaInicio({ ctrl }) {
  const { a, guardar } = useAjustes()
  const hoy = ctrl.pedidos.filter(
    (p) => new Date(p.creado_en).toDateString() === new Date().toDateString(),
  )
  const url = `${window.location.origin}${window.location.pathname}`

  return (
    <>
      <Encabezado titulo="Tu Delivery" bajada="El estado de la tienda online y el link que se comparte." />

      <Tarjeta className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="display text-2xl text-paper">Tienda Online</h2>
            <p className="mt-1 text-sm text-ash">
              {a.tienda_activa ? 'La tienda está recibiendo pedidos.' : 'La tienda está pausada.'}
            </p>
          </div>
          <Boton
            variante={a.tienda_activa ? 'ghost' : 'primario'}
            className="py-3"
            onClick={() => guardar({ tienda_activa: !a.tienda_activa })}
          >
            {a.tienda_activa ? 'Pausar tienda' : 'Activar tienda'}
          </Boton>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-white/10 px-4 py-3">
          <span className="flex-1 truncate text-sm text-amber">{url}</span>
          <Boton onClick={() => navigator.clipboard?.writeText(url)}>Copiar link</Boton>
        </div>
      </Tarjeta>

      <FilaKpis cols={4}>
        <Kpi label="Pedidos hoy" valor={hoy.length} />
        <Kpi label="Sin aceptar" valor={hoy.filter((p) => p.estado === 'pendiente').length} tono="flame" />
        <Kpi label="Facturado hoy" valor={pesos(hoy.reduce((s, p) => s + (p.total || 0), 0))} tono="amber" />
        <Kpi label="Locales activos" valor={LOCALES.length} />
      </FilaKpis>

      <Tarjeta titulo="Cómo está configurado">
        <ul className="space-y-2 text-sm text-ash">
          <li>· Los pedidos entran a <span className="text-paper">Ventas → Delivery</span> o <span className="text-paper">Mostrador</span> según la modalidad.</li>
          <li>· Al aceptar se imprime la comanda {a.imprimir_al_aceptar ? 'automáticamente' : '(desactivado)'}.</li>
          <li>· El aviso al cliente sale por WhatsApp desde el equipo del local.</li>
          <li>· El 10% de descuento por efectivo se aplica en el carrito y en la comanda.</li>
        </ul>
      </Tarjeta>
    </>
  )
}

// --------------------------------------------------------- TIENDA: HORARIOS
export function TiendaHorarios() {
  const { a, guardar } = useAjustes()
  const horarios = a.horarios ?? AJUSTES_INICIALES[0].horarios

  const cambiar = (i, cambios) => {
    const nuevos = horarios.map((h, idx) => (idx === i ? { ...h, ...cambios } : h))
    guardar({ horarios: nuevos })
  }

  return (
    <>
      <Encabezado titulo="Horarios" bajada="Cuándo se puede pedir por delivery y cuándo para retirar." />

      <Tarjeta>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="border-b border-white/10">
                {['Día', 'Delivery', 'Retiro en el local', 'Desde', 'Hasta'].map((h) => (
                  <th key={h} className="px-3 py-2 text-left text-[10px] font-extrabold uppercase tracking-widest text-ash">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horarios.map((h, i) => (
                <tr key={h.dia} className="border-b border-white/5">
                  <td className="px-3 py-2.5 font-bold text-paper">{h.dia}</td>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={h.delivery} onChange={(e) => cambiar(i, { delivery: e.target.checked })} className="h-4 w-4 accent-[#F5B301]" />
                  </td>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={h.retiro} onChange={(e) => cambiar(i, { retiro: e.target.checked })} className="h-4 w-4 accent-[#F5B301]" />
                  </td>
                  {['desde', 'hasta'].map((k) => (
                    <td key={k} className="px-3 py-2.5">
                      <input
                        type="time"
                        value={h[k]}
                        onChange={(e) => cambiar(i, { [k]: e.target.value })}
                        disabled={!h.delivery && !h.retiro}
                        className="rounded-lg border border-white/15 bg-ink px-2 py-1 text-sm text-paper disabled:opacity-40"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Tarjeta>
    </>
  )
}

// ---------------------------------------------------------- TIENDA: ENVÍOS
export function TiendaEnvios() {
  const { a, guardar } = useAjustes()
  const costo = Number(a.costo_envio) || 0

  return (
    <>
      <Encabezado titulo="Costo de envío" bajada="Uno solo para todas las zonas." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Cuánto se cobra">
          <Texto
            label="Costo del envío"
            tipo="number"
            valor={a.costo_envio}
            onChange={(v) => guardar({ costo_envio: v })}
          />
          <p className="mt-3 text-xs text-ash">
            Se suma al total cuando el cliente elige delivery, sale en el WhatsApp
            de confirmación y en el ticket. Si lo dejás en 0, el envío es gratis.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Así lo ve el cliente">
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-ash">
              <span>Subtotal</span>
              <span>{pesos(19400)}</span>
            </div>
            <div className="flex justify-between text-ash">
              <span>Envío</span>
              <span>{costo === 0 ? 'gratis' : pesos(costo)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-white/10 pt-2">
              <span className="text-paper">Total</span>
              <span className="display text-xl text-amber">{pesos(19400 + costo)}</span>
            </div>
          </div>
          <p className="mt-4 text-xs text-ash">
            Para retirar en el local no se cobra nada de esto.
          </p>
        </Tarjeta>
      </div>
    </>
  )
}

// ----------------------------------------------------- TIENDA: CONFIGURACIÓN
export function TiendaConfig() {
  const { a, guardar } = useAjustes()

  return (
    <>
      <Encabezado titulo="Configuración de la tienda" bajada="Datos de contacto y reglas de venta." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Contacto">
          <div className="space-y-3">
            <Texto label="Teléfono de contacto" valor={a.telefono} onChange={(v) => guardar({ telefono: v })} />
            <Texto label="WhatsApp" valor={a.whatsapp} onChange={(v) => guardar({ whatsapp: v })} />
            <Texto label="Email" valor={a.email} onChange={(v) => guardar({ email: v })} />
            <Texto label="Dirección" valor={a.direccion} onChange={(v) => guardar({ direccion: v })} />
            <Texto label="Horario" valor={a.horario} onChange={(v) => guardar({ horario: v })} />
            <Texto label="Instagram" valor={a.instagram} onChange={(v) => guardar({ instagram: v })} />
          </div>
        </Tarjeta>

        <div className="space-y-5">
          <Tarjeta titulo="Configuración básica">
            <Interruptor label="Activar alertas sonoras" bajada="Suena cuando entra una comanda nueva." valor={a.alertas_sonoras} onChange={(v) => guardar({ alertas_sonoras: v })} />
            <Interruptor label="Imprimir comanda al aceptar el pedido" valor={a.imprimir_al_aceptar} onChange={(v) => guardar({ imprimir_al_aceptar: v })} />
            <Interruptor label="Rechazar pedidos sin stock" valor={a.rechazar_sin_stock} onChange={(v) => guardar({ rechazar_sin_stock: v })} />
            <Interruptor label="Ocultar productos sin disponibilidad" valor={a.ocultar_sin_stock} onChange={(v) => guardar({ ocultar_sin_stock: v })} />
          </Tarjeta>

          <Tarjeta titulo="Monto mínimo de compra">
            <Interruptor label="Habilitar monto mínimo" valor={a.monto_minimo_activo} onChange={(v) => guardar({ monto_minimo_activo: v })} />
            {a.monto_minimo_activo && (
              <div className="mt-3">
                <Texto label="Monto" tipo="number" valor={a.monto_minimo} onChange={(v) => guardar({ monto_minimo: v })} />
              </div>
            )}
          </Tarjeta>
        </div>
      </div>
    </>
  )
}

// ------------------------------------------------------ OPCIONES DE IMPRESIÓN
export function OpcionesImpresion({ ctrl }) {
  const { a, guardar } = useAjustes()
  const ultimo = ctrl.pedidos[0]

  const [pref, setPref] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('nasty.autoimprimir') ?? 'true')
    } catch {
      return true
    }
  })

  const cambiarPref = (v) => {
    setPref(v)
    try {
      localStorage.setItem('nasty.autoimprimir', JSON.stringify(v))
    } catch {
      /* sin storage */
    }
    guardar({ imprimir_al_aceptar: v })
  }

  return (
    <>
      <Encabezado titulo="Opciones de impresión" bajada="Cómo y cuándo sale la comanda por la térmica." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Comportamiento">
          <Interruptor
            label="Imprimir la comanda al aceptar el pedido"
            bajada="Sale sola en cuanto el empleado toca Aceptar."
            valor={pref}
            onChange={cambiarPref}
          />
          <Interruptor
            label="Imprimir el ticket al entregar"
            valor={a.imprimir_ticket_al_entregar}
            onChange={(v) => guardar({ imprimir_ticket_al_entregar: v })}
          />
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Texto label="Copias de cocina" tipo="number" valor={a.copias_cocina} onChange={(v) => guardar({ copias_cocina: v })} />
            <label className="block">
              <span className="mb-1.5 block text-[11px] font-bold uppercase tracking-widest text-ash">Ancho de papel</span>
              <select
                value={a.ancho_papel}
                onChange={(e) => guardar({ ancho_papel: e.target.value })}
                className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-sm text-paper"
              >
                <option>80mm</option>
                <option>58mm</option>
              </select>
            </label>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Que salga sola, sin el cuadro de imprimir">
          <p className="text-sm text-ash">
            Ningún navegador deja que una página imprima sin avisar: es una protección de seguridad. La forma
            de saltearla —la que usan todos los sistemas de punto de venta web— es abrir Chrome con la opción{' '}
            <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-paper">--kiosk-printing</code>. Con
            eso la comanda sale directo por la impresora predeterminada de Windows, sin ninguna ventana.
          </p>
          <ol className="mt-3 space-y-1.5 text-sm text-ash">
            <li>
              <span className="font-bold text-paper">1.</span> Dejá la térmica como impresora{' '}
              <span className="text-paper">predeterminada</span> de Windows.
            </li>
            <li>
              <span className="font-bold text-paper">2.</span> Abrí el sistema desde el acceso directo{' '}
              <span className="text-paper">«Nasty - impresión directa»</span> (está en la carpeta{' '}
              <code className="rounded bg-white/10 px-1 text-xs">impresion/</code> del proyecto).
            </li>
            <li>
              <span className="font-bold text-paper">3.</span> Probá acá abajo: si sale el papel sin que
              aparezca nada, ya está.
            </li>
          </ol>

          <p className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-4 py-3 text-sm text-paper">
            <span className="font-bold">Si te aparece el cuadro de imprimir</span>, es que el sistema no se
            abrió desde ese acceso directo. No hay forma de sacarlo desde acá: la decisión es del navegador.
          </p>

          <p className="mt-3 text-sm text-ash">
            La primera vez, con el cuadro abierto, entrá en{' '}
            <span className="text-paper">Más opciones de configuración</span> y poné{' '}
            <span className="text-paper">Márgenes: Ninguno</span> y{' '}
            <span className="text-paper">Escala: 100</span>. Chrome se acuerda, y desde el acceso directo sale
            así siempre.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Boton
              variante="primario"
              className="py-3"
              disabled={!ultimo}
              onClick={() => imprimirComandaCocina(ultimo)}
            >
              Imprimir comanda de prueba
            </Boton>
            <Boton className="py-3" disabled={!ultimo} onClick={() => imprimirTicket(ultimo)}>
              Imprimir ticket de prueba
            </Boton>
          </div>
          {!ultimo && <p className="mt-3 text-xs text-flame">Hace falta al menos un pedido cargado.</p>}
        </Tarjeta>
      </div>
    </>
  )
}

// ------------------------------------------------------------ DELIVERY APPS
export function DeliveryApps({ ctrl }) {
  const { a, guardar } = useAjustes()
  const [importando, setImportando] = useState(false)
  const dePY = ctrl.pedidos.filter((p) => p.origen === 'Pedidos Ya')
  const facturadoPY = dePY.reduce((s, p) => s + (p.total || 0), 0)

  return (
    <>
      <Encabezado titulo="Delivery Apps" bajada="Pedidos Ya y otras plataformas." />

      <FilaKpis cols={3}>
        <Kpi label="Pedidos de Pedidos Ya" valor={dePY.length} />
        <Kpi label="Facturado por Pedidos Ya" valor={pesos(facturadoPY)} tono="amber" />
        <Kpi label="Comisión estimada" valor={pesos(Math.round((facturadoPY * (a.py_comision || 0)) / 100))} />
      </FilaKpis>

      <div className="grid gap-5 lg:grid-cols-2">
        <Tarjeta titulo="Pedidos Ya">
          <div className="space-y-3">
            <Texto label="Código de restaurante" valor={a.py_codigo} onChange={(v) => guardar({ py_codigo: v })} />
            <Texto label="Tasa de comisión %" tipo="number" valor={a.py_comision} onChange={(v) => guardar({ py_comision: v })} />
          </div>
          <div className="mt-3">
            <Interruptor label="Aceptar pedidos automáticamente" valor={a.py_auto_aceptar} onChange={(v) => guardar({ py_auto_aceptar: v })} />
            <Interruptor label="Activar sonido" valor={a.py_sonido} onChange={(v) => guardar({ py_sonido: v })} />
            <Interruptor label="Rechazar pedido ante falta de stock" valor={a.rechazar_sin_stock} onChange={(v) => guardar({ rechazar_sin_stock: v })} />
          </div>

          <div className="mt-4 rounded-xl border border-flame/40 bg-flame/5 p-4 text-sm">
            <p className="font-bold text-flame">La conexión automática la habilita PedidosYa</p>
            <p className="mt-1 text-ash">
              Su API es de partners: se pide desde la cuenta del local y la habilitan ellos. Mientras tanto,
              los pedidos se pueden traer con la exportación CSV del portal de PedidosYa.
            </p>
            <Boton className="mt-3 py-2.5" onClick={() => setImportando(true)}>
              Importar CSV de Pedidos Ya
            </Boton>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Últimos pedidos de la plataforma">
          {dePY.length === 0 ? (
            <Vacio>Todavía no entró ningún pedido de Pedidos Ya.</Vacio>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {dePY.slice(0, 12).map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="px-2 py-2 font-bold text-paper">#{p.numero}</td>
                    <td className="px-2 py-2 text-ash">{p.cliente_nombre}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-amber">{pesos(p.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Tarjeta>
      </div>

      {importando && (
        <Tarjeta titulo="Importar CSV" className="mt-5">
          <p className="text-sm text-ash">
            Descargá el CSV desde el portal de PedidosYa y subilo acá. Formato esperado:
            <code className="ml-1 rounded bg-white/5 px-1.5 py-0.5 text-xs text-paper">
              fecha;cliente;telefono;direccion;total;productos
            </code>
          </p>
          <input
            type="file"
            accept=".csv"
            className="mt-3 block w-full text-sm text-ash file:mr-3 file:rounded-full file:border-0 file:bg-amber file:px-4 file:py-2 file:text-xs file:font-extrabold file:uppercase file:tracking-widest file:text-ink"
          />
          <p className="mt-3 text-xs text-ash">
            La lectura del archivo queda lista para conectar cuando tengamos un CSV real de ejemplo: hace falta
            ver los nombres exactos de las columnas que exporta el portal.
          </p>
        </Tarjeta>
      )}
    </>
  )
}

// ------------------------------------------------------------- CONFIG DE LA IA
export function ConfigIA() {
  const [clave, setClave] = useState(() => claveGuardada())
  const [editando, setEditando] = useState(() => !claveGuardada())
  const [probando, setProbando] = useState(false)
  const [resultado, setResultado] = useState(null)

  const guardada = claveGuardada()

  const guardar = () => {
    guardarClave(clave)
    setEditando(false)
    setResultado(null)
  }

  const probar = async () => {
    setProbando(true)
    setResultado(null)
    try {
      await probarClave()
      setResultado({ ok: true, texto: 'Funciona. La IA ya está andando.' })
    } catch (e) {
      setResultado({
        ok: false,
        texto:
          e.message === 'clave-mala'
            ? 'La clave no es válida. Fijate que la hayas copiado entera.'
            : e.message === 'sin-ia'
              ? 'Todavía no hay ninguna clave cargada.'
              : e.message,
      })
    } finally {
      setProbando(false)
    }
  }

  return (
    <>
      <Encabezado
        titulo="Asistente IA"
        bajada="La clave de Gemini que usa el asistente para entender lo que le pedís."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Tarjeta titulo="La clave">
          {guardada && !editando ? (
            <>
              <p className="text-sm text-ash">Ya hay una clave cargada en esta computadora.</p>
              <p className="mt-2 rounded-xl border border-white/10 bg-ink px-4 py-3 font-mono text-sm text-paper">
                {claveOculta(guardada)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Boton variante="primario" className="py-3" onClick={probar} disabled={probando}>
                  {probando ? 'Probando…' : 'Probar que funcione'}
                </Boton>
                <Boton className="py-3" onClick={() => setEditando(true)}>
                  Cambiarla
                </Boton>
                <Boton
                  className="py-3"
                  onClick={() => {
                    guardarClave('')
                    setClave('')
                    setEditando(true)
                    setResultado(null)
                  }}
                >
                  Borrarla
                </Boton>
              </div>
            </>
          ) : (
            <>
              <input
                value={clave}
                onChange={(e) => setClave(e.target.value)}
                type="password"
                autoComplete="off"
                spellCheck="false"
                placeholder="AIza…"
                className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3.5 font-mono text-sm text-paper placeholder:text-ash/70 focus:outline-none focus:ring-2 focus:ring-amber"
              />
              <div className="mt-3 flex gap-2">
                <Boton variante="primario" className="py-3" onClick={guardar} disabled={!clave.trim()}>
                  Guardar
                </Boton>
                {guardada && (
                  <Boton className="py-3" onClick={() => { setClave(guardada); setEditando(false) }}>
                    Cancelar
                  </Boton>
                )}
              </div>
            </>
          )}

          {resultado && (
            <p className={`mt-3 text-sm ${resultado.ok ? 'text-amber' : 'text-flame'}`}>
              {resultado.texto}
            </p>
          )}
        </Tarjeta>

        <Tarjeta titulo="Cómo se saca, gratis">
          <ol className="space-y-2 text-sm text-ash">
            <li>
              <span className="font-bold text-paper">1.</span> Entrá a{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-amber underline"
              >
                aistudio.google.com/apikey
              </a>{' '}
              con tu cuenta de Google.
            </li>
            <li>
              <span className="font-bold text-paper">2.</span> Apretá{' '}
              <span className="text-paper">Create API key</span>.
            </li>
            <li>
              <span className="font-bold text-paper">3.</span> Copiala y pegala acá al lado.
            </li>
          </ol>

          <p className="mt-4 text-sm text-ash">
            Cada consulta cuesta menos de un centavo de dólar, y el plan gratis de Google cubre de sobra el
            uso de un local. Igual, las frases de todos los días —«subí las hamburguesas un 10%»— las resuelve
            el sistema solo, sin IA y sin costo.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Dónde queda guardada" className="lg:col-span-2">
          <p className="text-sm text-ash">
            La clave queda en <span className="text-paper">este navegador</span>, no adentro del archivo del
            sistema. Podés pasarle el HTML a otra computadora sin regalar la clave, pero cualquiera que use
            esta PC puede leerla desde el inspector. Para un local está bien.
          </p>
          <p className="mt-2 text-sm text-ash">
            Cuando el sistema esté publicado en internet, lo correcto es la otra forma: la clave va en el
            servidor, en la variable <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-paper">GEMINI_API_KEY</code>,
            y el navegador nunca la ve. En ese caso, dejá este campo vacío.
          </p>
        </Tarjeta>

        <Tarjeta titulo="Qué puede y qué no puede hacer" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber">Puede</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ash">
                <li>Contestar preguntas sobre ventas, costos, márgenes y stock</li>
                <li>Proponer cambios de precios y promos, para que los confirmes vos</li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-widest text-flame">No puede</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ash">
                <li>Cambiar un precio sin que alguien apriete Aplicar</li>
                <li>Borrar productos, tocar el stock o modificar recetas</li>
                <li>Ver ni mandar datos personales de los clientes</li>
              </ul>
            </div>
          </div>
        </Tarjeta>
      </div>
    </>
  )
}
