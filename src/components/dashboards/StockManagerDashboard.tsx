import { useState, useEffect } from "react";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, TrendingDown, TrendingUp, BarChart3, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface InventoryStats {
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  totalValue: number;
}

interface TopProduct {
  name: string;
  quantity: number;
  status: string;
}

export function StockManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<InventoryStats>({
    totalProducts: 0,
    lowStock: 0,
    outOfStock: 0,
    totalValue: 0,
  });
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch inventory data
      const { data: inventory, error: invError } = await supabase
        .from("inventory")
        .select("*, products(name, unit_price, cost_price)");

      if (invError) throw invError;

      const totalProducts = inventory?.length || 0;
      const lowStock = inventory?.filter(i => i.quantity_on_hand <= i.reorder_point && i.quantity_on_hand > 0).length || 0;
      const outOfStock = inventory?.filter(i => i.quantity_on_hand === 0).length || 0;
      
      const totalValue = inventory?.reduce((sum, item) => {
        const price = item.products?.cost_price || item.products?.unit_price || 0;
        return sum + (item.quantity_on_hand * parseFloat(price.toString()));
      }, 0) || 0;

      // Get top 5 products by quantity
      const sortedProducts = [...(inventory || [])]
        .sort((a, b) => b.quantity_on_hand - a.quantity_on_hand)
        .slice(0, 5)
        .map(item => ({
          name: item.products?.name || 'Unknown',
          quantity: item.quantity_on_hand,
          status: item.quantity_on_hand === 0 ? 'out' : item.quantity_on_hand <= item.reorder_point ? 'low' : 'ok'
        }));

      setStats({ totalProducts, lowStock, outOfStock, totalValue });
      setTopProducts(sortedProducts);
    } catch (error: any) {
      toast.error("Failed to fetch inventory statistics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  const stockHealthPercentage = stats.totalProducts > 0 
    ? ((stats.totalProducts - stats.outOfStock - stats.lowStock) / stats.totalProducts) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Manager Dashboard</h1>
        <p className="text-muted-foreground">Inventory overview and stock management</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
        />
        <StatCard
          title="Low Stock Items"
          value={stats.lowStock.toString()}
          icon={AlertTriangle}
        />
        <StatCard
          title="Out of Stock"
          value={stats.outOfStock.toString()}
          icon={TrendingDown}
        />
        <StatCard
          title="Inventory Value"
          value={`₹${stats.totalValue.toFixed(0)}`}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common stock management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer transition-colors"
              onClick={() => navigate('/products')}
            >
              <Package className="h-5 w-5" />
              <div>
                <p className="font-medium">View Products</p>
                <p className="text-sm opacity-90">Manage product catalog</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/reports')}
            >
              <BarChart3 className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Inventory Reports</p>
                <p className="text-sm text-muted-foreground">View stock analytics</p>
              </div>
            </div>
            <div 
              className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer transition-colors"
              onClick={() => navigate('/sales')}
            >
              <ShoppingCart className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Sales Data</p>
                <p className="text-sm text-muted-foreground">Product sales performance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Health</CardTitle>
            <CardDescription>Overall inventory status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">Healthy Stock</span>
                <span className="font-medium">{stockHealthPercentage.toFixed(0)}%</span>
              </div>
              <Progress value={stockHealthPercentage} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalProducts - stats.lowStock - stats.outOfStock}
                </p>
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStock}</p>
                <p className="text-xs text-muted-foreground">Low Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{stats.outOfStock}</p>
                <p className="text-xs text-muted-foreground">Out of Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Products by Stock</CardTitle>
          <CardDescription>Products with highest inventory levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center justify-between border-b border-border pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    product.status === 'ok' ? 'bg-green-500' :
                    product.status === 'low' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Status: {product.status === 'ok' ? 'In Stock' : product.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{product.quantity} units</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Reorder Alerts</CardTitle>
            <CardDescription>Products that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-3" />
              <p className="text-2xl font-bold">{stats.lowStock}</p>
              <p className="text-sm text-muted-foreground">Products below reorder point</p>
              <button 
                className="mt-4 text-sm text-primary hover:underline"
                onClick={() => navigate('/products')}
              >
                View All Products
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Inventory Insights</CardTitle>
            <CardDescription>Key metrics and recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Total Inventory Value</p>
                  <p className="text-xs text-muted-foreground">
                    Your current stock is worth ₹{stats.totalValue.toFixed(0)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Action Required</p>
                  <p className="text-xs text-muted-foreground">
                    {stats.lowStock + stats.outOfStock} products need attention
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Stock Health</p>
                  <p className="text-xs text-muted-foreground">
                    {stockHealthPercentage.toFixed(0)}% of products are adequately stocked
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}