// ---------------------------------------------------------------------------
// Datos iniciales del sistema, tomados de lo que ya está cargado en Fudo.
// Se cargan una sola vez, la primera vez que se abre cada pantalla.
// Todo es editable después desde el panel.
// ---------------------------------------------------------------------------

import { CATEGORIAS, NEGOCIO, TODOS_LOS_ITEMS } from './negocio.js'
import { nombreCompleto } from '../lib/utils.js'

const AREA = {
  pampera: 'Cocina',
  promo: 'Cocina',
  simples: 'Cocina',
  dobles: 'Cocina',
  triples: 'Cocina',
  papas: 'Cocina',
  extras: 'Cocina',
  bebidas: 'Mostrador',
  cerveza: 'Mostrador',
}

const NOMBRE_CAT = {
  pampera: 'La Pampera - Burga del Mundial',
  promo: 'Promo Miércoles - Melt 10% OFF',
  simples: 'Hamburguesas c/ Papas Fritas',
  dobles: 'Hamburguesas c/ Papas Fritas',
  triples: 'Hamburguesas c/ Papas Fritas',
  papas: 'Papas Fritas',
  extras: 'Extras',
  bebidas: 'Bebidas',
  cerveza: 'Cerveza',
}

const SUBCAT = { simples: 'Simple', dobles: 'Doble', triples: 'Triple' }

// ---------------------------------------------------------------------------
// INGREDIENTES
// ---------------------------------------------------------------------------

const ing = (nombre, categoria, unidad, costo, stock) => ({
  nombre,
  categoria,
  unidad,
  costo,
  stock,
  stock_minimo: 0,
})

export const INGREDIENTES = [
  ing('Medallón 120 g', 'Carne', 'un.', 1150, 480),
  ing('Bolita 120 g Smash', 'Carne', 'un.', 1150, 120),
  ing('Medallón de pollo frito', 'Pollo', 'un.', 1400, 40),
  ing('Bacon', 'Carne', 'g', 9, 4200),
  ing('Bacon bits', 'Carne', 'g', 11, 900),
  ing('Cheddar en fetas', 'Queso', 'un.', 320, 900),
  ing('Provolone', 'Queso', 'un.', 420, 180),
  ing('Cheddar líquido', 'Queso', 'g', 6, 5000),
  ing('Roquefort', 'Queso', 'g', 14, 800),
  ing('Pan de papa', 'Pan', 'un.', 780, 600),
  ing('Papas fritas', 'Papas fritas', 'g', 3, 42000),
  ing('Sazonado Nasty', 'Papas fritas', 'g', 22, 2400),
  ing('Cebolla en cubitos', 'Verduras', 'g', 2, 3500),
  ing('Cebolla morada', 'Verduras', 'g', 3, 2200),
  ing('Cebolla crispy', 'Verduras', 'g', 12, 1400),
  ing('Cebolla caramelizada', 'Verduras', 'g', 8, 900),
  ing('Cebolla smashed', 'Verduras', 'g', 5, 1100),
  ing('Lechuga', 'Verduras', 'g', 4, 1800),
  ing('Tomate', 'Verduras', 'g', 3, 2600),
  ing('Rúcula', 'Verduras', 'g', 9, 400),
  ing('Pickles', 'Verduras', 'g', 6, 1500),
  ing('Guacamole', 'Aderezos', 'g', 11, 700),
  ing('Mayonesa', 'Aderezos', 'g', 3, 6000),
  ing('Ketchup', 'Aderezos', 'g', 3, 5200),
  ing('Mostaza', 'Aderezos', 'g', 3, 2400),
  ing('Salsa mil islas', 'Aderezos', 'g', 5, 2800),
  ing('Salsa cheddar', 'Aderezos', 'g', 7, 3100),
  ing('Barbacoa', 'Aderezos', 'g', 6, 2600),
  ing('Mermelada de bacon', 'Aderezos', 'g', 15, 900),
  ing('Salsa criolla especial', 'Aderezos', 'g', 6, 1200),
  ing('Aceite Cañuelas', 'Cocinar', 'ml', 2, 18000),
  ing('Caja hamburguesa', 'Papelería', 'un.', 210, 800),
  ing('Bolsa papas fritas', 'Papelería', 'un.', 95, 900),
  ing('Bolsa polietileno', 'Papelería', 'un.', 60, 1200),
  ing('Aluminio plateado', 'Papelería', 'm', 40, 300),
  ing('Porta papas individual', 'Papelería', 'un.', 85, 700),
]

