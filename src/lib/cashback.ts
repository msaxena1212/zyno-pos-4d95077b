import { supabase } from "@/integrations/supabase/client";

export interface CashbackAccount {
  id: string;
  customer_id: string;
  current_balance: number;
  total_earned: number;
  total_redeemed: number;
}

export interface CashbackTransaction {
  id: string;
  customer_id: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  amount: number;
  balance_after: number;
  earning_rate?: number;
  earning_source?: string;
  description?: string;
  expires_at?: string;
  created_at: string;
}

export async function getCashbackAccount(customerId: string): Promise<CashbackAccount | null> {
  const { data, error } = await supabase
    .from('customer_cashback_accounts')
    .select('*')
    .eq('customer_id', customerId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching cashback account:', error);
    return null;
  }

  return data;
}

export async function getOrCreateCashbackAccount(customerId: string, brandId?: string): Promise<CashbackAccount | null> {
  let account = await getCashbackAccount(customerId);
  
  if (!account) {
    const { data, error } = await supabase
      .from('customer_cashback_accounts')
      .insert({
        customer_id: customerId,
        brand_id: brandId,
        current_balance: 0,
        total_earned: 0,
        total_redeemed: 0,
        total_expired: 0
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating cashback account:', error);
      return null;
    }

    account = data;
  }

  return account;
}

export async function calculateCashbackAmount(customerId: string, transactionAmount: number): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_cashback', {
    p_customer_id: customerId,
    p_transaction_amount: transactionAmount
  });

  if (error) {
    console.error('Error calculating cashback:', error);
    return 0;
  }

  return data || 0;
}

export async function recordCashbackEarned(
  customerId: string,
  transactionId: string,
  amount: number,
  earningRate: number,
  source: string = 'purchase'
): Promise<boolean> {
  try {
    const account = await getOrCreateCashbackAccount(customerId);
    if (!account) return false;

    const newBalance = account.current_balance + amount;

    // Create cashback transaction
    const { error: txError } = await supabase
      .from('cashback_transactions')
      .insert({
        customer_id: customerId,
        cashback_account_id: account.id,
        transaction_id: transactionId,
        transaction_type: 'earned',
        amount: amount,
        balance_after: newBalance,
        earning_rate: earningRate,
        earning_source: source,
        description: `Cashback earned on purchase`,
        status: 'completed'
      });

    if (txError) throw txError;

    // Update account balance
    const { error: updateError } = await supabase
      .from('customer_cashback_accounts')
      .update({
        current_balance: newBalance,
        total_earned: account.total_earned + amount
      })
      .eq('id', account.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error recording cashback earned:', error);
    return false;
  }
}

export async function redeemCashback(
  customerId: string,
  transactionId: string,
  amount: number
): Promise<boolean> {
  try {
    const account = await getCashbackAccount(customerId);
    if (!account || account.current_balance < amount) return false;

    const newBalance = account.current_balance - amount;

    // Create redemption transaction
    const { error: txError } = await supabase
      .from('cashback_transactions')
      .insert({
        customer_id: customerId,
        cashback_account_id: account.id,
        transaction_id: transactionId,
        transaction_type: 'redeemed',
        amount: -amount,
        balance_after: newBalance,
        description: `Cashback redeemed at checkout`,
        status: 'completed'
      });

    if (txError) throw txError;

    // Update account balance
    const { error: updateError } = await supabase
      .from('customer_cashback_accounts')
      .update({
        current_balance: newBalance,
        total_redeemed: account.total_redeemed + amount
      })
      .eq('id', account.id);

    if (updateError) throw updateError;

    return true;
  } catch (error) {
    console.error('Error redeeming cashback:', error);
    return false;
  }
}

export async function getCashbackHistory(customerId: string): Promise<CashbackTransaction[]> {
  const { data, error } = await supabase
    .from('cashback_transactions')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching cashback history:', error);
    return [];
  }

  return (data || []) as CashbackTransaction[];
}
