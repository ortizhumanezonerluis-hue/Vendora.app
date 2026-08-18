-- ============================================================
-- VENDORA: MÓDULO DE CONTABILIDAD Y GESTIÓN FISCAL (RÉGIMEN SIMPLIFICADO)
-- Tablas con soporte completo para negocio_id y RLS público/autenticado
-- ============================================================

-- 1. TABLA: rut_config
CREATE TABLE IF NOT EXISTS rut_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL,
  tenant_id UUID,
  nit TEXT DEFAULT '',
  dv TEXT DEFAULT '0',
  razon_social TEXT DEFAULT '',
  nombre_comercial TEXT DEFAULT '',
  actividad_ciiu TEXT DEFAULT '4711 - Comercio al por menor en establecimientos no especializados',
  responsabilidades TEXT[] DEFAULT ARRAY['52 - No responsable de IVA (Art. 437 E.T.)'],
  correo_fiscal TEXT DEFAULT '',
  telefono_fiscal TEXT DEFAULT '',
  departamento TEXT DEFAULT '',
  ciudad TEXT DEFAULT '',
  direccion_fiscal TEXT DEFAULT '',
  pdf_url TEXT DEFAULT '',
  estado_verificacion TEXT DEFAULT 'vigente',
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: libro_fiscal_registros (Asientos del Libro Fiscal Diario)
CREATE TABLE IF NOT EXISTS libro_fiscal_registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL,
  tenant_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('ingreso', 'egreso')) NOT NULL,
  origen TEXT CHECK (origen IN ('pos', 'orden_compra', 'manual')) DEFAULT 'manual',
  comprobante_ref TEXT,
  valor_ingreso NUMERIC(15, 2) DEFAULT 0,
  valor_egreso NUMERIC(15, 2) DEFAULT 0,
  observaciones TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: costos_soportados (Facturas y Documentos Soporte de Proveedores)
CREATE TABLE IF NOT EXISTS costos_soportados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL,
  tenant_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor_nombre TEXT NOT NULL,
  proveedor_nit TEXT NOT NULL,
  numero_factura TEXT NOT NULL,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  iva NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estado TEXT CHECK (estado IN ('validado', 'pendiente', 'rechazado')) DEFAULT 'validado',
  pdf_url TEXT DEFAULT '',
  xml_url TEXT DEFAULT '',
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: extractos_bancarios (Conciliación Bancaria y Billeteras Digitales)
CREATE TABLE IF NOT EXISTS extractos_bancarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL,
  tenant_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  entidad TEXT NOT NULL,
  referencia TEXT,
  monto_banco NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monto_pos NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estado TEXT CHECK (estado IN ('conciliado', 'pendiente', 'discrepancia')) DEFAULT 'conciliado',
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: pagos_menores (Gastos Operativos Cotidianos de Caja Menor)
CREATE TABLE IF NOT EXISTS pagos_menores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  negocio_id UUID NOT NULL,
  tenant_id UUID,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Acarreos',
  beneficiario TEXT NOT NULL,
  documento_beneficiario TEXT,
  monto NUMERIC(15, 2) NOT NULL DEFAULT 0,
  comprobante_url TEXT,
  observaciones TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Habilitar RLS y Crear Políticas Abiertas por Negocio
-- ============================================================
ALTER TABLE rut_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_rut_config" ON rut_config;
DROP POLICY IF EXISTS "Tenants rut_config access" ON rut_config;
CREATE POLICY "allow_all_rut_config" ON rut_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE libro_fiscal_registros ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_libro_fiscal" ON libro_fiscal_registros;
DROP POLICY IF EXISTS "Tenants libro_fiscal access" ON libro_fiscal_registros;
CREATE POLICY "allow_all_libro_fiscal" ON libro_fiscal_registros FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE costos_soportados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_costos_soportados" ON costos_soportados;
DROP POLICY IF EXISTS "Tenants costos_soportados access" ON costos_soportados;
CREATE POLICY "allow_all_costos_soportados" ON costos_soportados FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE extractos_bancarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_extractos_bancarios" ON extractos_bancarios;
DROP POLICY IF EXISTS "Tenants extractos_bancarios access" ON extractos_bancarios;
CREATE POLICY "allow_all_extractos_bancarios" ON extractos_bancarios FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

ALTER TABLE pagos_menores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_pagos_menores" ON pagos_menores;
DROP POLICY IF EXISTS "Tenants pagos_menores access" ON pagos_menores;
CREATE POLICY "allow_all_pagos_menores" ON pagos_menores FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