// ---------------------------------------------------------------------------
// RECETAS
// Se arman por familia: cada burger tiene sus toppings y el medallón y el
// cheddar se multiplican según sea simple, doble o triple. Con esto el costo
// de cada producto es real, el stock se descuenta solo y la web puede mostrar
// los ingredientes sin que nadie los escriba dos veces.
// ---------------------------------------------------------------------------

const l = (ingrediente, neta, merma = 0) => ({ ingrediente, neta, merma, mostrar_web: true })

// Lo que lleva toda burger, más allá del relleno.
const COMUNES = [
  l('Pan de papa', 1),
  l('Papas fritas', 150, 5),
  l('Aceite Cañuelas', 15),
  l('Caja hamburguesa', 1),
  l('Bolsa papas fritas', 1),
]

const RELLENO = {
  nasty: [l('Cebolla en cubitos', 20), l('Mayonesa', 15), l('Ketchup', 15)],
  dirty: [l('Salsa mil islas', 20), l('Cebolla morada', 15), l('Lechuga', 20), l('Tomate', 30)],
  sick: [l('Cebolla en cubitos', 20), l('Bacon', 30, 8), l('Pickles', 15), l('Ketchup', 15), l('Mostaza', 15)],
  critical: [l('Cebolla crispy', 20), l('Bacon', 30, 8), l('Barbacoa', 25)],
  gross: [l('Cebolla smashed', 25), l('Mayonesa', 15)],
  muddy: [l('Mermelada de bacon', 25), l('Bacon bits', 15), l('Mayonesa', 15)],
  stinky: [l('Roquefort', 25), l('Bacon', 30, 8), l('Cebolla caramelizada', 25), l('Rúcula', 10), l('Mayonesa', 15)],
  melt: [l('Salsa cheddar', 30), l('Bacon bits', 20), l('Mayonesa', 15)],
  nbc: [l('Guacamole', 25), l('Cebolla morada', 15), l('Tomate', 30)],
  pampera: [l('Bacon', 30, 8), l('Salsa criolla especial', 25), l('Mayonesa', 15)],
}

// Cuántas fetas de cheddar lleva cada tamaño (sale de la carta real).
const CHEDDAR = { Simple: 2, Doble: 4, Triple: 6 }
const MEDALLONES = { Simple: 1, Doble: 2, Triple: 3 }

function recetaDe(id, subcategoria) {
  const familia = id.replace(/-(s|d|t)$/, '').replace(/^melt-promo-/, 'melt').replace(/-(simple|doble|triple)$/, '')
  const relleno = RELLENO[familia]
  if (!relleno) return []

  const tam = subcategoria || 'Simple'
  const n = MEDALLONES[tam] ?? 1
  const carne =
    familia === 'gross'
      ? l('Bolita 120 g Smash', n)
      : familia === 'nbc'
        ? l('Medallón de pollo frito', 1)
        : l('Medallón 120 g', n, 5)

  const queso =
    familia === 'pampera'
      ? [l('Provolone', n * 2), l('Cheddar en fetas', 1)]
      : [l('Cheddar en fetas', CHEDDAR[tam] ?? 2)]

  return [COMUNES[0], carne, ...queso, ...relleno, ...COMUNES.slice(1)]
}

// ---------------------------------------------------------------------------
// PRODUCTOS
// ---------------------------------------------------------------------------

// Hasta que estén cargadas todas las recetas, el costo de lo que no tiene
// receta se estima entre el 18% y el 32% del precio, estable por producto.
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 1000, 7)
const costoEstimado = (precio, id) => Math.round((precio * (0.18 + (hash(id) / 1000) * 0.14)) / 10) * 10

const costoDeReceta = (receta) =>
  Math.round(
    receta.reduce((t, x) => {
      const i = INGREDIENTES.find((y) => y.nombre === x.ingrediente)
      return t + (Number(i?.costo) || 0) * x.neta * (1 + (x.merma || 0) / 100)
    }, 0),
  )

