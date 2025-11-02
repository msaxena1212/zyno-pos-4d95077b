-- Products and Inventory Tables
CREATE TABLE public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  parent_category_id UUID REFERENCES public.product_categories(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id UUID REFERENCES public.brands(id),
  category_id UUID REFERENCES public.product_categories(id),
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  cost_price NUMERIC(10,2),
  tax_rate NUMERIC(5,2) DEFAULT 0,
  is_taxable BOOLEAN DEFAULT true,
  is_perishable BOOLEAN DEFAULT false,
  expiry_date DATE,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id),
  brand_id UUID REFERENCES public.brands(id),
  location TEXT DEFAULT 'main_store',
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  last_stock_count DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(product_id, location)
);

-- POS Transactions
CREATE TABLE public.pos_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT NOT NULL UNIQUE,
  brand_id UUID REFERENCES public.brands(id),
  customer_id UUID REFERENCES public.profiles(id),
  cashier_id UUID NOT NULL REFERENCES public.profiles(id),
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subtotal NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  change_amount NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'pending',
  transaction_type TEXT DEFAULT 'sale',
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.pos_transaction_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES public.pos_transactions(id),
  payment_method TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  card_last_four TEXT,
  authorization_code TEXT,
  payment_status TEXT DEFAULT 'completed',
  payment_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.gift_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_number TEXT NOT NULL UNIQUE,
  pin TEXT,
  initial_balance NUMERIC(10,2) NOT NULL,
  current_balance NUMERIC(10,2) NOT NULL,
  status TEXT DEFAULT 'active',
  issued_date DATE DEFAULT CURRENT_DATE,
  expiry_date DATE,
  customer_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for product_categories
CREATE POLICY "Product categories viewable by authenticated users" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage product categories" ON public.product_categories FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text]));

-- RLS Policies for products
CREATE POLICY "Products viewable by authenticated users" ON public.products FOR SELECT USING (true);
CREATE POLICY "Managers can manage products" ON public.products FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'stock_manager'::text]));

-- RLS Policies for inventory
CREATE POLICY "Inventory viewable by authenticated users" ON public.inventory FOR SELECT USING (true);
CREATE POLICY "Stock managers can update inventory" ON public.inventory FOR ALL USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'stock_manager'::text]));

-- RLS Policies for pos_transactions
CREATE POLICY "Users can view transactions they created or all if admin/manager" ON public.pos_transactions FOR SELECT 
  USING (cashier_id = auth.uid() OR get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text]));
CREATE POLICY "Cashiers can create transactions" ON public.pos_transactions FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'cashier'::text]));
CREATE POLICY "Managers can update transactions" ON public.pos_transactions FOR UPDATE 
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text]));

-- RLS Policies for transaction items
CREATE POLICY "Transaction items viewable by authenticated users" ON public.pos_transaction_items FOR SELECT USING (true);
CREATE POLICY "Cashiers can manage transaction items" ON public.pos_transaction_items FOR ALL 
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'cashier'::text]));

-- RLS Policies for payments
CREATE POLICY "Payments viewable by authenticated users" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Cashiers can create payments" ON public.payments FOR INSERT 
  WITH CHECK (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'cashier'::text]));

-- RLS Policies for gift_cards
CREATE POLICY "Gift cards viewable by authenticated users" ON public.gift_cards FOR SELECT USING (true);
CREATE POLICY "Cashiers can manage gift cards" ON public.gift_cards FOR ALL 
  USING (get_user_role(auth.uid()) = ANY(ARRAY['admin'::text, 'manager'::text, 'cashier'::text]));

-- Triggers for updated_at
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON public.product_categories 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pos_transactions_updated_at BEFORE UPDATE ON public.pos_transactions 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate transaction number
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  transaction_num TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO seq_part
  FROM pos_transactions
  WHERE DATE(transaction_date) = CURRENT_DATE;
  
  transaction_num := 'TXN-' || date_part || '-' || seq_part;
  
  RETURN transaction_num;
END;
$$;

-- Indexes for performance
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_inventory_product ON public.inventory(product_id);
CREATE INDEX idx_transactions_date ON public.pos_transactions(transaction_date);
CREATE INDEX idx_transactions_cashier ON public.pos_transactions(cashier_id);
CREATE INDEX idx_transaction_items_transaction ON public.pos_transaction_items(transaction_id);