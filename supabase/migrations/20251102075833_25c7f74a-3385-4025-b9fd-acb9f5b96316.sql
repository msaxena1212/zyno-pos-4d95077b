-- Fix foreign key constraint for pos_transactions.customer_id
-- It should reference customers table, not profiles table

-- Drop the incorrect foreign key
ALTER TABLE public.pos_transactions 
DROP CONSTRAINT IF EXISTS pos_transactions_customer_id_fkey;

-- Add the correct foreign key referencing customers table
ALTER TABLE public.pos_transactions 
ADD CONSTRAINT pos_transactions_customer_id_fkey 
FOREIGN KEY (customer_id) 
REFERENCES public.customers(id) 
ON DELETE SET NULL;