export const PRODUCTOS = [
  ...TODOS_LOS_ITEMS.map((i) => {
    const receta = recetaDe(i.id, SUBCAT[i.categoriaId] || (i.id.includes('doble') ? 'Doble' : i.id.includes('triple') ? 'Triple' : 'Simple'))
    return {
      codigo: i.id,
      nombre: nombreCompleto(i),
      categoria: NOMBRE_CAT[i.categoriaId] ?? i.categoriaNombre,
      subcategoria: SUBCAT[i.categoriaId] ?? '',
      area: AREA[i.categoriaId] ?? 'Cocina',
      receta,
      costo: receta.length ? costoDeReceta(receta) : costoEstimado(i.precio, i.id),
      costo_manual: !receta.length,
      precio: i.precio,
      descripcion: i.desc ?? '',
      img: i.img ?? '',
      destacado: !!i.destacado,
      promo: !!i.promo,
      activo: true,
      visible_web: true,
      permitir_vender_solo: true,
      controlar_stock: receta.length > 0,
      vender_sin_stock: true,
      proveedor: '',
      // Toda hamburguesa es un combo: viene con papas y el cliente elige el
      // tipo. Los demás grupos son opcionales.
      modificadores: receta.some((r) => r.ingrediente === 'Papas fritas')
        ? ['Papas', 'Punto de la carne', 'Extras', 'Sin qué']
        : [],
    }
  }),
]

export const CAT_PRODUCTOS = [
  { nombre: 'La Pampera - Burga del Mundial', area: 'Cocina', bajada: 'La burga del mundial' },
  { nombre: 'Promo Miércoles - Melt 10% OFF', area: 'Cocina', bajada: 'Melt 2.0 con 10% OFF' },
  { nombre: 'Hamburguesas c/ Papas Fritas', area: 'Cocina', bajada: '' },
  { nombre: 'Papas Fritas', area: 'Cocina', bajada: '' },
  { nombre: 'Extras', area: 'Cocina', bajada: '' },
  { nombre: 'Bebidas', area: 'Mostrador', bajada: '' },
  { nombre: 'Cerveza', area: 'Mostrador', bajada: 'Imperial, línea completa.' },
  { nombre: 'Promo 4x3 - Simples', area: 'Mostrador', bajada: '' },
  { nombre: 'Burga del Mes', area: 'Cocina', bajada: '' },
  { nombre: 'Promo Día de la Hamburguesa', area: 'Mostrador', bajada: '' },
]

export const CAT_INGREDIENTES = [
  { nombre: 'Aderezos' },
  { nombre: 'Carne' },
  { nombre: 'Cocinar' },
  { nombre: 'Medallones Vegetarianos' },
  { nombre: 'Pan' },
  { nombre: 'Papas fritas' },
  { nombre: 'Papelería' },
  { nombre: 'Pollo' },
  { nombre: 'Queso' },
  { nombre: 'Verduras' },
]

export const GRUPOS_MODIFICADORES = [
  {
    nombre: 'Papas',
    bajada: 'Todas las burgas vienen con papas. Elegí cómo las querés.',
    minimo: 1,
    maximo: 1,
    opciones: [
      { nombre: 'Papas normales', precio: 0 },
      // el sazonado se descuenta del stock aunque no cambie el precio
      { nombre: 'Papas sazonadas', precio: 0, ingrediente: 'Sazonado Nasty', cantidad: 8 },
    ],
  },
  {
    nombre: 'Punto de la carne',
    bajada: 'Si no elegís, sale a punto.',
    minimo: 0,
    maximo: 1,
    opciones: [
      { nombre: 'A punto', precio: 0 },
      { nombre: 'Bien cocida', precio: 0 },
    ],
  },
  {
    nombre: 'Extras',
    bajada: 'Sumale lo que quieras.',
    minimo: 0,
    maximo: 4,
    opciones: [
      { nombre: 'Bacon', precio: 1500, ingrediente: 'Bacon', cantidad: 30 },
      { nombre: 'Cheddar x2', precio: 1500, ingrediente: 'Cheddar en fetas', cantidad: 2 },
      { nombre: 'Medallón + cheddar', precio: 4700, ingrediente: 'Medallón 120 g', cantidad: 1 },
      { nombre: 'Cebolla crispy', precio: 1200, ingrediente: 'Cebolla crispy', cantidad: 20 },
    ],
  },
  {
    nombre: 'Sin qué',
    bajada: 'Si hay algo que no te va, marcalo.',
    minimo: 0,
    maximo: 5,
    opciones: [
      { nombre: 'Sin cebolla', precio: 0 },
      { nombre: 'Sin pepinillos', precio: 0 },
      { nombre: 'Sin tomate', precio: 0 },
      { nombre: 'Sin mayonesa', precio: 0 },
      { nombre: 'Sin ketchup', precio: 0 },
    ],
  },
]


