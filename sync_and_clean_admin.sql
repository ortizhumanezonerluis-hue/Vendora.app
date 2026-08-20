-- ====================================================================
-- VENDORA: SINCRONIZAR NEGOCIOS REALES EXISTENTES A VENDORA_CLIENTES
-- ====================================================================

-- 1. Asegurar columnas de presencia y enlace
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS negocio_id UUID;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS email_acceso TEXT;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS online_ahora BOOLEAN DEFAULT FALSE;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS ultima_conexion TIMESTAMPTZ DEFAULT NOW();

-- 2. Insertar todos los comercios reales que ya estaban registrados en configuracion_negocio / usuarios
INSERT INTO vendora_clientes (
  negocio_id,
  nombre_comercio,
  nombre_dueno,
  email_acceso,
  telefono,
  municipio,
  plan,
  licencia_activa,
  tipo_pago,
  estado,
  cuota_mensual,
  cuotas_pagadas,
  cuotas_total,
  saldo_pendiente,
  fecha_inicio,
  fecha_corte,
  online_ahora,
  ultima_conexion
)
SELECT 
  cn.negocio_id,
  COALESCE(cn.nombre, 'Mi Comercio'),
  COALESCE(u.nombre, 'Propietario'),
  u.email,
  cn.telefono,
  'Cereté',
  'pro',
  TRUE,
  'financiado',
  'activo',
  160000,
  1,
  10,
  1440000,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  TRUE,
  NOW()
FROM configuracion_negocio cn
LEFT JOIN usuarios u ON u.negocio_id = cn.negocio_id
WHERE cn.negocio_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM vendora_clientes vc 
    WHERE vc.negocio_id = cn.negocio_id 
       OR (vc.email_acceso IS NOT NULL AND vc.email_acceso = u.email)
  );

-- 3. (Opcional) Si deseas eliminar los datos de prueba y dejar SOLO tus negocios reales:
-- DELETE FROM vendora_clientes WHERE nombre_comercio IN ('Granero El Puente', 'Boutique Mariana Centro', 'Droguería Salud Total', 'Ferretería Los Andes', 'Minimarket El Remate', 'Papelería Creativa', 'Miscelánea San José', 'Tienda La Bendición');
