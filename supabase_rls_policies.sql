-- =====================================================
-- POLÍTICAS RLS PARA TODAS LAS TABLAS DE VENDORA
-- Ejecutar en SQL Editor de Supabase → New Query → Run
-- =====================================================

-- Habilitar RLS en cada tabla
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE detalles_venta ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE arqueos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_negocio ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas anteriores si existen (para evitar conflictos)
DROP POLICY IF EXISTS "allow_all_productos" ON productos;
DROP POLICY IF EXISTS "allow_all_ventas" ON ventas;
DROP POLICY IF EXISTS "allow_all_detalles_venta" ON detalles_venta;
DROP POLICY IF EXISTS "allow_all_movimientos" ON movimientos_inventario;
DROP POLICY IF EXISTS "allow_all_arqueos" ON arqueos_caja;
DROP POLICY IF EXISTS "allow_all_audit_logs" ON audit_logs;
DROP POLICY IF EXISTS "allow_all_commissions" ON commissions;
DROP POLICY IF EXISTS "allow_all_usuarios" ON usuarios;
DROP POLICY IF EXISTS "allow_all_configuracion" ON configuracion_negocio;

-- Crear políticas permisivas para anon y authenticated
CREATE POLICY "allow_all_productos" ON productos
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_ventas" ON ventas
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_detalles_venta" ON detalles_venta
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_movimientos" ON movimientos_inventario
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_arqueos" ON arqueos_caja
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_audit_logs" ON audit_logs
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_commissions" ON commissions
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_usuarios" ON usuarios
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_configuracion" ON configuracion_negocio
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
