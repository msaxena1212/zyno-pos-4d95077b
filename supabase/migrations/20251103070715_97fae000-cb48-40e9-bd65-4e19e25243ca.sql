-- Create credit notes table
CREATE TABLE public.credit_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_number TEXT NOT NULL UNIQUE,
  credit_note_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  customer_id UUID REFERENCES public.customers(id),
  original_transaction_id UUID REFERENCES public.pos_transactions(id),
  brand_id UUID REFERENCES public.brands(id),
  
  -- Amounts
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  processing_fee NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL,
  
  -- Details
  return_reason TEXT,
  return_condition TEXT,
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'applied', 'reversed', 'expired')),
  
  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expiry_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months')
);

-- Create credit note items table
CREATE TABLE public.credit_note_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_note_id UUID NOT NULL REFERENCES public.credit_notes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer cashback accounts table
CREATE TABLE public.customer_cashback_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL UNIQUE REFERENCES public.customers(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES public.brands(id),
  current_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_earned NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_redeemed NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_expired NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cashback transactions table
CREATE TABLE public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  cashback_account_id UUID NOT NULL REFERENCES public.customer_cashback_accounts(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.pos_transactions(id),
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  
  -- Earning details
  earning_rate NUMERIC(5,2),
  earning_source TEXT, -- 'purchase', 'referral', 'bonus', 'return'
  
  -- Expiration
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '12 months'),
  
  description TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_note_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_cashback_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for credit_notes
CREATE POLICY "Credit notes viewable by authenticated users"
  ON public.credit_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers and managers can create credit notes"
  ON public.credit_notes FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager', 'cashier']));

CREATE POLICY "Managers can update credit notes"
  ON public.credit_notes FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager']));

-- RLS Policies for credit_note_items
CREATE POLICY "Credit note items viewable by authenticated users"
  ON public.credit_note_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers can create credit note items"
  ON public.credit_note_items FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager', 'cashier']));

-- RLS Policies for customer_cashback_accounts
CREATE POLICY "Cashback accounts viewable by authenticated users"
  ON public.customer_cashback_accounts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage cashback accounts"
  ON public.customer_cashback_accounts FOR ALL
  TO authenticated
  USING (true);

-- RLS Policies for cashback_transactions
CREATE POLICY "Cashback transactions viewable by authenticated users"
  ON public.cashback_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create cashback transactions"
  ON public.cashback_transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_credit_notes_customer ON public.credit_notes(customer_id);
CREATE INDEX idx_credit_notes_transaction ON public.credit_notes(original_transaction_id);
CREATE INDEX idx_credit_notes_status ON public.credit_notes(status);
CREATE INDEX idx_credit_notes_expiry ON public.credit_notes(expiry_date);

CREATE INDEX idx_cashback_accounts_customer ON public.customer_cashback_accounts(customer_id);
CREATE INDEX idx_cashback_transactions_customer ON public.cashback_transactions(customer_id);
CREATE INDEX idx_cashback_transactions_account ON public.cashback_transactions(cashback_account_id);
CREATE INDEX idx_cashback_transactions_expires ON public.cashback_transactions(expires_at);

-- Function to generate credit note number
CREATE OR REPLACE FUNCTION public.generate_credit_note_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  cn_number TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 6, '0')
  INTO seq_part
  FROM credit_notes
  WHERE DATE(credit_note_date) = CURRENT_DATE;
  
  cn_number := 'CN-' || date_part || '-' || seq_part;
  
  RETURN cn_number;
END;
$$;

-- Function to calculate cashback on transaction
CREATE OR REPLACE FUNCTION public.calculate_cashback(
  p_customer_id UUID,
  p_transaction_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  cashback_rate NUMERIC := 0.02; -- Default 2%
  cashback_amount NUMERIC;
  customer_tier TEXT;
BEGIN
  -- Get customer tier from loyalty points (simplified)
  SELECT 
    CASE 
      WHEN loyalty_points >= 5000 THEN 0.05  -- Platinum: 5%
      WHEN loyalty_points >= 2000 THEN 0.03  -- Gold: 3%
      WHEN loyalty_points >= 500 THEN 0.02   -- Silver: 2%
      ELSE 0.01                               -- Regular: 1%
    END INTO cashback_rate
  FROM customers
  WHERE id = p_customer_id;
  
  cashback_amount := ROUND(p_transaction_amount * cashback_rate, 2);
  
  RETURN cashback_amount;
END;
$$;

-- Trigger to update cashback account updated_at
CREATE TRIGGER update_cashback_accounts_updated_at
  BEFORE UPDATE ON public.customer_cashback_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update credit notes updated_at
CREATE TRIGGER update_credit_notes_updated_at
  BEFORE UPDATE ON public.credit_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();