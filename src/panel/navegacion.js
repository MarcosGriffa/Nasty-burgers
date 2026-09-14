// Estructura de módulos y secciones — el mismo mapa que Fudo, sin Mesas,
// Mostrador express ni Reservas (el local no los usa).
//
// tipo 'tabs'    -> las secciones van en solapas arriba
// tipo 'lateral' -> las secciones van en una barra a la izquierda

export const MODULOS = [
  {
    id: 'ventas',
    titulo: 'Ventas',
    icono: 'cubiertos',
    tipo: 'tabs',
    secciones: [
      { id: 'delivery', titulo: 'Delivery', pantalla: 'VentasDelivery' },
      { id: 'mostrador', titulo: 'Mostrador', pantalla: 'VentasMostrador' },
    ],
  },
  {
    id: 'estadisticas',
    titulo: 'Estadísticas',
    icono: 'grafico',
    tipo: 'tabs',
    secciones: [
      { id: 'ventas', titulo: 'Ventas', pantalla: 'EstadisticasVentas' },
      { id: 'movimientos', titulo: 'Movimientos de caja', crud: 'movimientos_caja' },
      { id: 'arqueos', titulo: 'Arqueos de Caja', pantalla: 'Arqueos' },
      { id: 'descuentos', titulo: 'Descuentos', crud: 'descuentos' },
    ],
  },
  {
    id: 'gastos',
    titulo: 'Gastos',
    icono: 'calculadora',
    tipo: 'tabs',
    secciones: [
      { id: 'gastos', titulo: 'Gastos', crud: 'gastos' },
      { id: 'categorias', titulo: 'Cat. de Gastos', crud: 'cat_gastos' },
    ],
  },
  {
    id: 'finanzas',
    titulo: 'Finanzas',
    icono: 'lupa',
    tipo: 'tabs',
    secciones: [
      { id: 'cobrar', titulo: 'Cuentas a cobrar', pantalla: 'CuentasCobrar' },
      { id: 'resultados', titulo: 'Estado de resultados', pantalla: 'EstadoResultados' },
      { id: 'bancarias', titulo: 'Cuentas bancarias', crud: 'cuentas_bancarias' },
      { id: 'flujo', titulo: 'Flujo de Caja', pantalla: 'FlujoCaja' },
    ],
  },
  {
    id: 'ia',
    titulo: 'Asistente IA',
    icono: 'chispa',
    tipo: 'tabs',
    secciones: [
      { id: 'preguntar', titulo: 'Preguntar', pantalla: 'Preguntar' },
      { id: 'precios', titulo: 'Cambiar la carta', pantalla: 'Asistente' },
    ],
  },
  {
    id: 'productos',
    titulo: 'Productos',
    icono: 'caja',
    tipo: 'tabs',
    secciones: [
      { id: 'productos', titulo: 'Productos', crud: 'productos' },
      { id: 'ingredientes', titulo: 'Ingredientes', crud: 'ingredientes' },
      { id: 'modificadores', titulo: 'Grupos modificadores', crud: 'grupos_modificadores' },
      { id: 'cat-productos', titulo: 'Cat. de Productos', crud: 'cat_productos' },
      { id: 'cat-ingredientes', titulo: 'Cat. de Ingredientes', crud: 'cat_ingredientes' },
      { id: 'fichas', titulo: 'Fichas técnicas', pantalla: 'Fichas' },
      { id: 'stock', titulo: 'Stock', pantalla: 'Stock' },
      { id: 'inventario', titulo: 'Conteo de inventario', pantalla: 'Inventario' },
      { id: 'precios', titulo: 'Lista de precios', pantalla: 'ListaPrecios' },
      { id: 'menus', titulo: 'Menús', crud: 'menus' },
    ],
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    icono: 'persona',
    tipo: 'tabs',
    secciones: [{ id: 'clientes', titulo: 'Clientes', pantalla: 'Clientes' }],
  },
  {
    id: 'proveedores',
    titulo: 'Proveedores',
    icono: 'camion',
    tipo: 'tabs',
    secciones: [{ id: 'proveedores', titulo: 'Proveedores', crud: 'proveedores' }],
  },
  {
    id: 'reportes',
    titulo: 'Reportes',
    icono: 'reporte',
    tipo: 'lateral',
    secciones: [
      { id: 'ventas', titulo: 'Ventas', pantalla: 'EstadisticasVentas' },
      { id: 'productos', titulo: 'Productos', pantalla: 'ReporteProductos' },
      { id: 'stock', titulo: 'Stock', pantalla: 'Stock' },
      { id: 'gastos', titulo: 'Gastos', pantalla: 'ReporteGastos' },
      { id: 'balance', titulo: 'Balance', pantalla: 'Balance' },
    ],
  },
  {
    id: 'tienda',
    titulo: 'Tu Delivery',
    icono: 'tienda',
    tipo: 'lateral',
    secciones: [
      { id: 'inicio', titulo: 'Inicio', pantalla: 'TiendaInicio' },
      { id: 'horarios', titulo: 'Horarios', pantalla: 'TiendaHorarios' },
      { id: 'envios', titulo: 'Costos de envío', pantalla: 'TiendaEnvios' },
      { id: 'config', titulo: 'Configuración', pantalla: 'TiendaConfig' },
    ],
  },
  {
    id: 'config',
    titulo: 'Configuración',
    icono: 'engranaje',
    tipo: 'lateral',
    secciones: [
      { id: 'impresoras', titulo: 'Impresoras', crud: 'impresoras' },
      { id: 'areas', titulo: 'Áreas de impresión', crud: 'areas_impresion' },
      { id: 'opciones-impresion', titulo: 'Opciones de impresión', pantalla: 'OpcionesImpresion' },
      { id: 'cajas', titulo: 'Cajas', crud: 'cajas' },
      { id: 'medios-pago', titulo: 'Medios de Pago', crud: 'medios_pago' },
      { id: 'delivery-apps', titulo: 'Delivery Apps', pantalla: 'DeliveryApps' },
      { id: 'ia', titulo: 'Asistente IA', pantalla: 'ConfigIA' },
      { id: 'usuarios', titulo: 'Usuarios', crud: 'usuarios' },
      { id: 'roles', titulo: 'Roles de usuario', crud: 'roles' },
      { id: 'turnos', titulo: 'Turnos', crud: 'turnos' },
    ],
  },
]

