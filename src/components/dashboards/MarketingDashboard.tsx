import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, TrendingUp, Users, Target, Plus, Eye, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export function MarketingDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    activeOffers: 0,
    totalOffers: 0,
    offerUsage: 0,
    totalCustomers: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch offers data
      const { data: offers, error: offersError } = await supabase
        .from("offers")
        .select("*");

      if (offersError) throw offersError;

      const activeOffers = offers?.filter(o => o.status === 'active').length || 0;
      const totalOffers = offers?.length || 0;
      const offerUsage = offers?.reduce((sum, o) => sum + (o.current_usage_count || 0), 0) || 0;

      // Fetch customers count
      const { count: customerCount } = await supabase
        .from("customers")
        .select("id", { count: 'exact', head: true });

      // Fetch sales data
      const { data: transactions, error: txnError } = await supabase
        .from("pos_transactions")
        .select("total_amount");

      if (txnError) throw txnError;

      const totalSales = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;

      setStats({
        activeOffers,
        totalOffers,
        offerUsage,
        totalCustomers: customerCount || 0,
        totalSales,
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

  const offerActivationRate = stats.totalOffers > 0 
    ? (stats.activeOffers / stats.totalOffers) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
        <p className="text-muted-foreground">Campaign performance and offers</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Offers"
          value={stats.activeOffers.toString()}
          icon={Tag}
        />
        <StatCard
          title="Total Customers"
          value={stats.totalCustomers.toString()}
          icon={Users}
        />
        <StatCard
          title="Offer Usage"
          value={stats.offerUsage.toString()}
          icon={Target}
        />
        <StatCard
          title="Total Sales"
          value={`₹${stats.totalSales.toFixed(0)}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Marketing campaign management</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
              onClick={() => navigate('/offers')}
            >
              <Plus className="h-5 w-5" />
              <div>
                <p className="font-medium">Create Offer</p>
                <p className="text-sm opacity-90">Launch new campaign</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/offers')}
            >
              <Eye className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">View Offers</p>
                <p className="text-sm text-muted-foreground">Manage active campaigns</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Campaign Reports</p>
                <p className="text-sm text-muted-foreground">View performance data</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Offer Performance</CardTitle>
            <CardDescription>Campaign effectiveness metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Active Campaigns</span>
                <span className="font-medium">{offerActivationRate.toFixed(0)}%</span>
              </div>
              <Progress value={offerActivationRate} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{stats.activeOffers}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalOffers}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{stats.offerUsage}</p>
                <p className="text-xs text-muted-foreground">Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Marketing Insights</CardTitle>
          <CardDescription>Key metrics and customer engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Tag className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Campaign Reach</p>
                <p className="text-xs text-muted-foreground">
                  {stats.activeOffers} active campaigns reaching {stats.totalCustomers} customers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Engagement Rate</p>
                <p className="text-xs text-muted-foreground">
                  {stats.offerUsage} total offer redemptions across all campaigns
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Sales Impact</p>
                <p className="text-xs text-muted-foreground">
                  ₹{stats.totalSales.toFixed(0)} total revenue generated
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Customer Base</p>
                <p className="text-xs text-muted-foreground">
                  Growing customer database with {stats.totalCustomers} registered customers
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
