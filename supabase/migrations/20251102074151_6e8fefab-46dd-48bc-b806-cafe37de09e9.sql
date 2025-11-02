-- Fix RLS policy for pos_transactions to allow authenticated cashiers to create transactions
-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Cashiers can create transactions" ON public.pos_transactions;

-- Create updated INSERT policy that properly checks authentication
CREATE POLICY "Cashiers can create transactions" 
ON public.pos_transactions 
FOR INSERT 
TO authenticated
WITH CHECK (
  cashier_id = auth.uid() AND
  (get_user_role(auth.uid()) = ANY (ARRAY['admin'::text, 'manager'::text, 'cashier'::text]))
);