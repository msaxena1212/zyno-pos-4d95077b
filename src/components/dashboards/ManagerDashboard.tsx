import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const salesData = [
  { name: "Mon", sales: 4200 },
  { name: "Tue", sales: 5300 },
  { name: "Wed", sales: 4800 },
  { name: "Thu", sales: 6200 },
  { name: "Fri", sales: 7800 },
  { name: "Sat", sales: 9200 },
  { name: "Sun", sales: 6500 },
];

export function ManagerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <p className="text-muted-foreground">Business performance and team management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          change="+20.1%"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value="2,345"
          change="+12.5%"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          title="Active Staff"
          value="24"
          icon={Users}
        />
        <StatCard
          title="Growth Rate"
          value="15.3%"
          change="+2.4%"
          changeType="positive"
          icon={TrendingUp}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Performance</CardTitle>
          <CardDescription>Sales trends for this week</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs" />
              <YAxis className="text-xs" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)"
                }}
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
    </div>
  );
}
