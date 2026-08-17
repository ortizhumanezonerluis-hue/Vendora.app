-- Migration to add telefono field to configuracion_negocio table
ALTER TABLE configuracion_negocio ADD COLUMN IF NOT EXISTS telefono TEXT;
