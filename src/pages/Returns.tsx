import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Package, RotateCcw, Receipt, User, Barcode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";

interface Customer {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
}

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
}

interface TransactionItem {
  id: string;
  product_id: string;
  product: any;
  quantity: number;
  unit_price: number;
  line_total: number;
}

interface ReturnItem {
  product_id: string;
  product_name: string;
  quantity_purchased: number;
  quantity_returned: number;
  unit_price: number;
  return_reason: string;
  return_condition: string;
  disposition: string;
}

export default function Returns() {
  const { user } = useAuth();
  const [searchMethod, setSearchMethod] = useState<'customer' | 'receipt' | 'barcode'>('customer');
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [returnReasons, setReturnReasons] = useState<any[]>([]);
  const [dispositions, setDispositions] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);
  const [showReturnDialog, setShowReturnDialog] = useState(false);

  useEffect(() => {
    fetchReturnReasons();
    fetchDispositions();
  }, []);

  const fetchReturnReasons = async () => {
    const { data } = await supabase
      .from('return_reason_codes')
      .select('*')
      .eq('active', true)
      .order('category, name');
    
    setReturnReasons(data || []);
  };

  const fetchDispositions = async () => {
    const { data } = await supabase
      .from('return_disposition_codes')
      .select('*')
      .eq('active', true)
      .order('name');
    
    setDispositions(data || []);
  };

  const searchCustomers = async () => {
    if (!searchQuery) {
      toast.error("Please enter search criteria");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .or(`phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,customer_number.ilike.%${searchQuery}%`)
        .eq('status', 'active')
        .limit(10);

      if (error) throw error;
      setCustomers(data || []);
      
      if (data && data.length === 0) {
        toast.info("No customers found");
      }
    } catch (error: any) {
      toast.error("Failed to search customers");
    }
  };

  const selectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomers([]);
    setSearchQuery("");
    
    // Fetch customer's transactions
    try {
      const { data, error } = await supabase
        .from('pos_transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('status', 'completed')
        .order('transaction_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast.error("Failed to load transactions");
    }
  };

  const selectTransaction = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    
    // Fetch transaction items
    try {
      const { data, error } = await supabase
        .from('pos_transaction_items')
        .select(`
          *,
          product:products(*)
        `)
        .eq('transaction_id', transaction.id);

      if (error) throw error;
      setTransactionItems(data || []);
    } catch (error) {
      toast.error("Failed to load transaction items");
    }
  };

  const searchByReceipt = async () => {
    if (!searchQuery) {
      toast.error("Please enter receipt number");
      return;
    }

    try {
      const { data, error } = await supabase
        .from('pos_transactions')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('transaction_number', searchQuery)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        if (data.customer) {
          setSelectedCustomer(data.customer);
        }
        await selectTransaction(data);
      } else {
        toast.error("Receipt not found");
      }
    } catch (error) {
      toast.error("Failed to search receipt");
    }
  };

  const addReturnItem = (item: TransactionItem, quantity: number, reason: string, condition: string, disposition: string) => {
    const existingIndex = returnItems.findIndex(ri => ri.product_id === item.product_id);
    
    const newItem: ReturnItem = {
      product_id: item.product_id,
      product_name: item.product.name,
      quantity_purchased: item.quantity,
      quantity_returned: quantity,
      unit_price: item.unit_price,
      return_reason: reason,
      return_condition: condition,
      disposition: disposition
    };

    if (existingIndex >= 0) {
      const updated = [...returnItems];
      updated[existingIndex] = newItem;
      setReturnItems(updated);
    } else {
      setReturnItems([...returnItems, newItem]);
    }
  };

  const calculateReturnTotal = () => {
    return returnItems.reduce((sum, item) => {
      return sum + (item.unit_price * item.quantity_returned);
    }, 0);
  };

  const processReturn = async () => {
    if (returnItems.length === 0) {
      toast.error("No items selected for return");
      return;
    }

    if (!selectedTransaction) {
      toast.error("No transaction selected");
      return;
    }

    setProcessing(true);
    try {
      // Generate RMA number
      const { data: rmaNumber, error: rmaError } = await supabase.rpc('generate_rma_number');
      if (rmaError) throw rmaError;

      const subtotal = calculateReturnTotal();
      const taxRate = 0.12;
      const taxAmount = subtotal * taxRate;
      const processingFee = 25;
      const totalRefund = subtotal + taxAmount - processingFee;

      // Create return request
      const { data: returnRequest, error: returnError } = await supabase
        .from('return_requests')
        .insert({
          rma_number: rmaNumber,
          customer_id: selectedCustomer?.id,
          original_transaction_id: selectedTransaction.id,
          return_type: 'customer_return',
          return_method: 'in_store',
          status: 'approved',
          subtotal: subtotal,
          tax_amount: taxAmount,
          processing_fee: processingFee,
          total_refund_amount: totalRefund,
          refund_method: 'store_credit',
          refund_status: 'pending',
          requested_by: user?.id,
          approved_by: user?.id,
          approved_at: new Date().toISOString()
        })
        .select()
        .single();

      if (returnError) throw returnError;

      // Create return items
      const returnItemsData = returnItems.map(item => ({
        return_request_id: returnRequest.id,
        product_id: item.product_id,
        quantity_purchased: item.quantity_purchased,
        quantity_returned: item.quantity_returned,
        unit_price: item.unit_price,
        line_total: item.unit_price * item.quantity_returned,
        return_reason_code: item.return_reason,
        return_condition: item.return_condition,
        disposition_code: item.disposition
      }));

      const { error: itemsError } = await supabase
        .from('return_items')
        .insert(returnItemsData);

      if (itemsError) throw itemsError;

      // Process inventory adjustments
      await supabase.rpc('process_return_inventory', {
        p_return_request_id: returnRequest.id
      });

      // Generate credit note if applicable
      const { error: creditNoteError } = await supabase
        .from('credit_notes')
        .insert({
          credit_note_number: await supabase.rpc('generate_credit_note_number').then(res => res.data),
          customer_id: selectedCustomer?.id,
          original_transaction_id: selectedTransaction.id,
          subtotal: subtotal,
          tax_amount: taxAmount,
          processing_fee: processingFee,
          total_amount: totalRefund,
          return_reason: returnItems[0]?.return_reason,
          status: 'active',
          created_by: user?.id
        });

      if (creditNoteError) console.warn('Credit note creation failed:', creditNoteError);

      toast.success(`Return processed successfully! RMA: ${rmaNumber}`);
      
      // Reset form
      setReturnItems([]);
      setSelectedTransaction(null);
      setTransactionItems([]);
      setShowReturnDialog(false);
    } catch (error: any) {
      console.error('Return processing error:', error);
      toast.error(error.message || "Failed to process return");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Returns Management</h1>
        <Badge variant="outline" className="text-lg">
          <RotateCcw className="h-4 w-4 mr-2" />
          Return Processing
        </Badge>
      </div>

      <Tabs value={searchMethod} onValueChange={(v) => setSearchMethod(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer">
            <User className="h-4 w-4 mr-2" />
            Customer Search
          </TabsTrigger>
          <TabsTrigger value="receipt">
            <Receipt className="h-4 w-4 mr-2" />
            Receipt Search
          </TabsTrigger>
          <TabsTrigger value="barcode">
            <Barcode className="h-4 w-4 mr-2" />
            Barcode Scan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Search by phone, email, name, or customer number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
                />
                <Button onClick={searchCustomers}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {customers.length > 0 && (
                <div className="space-y-2">
                  {customers.map(customer => (
                    <Card key={customer.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => selectCustomer(customer)}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{customer.first_name} {customer.last_name}</p>
                            <p className="text-sm text-muted-foreground">{customer.phone} • {customer.email}</p>
                          </div>
                          <Badge>{customer.customer_number}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardHeader>
              <CardTitle>Search by Receipt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter receipt/transaction number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchByReceipt()}
                />
                <Button onClick={searchByReceipt}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="barcode">
          <Card>
            <CardHeader>
              <CardTitle>Scan Product Barcode</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Barcode scanning feature coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedCustomer && (
        <Card>
          <CardHeader>
            <CardTitle>Customer: {selectedCustomer.first_name} {selectedCustomer.last_name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 text-sm">
              <span><strong>Phone:</strong> {selectedCustomer.phone}</span>
              <span><strong>Email:</strong> {selectedCustomer.email}</span>
              <span><strong>ID:</strong> {selectedCustomer.customer_number}</span>
            </div>

            {transactions.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Recent Transactions</h3>
                {transactions.map(txn => (
                  <Card key={txn.id} className="cursor-pointer hover:bg-secondary/50" onClick={() => selectTransaction(txn)}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{txn.transaction_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(txn.transaction_date), 'PPp')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">₹{txn.total_amount.toFixed(2)}</p>
                          <Badge variant="outline">{txn.payment_status}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedTransaction && transactionItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction Items - {selectedTransaction.transaction_number}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transactionItems.map((item) => (
              <ReturnItemCard
                key={item.id}
                item={item}
                returnReasons={returnReasons}
                dispositions={dispositions}
                onAddReturn={addReturnItem}
              />
            ))}

            {returnItems.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Return Summary</h3>
                <div className="space-y-2">
                  {returnItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{item.product_name} x{item.quantity_returned}</span>
                      <span>₹{(item.unit_price * item.quantity_returned).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total Return Value:</span>
                  <span>₹{calculateReturnTotal().toFixed(2)}</span>
                </div>
                <Button onClick={() => setShowReturnDialog(true)} className="w-full" size="lg">
                  <Package className="h-4 w-4 mr-2" />
                  Process Return
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showReturnDialog} onOpenChange={setShowReturnDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Return Processing</DialogTitle>
            <DialogDescription>
              Review return details before processing
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <p><strong>Customer:</strong> {selectedCustomer?.first_name} {selectedCustomer?.last_name}</p>
              <p><strong>Original Transaction:</strong> {selectedTransaction?.transaction_number}</p>
              <p><strong>Items to Return:</strong> {returnItems.length}</p>
              <p><strong>Return Value:</strong> ₹{calculateReturnTotal().toFixed(2)}</p>
              <p><strong>Refund Method:</strong> Store Credit</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReturnDialog(false)}>Cancel</Button>
            <Button onClick={processReturn} disabled={processing}>
              {processing ? "Processing..." : "Confirm Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ReturnItemCard({ item, returnReasons, dispositions, onAddReturn }: any) {
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("used");
  const [disposition, setDisposition] = useState("RESTOCK");

  const handleAdd = () => {
    if (!reason) {
      toast.error("Please select a return reason");
      return;
    }
    onAddReturn(item, quantity, reason, condition, disposition);
    toast.success("Item added to return");
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold">{item.product.name}</p>
            <p className="text-sm text-muted-foreground">SKU: {item.product.sku}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">₹{item.unit_price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Quantity to Return</Label>
            <Input
              type="number"
              min="1"
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(Number(e.target.value), item.quantity))}
            />
          </div>

          <div className="space-y-2">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New/Unopened</SelectItem>
                <SelectItem value="used">Used/Opened</SelectItem>
                <SelectItem value="damaged">Damaged</SelectItem>
                <SelectItem value="defective">Defective</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Return Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {returnReasons.map((r: any) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Disposition</Label>
            <Select value={disposition} onValueChange={setDisposition}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {dispositions.map((d: any) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleAdd} className="w-full" variant="outline">
          Add to Return
        </Button>
      </CardContent>
    </Card>
  );
}
