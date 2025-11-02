import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, Tag, Workflow, Building2, Activity } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const systemData = [
  { name: "Users", count: 0 },
  { name: "Roles", count: 0 },
  { name: "Offers", count: 0 },
  { name: "Tasks", count: 0 },
];

export function AdminDashboard() {
  const [stats, setStats] = useState(systemData);

  useEffect(() => {
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const [users, roles, offers, tasks] = await Promise.all([
        supabase.from("profiles").select("id", { count: 'exact', head: true }),
        supabase.from("roles").select("id", { count: 'exact', head: true }),
        supabase.from("offers").select("id", { count: 'exact', head: true }),
        supabase.from("workflow_tasks").select("id", { count: 'exact', head: true }),
      ]);

      setStats([
        { name: "Users", count: users.count || 0 },
        { name: "Roles", count: roles.count || 0 },
        { name: "Offers", count: offers.count || 0 },
        { name: "Tasks", count: tasks.count || 0 },
      ]);
    } catch (error) {
      console.error("Error fetching system stats:", error);
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
    </div>
  );
}
