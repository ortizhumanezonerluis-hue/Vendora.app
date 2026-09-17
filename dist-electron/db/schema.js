"use strict";
/**
 * Vendora POS - SQLite Relational Schema
 * High-performance, offline-first relational database schema.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCHEMA_DDL = void 0;
exports.SCHEMA_DDL = `
-- Configuración de integridad y rendimiento
PRAGMA foreign_keys = ON;

-- 1. Negocio y Configuración
CREATE TABLE IF NOT EXISTS negocios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  email_contacto TEXT,
  telefono TEXT,
  direccion TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuracion_negocio (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL UNIQUE,
  moneda TEXT DEFAULT 'COP',
  impuesto_iva_defecto REAL DEFAULT 19,
  habilitar_granel INTEGER DEFAULT 1,
  unidad_medida_defecto TEXT DEFAULT 'kg',
  prefijo_factura TEXT DEFAULT 'POS-',
  consecutivo_actual INTEGER DEFAULT 1,
  tema TEXT DEFAULT 'light',
  nombre_comercial TEXT,
  nit_rut TEXT,
  impresora_nombre TEXT,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- 2. Usuarios y Roles
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('admin', 'cajero', 'supervisor', 'empleado')),
  pin_acceso TEXT,
  activo INTEGER DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- 3. Productos e Inventario
CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  codigo_barras TEXT,
  plu TEXT,
  nombre TEXT NOT NULL,
  precio_costo REAL NOT NULL DEFAULT 0,
  precio_venta REAL NOT NULL DEFAULT 0,
  stock_actual REAL NOT NULL DEFAULT 0,
  stock_minimo REAL NOT NULL DEFAULT 0,
  categoria TEXT NOT NULL DEFAULT 'General',
  es_granel INTEGER NOT NULL DEFAULT 0,
  unidad_medida TEXT NOT NULL DEFAULT 'UND',
  iva_porcentaje REAL DEFAULT 0,
  proveedor_id TEXT,
  imagen_url TEXT,
  activo INTEGER DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_productos_barcode ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_productos_negocio ON productos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);

-- 4. Movimientos de Inventario
CREATE TABLE IF NOT EXISTS movimientos_inventario (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida', 'ajuste', 'merma', 'venta', 'anulacion')),
  cantidad REAL NOT NULL,
  motivo TEXT,
  usuario_id TEXT,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_mov_producto ON movimientos_inventario(producto_id);
CREATE INDEX IF NOT EXISTS idx_mov_fecha ON movimientos_inventario(fecha);

-- 5. Clientes
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  documento TEXT,
  telefono TEXT,
  email TEXT,
  direccion TEXT,
  puntos INTEGER DEFAULT 0,
  notas TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

-- 6. Ventas y Comprobantes
CREATE TABLE IF NOT EXISTS ventas (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  consecutivo TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id TEXT NOT NULL,
  total REAL NOT NULL,
  subtotal REAL NOT NULL,
  iva_total REAL NOT NULL DEFAULT 0,
  metodo_pago TEXT NOT NULL CHECK(metodo_pago IN ('efectivo', 'transferencia', 'tarjeta', 'mixto')),
  monto_recibido REAL DEFAULT 0,
  cambio REAL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'completada' CHECK(estado IN ('completada', 'anulada')),
  cliente_id TEXT,
  cliente_nombre TEXT,
  notas TEXT,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_negocio ON ventas(negocio_id);

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id TEXT PRIMARY KEY,
  venta_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  producto_nombre TEXT NOT NULL,
  cantidad REAL NOT NULL,
  precio_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  iva_porcentaje REAL DEFAULT 0,
  iva_monto REAL DEFAULT 0,
  unidad_medida TEXT DEFAULT 'UND',
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_detalle_venta ON detalle_ventas(venta_id);

-- 7. Arqueos de Caja y Turnos
CREATE TABLE IF NOT EXISTS arqueos_caja (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  usuario_nombre TEXT NOT NULL,
  fecha_apertura DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_cierre DATETIME,
  monto_inicial REAL NOT NULL DEFAULT 0,
  efectivo_declarado REAL,
  efectivo_sistema REAL,
  diferencia REAL,
  total_ventas_efectivo REAL DEFAULT 0,
  total_ventas_transferencia REAL DEFAULT 0,
  total_ventas_tarjeta REAL DEFAULT 0,
  total_entradas REAL DEFAULT 0,
  total_salidas REAL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'abierto' CHECK(estado IN ('abierto', 'cerrado')),
  observaciones TEXT,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
  id TEXT PRIMARY KEY,
  arqueo_id TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
  monto REAL NOT NULL,
  motivo TEXT NOT NULL,
  usuario_id TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (arqueo_id) REFERENCES arqueos_caja(id) ON DELETE CASCADE
);

-- 8. Proveedores y Órdenes de Compra
CREATE TABLE IF NOT EXISTS proveedores (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  asesor TEXT,
  telefono TEXT,
  email TEXT,
  dias_visita TEXT,
  notas TEXT,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ordenes_compra (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  codigo TEXT NOT NULL,
  proveedor_id TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  costo_total REAL NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'enviada', 'recibida', 'cancelada')),
  observaciones TEXT,
  recibido_en DATETIME,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detalle_ordenes_compra (
  id TEXT PRIMARY KEY,
  orden_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  cantidad_pedida REAL NOT NULL,
  costo_unitario REAL NOT NULL,
  subtotal REAL NOT NULL,
  FOREIGN KEY (orden_id) REFERENCES ordenes_compra(id) ON DELETE CASCADE
);

-- 9. Auditorías Físicas
CREATE TABLE IF NOT EXISTS sesiones_auditoria (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  nombre TEXT NOT NULL,
  responsable TEXT NOT NULL,
  alcance TEXT NOT NULL CHECK(alcance IN ('todo', 'categoria', 'proveedor')),
  filtro_valor TEXT,
  ocultar_teorico INTEGER DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'en_proceso' CHECK(estado IN ('en_proceso', 'completada', 'cancelada')),
  diferencia_total REAL DEFAULT 0,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  finalizado_en DATETIME,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS detalles_sesion_auditoria (
  id TEXT PRIMARY KEY,
  sesion_id TEXT NOT NULL,
  producto_id TEXT NOT NULL,
  stock_sistema REAL NOT NULL,
  cantidad_contada REAL NOT NULL DEFAULT 0,
  diferencia REAL NOT NULL DEFAULT 0,
  costo_unitario REAL NOT NULL DEFAULT 0,
  diferencia_dinero REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (sesion_id) REFERENCES sesiones_auditoria(id) ON DELETE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
);

-- 10. Catálogo Maestro Offline (Diccionario de Búsqueda Inteligente)
CREATE TABLE IF NOT EXISTS catalogo_maestro_offline (
  barcode TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT,
  category TEXT NOT NULL,
  default_iva REAL DEFAULT 19,
  image_url TEXT,
  source TEXT DEFAULT 'offline_seed',
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cat_barcode ON catalogo_maestro_offline(barcode);
CREATE INDEX IF NOT EXISTS idx_cat_category ON catalogo_maestro_offline(category);

-- 11. Contabilidad (PUC, Asientos y Líneas)
CREATE TABLE IF NOT EXISTS cuentas_contables (
  id TEXT PRIMARY KEY,
  codigo TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL,
  naturaleza TEXT NOT NULL CHECK(naturaleza IN ('D', 'C')),
  nivel INTEGER NOT NULL DEFAULT 1,
  padre_id TEXT
);

CREATE TABLE IF NOT EXISTS asientos_contables (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  tipo_origen TEXT NOT NULL,
  origen_id TEXT,
  descripcion TEXT NOT NULL,
  total_debito REAL NOT NULL DEFAULT 0,
  total_credito REAL NOT NULL DEFAULT 0,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS asiento_lineas (
  id TEXT PRIMARY KEY,
  asiento_id TEXT NOT NULL,
  cuenta_codigo TEXT NOT NULL,
  cuenta_nombre TEXT NOT NULL,
  descripcion TEXT,
  debito REAL NOT NULL DEFAULT 0,
  credito REAL NOT NULL DEFAULT 0,
  FOREIGN KEY (asiento_id) REFERENCES asientos_contables(id) ON DELETE CASCADE
);

-- 12. Logs de Auditoría y Seguridad
CREATE TABLE IF NOT EXISTS logs_sistema (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL,
  fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario TEXT NOT NULL,
  accion TEXT NOT NULL,
  detalle TEXT NOT NULL,
  severidad TEXT NOT NULL DEFAULT 'info' CHECK(severidad IN ('info', 'warning', 'critical')),
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE
);
`;
