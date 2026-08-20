-- ====================================================================
-- VENDORA: TABLAS MAESTRAS PARA EL PANEL DE CONTROL DEL PROPIETARIO
-- Control de Licencias, Planes (Starter, Pro, Max) y Registro de Pagos
-- ====================================================================

-- 1. TABLA: vendora_clientes (Registro maestro de comercios y licencias)
CREATE TABLE IF NOT EXISTS vendora_clientes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID,
  nombre_comercio TEXT NOT NULL,
  nombre_dueno TEXT NOT NULL,
  email_acceso TEXT,
  telefono TEXT,
  municipio TEXT DEFAULT 'Cereté',
  plan TEXT CHECK (plan IN ('starter', 'pro', 'max', 'sin_licencia')) DEFAULT 'sin_licencia',
  licencia_activa BOOLEAN DEFAULT FALSE,
  tipo_pago TEXT CHECK (tipo_pago IN ('financiado', 'vitalicio')) DEFAULT 'financiado',
  estado TEXT CHECK (estado IN ('activo', 'suspendido', 'mora', 'pendiente')) DEFAULT 'pendiente',
  cuota_mensual NUMERIC(15, 2) DEFAULT 160000,
  cuotas_pagadas INT DEFAULT 0,
  cuotas_total INT DEFAULT 10,
  saldo_pendiente NUMERIC(15, 2) DEFAULT 0,
  fecha_inicio DATE DEFAULT CURRENT_DATE,
  fecha_corte DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  online_ahora BOOLEAN DEFAULT FALSE,
  ultima_conexion TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS negocio_id UUID;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS email_acceso TEXT;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS municipio TEXT DEFAULT 'Cereté';
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'sin_licencia';
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS licencia_activa BOOLEAN DEFAULT FALSE;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS tipo_pago TEXT DEFAULT 'financiado';
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'pendiente';
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS cuota_mensual NUMERIC(15, 2) DEFAULT 160000;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS cuotas_pagadas INT DEFAULT 0;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS cuotas_total INT DEFAULT 10;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS saldo_pendiente NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS fecha_corte DATE;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS online_ahora BOOLEAN DEFAULT FALSE;
ALTER TABLE vendora_clientes ADD COLUMN IF NOT EXISTS ultima_conexion TIMESTAMPTZ DEFAULT NOW();

-- 2. TABLA: pagos_admin (Registro de cobros físicos y cuotas)
CREATE TABLE IF NOT EXISTS pagos_admin (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_id UUID REFERENCES vendora_clientes(id) ON DELETE CASCADE,
  nombre_comercio TEXT,
  monto NUMERIC(15, 2) NOT NULL,
  tipo_pago TEXT DEFAULT 'cuota_mensual',
  metodo TEXT DEFAULT 'efectivo',
  notas TEXT,
  registrado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HABILITAR RLS Y POLÍTICAS PERMISIVAS SEGURAS
ALTER TABLE vendora_clientes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_vendora_clientes" ON vendora_clientes;
CREATE POLICY "allow_all_vendora_clientes" ON vendora_clientes FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE pagos_admin ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_pagos_admin" ON pagos_admin;
CREATE POLICY "allow_all_pagos_admin" ON pagos_admin FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 4. INSERTAR CLIENTES DE PRUEBA REALES DE CÓRDOBA (Solo si está vacía)
INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Granero El Puente', 'Carlos Pérez', 'graneroelpuente@gmail.com', '3015489921', 'Cereté',
  'pro', TRUE, 'financiado', 'activo', 160000, 3, 10, 1120000, CURRENT_DATE + INTERVAL '12 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Granero El Puente');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Boutique Mariana Centro', 'Mariana Torres', 'boutiquemariana@gmail.com', '3104523319', 'Montería',
  'max', TRUE, 'financiado', 'activo', 240000, 4, 10, 1440000, CURRENT_DATE + INTERVAL '18 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Boutique Mariana Centro');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Droguería Salud Total', 'Jorge Ramos', 'saludtotal@hotmail.com', '3008819203', 'Cereté',
  'starter', TRUE, 'financiado', 'mora', 80000, 1, 10, 720000, CURRENT_DATE - INTERVAL '4 days', FALSE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Droguería Salud Total');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Ferretería Los Andes', 'Luis Martínez', 'ferreterialosandes@gmail.com', '3128904421', 'Sahagún',
  'pro', TRUE, 'vitalicio', 'activo', 0, 10, 10, 0, CURRENT_DATE + INTERVAL '300 days', FALSE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Ferretería Los Andes');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Minimarket El Remate', 'Sandra Ortiz', 'elremateminimarket@gmail.com', '3209938812', 'Ciénaga de Oro',
  'max', TRUE, 'financiado', 'activo', 240000, 2, 10, 1920000, CURRENT_DATE + INTERVAL '22 days', TRUE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Minimarket El Remate');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Papelería Creativa', 'Diana Gómez', 'papeleriacreativa@gmail.com', '3045582910', 'Cereté',
  'starter', TRUE, 'financiado', 'activo', 80000, 5, 10, 400000, CURRENT_DATE + INTERVAL '15 days', FALSE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Papelería Creativa');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Miscelánea San José', 'Efraín López', 'sanjosemiscelanea@gmail.com', '3117729901', 'Lorica',
  'pro', FALSE, 'financiado', 'suspendido', 160000, 2, 10, 1280000, CURRENT_DATE - INTERVAL '15 days', FALSE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Miscelánea San José');

INSERT INTO vendora_clientes (
  nombre_comercio, nombre_dueno, email_acceso, telefono, municipio,
  plan, licencia_activa, tipo_pago, estado, cuota_mensual, cuotas_pagadas, cuotas_total, saldo_pendiente, fecha_corte, online_ahora
)
SELECT 
  'Tienda La Bendición', 'Rosa Arroyo', 'tiendalabendicion@gmail.com', '3004491022', 'Cereté',
  'sin_licencia', FALSE, 'financiado', 'pendiente', 160000, 0, 10, 1600000, CURRENT_DATE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM vendora_clientes WHERE nombre_comercio = 'Tienda La Bendición');

-- 5. INSERTAR ALGUNOS PAGOS INICIALES PARA GRÁFICAS
INSERT INTO pagos_admin (cliente_id, nombre_comercio, monto, tipo_pago, metodo, notas)
SELECT id, 'Granero El Puente', 160000, 'cuota_mensual', 'efectivo', 'Cobro cuota 3 en local'
FROM vendora_clientes WHERE nombre_comercio = 'Granero El Puente' LIMIT 1;

INSERT INTO pagos_admin (cliente_id, nombre_comercio, monto, tipo_pago, metodo, notas)
SELECT id, 'Boutique Mariana Centro', 240000, 'cuota_mensual', 'transferencia', 'Transferencia Nequi'
FROM vendora_clientes WHERE nombre_comercio = 'Boutique Mariana Centro' LIMIT 1;

INSERT INTO pagos_admin (cliente_id, nombre_comercio, monto, tipo_pago, metodo, notas)
SELECT id, 'Minimarket El Remate', 240000, 'cuota_mensual', 'efectivo', 'Cobro en efectivo cuota 2'
FROM vendora_clientes WHERE nombre_comercio = 'Minimarket El Remate' LIMIT 1;
