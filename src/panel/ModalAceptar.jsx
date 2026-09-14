import { useState } from 'react'
import { DEMORAS } from '../data/negocio'

export default function ModalAceptar({ pedido, onCancelar, onAceptar }) {
  const [minutos, setMinutos] = useState(pedido.modalidad === 'delivery' ? 40 : 25)
  const [otro, setOtro] = useState('')

  const valor = otro ? Number(otro) : minutos
  const valido = Number.isFinite(valor) && valor > 0 && valor <= 240

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-ink-2 p-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-amber">
          Aceptar comanda #{pedido.numero}
        </p>
        <h3 className="display mt-2 text-3xl text-paper">¿Cuánto va a demorar?</h3>
        <p className="mt-2 text-sm text-ash">
          {pedido.modalidad === 'delivery'
            ? 'Tiempo estimado hasta que salga el envío.'
            : 'Tiempo estimado hasta que esté listo para retirar.'}
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {DEMORAS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMinutos(m)
                setOtro('')
              }}
              className={`rounded-xl border py-3 text-sm font-extrabold transition-colors ${
                !otro && minutos === m
                  ? 'border-amber bg-amber text-ink'
                  : 'border-white/15 text-paper hover:border-white/40'
              }`}
            >
              {m}′
            </button>
          ))}
          <input
            value={otro}
            onChange={(e) => setOtro(e.target.value.replace(/\D/g, ''))}
            placeholder="Otro"
            inputMode="numeric"
            className="rounded-xl border border-white/15 bg-ink px-2 py-3 text-center text-sm font-extrabold text-paper placeholder:text-ash/60 focus:outline-none focus:ring-2 focus:ring-amber"
          />
        </div>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            disabled={!valido}
            onClick={() => onAceptar(valor, true)}
            className={`rounded-full px-5 py-4 text-sm font-extrabold uppercase tracking-widest ${
              valido
                ? 'bg-[#25D366] text-ink hover:scale-[1.02]'
                : 'cursor-not-allowed bg-white/10 text-ash'
            }`}
          >
            Aceptar y avisar
          </button>
          <button
            type="button"
            disabled={!valido}
            onClick={() => onAceptar(valor, false)}
            className="rounded-full border border-white/20 px-5 py-4 text-sm font-extrabold uppercase tracking-widest text-paper hover:border-white/50"
          >
            Aceptar sin avisar
          </button>
        </div>
        <button
          type="button"
          onClick={onCancelar}
          className="mt-3 w-full text-xs font-semibold uppercase tracking-widest text-ash hover:text-paper"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
