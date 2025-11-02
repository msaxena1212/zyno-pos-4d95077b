import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, ShoppingCart, TrendingUp, Package, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalItems: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const { user } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    fetchReports();
  }, [user, role, period]);

  const fetchReports = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let transactionsQuery = supabase
        .from("pos_transactions")
        .select("*");

      // If cashier, only show their own data
      if (role === 'cashier') {
        transactionsQuery = transactionsQuery.eq("cashier_id", user?.id);
      }

      const { data: transactions, error: txnError } = await transactionsQuery;

      if (txnError) throw txnError;

      const totalSales = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      
      const todayTxns = transactions?.filter(t => new Date(t.transaction_date) >= today) || [];
      const todaySales = todayTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
      
      const weekTxns = transactions?.filter(t => new Date(t.transaction_date) >= weekAgo) || [];
      const weekSales = weekTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
      
      const monthTxns = transactions?.filter(t => new Date(t.transaction_date) >= monthAgo) || [];
      const monthSales = monthTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);

      let itemsQuery = supabase
        .from("pos_transaction_items")
        .select("quantity, transaction_id");

      if (role === 'cashier') {
        const txnIds = transactions?.map(t => t.id) || [];
        itemsQuery = itemsQuery.in("transaction_id", txnIds);
      }

      const { data: items, error: itemsError } = await itemsQuery;

      if (itemsError) throw itemsError;

      const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      setStats({
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        totalItems,
        todaySales,
        weekSales,
        monthSales,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground">
            {role === 'cashier' ? "Your performance reports" : "Sales and performance analytics"}
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {period === 'today' ? "Today's Sales" : 
               period === 'week' ? "This Week" :
               period === 'month' ? "This Month" : "Total Sales"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(period === 'today' ? stats.todaySales :
                  period === 'week' ? stats.weekSales :
                  period === 'month' ? stats.monthSales :
                  stats.totalSales).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'all' ? `${stats.totalTransactions} transactions` : 'Revenue generated'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.averageTransaction.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Total quantity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Daily revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.weekSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Weekly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly revenue</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Best Day (This Week)</p>
                <p className="text-2xl font-bold">₹{(stats.weekSales / 7).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">Average per day</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Growth Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.weekSales > 0 ? '+' : ''}
                  {((stats.weekSales - stats.monthSales / 4) / (stats.monthSales / 4) * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Week over week</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}