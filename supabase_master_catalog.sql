-- 1. Create master_catalog table
CREATE TABLE IF NOT EXISTS public.master_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barcode VARCHAR NOT NULL UNIQUE,
    name VARCHAR NOT NULL,
    brand VARCHAR,
    category VARCHAR NOT NULL DEFAULT 'Abarrotes',
    default_iva NUMERIC NOT NULL DEFAULT 19.00,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Speed index on barcode
CREATE INDEX IF NOT EXISTS idx_master_catalog_barcode ON public.master_catalog(barcode);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.master_catalog ENABLE ROW LEVEL SECURITY;

-- 4. Enable public reading of the catalog
CREATE POLICY "Allow public read access to master_catalog" 
ON public.master_catalog
FOR SELECT 
TO public
USING (true);

-- 5. Allow authenticated users to insert / update catalog entries
CREATE POLICY "Allow authenticated inserts to master_catalog" 
ON public.master_catalog
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Allow authenticated updates to master_catalog" 
ON public.master_catalog
FOR UPDATE 
TO authenticated 
USING (true)
WITH CHECK (true);
