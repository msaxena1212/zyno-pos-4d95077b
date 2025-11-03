import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingCart, Package, Users, FileText, BarChart3, DollarSign, Shield, Tag, Workflow, UserCircle, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/useUserRole";

const allNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard, roles: ['admin', 'manager', 'marketing_manager', 'cashier', 'stock_manager'] },
  { name: "POS Checkout", href: "/pos-checkout", icon: ShoppingCart, roles: ['admin', 'manager', 'cashier', 'marketing_manager', 'stock_manager'] },
  { name: "Products", href: "/products", icon: Package, roles: ['admin', 'manager', 'cashier', 'stock_manager', 'marketing_manager'] },
  { name: "Customers", href: "/customers", icon: UserCircle, roles: ['admin', 'manager', 'cashier', 'marketing_manager', 'stock_manager'] },
  { name: "Sales", href: "/sales", icon: DollarSign, roles: ['admin', 'manager', 'cashier', 'marketing_manager', 'stock_manager'] },
  { name: "Transactions", href: "/transactions", icon: FileText, roles: ['admin', 'manager', 'cashier', 'marketing_manager', 'stock_manager'] },
  { name: "Returns", href: "/returns", icon: RotateCcw, roles: ['admin', 'manager', 'cashier'] },
  { name: "Reports", href: "/reports", icon: BarChart3, roles: ['admin', 'manager', 'cashier', 'marketing_manager', 'stock_manager'] },
  { name: "Users", href: "/users", icon: Users, roles: ['admin', 'manager'] },
  { name: "Roles", href: "/roles", icon: Shield, roles: ['admin', 'manager'] },
  { name: "Offers", href: "/offers", icon: Tag, roles: ['admin', 'manager', 'marketing_manager', 'stock_manager'] },
  { name: "Workflows", href: "/workflows", icon: Workflow, roles: ['admin', 'manager'] },
];

export function Sidebar() {
  const { role, loading } = useUserRole();

  const navigation = allNavigation.filter(item => 
    !item.roles || item.roles.includes(role || '')
  );

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-foreground">RetailPro POS</h1>
      </div>
      <nav className="flex flex-col gap-1 p-4">
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Loading...</div>
        ) : (
          navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))
        )}
      </nav>
    </aside>
  );
}
