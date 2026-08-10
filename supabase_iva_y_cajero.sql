-- =====================================================
-- CORRECCIÓN DE BASE DE DATOS Y COLUMNAS INDIVIDUALES
-- Ejecuta este script en el SQL Editor de Supabase
-- =====================================================

-- 1. Asegurar que la columna 'cajero' existe en la tabla 'ventas'
-- (Si ya existe, el bloque DO la ignorará de forma segura)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'cajero'
    ) THEN
        ALTER TABLE ventas ADD COLUMN cajero VARCHAR(255);
    END IF;
END $$;

-- 2. Asegurar que la columna 'usuario_id' también existe (por retrocompatibilidad)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ventas' AND column_name = 'usuario_id'
    ) THEN
        ALTER TABLE ventas ADD COLUMN usuario_id VARCHAR(255);
    END IF;
END $$;

-- 3. Agregar IVA/Impuesto individual por producto a la tabla 'productos'
-- Por defecto 19% (IVA estándar en Colombia), pero configurable por cada producto.
ALTER TABLE productos ADD COLUMN IF NOT EXISTS porcentaje_iva DECIMAL(5,2) NOT NULL DEFAULT 19.00;
