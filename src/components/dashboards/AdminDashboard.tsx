import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Tag, Workflow, Building2, Activity, TrendingUp, Database } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Pie, PieChart, Cell, Legend, Area, AreaChart } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(142, 76%, 36%)', 'hsl(48, 96%, 53%)'];

export function AdminDashboard() {
  const [stats, setStats] = useState([
    { name: "Users", count: 0 },
    { name: "Roles", count: 0 },
    { name: "Offers", count: 0 },
    { name: "Tasks", count: 0 },
  ]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [pieData, setPieData] = useState<any[]>([]);

  useEffect(() => {
    fetchSystemStats();
    fetchActivityData();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const [users, roles, offers, tasks, brands, transactions, products] = await Promise.all([
        supabase.from("profiles").select("id", { count: 'exact', head: true }),
        supabase.from("roles").select("id", { count: 'exact', head: true }),
        supabase.from("offers").select("id", { count: 'exact', head: true }),
        supabase.from("workflow_tasks").select("id", { count: 'exact', head: true }),
        supabase.from("brands").select("id", { count: 'exact', head: true }),
        supabase.from("pos_transactions").select("id", { count: 'exact', head: true }),
        supabase.from("products").select("id", { count: 'exact', head: true }),
      ]);

      const newStats = [
        { name: "Users", count: users.count || 0 },
        { name: "Roles", count: roles.count || 0 },
        { name: "Offers", count: offers.count || 0 },
        { name: "Tasks", count: tasks.count || 0 },
      ];

      setStats(newStats);
      setPieData([
        { name: "Users", value: users.count || 0, color: COLORS[0] },
        { name: "Products", value: products.count || 0, color: COLORS[1] },
        { name: "Transactions", value: (transactions.count || 0) / 10, color: COLORS[2] },
        { name: "Brands", value: (brands.count || 0) * 5, color: COLORS[3] },
      ]);
    } catch (error) {
      console.error("Error fetching system stats:", error);
    }
  };

  const fetchActivityData = async () => {
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

        const [transactions, tasks] = await Promise.all([
          supabase.from("pos_transactions").select("id", { count: 'exact', head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
          supabase.from("workflow_tasks").select("id", { count: 'exact', head: true })
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDate.toISOString()),
        ]);

        weekData.push({
          name: days[date.getDay()],
          transactions: transactions.count || 0,
          tasks: tasks.count || 0,
        });
      }

      setActivityData(weekData);
    } catch (error) {
      console.error("Failed to fetch activity data", error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats[0].count.toString()}
          icon={Users}
        />
        <StatCard
          title="Active Roles"
          value={stats[1].count.toString()}
          icon={Shield}
        />
        <StatCard
          title="Active Offers"
          value={stats[2].count.toString()}
          icon={Tag}
        />
        <StatCard
          title="Workflow Tasks"
          value={stats[3].count.toString()}
          icon={Workflow}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Overview</CardTitle>
            <CardDescription>Current system statistics</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats}>
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
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Distribution</CardTitle>
            <CardDescription>Resource allocation overview</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)"
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
            <CardDescription>System usage over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
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
                <Area type="monotone" dataKey="transactions" stackId="1" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Area type="monotone" dataKey="tasks" stackId="1" stroke="hsl(142, 76%, 36%)" fill="hsl(142, 76%, 36%)" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Administrative shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">User Management</p>
                <p className="text-sm text-muted-foreground">Manage system users and roles</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Brand Configuration</p>
                <p className="text-sm text-muted-foreground">Configure multi-brand settings</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer">
              <Activity className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">System Audit</p>
                <p className="text-sm text-muted-foreground">View system activity logs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
          <CardDescription>Platform performance and usage metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Database className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">Database Usage</p>
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">System Performance</p>
                  <span className="text-sm text-muted-foreground">Optimal</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-sm">User Activity</p>
                  <span className="text-sm text-muted-foreground">High</span>
                </div>
                <Progress value={85} className="h-2" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
