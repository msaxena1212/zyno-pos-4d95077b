import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Receipt, CreditCard, Banknote } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Transaction {
  id: string;
  transaction_number: string;
  transaction_date: string;
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  amount_paid: number;
  change_amount: number;
  payment_status: string;
  status: string;
}

interface TransactionItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  tax_amount: number;
  discount_amount: number;
  line_total: number;
  products: {
    name: string;
    sku: string;
  };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { user } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    fetchTransactions();
  }, [user, role]);

  const fetchTransactions = async () => {
    try {
      let query = supabase
        .from("pos_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      // Cashiers only see their own transactions, managers see all
      if (role === 'cashier') {
        query = query.eq("cashier_id", user?.id);
      }
      // stock_manager and marketing_manager see all transactions

      const { data, error } = await query;

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch transactions");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    try {
      const { data, error } = await supabase
        .from("pos_transaction_items")
        .select("*, products(name, sku)")
        .eq("transaction_id", transactionId);

      if (error) throw error;
      setTransactionItems(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch transaction details");
    }
  };

  const handleViewDetails = async (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    await fetchTransactionDetails(transaction.id);
    setDetailsOpen(true);
  };

  const filteredTransactions = transactions.filter(txn =>
    txn.transaction_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground">
          {role === 'cashier' ? "Your transaction history" : 
           role === 'stock_manager' ? "All transaction records" :
           role === 'marketing_manager' ? "Sales transaction data" :
           "All payment transactions"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => t.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{transactions.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Count</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {transactions.filter(t => {
                const txnDate = new Date(t.transaction_date).toDateString();
                return txnDate === new Date().toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by transaction number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm">{txn.transaction_number}</TableCell>
                  <TableCell>
                    {new Date(txn.transaction_date).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </TableCell>
                  <TableCell>₹{parseFloat(txn.subtotal.toString()).toFixed(2)}</TableCell>
                  <TableCell>₹{parseFloat(txn.tax_amount.toString()).toFixed(2)}</TableCell>
                  <TableCell className="text-destructive">
                    -₹{parseFloat(txn.discount_amount.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell className="font-semibold">
                    ₹{parseFloat(txn.total_amount.toString()).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={txn.status === "completed" ? "default" : "secondary"}>
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(txn)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
            <DialogDescription>
              {selectedTransaction?.transaction_number}
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Transaction Date</p>
                  <p className="font-medium">
                    {new Date(selectedTransaction.transaction_date).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment Status</p>
                  <Badge>{selectedTransaction.payment_status}</Badge>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactionItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.products.name}</TableCell>
                        <TableCell className="font-mono text-sm">{item.products.sku}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{parseFloat(item.unit_price.toString()).toFixed(2)}</TableCell>
                        <TableCell>₹{parseFloat(item.line_total.toString()).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{parseFloat(selectedTransaction.subtotal.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{parseFloat(selectedTransaction.tax_amount.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Discount:</span>
                  <span>-₹{parseFloat(selectedTransaction.discount_amount.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total:</span>
                  <span>₹{parseFloat(selectedTransaction.total_amount.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>₹{parseFloat(selectedTransaction.amount_paid.toString()).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Change:</span>
                  <span>₹{parseFloat(selectedTransaction.change_amount.toString()).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}