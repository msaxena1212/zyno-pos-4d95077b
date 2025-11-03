-- Create return reason codes table
CREATE TABLE public.return_reason_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  requires_manager_approval BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create return disposition codes table
CREATE TABLE public.return_disposition_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  affects_inventory BOOLEAN DEFAULT true,
  inventory_status TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create return requests (RMA) table
CREATE TABLE public.return_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rma_number TEXT NOT NULL UNIQUE,
  rma_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Customer and transaction info
  customer_id UUID REFERENCES public.customers(id),
  original_transaction_id UUID REFERENCES public.pos_transactions(id),
  brand_id UUID REFERENCES public.brands(id),
  
  -- Return details
  return_type TEXT DEFAULT 'customer_return' CHECK (return_type IN ('customer_return', 'exchange', 'warranty', 'damaged_in_transit')),
  return_method TEXT DEFAULT 'in_store' CHECK (return_method IN ('in_store', 'mail', 'pickup')),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processing', 'completed', 'cancelled')),
  
  -- Financial
  subtotal NUMERIC(10,2) NOT NULL,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  restocking_fee NUMERIC(10,2) DEFAULT 0,
  processing_fee NUMERIC(10,2) DEFAULT 0,
  total_refund_amount NUMERIC(10,2) NOT NULL,
  
  -- Refund details
  refund_method TEXT CHECK (refund_method IN ('original_payment', 'store_credit', 'cash', 'exchange')),
  refund_status TEXT DEFAULT 'pending' CHECK (refund_status IN ('pending', 'processing', 'completed', 'failed')),
  refund_reference TEXT,
  
  -- Approval workflow
  requires_approval BOOLEAN DEFAULT false,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Documentation
  notes TEXT,
  customer_signature TEXT,
  photos JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create return items table
CREATE TABLE public.return_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_request_id UUID NOT NULL REFERENCES public.return_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  original_transaction_item_id UUID REFERENCES public.pos_transaction_items(id),
  
  -- Quantity details
  quantity_purchased INTEGER NOT NULL,
  quantity_returned INTEGER NOT NULL,
  quantity_already_returned INTEGER DEFAULT 0,
  
  -- Pricing
  unit_price NUMERIC(10,2) NOT NULL,
  discount_amount NUMERIC(10,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  line_total NUMERIC(10,2) NOT NULL,
  
  -- Return specific
  return_reason_code TEXT,
  return_condition TEXT CHECK (return_condition IN ('new', 'used', 'damaged', 'defective')),
  disposition_code TEXT,
  
  -- Quality assessment
  quality_notes TEXT,
  inspected_by UUID REFERENCES auth.users(id),
  inspection_date TIMESTAMP WITH TIME ZONE,
  
  -- Serial tracking
  serial_number TEXT,
  lot_number TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.return_reason_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_disposition_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reason codes
CREATE POLICY "Reason codes viewable by authenticated users"
  ON public.return_reason_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage reason codes"
  ON public.return_reason_codes FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for disposition codes
CREATE POLICY "Disposition codes viewable by authenticated users"
  ON public.return_disposition_codes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can manage disposition codes"
  ON public.return_disposition_codes FOR ALL
  TO authenticated
  USING (get_user_role(auth.uid()) = 'admin');

-- RLS Policies for return requests
CREATE POLICY "Return requests viewable by authenticated users"
  ON public.return_requests FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers can create return requests"
  ON public.return_requests FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager', 'cashier']));

CREATE POLICY "Managers can update return requests"
  ON public.return_requests FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager']));

-- RLS Policies for return items
CREATE POLICY "Return items viewable by authenticated users"
  ON public.return_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Cashiers can create return items"
  ON public.return_items FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager', 'cashier']));

CREATE POLICY "Managers can update return items"
  ON public.return_items FOR UPDATE
  TO authenticated
  USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'manager', 'stock_manager']));

-- Create indexes
CREATE INDEX idx_return_requests_customer ON public.return_requests(customer_id);
CREATE INDEX idx_return_requests_transaction ON public.return_requests(original_transaction_id);
CREATE INDEX idx_return_requests_status ON public.return_requests(status);
CREATE INDEX idx_return_requests_rma ON public.return_requests(rma_number);
CREATE INDEX idx_return_items_return_request ON public.return_items(return_request_id);
CREATE INDEX idx_return_items_product ON public.return_items(product_id);

