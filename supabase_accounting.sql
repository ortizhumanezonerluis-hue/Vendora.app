-- ============================================================
-- VENDORA: MÓDULO DE CONTABILIDAD Y GESTIÓN FISCAL (RÉGIMEN SIMPLIFICADO)
-- Tablas para RUT, Libro Fiscal, Costos Soportados, Extractos y Pagos Menores
-- ============================================================

-- 1. TABLA: rut_config
CREATE TABLE IF NOT EXISTS rut_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL UNIQUE,
  nit TEXT NOT NULL,
  dv TEXT DEFAULT '0',
  razon_social TEXT NOT NULL,
  nombre_comercial TEXT,
  actividad_ciiu TEXT DEFAULT '4711 - Comercio al por menor en establecimientos no especializados',
  responsabilidades TEXT[] DEFAULT ARRAY['52 - No responsable de IVA'],
  correo_fiscal TEXT,
  telefono_fiscal TEXT,
  departamento TEXT DEFAULT 'Córdoba',
  ciudad TEXT DEFAULT 'Cereté',
  direccion_fiscal TEXT,
  pdf_url TEXT,
  estado_verificacion TEXT CHECK (estado_verificacion IN ('vigente', 'pendiente_actualizacion', 'en_revision')) DEFAULT 'vigente',
  actualizado_en TIMESTAMPTZ DEFAULT NOW(),
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA: libro_fiscal_registros (Asientos del Libro Fiscal Diario)
CREATE TABLE IF NOT EXISTS libro_fiscal_registros (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
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
  tenant_id UUID NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor_nombre TEXT NOT NULL,
  proveedor_nit TEXT NOT NULL,
  numero_factura TEXT NOT NULL,
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
  iva NUMERIC(15, 2) NOT NULL DEFAULT 0,
  total NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estado TEXT CHECK (estado IN ('validado', 'pendiente', 'rechazado')) DEFAULT 'validado',
  pdf_url TEXT,
  xml_url TEXT,
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA: extractos_bancarios (Conciliación Bancaria y Billeteras Digitales)
CREATE TABLE IF NOT EXISTS extractos_bancarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  entidad TEXT NOT NULL, -- Nequi, Daviplata, Bancolombia, Datafono, etc.
  referencia TEXT,
  monto_banco NUMERIC(15, 2) NOT NULL DEFAULT 0,
  monto_pos NUMERIC(15, 2) NOT NULL DEFAULT 0,
  estado TEXT CHECK (estado IN ('conciliado', 'pendiente', 'discrepancia')) DEFAULT 'conciliado',
  notas TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: pagos_menores (Gastos Operativos Cotidianos sin Factura Electrónica)
CREATE TABLE IF NOT EXISTS pagos_menores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Acarreos', -- Acarreos, Servicios, Mantenimiento, Aseo, Suministros, Otros
  beneficiario TEXT NOT NULL,
  documento_beneficiario TEXT,
  monto NUMERIC(15, 2) NOT NULL DEFAULT 0,
  comprobante_url TEXT,
  observaciones TEXT,
  creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Habilitar Row Level Security (RLS) en todas las tablas
-- ============================================================
ALTER TABLE rut_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE libro_fiscal_registros ENABLE ROW LEVEL SECURITY;
ALTER TABLE costos_soportados ENABLE ROW LEVEL SECURITY;
ALTER TABLE extractos_bancarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagos_menores ENABLE ROW LEVEL SECURITY;

-- Políticas RLS por Tenant
CREATE POLICY "Tenants rut_config access" ON rut_config
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'negocio_id')::uuid);

CREATE POLICY "Tenants libro_fiscal access" ON libro_fiscal_registros
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'negocio_id')::uuid);

CREATE POLICY "Tenants costos_soportados access" ON costos_soportados
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'negocio_id')::uuid);

CREATE POLICY "Tenants extractos_bancarios access" ON extractos_bancarios
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'negocio_id')::uuid);

CREATE POLICY "Tenants pagos_menores access" ON pagos_menores
  FOR ALL USING (tenant_id = (auth.jwt() ->> 'negocio_id')::uuid);
