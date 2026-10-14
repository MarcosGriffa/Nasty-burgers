import { Component } from 'react'

/**
 * La red de contención.
 *
 * Por qué existe: hasta ahora, cualquier error adentro de una pantalla tiraba
 * abajo TODA la aplicación y dejaba la ventana en negro. Negro no se puede
 * arreglar: no dice qué pasó, no dice en qué pantalla, y el encargado del local
 * -que no tiene por qué abrir la consola del navegador- solo ve que "se rompió".
 *
 * Con esto, el error queda encerrado donde pasó: el resto del sistema sigue en
 * pie, y la pantalla rota muestra el mensaje de verdad, que es lo único que
 * sirve para arreglarlo. Es lo mínimo que tiene que tener algo que va a estar
 * abierto en el mostrador mientras entran comandas.
 */
export default class Pantallazo extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Igual queda en la consola, para cuando sí hay alguien técnico mirando.
    console.error('Se rompió una pantalla:', error, info?.componentStack)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const donde = this.props.donde ? ` en ${this.props.donde}` : ''

    return (
      <div className="grid min-h-svh place-items-center bg-ink px-5 py-10">
        <div className="w-full max-w-lg">
          <p className="display text-3xl text-paper">
            Se rompió algo<span className="text-flame">.</span>
          </p>
          <p className="mt-2 text-sm text-ash">
            El sistema encontró un error{donde} y frenó ahí para no seguir con
            datos a medias. Los pedidos que ya estaban cargados no se tocaron.
          </p>

          <pre className="mt-5 max-h-56 overflow-auto rounded-xl border border-white/15 bg-ink-2 p-4 text-left text-[11px] leading-relaxed text-amber">
            {String(error?.message || error)}
          </pre>

          <p className="mt-4 text-xs text-ash">
            Mandale este texto a quien te armó el sistema: con eso alcanza para
            saber qué pasó.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => this.setState({ error: null })}
              className="rounded-full bg-amber px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-ink hover:bg-amber-deep"
            >
              Reintentar
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full border border-white/20 px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-widest text-paper hover:border-white/40"
            >
              Recargar la página
            </button>
          </div>
        </div>
      </div>
    )
  }
}
