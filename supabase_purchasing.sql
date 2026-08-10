-- =====================================================
-- MIGRACIÓN: REABASTECIMIENTO Y ORDENES DE COMPRA
-- Ejecuta en: Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- 1. Tabla de proveedores
CREATE TABLE IF NOT EXISTS proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  nombre VARCHAR(255) NOT NULL,
  asesor VARCHAR(255),
  telefono VARCHAR(50),
  email VARCHAR(255),
  dias_visita VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Habilitar RLS en proveedores
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_proveedores" ON proveedores;
CREATE POLICY "allow_all_proveedores" ON proveedores
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Vincular productos con proveedores
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_productos_proveedor ON productos(proveedor_id);

-- 3. Tabla de órdenes de compra
CREATE TABLE IF NOT EXISTS ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(100) UNIQUE NOT NULL,
  negocio_id UUID REFERENCES negocios(id) ON DELETE CASCADE,
  proveedor_id UUID REFERENCES proveedores(id) ON DELETE SET NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  costo_total DECIMAL(12,2) DEFAULT 0,
  estado VARCHAR(50) DEFAULT 'pendiente', -- 'pendiente', 'enviada', 'recibida'
  observaciones TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Habilitar RLS en ordenes_compra
ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_ordenes" ON ordenes_compra;
CREATE POLICY "allow_all_ordenes" ON ordenes_compra
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. Detalles de órdenes de compra
CREATE TABLE IF NOT EXISTS detalles_orden_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
  cantidad INT NOT NULL,
  costo_unitario DECIMAL(12,2) NOT NULL,
  subtotal DECIMAL(12,2) NOT NULL
);

-- Habilitar RLS en detalles_orden_compra
ALTER TABLE detalles_orden_compra ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_detalles_orden" ON detalles_orden_compra;
CREATE POLICY "allow_all_detalles_orden" ON detalles_orden_compra
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
