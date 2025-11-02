import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Clock, CheckCircle2, TrendingUp, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart } from "recharts";

export function CashierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    completedTransactions: 0,
    averageTransaction: 0,
  });
  const [hourlyData, setHourlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchHourlyData();
    fetchTopProducts();
  }, [user]);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: transactions, error } = await supabase
        .from("pos_transactions")
        .select("*")
        .eq("cashier_id", user?.id)
        .gte("transaction_date", today.toISOString());

      if (error) throw error;

      const todaySales = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;
      const todayTransactions = transactions?.length || 0;
      const completedTransactions = transactions?.filter(t => t.status === 'completed').length || 0;
      const averageTransaction = todayTransactions > 0 ? todaySales / todayTransactions : 0;

      setStats({
        todaySales,
        todayTransactions,
        completedTransactions,
        averageTransaction,
      });
    } catch (error: any) {
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchHourlyData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: transactions } = await supabase
        .from("pos_transactions")
        .select("transaction_date, total_amount")
        .eq("cashier_id", user?.id)
        .gte("transaction_date", today.toISOString());

      const hourlyMap = new Map();
      for (let i = 0; i < 24; i++) {
        hourlyMap.set(i, { hour: `${i}:00`, sales: 0, count: 0 });
      }

      transactions?.forEach(txn => {
        const hour = new Date(txn.transaction_date).getHours();
        const current = hourlyMap.get(hour);
        if (current) {
          current.sales += parseFloat(txn.total_amount.toString());
          current.count += 1;
        }
      });

      setHourlyData(Array.from(hourlyMap.values()).filter(h => h.count > 0));
    } catch (error) {
      console.error("Failed to fetch hourly data", error);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: items } = await supabase
        .from("pos_transaction_items")
        .select("product_id, quantity, products(name)")
        .gte("created_at", today.toISOString());

      const productMap = new Map();
      items?.forEach(item => {
        const name = item.products?.name || 'Unknown';
        const current = productMap.get(name) || 0;
        productMap.set(name, current + item.quantity);
      });

      const sorted = Array.from(productMap.entries())
        .map(([name, quantity]) => ({ name, quantity }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setTopProducts(sorted);
    } catch (error) {
      console.error("Failed to fetch top products", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
        <p className="text-muted-foreground">Your shift overview and quick actions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value={`₹${stats.todaySales.toFixed(2)}`}
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value={stats.todayTransactions.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Average Sale"
          value={`₹${stats.averageTransaction.toFixed(2)}`}
          icon={TrendingUp}
        />
        <StatCard
          title="Completed"
          value={stats.completedTransactions.toString()}
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your shift</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
              onClick={() => navigate('/pos-checkout')}
            >
              <ShoppingCart className="h-5 w-5" />
              <div>
                <p className="font-medium">New Transaction</p>
                <p className="text-sm opacity-90">Start a new sale</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/sales')}
            >
              <DollarSign className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">View Sales</p>
                <p className="text-sm text-muted-foreground">Review your sales history</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/transactions')}
            >
              <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">View Transactions</p>
                <p className="text-sm text-muted-foreground">Check transaction details</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Products Today</CardTitle>
            <CardDescription>Most sold items in your shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{product.name}</span>
                    </div>
                    <span className="font-semibold text-sm">{product.quantity} sold</span>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No sales yet today</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {hourlyData.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales</CardTitle>
              <CardDescription>Your sales performance throughout the day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: any) => [`₹${value.toFixed(0)}`, 'Sales']}
                  />
                  <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transactions per Hour</CardTitle>
              <CardDescription>Transaction volume distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="hour" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)"
                    }}
                    formatter={(value: any) => [value, 'Transactions']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
