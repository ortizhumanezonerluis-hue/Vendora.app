-- ====================================================================
-- VENDORA: SOPORTE DE VENTA A GRANEL, PESO Y FRACCIONADOS
-- ====================================================================

-- 1. Añadir configuración de venta a granel en configuracion_negocio
ALTER TABLE configuracion_negocio 
ADD COLUMN IF NOT EXISTS habilitar_granel BOOLEAN DEFAULT FALSE;

ALTER TABLE configuracion_negocio 
ADD COLUMN IF NOT EXISTS unidad_medida_defecto TEXT DEFAULT 'kg';

-- 2. Añadir campos de granel y unidad de medida a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS es_granel BOOLEAN DEFAULT FALSE;

ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS unidad_medida TEXT DEFAULT 'UND';

-- 3. Asegurar que el stock_actual y stock_minimo soporten decimales (NUMERIC)
ALTER TABLE productos 
ALTER COLUMN stock_actual TYPE NUMERIC USING stock_actual::NUMERIC;

ALTER TABLE productos 
ALTER COLUMN stock_minimo TYPE NUMERIC USING stock_minimo::NUMERIC;

-- 4. Asegurar que las cantidades en detalles_venta y movimientos soporten fracciones
ALTER TABLE detalles_venta 
ALTER COLUMN cantidad TYPE NUMERIC USING cantidad::NUMERIC;

ALTER TABLE movimientos_inventario 
ALTER COLUMN cantidad TYPE NUMERIC USING cantidad::NUMERIC;

-- ====================================================================
-- ¡LISTO! Todo configurado para soportar balanzas, peso y venta por dinero.
-- ====================================================================
