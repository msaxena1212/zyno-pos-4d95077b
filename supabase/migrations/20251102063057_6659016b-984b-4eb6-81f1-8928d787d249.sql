-- Function to update inventory quantity
CREATE OR REPLACE FUNCTION update_inventory_quantity(p_product_id UUID, p_quantity_change INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE inventory
  SET quantity_on_hand = quantity_on_hand + p_quantity_change,
      updated_at = NOW()
  WHERE product_id = p_product_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found in inventory';
  END IF;
END;
$$;