import { lerp, useVelocidadScroll } from '../lib/scroll'

const FRASES = [
  'Delivery & Take Away',
  'Smash 120 g',
  'Benavídez',
  '10% OFF en efectivo',
  'Escobar',
  'Papas con sazonado propio',
]

function Fila({ duracion, invertida = false }) {
  const fila = [...FRASES, ...FRASES]
  return (
    <div
      className={`flex w-max items-center gap-8 pr-8 ${
        invertida ? 'animate-marquee-rev' : 'animate-marquee'
      }`}
      style={{ animationDuration: `${duracion}s` }}
    >
      {fila.map((f, i) => (
        <span
          key={i}
          className="display flex items-center gap-8 text-xl text-ink sm:text-2xl"
        >
          {f}
          <span className="text-ink/50">★</span>
        </span>
      ))}
    </div>
  )
}

export default function Marquee() {
  // la cinta acelera cuando el visitante scrollea rapido
  const v = useVelocidadScroll()
  const duracion = lerp(28, 7, v)

  return (
    <div className="overflow-hidden border-y-4 border-ink bg-flame py-3">
      <Fila duracion={duracion} />
      <div className="mt-1 opacity-60">
        <Fila duracion={duracion * 1.35} invertida />
      </div>
    </div>
  )
}
