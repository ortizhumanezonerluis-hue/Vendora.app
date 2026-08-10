-- =====================================================
-- MIGRACIÓN: MULTI-TENANCY (AISLAMIENTO POR NEGOCIO)
-- Ejecuta en: Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- 1. Tabla de negocios (cada empresa registrada desde Login)
CREATE TABLE IF NOT EXISTS negocios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

ALTER TABLE negocios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_negocios" ON negocios;
CREATE POLICY "allow_all_negocios" ON negocios
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 2. Agregar negocio_id a todas las tablas clave
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE ventas ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE movimientos_inventario ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);

-- configuracion_negocio: cada negocio tiene SU configuracion
ALTER TABLE configuracion_negocio ADD COLUMN IF NOT EXISTS negocio_id UUID REFERENCES negocios(id);

-- 3. Índices de rendimiento para todos los filtros por negocio
CREATE INDEX IF NOT EXISTS idx_usuarios_negocio ON usuarios(negocio_id);
CREATE INDEX IF NOT EXISTS idx_productos_negocio ON productos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_ventas_negocio ON ventas(negocio_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_negocio ON arqueos_caja(negocio_id);
CREATE INDEX IF NOT EXISTS idx_notif_negocio ON notificaciones(negocio_id);
CREATE INDEX IF NOT EXISTS idx_audit_negocio ON audit_logs(negocio_id);

-- 4. IMPORTANTE: Para los datos existentes, créa un negocio "legacy" y asígnalo
-- a todos los registros que aún no tienen negocio_id
DO $$
DECLARE
  legacy_id UUID;
BEGIN
  -- Solo si hay registros sin negocio_id
  IF EXISTS (SELECT 1 FROM usuarios WHERE negocio_id IS NULL LIMIT 1) THEN
    -- Crear negocio legacy para datos preexistentes
    INSERT INTO negocios (nombre) VALUES ('Mi Negocio (Migrado)')
    RETURNING id INTO legacy_id;

    -- Asignar a todos los usuarios sin negocio
    UPDATE usuarios SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE productos SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE ventas SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE arqueos_caja SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE movimientos_inventario SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE notificaciones SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE audit_logs SET negocio_id = legacy_id WHERE negocio_id IS NULL;
    UPDATE configuracion_negocio SET negocio_id = legacy_id WHERE negocio_id IS NULL;
  END IF;
END $$;
