import { useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Marquee from './components/Marquee'
import Destacadas from './components/Destacadas'
import Pedido from './components/Pedido'
import Locales from './components/Locales'
import Footer from './components/Footer'
import Shell from './panel/Shell'
import { useCarrito } from './hooks/useCarrito'
import { useReveals } from './lib/scroll'
import { useRuta } from './lib/ruta'

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
  return ruta.startsWith('/panel') ? <Shell /> : <Web />
}
