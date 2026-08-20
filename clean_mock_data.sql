-- ====================================================================
-- VENDORA: LIMPIEZA COMPLETA DE DATOS DE PRUEBA / MOCK EN PANEL ADMIN
-- ====================================================================

-- 1. Eliminar pagos de prueba de la tabla pagos_admin
DELETE FROM pagos_admin 
WHERE nombre_comercio IN (
  'Granero El Puente', 
  'Boutique Mariana Centro', 
  'Droguería Salud Total', 
  'Ferretería Los Andes', 
  'Minimarket El Remate', 
  'Papelería Creativa', 
  'Miscelánea San José', 
  'Tienda La Bendición'
)
OR nombre_comercio IS NULL
OR nombre_comercio = '';

-- 2. Eliminar registros mock de la tabla vendora_clientes
DELETE FROM vendora_clientes 
WHERE nombre_comercio IN (
  'Granero El Puente', 
  'Boutique Mariana Centro', 
  'Droguería Salud Total', 
  'Ferretería Los Andes', 
  'Minimarket El Remate', 
  'Papelería Creativa', 
  'Miscelánea San José', 
  'Tienda La Bendición'
)
OR nombre_comercio = 'Comercio Registrado'
OR nombre_comercio IS NULL
OR nombre_comercio = '';

-- 3. Verificar los comercios reales que quedan registrados:
SELECT id, nombre_comercio, nombre_dueno, email_acceso, plan, licencia_activa, cuotas_pagadas, cuotas_total, saldo_pendiente 
FROM vendora_clientes;
