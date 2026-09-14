import * as S from '../data/semillas'

// ---------------------------------------------------------------------------
// Definición de las pantallas de ABM. Cada una declara columnas y campos, y
// el componente genérico Crud.jsx se encarga del resto (buscar, alta, edición,
// borrado, panel de detalle, exportar CSV).
//
// tipo de campo: texto | area | numero | moneda | select | bool | fecha
// ---------------------------------------------------------------------------

const t = (k, label, extra = {}) => ({ k, label, tipo: 'texto', ...extra })
const n = (k, label, extra = {}) => ({ k, label, tipo: 'numero', ...extra })
const m = (k, label, extra = {}) => ({ k, label, tipo: 'moneda', ...extra })
const b = (k, label, extra = {}) => ({ k, label, tipo: 'bool', ...extra })
const sel = (k, label, opciones, extra = {}) => ({ k, label, tipo: 'select', opciones, ...extra })

export const ENTIDADES = {
  productos: {
    titulo: 'Productos',
    singular: 'producto',
    semilla: S.PRODUCTOS,
    editor: 'producto', // usa la pantalla completa con receta, foto y vista previa
    agrupar: 'categoria',
    buscar: ['nombre', 'codigo', 'categoria'],
    columnas: [
      { k: 'codigo', label: 'Cód.', ancho: '90px' },
      { k: 'nombre', label: 'Producto', principal: true },
      { k: 'costo', label: 'Costo', tipo: 'moneda', num: true },
      { k: 'margen', label: 'Margen $', tipo: 'moneda', num: true, calc: (f) => (f.precio || 0) - (f.costo || 0) },
      { k: 'margenpc', label: 'Margen %', num: true, calc: (f) => (f.precio ? `${Math.round(((f.precio - f.costo) / f.precio) * 100)} %` : '-') },
      { k: 'markup', label: 'Markup %', num: true, calc: (f) => (f.costo ? `${Math.round(((f.precio - f.costo) / f.costo) * 100)} %` : '-') },
      { k: 'receta', label: 'Ingr.', num: true, calc: (f) => (f.receta?.length ? f.receta.length : '—') },
      { k: 'visible_web', label: 'Web', calc: (f) => (f.visible_web === false ? 'oculto' : 'sí') },
      { k: 'precio', label: 'Precio', tipo: 'moneda', num: true },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      t('codigo', 'Código'),
      sel('categoria', 'Categoría', () => S.CAT_PRODUCTOS.map((c) => c.nombre)),
      t('subcategoria', 'Subcategoría'),
      sel('area', 'Área de impresión', ['Cocina', 'Mostrador']),
      m('costo', 'Costo'),
      m('precio', 'Precio', { requerido: true }),
      b('activo', 'Activo'),
      b('vender_sin_stock', 'Permitir vender sin stock'),
    ],
  },

  ingredientes: {
    titulo: 'Ingredientes',
    singular: 'ingrediente',
    semilla: S.INGREDIENTES,
    agrupar: 'categoria',
    buscar: ['nombre', 'categoria'],
    columnas: [
      { k: 'nombre', label: 'Ingrediente', principal: true },
      { k: 'unidad', label: 'Unidad' },
      { k: 'costo', label: 'Costo unitario', tipo: 'moneda', num: true },
      { k: 'stock', label: 'Stock', num: true },
      { k: 'stock_minimo', label: 'Stock mínimo', num: true },
      { k: 'valor', label: 'Valorizado', tipo: 'moneda', num: true, calc: (f) => (f.costo || 0) * (f.stock || 0) },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('categoria', 'Categoría', () => S.CAT_INGREDIENTES.map((c) => c.nombre)),
      sel('unidad', 'Unidad', ['un.', 'g', 'kg', 'ml', 'l', 'm']),
      m('costo', 'Costo por unidad'),
      n('stock', 'Stock actual'),
      n('stock_minimo', 'Stock mínimo'),
    ],
  },

  cat_productos: {
    titulo: 'Categorías de productos',
    singular: 'categoría',
    semilla: S.CAT_PRODUCTOS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'area', label: 'Área de impresión' },
    ],
    campos: [t('nombre', 'Nombre', { requerido: true }), sel('area', 'Área de impresión', ['Cocina', 'Mostrador'])],
    contarEn: { coleccion: 'productos', campo: 'categoria', label: 'Productos asociados' },
  },

  cat_ingredientes: {
    titulo: 'Categorías de ingredientes',
    singular: 'categoría',
    semilla: S.CAT_INGREDIENTES,
    buscar: ['nombre'],
    columnas: [{ k: 'nombre', label: 'Nombre', principal: true }],
    campos: [t('nombre', 'Nombre', { requerido: true })],
    contarEn: { coleccion: 'ingredientes', campo: 'categoria', label: 'Ingredientes asociados' },
  },

  grupos_modificadores: {
    titulo: 'Grupos modificadores',
    singular: 'grupo',
    semilla: S.GRUPOS_MODIFICADORES,
    editor: 'modificador', // pantalla propia: las opciones son una tabla, no un campo
    buscar: ['nombre', 'bajada'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'bajada', label: 'Bajada' },
      {
        k: 'opciones',
        label: 'Opciones',
        num: true,
        calc: (f) => (f.opciones?.length ? f.opciones.length : '—'),
      },
      {
        k: 'obligatorio',
        label: '¿Obligatorio?',
        calc: (f) => ((f.minimo ?? 0) >= 1 ? 'sí' : 'no'),
      },
      { k: 'minimo', label: 'Cant. mínima', num: true },
      { k: 'maximo', label: 'Cant. máxima', num: true },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      t('bajada', 'Bajada'),
      n('minimo', 'Cantidad mínima'),
      n('maximo', 'Cantidad máxima'),
    ],
  },

  menus: {
    titulo: 'Menús',
    singular: 'menú',
    semilla: S.MENUS,
    buscar: ['nombre', 'canal'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'canal', label: 'Canal' },
      { k: 'productos', label: 'Productos', num: true },
      { k: 'estado', label: 'Estado', chip: true },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('canal', 'Canal', ['Tienda Online', 'Mostrador', 'Pedidos Ya']),
      n('productos', 'Cantidad de productos'),
      sel('estado', 'Estado', ['Publicado', 'Borrador']),
    ],
  },

  proveedores: {
    titulo: 'Proveedores',
    singular: 'proveedor',
    semilla: S.PROVEEDORES,
    buscar: ['nombre', 'telefono', 'direccion'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'email', label: 'Email' },
      { k: 'telefono', label: 'Teléfono' },
      { k: 'direccion', label: 'Dirección' },
      { k: 'saldo', label: 'Saldo', tipo: 'moneda', num: true },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      t('email', 'Email'),
      t('telefono', 'Teléfono'),
      t('direccion', 'Dirección'),
      m('saldo', 'Saldo'),
    ],
  },

  gastos: {
    titulo: 'Gastos',
    singular: 'gasto',
    semilla: S.GASTOS,
    buscar: ['proveedor', 'categoria', 'comentario'],
    ordenar: { campo: 'fecha', desc: true },
    totalizar: 'importe',
    columnas: [
      { k: 'fecha', label: 'Fecha', tipo: 'fecha' },
      { k: 'proveedor', label: 'Proveedor', principal: true },
      { k: 'categoria', label: 'Categoría' },
      { k: 'comentario', label: 'Comentario' },
      { k: 'medio_pago', label: 'Medio de pago' },
      { k: 'estado', label: 'Estado del pago', chip: true },
      { k: 'importe', label: 'Importe', tipo: 'moneda', num: true },
    ],
    campos: [
      { k: 'fecha', label: 'Fecha', tipo: 'fecha', requerido: true },
      sel('proveedor', 'Proveedor', () => S.PROVEEDORES.map((p) => p.nombre)),
      sel('categoria', 'Categoría', () => S.CAT_GASTOS.map((c) => c.nombre)),
      t('comentario', 'Comentario'),
      sel('medio_pago', 'Medio de pago', ['Efectivo', 'Transferencia', 'Tarjeta', 'Débito automático']),
      sel('estado', 'Estado del pago', ['Pagado', 'A pagar']),
      m('importe', 'Importe', { requerido: true }),
    ],
  },

  cat_gastos: {
    titulo: 'Categorías de gastos',
    singular: 'categoría',
    semilla: S.CAT_GASTOS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'financiera', label: 'Categoría financiera' },
      { k: 'activo', label: 'Activo', tipo: 'bool' },
    ],
    campos: [t('nombre', 'Nombre', { requerido: true }), t('financiera', 'Categoría financiera'), b('activo', 'Activo')],
    contarEn: { coleccion: 'gastos', campo: 'categoria', label: 'Gastos asociados' },
  },

  movimientos_caja: {
    titulo: 'Movimientos de caja',
    singular: 'movimiento',
    buscar: ['comentario', 'tipo', 'caja'],
    ordenar: { campo: 'fecha', desc: true },
    totalizar: 'monto',
    columnas: [
      { k: 'fecha', label: 'Fecha', tipo: 'fecha' },
      { k: 'caja', label: 'Caja' },
      { k: 'monto', label: 'Monto', tipo: 'moneda', num: true },
      { k: 'tipo', label: 'Tipo', chip: true },
      { k: 'comentario', label: 'Comentario', principal: true },
    ],
    campos: [
      { k: 'fecha', label: 'Fecha', tipo: 'fecha', requerido: true },
      sel('caja', 'Caja', () => S.CAJAS.map((c) => c.nombre)),
      sel('tipo', 'Tipo', ['Ingreso', 'Egreso'], { requerido: true }),
      m('monto', 'Monto', { requerido: true }),
      t('comentario', 'Comentario'),
    ],
  },

  descuentos: {
    titulo: 'Descuentos',
    singular: 'descuento',
    semilla: S.DESCUENTOS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'tipo', label: 'Tipo' },
      { k: 'valor', label: 'Valor', num: true, calc: (f) => (f.tipo === 'Porcentaje' ? `${f.valor} %` : f.valor) },
      { k: 'activo', label: 'Estado', tipo: 'bool' },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('tipo', 'Tipo', ['Porcentaje', 'Monto']),
      n('valor', 'Valor'),
      b('activo', 'Activo'),
    ],
  },

  cuentas_bancarias: {
    titulo: 'Cuentas bancarias',
    singular: 'cuenta',
    semilla: S.CUENTAS_BANCARIAS,
    buscar: ['nombre', 'banco'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'banco', label: 'Banco' },
      { k: 'numero', label: 'N° de cuenta' },
      { k: 'saldo', label: 'Saldo', tipo: 'moneda', num: true },
    ],
    campos: [t('nombre', 'Nombre', { requerido: true }), t('banco', 'Banco'), t('numero', 'N° de cuenta'), m('saldo', 'Saldo')],
  },

  cajas: {
    titulo: 'Cajas',
    singular: 'caja',
    semilla: S.CAJAS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'activa', label: 'Activa', tipo: 'bool' },
    ],
    campos: [t('nombre', 'Nombre', { requerido: true }), b('activa', 'Activa')],
  },

  medios_pago: {
    titulo: 'Medios de pago',
    singular: 'medio de pago',
    semilla: S.MEDIOS_PAGO,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'tipo', label: 'Tipo' },
      { k: 'comision', label: 'Comisión %', num: true },
      { k: 'activo', label: 'Activo', tipo: 'bool' },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('tipo', 'Tipo', ['Efectivo', 'Tarjeta', 'Online', 'Bancario']),
      n('comision', 'Comisión %'),
      b('activo', 'Activo'),
    ],
  },

  impresoras: {
    titulo: 'Impresoras',
    singular: 'impresora',
    semilla: S.IMPRESORAS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'ancho', label: 'Ancho de papel' },
      { k: 'tipo', label: 'Conexión' },
      { k: 'activa', label: 'Activa', tipo: 'bool' },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('ancho', 'Ancho de papel', ['58mm', '80mm']),
      sel('tipo', 'Conexión', ['Navegador', 'Red (IP)', 'USB']),
      b('activa', 'Activa'),
    ],
  },

  areas_impresion: {
    titulo: 'Áreas de impresión',
    singular: 'área',
    semilla: S.AREAS_IMPRESION,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'impresora', label: 'Impresora' },
      { k: 'copias', label: 'Copias', num: true },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      sel('impresora', 'Impresora', () => S.IMPRESORAS.map((i) => i.nombre)),
      n('copias', 'Copias'),
    ],
  },

  usuarios: {
    titulo: 'Usuarios',
    singular: 'usuario',
    semilla: S.USUARIOS,
    buscar: ['nombre', 'email', 'rol'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'email', label: 'Email' },
      { k: 'rol', label: 'Rol' },
      { k: 'activo', label: 'Activo', tipo: 'bool' },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      t('email', 'Email'),
      sel('rol', 'Rol', () => S.ROLES.map((r) => r.nombre)),
      b('activo', 'Activo'),
    ],
  },

  roles: {
    titulo: 'Roles de usuario',
    singular: 'rol',
    semilla: S.ROLES,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'permisos', label: 'Permisos' },
    ],
    campos: [t('nombre', 'Nombre', { requerido: true }), t('permisos', 'Permisos')],
  },

  turnos: {
    titulo: 'Turnos',
    singular: 'turno',
    semilla: S.TURNOS,
    buscar: ['nombre'],
    columnas: [
      { k: 'nombre', label: 'Nombre', principal: true },
      { k: 'desde', label: 'Desde' },
      { k: 'hasta', label: 'Hasta' },
      { k: 'activo', label: 'Activo', tipo: 'bool' },
    ],
    campos: [
      t('nombre', 'Nombre', { requerido: true }),
      t('desde', 'Desde'),
      t('hasta', 'Hasta'),
      b('activo', 'Activo'),
    ],
  },
}
