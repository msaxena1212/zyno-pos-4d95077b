import { useUserRole } from "@/hooks/useUserRole";
import { AdminDashboard } from "@/components/dashboards/AdminDashboard";
import { ManagerDashboard } from "@/components/dashboards/ManagerDashboard";
import { MarketingDashboard } from "@/components/dashboards/MarketingDashboard";
import { CashierDashboard } from "@/components/dashboards/CashierDashboard";
import { StockManagerDashboard } from "@/components/dashboards/StockManagerDashboard";

const Dashboard = () => {
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  if (role === 'admin') return <AdminDashboard />;
  if (role === 'manager') return <ManagerDashboard />;
  if (role === 'marketing_manager') return <MarketingDashboard />;
  if (role === 'stock_manager') return <StockManagerDashboard />;
  if (role === 'cashier') return <CashierDashboard />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome to your dashboard</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">No role assigned. Please contact an administrator.</p>
      </div>
    </div>
  );
};

export default Dashboard;
