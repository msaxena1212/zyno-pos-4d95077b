-- Fix function search paths for security
CREATE OR REPLACE FUNCTION public.generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  new_number TEXT;
  counter INTEGER;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(customer_number FROM '[0-9]+')::INTEGER), 0) + 1
  INTO counter
  FROM customers;
  
  new_number := 'CUST-' || LPAD(counter::TEXT, 6, '0');
  RETURN new_number;
END;
$$;

CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;