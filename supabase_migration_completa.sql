-- =====================================================
-- MIGRACIÓN COMPLETA DE SUPABASE PARA VENDORA
-- Ejecuta este script COMPLETO en:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- =====================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- 1. TABLA: productos
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(100) UNIQUE NOT NULL,
    plu VARCHAR(50),
    nombre VARCHAR(255) NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    precio_venta DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 10,
    categoria VARCHAR(100) NOT NULL DEFAULT 'General',
    unidad VARCHAR(50) NOT NULL DEFAULT 'pza',
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 2. TABLA: ventas
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    impuesto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    metodo_pago VARCHAR(50) NOT NULL DEFAULT 'efectivo',
    cajero VARCHAR(255),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 3. TABLA: detalles_venta
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS detalles_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venta_id UUID REFERENCES ventas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00
);

-- ─────────────────────────────────────────────
-- 4. TABLA: movimientos_inventario
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('entrada', 'salida', 'ajuste', 'merma')),
    cantidad INTEGER NOT NULL,
    motivo TEXT,
    usuario_id VARCHAR(255),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 5. TABLA: arqueos_caja
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS arqueos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    monto_inicial DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_final_sistema DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    monto_fisico DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    diferencia DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    abierto_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL,
    cerrado_en TIMESTAMP WITH TIME ZONE
);

-- ─────────────────────────────────────────────
-- 6. TABLA: audit_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user" VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    detail TEXT,
    severity VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 7. TABLA: commissions
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cashier VARCHAR(255) NOT NULL,
    sales INTEGER NOT NULL DEFAULT 0,
    total_sales DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    commission DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    period VARCHAR(100) NOT NULL
);

-- ─────────────────────────────────────────────
-- 8. TABLA: usuarios  ← CORREGIDA CON email
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    rol VARCHAR(50) NOT NULL DEFAULT 'empleado' CHECK (rol IN ('admin', 'empleado')),
    estado VARCHAR(50) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Si la tabla ya existía sin el campo email, agrégalo así:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'email'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL DEFAULT 'pendiente@vendora.app';
    END IF;
END $$;

-- ─────────────────────────────────────────────
-- 9. TABLA: configuracion_negocio
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS configuracion_negocio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255),
    direccion TEXT,
    rfc VARCHAR(50),
    stock_minimo_alerta INTEGER DEFAULT 10,
    notif_caja BOOLEAN DEFAULT true,
    notif_stock BOOLEAN DEFAULT true,
    notif_auditoria BOOLEAN DEFAULT false,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- ─────────────────────────────────────────────
-- 10. TABLA: notificaciones
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mensaje TEXT NOT NULL,
    tipo VARCHAR(50) NOT NULL DEFAULT 'stock' CHECK (tipo IN ('stock', 'caja', 'auditoria')),
    leida BOOLEAN DEFAULT false,
    usuario_email VARCHAR(255),
    fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- =====================================================
-- RLS: Habilitar y crear políticas permisivas
-- =====================================================

ALTER TABLE productos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_venta          ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario  ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueos_caja            ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_negocio   ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones          ENABLE ROW LEVEL SECURITY;

-- Borrar políticas anteriores si existen (evita conflictos)
DROP POLICY IF EXISTS "allow_all_productos"             ON productos;
DROP POLICY IF EXISTS "allow_all_ventas"                ON ventas;
DROP POLICY IF EXISTS "allow_all_detalles_venta"        ON detalles_venta;
DROP POLICY IF EXISTS "allow_all_movimientos"           ON movimientos_inventario;
DROP POLICY IF EXISTS "allow_all_arqueos"               ON arqueos_caja;
DROP POLICY IF EXISTS "allow_all_audit_logs"            ON audit_logs;
DROP POLICY IF EXISTS "allow_all_commissions"           ON commissions;
DROP POLICY IF EXISTS "allow_all_usuarios"              ON usuarios;
DROP POLICY IF EXISTS "allow_all_configuracion"         ON configuracion_negocio;
DROP POLICY IF EXISTS "allow_all_notificaciones"        ON notificaciones;

-- Crear políticas permisivas para anon y authenticated
CREATE POLICY "allow_all_productos"             ON productos             FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_ventas"                ON ventas                FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_detalles_venta"        ON detalles_venta        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_movimientos"           ON movimientos_inventario FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_arqueos"               ON arqueos_caja          FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_audit_logs"            ON audit_logs            FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_commissions"           ON commissions           FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_usuarios"              ON usuarios              FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_configuracion"         ON configuracion_negocio FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notificaciones"        ON notificaciones        FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
