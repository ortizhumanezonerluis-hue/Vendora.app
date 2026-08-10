-- Habilitar extensión UUID si no está activa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Productos
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    plu VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 10,
    categoria VARCHAR(100) NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabla de Ventas
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    usuario_id VARCHAR(100) NOT NULL, -- Identificador o nombre del cajero
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(50) CHECK (metodo_pago IN ('efectivo', 'transferencia', 'tarjeta')) NOT NULL,
    estado VARCHAR(50) CHECK (estado IN ('completada', 'anulada')) DEFAULT 'completada' NOT NULL
);

-- 3. Tabla de Detalles de Venta
CREATE TABLE IF NOT EXISTS detalles_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE NOT NULL,
    producto_id UUID REFERENCES productos(id) ON DELETE RESTRICT NOT NULL,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL
);

-- 4. Tabla de Movimientos de Inventario (Kardex)
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE NOT NULL,
    tipo VARCHAR(50) CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'merma')) NOT NULL,
    cantidad INTEGER NOT NULL,
    motivo VARCHAR(255) NOT NULL,
    usuario_id VARCHAR(100) NOT NULL,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabla de Arqueos de Caja
CREATE TABLE IF NOT EXISTS arqueos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE,
    usuario_id VARCHAR(100) NOT NULL,
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    efectivo_declarado DECIMAL(10,2),
    efectivo_sistema DECIMAL(10,2),
    diferencia DECIMAL(10,2),
    estado VARCHAR(50) CHECK (estado IN ('abierto', 'cerrado')) DEFAULT 'abierto' NOT NULL
);

-- 6. Tabla de Logs de Auditoría (Seguridad)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "user" VARCHAR(100) NOT NULL,
    action VARCHAR(150) NOT NULL,
    detail TEXT NOT NULL,
    severity VARCHAR(50) CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info' NOT NULL
);

-- 7. Tabla de Comisiones
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier VARCHAR(100) NOT NULL,
    sales INTEGER NOT NULL DEFAULT 0,
    total_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    period VARCHAR(100) NOT NULL
);

-- 8. Tabla de Usuarios del sistema
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(100) NOT NULL DEFAULT 'empleado',
    estado VARCHAR(50) CHECK (estado IN ('activo', 'inactivo')) DEFAULT 'activo' NOT NULL,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Tabla de Configuración del Negocio (solo un registro)
CREATE TABLE IF NOT EXISTS configuracion_negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255),
    direccion TEXT,
    rfc VARCHAR(50),
    stock_minimo_alerta INTEGER DEFAULT 10,
    notif_caja BOOLEAN DEFAULT true,
    notif_stock BOOLEAN DEFAULT true,
    notif_auditoria BOOLEAN DEFAULT false,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
