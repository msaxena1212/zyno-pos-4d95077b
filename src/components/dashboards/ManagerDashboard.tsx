import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, TrendingUp, Package, UserCircle, Tag, BarChart3 } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Bar, BarChart } from "recharts";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    activeStaff: 0,
    totalProducts: 0,
    totalCustomers: 0,
    activeOffers: 0,
    lowStockItems: 0,
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchWeeklyData();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch transactions
      const { data: transactions, error: txnError } = await supabase
        .from("pos_transactions")
        .select("total_amount");

      if (txnError) throw txnError;

      const totalRevenue = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;
      const totalTransactions = transactions?.length || 0;

      // Fetch products
      const { count: productCount } = await supabase
        .from("products")
        .select("id", { count: 'exact', head: true })
        .eq("status", "active");

      // Fetch inventory for low stock
      const { data: inventory } = await supabase
        .from("inventory")
        .select("quantity_on_hand, reorder_point");

      const lowStockItems = inventory?.filter(i => i.quantity_on_hand <= i.reorder_point && i.quantity_on_hand > 0).length || 0;

      // Fetch customers
      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: 'exact', head: true });

      // Fetch active offers
      const { count: offerCount } = await supabase
        .from("offers")
        .select("id", { count: 'exact', head: true })
        .eq("status", "active");

      // Fetch active staff (users with active role assignments)
      const { data: activeAssignments } = await supabase
        .from("user_role_assignments")
        .select("user_id")
        .eq("status", "active");

      const uniqueStaff = new Set(activeAssignments?.map(a => a.user_id)).size;

      setStats({
        totalRevenue,
        totalTransactions,
        activeStaff: uniqueStaff,
        totalProducts: productCount || 0,
        totalCustomers: customerCount || 0,
        activeOffers: offerCount || 0,
        lowStockItems,
      });
    } catch (error: any) {
      toast.error("Failed to fetch statistics");
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyData = async () => {
    try {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const weekData = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);
        
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        const { data: dayTransactions } = await supabase
          .from("pos_transactions")
          .select("total_amount")
          .gte("transaction_date", date.toISOString())
          .lt("transaction_date", nextDate.toISOString());

        const sales = dayTransactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;

        weekData.push({
          name: days[date.getDay()],
          sales: Math.round(sales),
          transactions: dayTransactions?.length || 0,
        });
      }

      setWeeklyData(weekData);
    } catch (error: any) {
      console.error("Failed to fetch weekly data", error);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const growthRate = weeklyData.length >= 2 
    ? ((weeklyData[6].sales - weeklyData[0].sales) / Math.max(weeklyData[0].sales, 1)) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Business performance and team management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`₹${stats.totalRevenue.toFixed(0)}`}
          change={growthRate > 0 ? `+${growthRate.toFixed(1)}%` : `${growthRate.toFixed(1)}%`}
          changeType={growthRate >= 0 ? "positive" : "negative"}
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value={stats.totalTransactions.toString()}
          icon={ShoppingCart}
        />
        <StatCard
          title="Active Staff"
          value={stats.activeStaff.toString()}
          icon={Users}
        />
        <StatCard
          title="Growth Rate"
          value={`${Math.abs(growthRate).toFixed(1)}%`}
          change={growthRate >= 0 ? "week over week" : "week over week"}
          changeType={growthRate >= 0 ? "positive" : "negative"}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
              onClick={() => navigate('/pos-checkout')}
            >
              <ShoppingCart className="h-5 w-5" />
              <div>
                <p className="font-medium">New Transaction</p>
                <p className="text-sm opacity-90">Process a sale</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/users')}
            >
              <Users className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Manage Staff</p>
                <p className="text-sm text-muted-foreground">View and manage team</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-muted-foreground">Business analytics</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/products')}
            >
              <Package className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Manage Products</p>
                <p className="text-sm text-muted-foreground">Update inventory</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Business Overview</CardTitle>
            <CardDescription>Key metrics at a glance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Package className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <UserCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                <p className="text-xs text-muted-foreground">Customers</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <Tag className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{stats.activeOffers}</p>
                <p className="text-xs text-muted-foreground">Active Offers</p>
              </div>
              <div className="text-center p-4 bg-accent/10 rounded-lg">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                <p className="text-2xl font-bold">{stats.lowStockItems}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Sales Performance</CardTitle>
            <CardDescription>Revenue trends for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  formatter={(value: any) => [`₹${value}`, 'Sales']}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Volume</CardTitle>
            <CardDescription>Daily transaction count</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                  formatter={(value: any) => [value, 'Transactions']}
                />
                <Bar 
                  dataKey="transactions" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Management Insights</CardTitle>
          <CardDescription>Key performance indicators and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Revenue Performance</p>
                <p className="text-xs text-muted-foreground">
                  Total revenue of ₹{stats.totalRevenue.toFixed(0)} from {stats.totalTransactions} transactions
                </p>
                <Progress value={Math.min(100, (stats.totalRevenue / 100000) * 100)} className="h-2 mt-2" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Team Performance</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeStaff} active staff members contributing to operations
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Package className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Inventory Alert</p>
                <p className="text-xs text-muted-foreground">
                  {stats.lowStockItems} products are running low and need restocking
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Growth Trend</p>
                <p className="text-xs text-muted-foreground">
                  {growthRate >= 0 ? 'Positive' : 'Negative'} growth of {Math.abs(growthRate).toFixed(1)}% compared to last week
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}