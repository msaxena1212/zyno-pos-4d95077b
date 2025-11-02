import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, TrendingUp, Users, Target } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function MarketingDashboard() {
  const [offerCount, setOfferCount] = useState(0);

  useEffect(() => {
    fetchOfferStats();
  }, []);

  const fetchOfferStats = async () => {
    try {
      const { count } = await supabase
        .from("offers")
        .select("id", { count: 'exact', head: true })
        .eq("status", "active");
      
      setOfferCount(count || 0);
    } catch (error) {
      console.error("Error fetching offer stats:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketing Dashboard</h1>
        <p className="text-muted-foreground">Campaign performance and offers</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Offers"
          value={offerCount.toString()}
          icon={Tag}
        />
        <StatCard
          title="Campaign Reach"
          value="12,543"
          change="+18.2%"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Conversion Rate"
          value="8.4%"
          change="+2.1%"
          changeType="positive"
          icon={Target}
        />
        <StatCard
          title="ROI"
          value="234%"
          change="+12%"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Campaign Overview</CardTitle>
          <CardDescription>Active marketing campaigns and their performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-medium">Summer Sale Campaign</p>
                <p className="text-sm text-muted-foreground">Running for 12 days</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">+24% Sales</p>
                <p className="text-sm text-muted-foreground">vs last month</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <p className="font-medium">New Customer Discount</p>
                <p className="text-sm text-muted-foreground">Running for 5 days</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">+156 Sign-ups</p>
                <p className="text-sm text-muted-foreground">this week</p>
              </div>
            </div>
            <div className="flex items-center justify-between pb-3">
              <div>
                <p className="font-medium">Bundle Promotion</p>
                <p className="text-sm text-muted-foreground">Running for 3 days</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-accent">+89 Orders</p>
                <p className="text-sm text-muted-foreground">since launch</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
