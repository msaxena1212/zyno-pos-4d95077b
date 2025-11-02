import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, TrendingDown } from "lucide-react";
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const salesData = [
  { name: "Mon", sales: 4200 },
  { name: "Tue", sales: 5300 },
  { name: "Wed", sales: 4800 },
  { name: "Thu", sales: 6200 },
  { name: "Fri", sales: 7800 },
  { name: "Sat", sales: 9200 },
  { name: "Sun", sales: 6500 },
];

const productData = [
  { name: "Electronics", sales: 45000 },
  { name: "Clothing", sales: 32000 },
  { name: "Food", sales: 28000 },
  { name: "Home", sales: 19000 },
  { name: "Sports", sales: 15000 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your business performance</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value="$45,231"
          change="+20.1% from last month"
          changeType="positive"
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value="2,345"
          change="+12.5% from last month"
          changeType="positive"
          icon={ShoppingCart}
        />
        <StatCard
          title="Active Customers"
          value="1,893"
          change="+8.2% from last month"
          changeType="positive"
          icon={Users}
        />
        <StatCard
          title="Products in Stock"
          value="456"
          change="-3 low stock items"
          changeType="negative"
          icon={Package}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
            <CardDescription>Weekly sales performance</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Sales by product category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={productData}>
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
                <Bar dataKey="sales" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest transactions and updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { id: 1, action: "Sale completed", amount: "$234.50", time: "2 minutes ago", trend: "up" },
              { id: 2, action: "Product restocked", amount: "50 units", time: "15 minutes ago", trend: "up" },
              { id: 3, action: "Refund processed", amount: "$89.99", time: "1 hour ago", trend: "down" },
              { id: 4, action: "New customer registered", amount: "Sarah Johnson", time: "2 hours ago", trend: "up" },
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-3">
                  {item.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-accent" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <div>
                    <p className="font-medium">{item.action}</p>
                    <p className="text-sm text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <p className="font-semibold">{item.amount}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