export const PROVEEDORES = [
  { nombre: 'Agua Ivess', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'Bebidas Garin', email: '', telefono: '', direccion: 'Colectora Oeste 1890', saldo: 0 },
  { nombre: 'Carne Colo', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'Carnes Camfa', email: '', telefono: '1132456479', direccion: 'Dr. Ricardo Balbín 1203', saldo: 0 },
  { nombre: 'Distribuidora HUSA Cajas', email: '', telefono: '011 4489-1373', direccion: 'Av. Estanislao Zeballos 2682', saldo: 0 },
  { nombre: 'Distribuidora Marmol', email: '', telefono: '11 3888-1190', direccion: '', saldo: 0 },
  { nombre: 'Edenor', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'Gas Caracciolo', email: '', telefono: '', direccion: 'Av. Gral. Juan Domingo Perón 5649', saldo: 0 },
  { nombre: 'Inmobiliaria Puricelli', email: '', telefono: '011 4935-7588', direccion: 'Av. Alvear 2819', saldo: 0 },
  { nombre: 'Movistar', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'Papelera Coda', email: '', telefono: '', direccion: 'Hipólito Yrigoyen 538', saldo: 0 },
  { nombre: 'Porta Papas Individuales', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'The burger pan', email: '', telefono: '', direccion: '', saldo: 0 },
  { nombre: 'Verdulería Rosa', email: '', telefono: '', direccion: 'Av. Alvear 3050', saldo: 0 },
]

export const CAT_GASTOS = [
  { nombre: 'Gastos Generales', financiera: '', activo: true },
  { nombre: 'Proveedores', financiera: '', activo: true },
  { nombre: 'Sueldos', financiera: '', activo: true },
]

const diasAtras = (d) => {
  const f = new Date()
  f.setDate(f.getDate() - d)
  f.setHours(20, 0, 0, 0)
  return f.toISOString()
}

export const GASTOS = [
  { fecha: diasAtras(1), proveedor: 'Carnes Camfa', categoria: 'Proveedores', comentario: 'Medallones semana', medio_pago: 'Transferencia', estado: 'Pagado', importe: 480000 },
  { fecha: diasAtras(2), proveedor: 'The burger pan', categoria: 'Proveedores', comentario: 'Pan de papa', medio_pago: 'Efectivo', estado: 'Pagado', importe: 156000 },
  { fecha: diasAtras(3), proveedor: 'Verdulería Rosa', categoria: 'Proveedores', comentario: 'Verduras', medio_pago: 'Efectivo', estado: 'Pagado', importe: 63000 },
  { fecha: diasAtras(5), proveedor: 'Bebidas Garin', categoria: 'Proveedores', comentario: 'Gaseosas y cerveza', medio_pago: 'Transferencia', estado: 'A pagar', importe: 210000 },
  { fecha: diasAtras(8), proveedor: 'Edenor', categoria: 'Gastos Generales', comentario: 'Luz', medio_pago: 'Débito automático', estado: 'Pagado', importe: 184000 },
  { fecha: diasAtras(10), proveedor: 'Inmobiliaria Puricelli', categoria: 'Gastos Generales', comentario: 'Alquiler', medio_pago: 'Transferencia', estado: 'Pagado', importe: 950000 },
  { fecha: diasAtras(12), proveedor: 'Papelera Coda', categoria: 'Proveedores', comentario: 'Cajas y bolsas', medio_pago: 'Efectivo', estado: 'Pagado', importe: 98000 },
]

export const DESCUENTOS = [
  { nombre: 'Pago en efectivo', tipo: 'Porcentaje', valor: 10, activo: true },
  { nombre: 'Sin motivo', tipo: 'Monto', valor: 0, activo: true },
  { nombre: 'Empleados', tipo: 'Porcentaje', valor: 50, activo: true },
  { nombre: 'Clientes', tipo: 'Porcentaje', valor: 15, activo: true },
]

