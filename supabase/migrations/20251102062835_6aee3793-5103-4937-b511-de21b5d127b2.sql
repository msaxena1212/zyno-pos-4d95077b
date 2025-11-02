-- Fix search path for generate_transaction_number function
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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