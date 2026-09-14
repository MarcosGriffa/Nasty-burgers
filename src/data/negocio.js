// ---------------------------------------------------------------------------
// DATOS DEL NEGOCIO
// Todo lo editable esta aca. No hace falta tocar los componentes.
// ---------------------------------------------------------------------------

export const NEGOCIO = {
  nombre: 'Nasty Burgers',
  claim: 'Hamburguesas por Delivery & Take Away',
  whatsapp: '541140940880', // solo numeros, con codigo de pais
  email: 'nastyburgersbenavidez@gmail.com',
  instagram: 'nastyburgersarg',
  promoEfectivo: 0.1, // 10% OFF abonando en efectivo
  costoEnvio: null, // null = "a coordinar". Si pones un numero, se suma al total.
}

export const LOCALES = [
  {
    id: 'benavidez',
    nombre: 'Benavídez',
    direccion: 'Av. Alvear 3041, Benavídez',
    dias: 'Miércoles a Domingo',
    horario: '19:30 a 23:00',
    maps: 'https://www.google.com/maps/search/?api=1&query=Av.+Alvear+3041+Benavidez',
    whatsapp: '541140940880',
    // Con este mail entra el empleado de este local al sistema. Solo ve las
    // comandas de acá.
    cuenta: 'benavidez@nastyburgers.com',
  },
  {
    id: 'escobar',
    nombre: 'Escobar',
    direccion: 'Belén de Escobar',
    dias: 'Lunes a Domingo',
    horario: '19:30 a 23:00',
    maps: 'https://www.google.com/maps/search/?api=1&query=Nasty+Burgers+Escobar',
    whatsapp: '541140940880',
    cuenta: 'escobar@nastyburgers.com',
  },
]

// ---------------------------------------------------------------------------
// MENU
// img: nombre del archivo dentro de /public/img/. Si no existe, la card
// muestra un placeholder con el estilo de la marca (no se rompe nada).
// destacado: true -> aparece con el sello "TOP" y sale en la home.
// ---------------------------------------------------------------------------