export const MEDIOS_PAGO = [
  { nombre: 'Efectivo', tipo: 'Efectivo', comision: 0, activo: true },
  { nombre: 'Mercado Pago', tipo: 'Online', comision: 3.5, activo: true },
  { nombre: 'Transferencia', tipo: 'Bancario', comision: 0, activo: true },
  { nombre: 'Tarjeta Débito', tipo: 'Tarjeta', comision: 1.8, activo: true },
  { nombre: 'Tarjeta Crédito', tipo: 'Tarjeta', comision: 3.2, activo: true },
]

export const CAJAS = [{ nombre: 'Principal', activa: true }]

export const CUENTAS_BANCARIAS = [{ nombre: 'Caja física', banco: '', numero: '', saldo: 0 }]

export const USUARIOS = [
  { nombre: 'nastyburger', email: 'nastyburgersbenavidez@gmail.com', rol: 'Administrador', activo: true },
  { nombre: 'Ramiro', email: '', rol: 'Cajero', activo: true },
  { nombre: 'Manu', email: '', rol: 'Cocina', activo: true },
  { nombre: 'Fede', email: '', rol: 'Cocina', activo: true },
  { nombre: 'Juanma', email: '', rol: 'Cocina', activo: true },
]

export const ROLES = [
  { nombre: 'Administrador', permisos: 'Todo' },
  { nombre: 'Cajero', permisos: 'Ventas, caja, comandas' },
  { nombre: 'Cocina', permisos: 'Comandas' },
]

export const AREAS_IMPRESION = [
  { nombre: 'Cocina', impresora: 'Térmica cocina', copias: 1 },
  { nombre: 'Mostrador', impresora: 'Térmica mostrador', copias: 1 },
]

export const IMPRESORAS = [
  { nombre: 'Térmica cocina', ancho: '80mm', tipo: 'Navegador', activa: true },
  { nombre: 'Térmica mostrador', ancho: '80mm', tipo: 'Navegador', activa: true },
]

export const LISTAS_PRECIOS = [{ nombre: '$2.000 menos', ajuste: -2000, tipo: 'Monto', activa: true }]

export const MENUS = [{ nombre: 'Menu Tienda Online', canal: 'Tienda Online', productos: 46, estado: 'Publicado' }]

export const TURNOS = [{ nombre: 'Noche', desde: '19:30', hasta: '23:00', activo: true }]

export const CATEGORIAS_WEB = CATEGORIAS.map((c) => c.nombre)

// ---------------------------------------------------------------------------
// TIENDA ONLINE
// ---------------------------------------------------------------------------

export const ZONAS_ENVIO = [
  { zona: 'Benavídez centro', hasta_km: 3, costo: 1500 },
  { zona: 'Benavídez resto', hasta_km: 6, costo: 2500 },
  { zona: 'Nordelta / Garín', hasta_km: 10, costo: 3800 },
]

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const AJUSTES_INICIALES = [
  {
    clave: 'general',
    tienda_activa: true,
    telefono: NEGOCIO.whatsapp,
    whatsapp: NEGOCIO.whatsapp,
    email: NEGOCIO.email,
    direccion: 'Av. Alvear 3041',
    horario: '19:30 - 23:00',
    instagram: `https://instagram.com/${NEGOCIO.instagram}`,
    facebook: '',
    monto_minimo_activo: false,
    monto_minimo: 0,
    ocultar_sin_stock: true,
    alertas_sonoras: true,
    imprimir_al_aceptar: true,
    imprimir_ticket_al_entregar: false,
    rechazar_sin_stock: false,
    copias_cocina: 1,
    ancho_papel: '80mm',
    // Delivery apps
    py_activo: false,
    py_codigo: '468828',
    py_comision: 0,
    py_auto_aceptar: false,
    py_sonido: true,
    // horarios: 7 días x {delivery:[desde,hasta,activo], retiro:...}
    horarios: DIAS.map((d, i) => ({
      dia: d,
      delivery: i >= 2 || i === 6,
      retiro: i >= 2 || i === 6,
      desde: '19:30',
      hasta: '23:00',
    })),
  },
]