-- Function to generate RMA number
CREATE OR REPLACE FUNCTION public.generate_rma_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  date_part TEXT;
  seq_part TEXT;
  store_id TEXT := 'STR001';
  rma_num TEXT;
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0')
  INTO seq_part
  FROM return_requests
  WHERE DATE(rma_date) = CURRENT_DATE;
  
  rma_num := 'RMA-' || date_part || '-' || seq_part || '-' || store_id;
  
  RETURN rma_num;
END;
$$;

-- Function to process return and adjust inventory
CREATE OR REPLACE FUNCTION public.process_return_inventory(
  p_return_request_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  return_item RECORD;
  inv_record RECORD;
BEGIN
  -- Loop through all items in the return
  FOR return_item IN 
    SELECT * FROM return_items 
    WHERE return_request_id = p_return_request_id
  LOOP
    -- Check disposition code to determine inventory action
    IF return_item.disposition_code IN ('RESTOCK', 'REPACKAGE', 'DISCOUNT') THEN
      -- Find inventory record
      SELECT * INTO inv_record
      FROM inventory
      WHERE product_id = return_item.product_id
      LIMIT 1;
      
      IF FOUND THEN
        -- Add back to inventory
        UPDATE inventory
        SET quantity_on_hand = quantity_on_hand + return_item.quantity_returned,
            quantity_available = quantity_available + return_item.quantity_returned,
            updated_at = NOW()
        WHERE id = inv_record.id;
      END IF;
    END IF;
  END LOOP;
  
  RETURN true;
END;
$$;

-- Trigger to update return requests updated_at
CREATE TRIGGER update_return_requests_updated_at
  BEFORE UPDATE ON public.return_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default return reason codes
INSERT INTO public.return_reason_codes (code, category, name, description, requires_manager_approval) VALUES
('DEFECTIVE', 'Quality Issues', 'Defective/Malfunction', 'Manufacturing defect or product malfunction', false),
('DAMAGED', 'Quality Issues', 'Damaged', 'Physical damage to product', false),
('POOR_QUALITY', 'Quality Issues', 'Poor Quality', 'Does not meet quality expectations', false),
('MISSING_PARTS', 'Quality Issues', 'Missing Parts', 'Incomplete product or missing components', false),
('WRONG_COLOR', 'Quality Issues', 'Wrong Color', 'Color different from expectation', false),
('WRONG_SIZE', 'Quality Issues', 'Wrong Size', 'Size different from ordered', false),
('NOT_AS_DESCRIBED', 'Customer Satisfaction', 'Not As Described', 'Product differs from description', false),
('DIDNT_LIKE', 'Customer Satisfaction', 'Did not Like', 'Customer changed mind', false),
('UNCOMFORTABLE', 'Customer Satisfaction', 'Uncomfortable', 'Fit or comfort issues', false),
('TOO_EXPENSIVE', 'Customer Satisfaction', 'Too Expensive', 'Found better price or budget concerns', false),
('WRONG_ITEM', 'Order Error', 'Wrong Item Shipped', 'Incorrect product shipped', false),
('DUPLICATE_ORDER', 'Order Error', 'Duplicate Order', 'Accidental double order', false),
('LATE_DELIVERY', 'Order Error', 'Late Delivery', 'Delivered after needed date', false),
('EXCHANGE', 'Business Process', 'Exchange', 'Customer wants to exchange item', false),
('WARRANTY_CLAIM', 'Business Process', 'Warranty Claim', 'Return under warranty', true);

-- Insert default disposition codes
INSERT INTO public.return_disposition_codes (code, name, description, affects_inventory, inventory_status) VALUES
('RESTOCK', 'Restock', 'Return to sellable inventory immediately', true, 'available'),
('REPACKAGE', 'Repackage', 'Repackage before resale', true, 'available'),
('DISCOUNT', 'Discount Sale', 'Return to inventory with marked-down price', true, 'clearance'),
('REPAIR', 'Send for Repair', 'Send to repair center', false, 'repair'),
('REFURBISH', 'Refurbish', 'Internal refurbishment needed', false, 'refurbish'),
('RETURN_TO_VENDOR', 'Return to Vendor', 'Send back to manufacturer', false, 'vendor_return'),
('SCRAP', 'Scrap/Dispose', 'Dispose due to damage', false, 'scrapped'),
('DONATE', 'Donate', 'Charitable donation', false, 'donated'),
('INSPECT', 'Needs Inspection', 'Quality inspection required', false, 'inspection');