export const rutaDe = (m, s) => `/panel/${m}/${s}`

export function resolverRuta(ruta) {
  const partes = ruta.replace(/^\/panel\/?/, '').split('/').filter(Boolean)
  const modulo = MODULOS.find((m) => m.id === partes[0]) ?? MODULOS[0]
  const seccion =
    modulo.secciones.find((s) => s.id === partes[1]) ?? modulo.secciones[0]
  return { modulo, seccion }
}

// Trazos de los iconos de la barra superior (24x24, stroke).
export const ICONOS = {
  chispa: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9zM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8z',
  cubiertos: 'M6 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M8 13v8M16 3c-1.5 1-2 3-2 5s.5 3 2 3v10',
  grafico: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  calculadora: 'M6 2h12v20H6zM9 6h6M8.5 11h.01M12 11h.01M15.5 11h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 19h7',
  lupa: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 21l-4.5-4.5',
  caja: 'M3 8l9-5 9 5v8l-9 5-9-5zM3 8l9 5 9-5M12 13v8',
  persona: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  camion: 'M2 7h11v10H2zM13 10h4l4 3v4h-8zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM18 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  reporte: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  tienda: 'M4 9h16l-1 11H5zM4 9l1-4h14l1 4M9 13v4M15 13v4',
  engranaje:
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 9 19.4a1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 4.6 9a1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z',
}
