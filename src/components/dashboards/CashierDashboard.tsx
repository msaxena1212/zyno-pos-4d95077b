import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function CashierDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    completedTransactions: 0,
    averageTransaction: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
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
            <CardTitle>Performance Chart</CardTitle>
            <CardDescription>Your sales performance today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Sales Target Progress</span>
                  <span className="font-medium">
                    {stats.todayTransactions > 0 ? Math.min(100, (stats.todayTransactions / 50) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.todayTransactions / 50) * 100)}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Revenue Target</span>
                  <span className="font-medium">
                    {stats.todaySales > 0 ? Math.min(100, (stats.todaySales / 50000) * 100).toFixed(0) : 0}%
                  </span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (stats.todaySales / 50000) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">Keep up the great work!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Target: 50 transactions or ₹50,000 per day
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
