import { lazy, Suspense, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Destacadas from './components/Destacadas'
import Pedido from './components/Pedido'
import Locales from './components/Locales'
import Footer from './components/Footer'
import { useCarrito } from './hooks/useCarrito'
import { useReveals } from './lib/scroll'
import { useRuta } from './lib/ruta'
import Pantallazo from './components/Pantallazo'
import { SOLO_WEB } from './lib/entorno'

// En la version publica esto queda en null y el bundler se lleva puesto todo
// el panel: no viaja ni una pantalla del sistema al navegador del cliente.
const Shell = SOLO_WEB ? null : lazy(() => import('./panel/Shell'))

function Web() {
  const carrito = useCarrito()
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  useReveals()

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Marquee />
        <Destacadas />
        <Pedido
          carrito={carrito}
          drawerAbierto={drawerAbierto}
          setDrawerAbierto={setDrawerAbierto}
        />
        <Locales />
      </main>
      <Footer />
    </>
  )
}

export default function App() {
  const ruta = useRuta()
  // La clave hace que al cambiar de pantalla la red de contención se resetee:
  // si una pantalla quedó rota, irse a otra no tiene por qué arrastrar el error.
  // Sin panel, /panel no existe: el que llegue ahí de casualidad ve la web.
  const alPanel = ruta.startsWith('/panel') && Shell

  return (
    <Pantallazo key={ruta} donde={alPanel ? 'el sistema del local' : 'la web'}>
      {alPanel ? (
        <Suspense fallback={<div className="min-h-svh bg-ink" />}>
          <Shell />
        </Suspense>
      ) : (
        <Web />
      )}
    </Pantallazo>
  )
}
