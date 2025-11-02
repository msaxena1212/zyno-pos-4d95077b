-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'India',
  date_of_birth DATE,
  loyalty_points INTEGER DEFAULT 0,
  total_purchases NUMERIC DEFAULT 0,
  last_purchase_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active',
  notes TEXT,
  brand_id UUID REFERENCES public.brands(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers
CREATE POLICY "Customers viewable by authenticated users"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers and managers can manage customers"
  ON public.customers
  FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'cashier'::text]));

-- Add customer_id to pos_transactions if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'pos_transactions' 
    AND column_name = 'customer_id'
  ) THEN
    ALTER TABLE public.pos_transactions 
    ADD COLUMN customer_id UUID REFERENCES public.customers(id);
  END IF;
END $$;

-- Create function to generate customer number
CREATE OR REPLACE FUNCTION generate_customer_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customers_updated_at_trigger
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();