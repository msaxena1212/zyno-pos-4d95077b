import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, DollarSign, TrendingUp, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface Sale {
  id: string;
  transaction_number: string;
  transaction_date: string;
  total_amount: number;
  payment_status: string;
  transaction_type: string;
  customer_id: string | null;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    fetchSales();
  }, [user, role]);

  const fetchSales = async () => {
    try {
      let query = supabase
        .from("pos_transactions")
        .select("*")
        .order("transaction_date", { ascending: false });

      // If cashier, only show their own sales
      if (role === 'cashier') {
        query = query.eq("cashier_id", user?.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch sales");
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale =>
    sale.transaction_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalSales = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);
  const todaySales = sales.filter(sale => {
    const saleDate = new Date(sale.transaction_date).toDateString();
    const today = new Date().toDateString();
    return saleDate === today;
  });
  const todayTotal = todaySales.reduce((sum, sale) => sum + parseFloat(sale.total_amount.toString()), 0);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales</h1>
        <p className="text-muted-foreground">
          {role === 'cashier' ? "Your sales history" : "All sales transactions"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{sales.length} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Sales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{todayTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{todaySales.length} transactions today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Sale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{sales.length > 0 ? (totalSales / sales.length).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
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
          <CardTitle>Sales History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction #</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-mono text-sm">{sale.transaction_number}</TableCell>
                  <TableCell>
                    {new Date(sale.transaction_date).toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    })}
                  </TableCell>
                  <TableCell className="capitalize">{sale.transaction_type}</TableCell>
                  <TableCell className="font-semibold">₹{parseFloat(sale.total_amount.toString()).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={sale.payment_status === "completed" ? "default" : "secondary"}>
                      {sale.payment_status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}