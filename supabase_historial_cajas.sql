-- =====================================================
-- MIGRACIÓN: HISTORIAL DE CAJAS Y TURNOS
-- Ejecuta en: Supabase Dashboard → SQL Editor → Run
-- =====================================================

-- 1. Agregar columnas necesarias a arqueos_caja
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS auto_cerrado BOOLEAN DEFAULT false;
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS notas TEXT;

-- 2. Asegurar que ventas tiene la columna cajero
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'ventas' AND column_name = 'cajero'
    ) THEN
        ALTER TABLE ventas ADD COLUMN cajero VARCHAR(255);
    END IF;
END $$;

-- 3. Corregir las fechas: renombrar abierto_en → fecha_apertura si es necesario
-- (Si ya existe fecha_apertura, este bloque no hace nada)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'arqueos_caja' AND column_name = 'abierto_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'arqueos_caja' AND column_name = 'fecha_apertura'
    ) THEN
        ALTER TABLE arqueos_caja RENAME COLUMN abierto_en TO fecha_apertura;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'arqueos_caja' AND column_name = 'cerrado_en'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'arqueos_caja' AND column_name = 'fecha_cierre'
    ) THEN
        ALTER TABLE arqueos_caja RENAME COLUMN cerrado_en TO fecha_cierre;
    END IF;
END $$;

-- 4. Asegurar columnas de fecha en arqueos_caja por si no existen
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now());
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP WITH TIME ZONE;
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS usuario_id VARCHAR(255);
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS monto_inicial DECIMAL(10,2) DEFAULT 0;
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS efectivo_declarado DECIMAL(10,2);
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS efectivo_sistema DECIMAL(10,2);
ALTER TABLE arqueos_caja ADD COLUMN IF NOT EXISTS diferencia DECIMAL(10,2);

-- 5. Índice para acelerar consultas por usuario y estado
CREATE INDEX IF NOT EXISTS idx_arqueos_usuario ON arqueos_caja(usuario_id);
CREATE INDEX IF NOT EXISTS idx_arqueos_estado ON arqueos_caja(estado);
CREATE INDEX IF NOT EXISTS idx_ventas_cajero ON ventas(cajero);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);

-- 6. Notificaciones: columna tipo con valor 'caja' permitido
ALTER TABLE notificaciones DROP CONSTRAINT IF EXISTS notificaciones_tipo_check;
ALTER TABLE notificaciones ADD CONSTRAINT notificaciones_tipo_check
    CHECK (tipo IN ('stock', 'caja', 'auditoria'));

-- 7. RLS: asegurar que la nueva tabla arqueos_caja sigue siendo accesible
DROP POLICY IF EXISTS "allow_all_arqueos" ON arqueos_caja;
CREATE POLICY "allow_all_arqueos" ON arqueos_caja
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