export const CATEGORIAS = [
  {
    id: 'pampera',
    nombre: 'La Pampera',
    bajada: 'La burga del mundial',
    items: [
      {
        id: 'pampera-simple',
        nombre: 'Pampera Simple',
        desc: 'Pan de Papa + Medallón de 120 g + Cheddar + Provolone x2 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.',
        precio: 15500,
        img: 'pampera.jpg',
      },
      {
        id: 'pampera-doble',
        nombre: 'Pampera Doble',
        desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar + Provolone x4 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.',
        precio: 17700,
        img: 'pampera.jpg',
      },
      {
        id: 'pampera-triple',
        nombre: 'Pampera Triple',
        desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar + Provolone x6 + Bacon + Salsa Criolla Especial + Mayonesa. Con papas fritas.',
        precio: 19900,
        img: 'pampera.jpg',
      },
    ],
  },
  {
    id: 'promo',
    nombre: 'Promo Miércoles',
    bajada: 'Melt 2.0 con 10% OFF',
    items: [
      {
        id: 'melt-promo-simple',
        nombre: 'Melt 2.0 Simple',
        desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.',
        precio: 13680,
        img: 'melt-s.jpg',
        promo: true,
      },
      {
        id: 'melt-promo-doble',
        nombre: 'Melt 2.0 Doble',
        desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.',
        precio: 15660,
        img: 'melt-d.jpg',
        promo: true,
      },
      {
        id: 'melt-promo-triple',
        nombre: 'Melt 2.0 Triple',
        desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Cheddar + Bacon Bits + Mayonesa. Con papas fritas.',
        precio: 17640,
        img: 'melt-t.jpg',
        promo: true,
      },
    ],
  },
  {
    id: 'simples',
    nombre: 'Simples',
    bajada: 'Un medallón. Todas con papas fritas.',
    items: [
      { id: 'nasty-s', nombre: 'Nasty', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Cubos + Mayonesa + Ketchup.', precio: 14850, img: 'nasty-s.jpg' },
      { id: 'dirty-s', nombre: 'Dirty', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', precio: 14950, img: 'dirty-s.jpg' },
      { id: 'sick-s', nombre: 'Sick', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', precio: 14950, img: 'sick-s.jpg' },
      { id: 'critical-s', nombre: 'Critical', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Cebolla Crispy + Bacon + Salsa BBQ.', precio: 15500, img: 'critical-s.jpg' },
      { id: 'gross-s', nombre: 'Gross', desc: 'Pan de Papa + Medallón Smash 120 g + Cheddar x2 + Cebolla Smashed + Mayonesa.', precio: 15100, img: 'gross-s.jpg' },
      { id: 'muddy-s', nombre: 'Muddy', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Mermelada de Bacon + Bacon Bits + Mayonesa.', precio: 15100, img: 'muddy-s.jpg' },
      { id: 'stinky-s', nombre: 'Stinky', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', precio: 15200, img: 'stinky-s.jpg' },
      { id: 'melt-s', nombre: 'Melt 2.0', desc: 'Pan de Papa + Medallón de 120 g + Cheddar x2 + Salsa Cheddar + Bacon Bits + Mayonesa.', precio: 15200, img: 'melt-s.jpg' },
      { id: 'nbc-s', nombre: 'NBC', desc: 'Pan de papa + medallón de pollo frito + cheddar x2 + guacamole + cebolla morada + tomate.', precio: 14300, img: 'nbc.jpg' },
    ],
  },
  {
    id: 'dobles',
    nombre: 'Dobles',
    bajada: 'Dos medallones. Todas con papas fritas.',
    items: [
      { id: 'nasty-d', nombre: 'Nasty', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Cubos + Mayonesa + Ketchup.', precio: 17000, img: 'nasty-d.jpg' },
      { id: 'dirty-d', nombre: 'Dirty', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', precio: 17100, img: 'dirty-d.jpg' },
      { id: 'sick-d', nombre: 'Sick', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', precio: 17100, img: 'sick-d.jpg', destacado: true },
      { id: 'critical-d', nombre: 'Critical', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Cebolla Crispy + Bacon + Salsa BBQ.', precio: 17700, img: 'critical-d.jpg' },
      { id: 'gross-d', nombre: 'Gross', desc: 'Pan de Papa + 2 Medallones Smash 120 g + Cheddar x4 + Cebolla Smashed + Mayonesa.', precio: 17300, img: 'gross-d.jpg' },
      { id: 'muddy-d', nombre: 'Muddy', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Mermelada de Bacon + Bacon Bits + Mayonesa.', precio: 17300, img: 'muddy-d.jpg' },
      { id: 'stinky-d', nombre: 'Stinky', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', precio: 17400, img: 'stinky-d.jpg' },
      { id: 'melt-d', nombre: 'Melt 2.0', desc: 'Pan de Papa + 2 Medallones de 120 g + Cheddar x4 + Salsa Cheddar + Bacon Bits + Mayonesa.', precio: 17400, img: 'melt-d.jpg' },
    ],
  },
  {
    id: 'triples',
    nombre: 'Triples',
    bajada: 'Tres medallones. Para valientes.',
    items: [
      { id: 'nasty-t', nombre: 'Nasty', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Cubos + Mayonesa + Ketchup.', precio: 19200, img: 'nasty-t.jpg' },
      { id: 'dirty-t', nombre: 'Dirty', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Mil Islas + Cebolla Morada + Lechuga + Tomate.', precio: 19400, img: 'dirty-t.jpg', destacado: true },
      { id: 'sick-t', nombre: 'Sick', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Cubos + Bacon + Pepinos + Ketchup + Mostaza.', precio: 19400, img: 'sick-t.jpg' },
      { id: 'critical-t', nombre: 'Critical', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Cebolla Crispy + Bacon + Salsa BBQ.', precio: 19900, img: 'critical-t.jpg', destacado: true },
      { id: 'gross-t', nombre: 'Gross', desc: 'Pan de Papa + 3 Medallones Smash 120 g + Cheddar x6 + Cebolla Smashed + Mayonesa.', precio: 19500, img: 'gross-t.jpg' },
      { id: 'muddy-t', nombre: 'Muddy', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Mermelada de Bacon + Bacon Bits + Mayonesa.', precio: 19500, img: 'muddy-t.jpg' },
      { id: 'stinky-t', nombre: 'Stinky', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Roquefort + Bacon + Cebolla Caramelizada + Rúcula + Mayonesa.', precio: 19600, img: 'stinky-t.jpg' },
      { id: 'melt-t', nombre: 'Melt 2.0', desc: 'Pan de Papa + 3 Medallones de 120 g + Cheddar x6 + Salsa Cheddar + Bacon Bits + Mayonesa.', precio: 19600, img: 'melt-t.jpg' },
    ],
  },
  {
    id: 'papas',
    nombre: 'Papas',
    items: [
      { id: 'papas', nombre: 'Porción de papas fritas', desc: 'Con nuestro sazonado.', precio: 4200, img: 'papas.jpg' },
    ],
  },
  {
    id: 'extras',
    nombre: 'Extras',
    items: [
      { id: 'ex-bacon', nombre: 'Extra bacon', desc: '', precio: 1500 },
      { id: 'ex-cheddar', nombre: 'Extra cheddar en fetas x2', desc: '', precio: 1500 },
      { id: 'ex-medallon', nombre: 'Medallón extra + cheddar', desc: '', precio: 4700 },
      { id: 'cheeseburger', nombre: 'CheeseBurger', desc: 'Sumá una hamburguesa con queso.', precio: 10300 },
      { id: 'cheeseburger-papas', nombre: 'CheeseBurger c/ papas', desc: '', precio: 11500 },
    ],
  },
  {
    id: 'bebidas',
    nombre: 'Bebidas',
    items: [
      { id: 'agua', nombre: 'Agua mineral 500 ml', desc: 'Villavicencio.', precio: 2000 },
      { id: 'coca', nombre: 'Coca-Cola 500 ml', desc: '', precio: 3500 },
      { id: 'coca-zero', nombre: 'Coca-Cola Zero 500 ml', desc: '', precio: 3500 },
      { id: 'sprite', nombre: 'Sprite 500 ml', desc: '', precio: 3500 },
    ],
  },
  {
    id: 'cerveza',
    nombre: 'Cerveza',
    bajada: 'Imperial, línea completa.',
    items: [
      { id: 'imp-golden', nombre: 'Imperial Golden', desc: '', precio: 3000 },
      { id: 'imp-stout', nombre: 'Imperial Cream Stout', desc: '', precio: 3000 },
      { id: 'imp-apa', nombre: 'Imperial APA', desc: '', precio: 3000 },
      { id: 'imp-ipa', nombre: 'Imperial IPA', desc: '', precio: 3000 },
      { id: 'imp-lager', nombre: 'Imperial Extra Lager', desc: '', precio: 3000 },
    ],
  },
]

export const TODOS_LOS_ITEMS = CATEGORIAS.flatMap((c) =>
  c.items.map((i) => ({ ...i, categoriaId: c.id, categoriaNombre: c.nombre })),
)

// ---------------------------------------------------------------------------
// MENSAJES QUE EL LOCAL LE MANDA AL CLIENTE
// Se abren en WhatsApp ya escritos. Editalos a gusto: son texto plano.
// ---------------------------------------------------------------------------

/** $19.400,00 — el formato que usa el mensaje al cliente. */
const plata = (n) =>
  '$' +
  new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(Number(n) || 0))

const localDe = (id) => LOCALES.find((l) => l.id === id) ?? LOCALES[0]

export const MENSAJES = {
  /**
   * El que sale al aceptar la comanda. Las líneas de descuento y de envío
   * aparecen solo si el pedido las tiene.
   */
  aceptado: ({ nombre, numero, minutos, modalidad, local, direccion, subtotal, descuento, envio, total }) => {
    const l = [`Hola ${nombre}, confirmamos tu pedido #${numero} \u2705`]

    l.push(
      modalidad === 'delivery'
        ? `\ud83d\udef5 Dirección de entrega: ${direccion}`
        : '\ud83d\udce6 Tipo de entrega: Retiro en el local',
    )
    l.push(`\u23f0 Tiempo estimado: ${minutos} minutos`)

    l.push(`* Productos: ${plata(subtotal)}`)
    if (descuento > 0) l.push(`* Descuentos: -${plata(descuento)}`)
    if (modalidad === 'delivery' && envio > 0) l.push(`* Costo de envío: ${plata(envio)}`)
    l.push(`* Total: ${plata(total)}`)

    l.push('¡Gracias por tu compra!')
    l.push(`${NEGOCIO.nombre} - Local ${localDe(local).nombre}`)
    return l.join('\n')
  },

  en_envio: ({ nombre, numero }) =>
    `${nombre}, tu pedido #${numero} ya salió para tu dirección. En unos minutos está ahí.`,

  listo: ({ nombre, numero }) =>
    `${nombre}, tu pedido #${numero} ya está listo para retirar. Te esperamos.`,

  rechazado: ({ nombre, numero, motivo }) =>
    `Hola ${nombre}, lamentablemente no podemos tomar tu pedido #${numero}` +
    (motivo ? `: ${motivo}.` : ' en este momento.') +
    ` Perdón por la molestia.`,
}

/** Opciones rapidas de demora, en minutos, que ve el empleado al aceptar. */
export const DEMORAS = [15, 20, 25, 30, 40, 45, 60]
