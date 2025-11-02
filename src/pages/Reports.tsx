import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DollarSign, ShoppingCart, TrendingUp, Package, Calendar, Download, AlertTriangle, Users, XCircle, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Reports() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    averageTransaction: 0,
    totalItems: 0,
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [outOfStockProducts, setOutOfStockProducts] = useState<any[]>([]);
  const [inactiveCustomers, setInactiveCustomers] = useState<any[]>([]);
  const [transactionTypes, setTransactionTypes] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("today");
  const { user } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    fetchReports();
  }, [user, role, period]);

  const fetchReports = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      let transactionsQuery = supabase
        .from("pos_transactions")
        .select("*");

      if (role === 'cashier') {
        transactionsQuery = transactionsQuery.eq("cashier_id", user?.id);
      }

      const { data: transactions, error: txnError } = await transactionsQuery;
      if (txnError) throw txnError;

      const totalSales = transactions?.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0) || 0;
      const totalTransactions = transactions?.length || 0;
      
      const todayTxns = transactions?.filter(t => new Date(t.transaction_date) >= today) || [];
      const todaySales = todayTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
      
      const weekTxns = transactions?.filter(t => new Date(t.transaction_date) >= weekAgo) || [];
      const weekSales = weekTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);
      
      const monthTxns = transactions?.filter(t => new Date(t.transaction_date) >= monthAgo) || [];
      const monthSales = monthTxns.reduce((sum, t) => sum + parseFloat(t.total_amount.toString()), 0);

      let itemsQuery = supabase
        .from("pos_transaction_items")
        .select("quantity, transaction_id");

      if (role === 'cashier') {
        const txnIds = transactions?.map(t => t.id) || [];
        itemsQuery = itemsQuery.in("transaction_id", txnIds);
      }

      const { data: items, error: itemsError } = await itemsQuery;
      if (itemsError) throw itemsError;

      const totalItems = items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Fetch low stock products
      const { data: lowStock, error: lowStockError } = await supabase
        .from("inventory")
        .select("*, products(name, sku)")
        .gt("quantity_on_hand", 0)
        .order("quantity_on_hand", { ascending: true })
        .limit(10);

      if (!lowStockError) {
        const filtered = lowStock?.filter(item => 
          item.quantity_on_hand <= item.reorder_point
        ) || [];
        setLowStockProducts(filtered);
      }

      // Fetch out of stock products
      const { data: outOfStock, error: outOfStockError } = await supabase
        .from("inventory")
        .select("*, products(name, sku)")
        .eq("quantity_on_hand", 0)
        .limit(10);

      if (!outOfStockError) setOutOfStockProducts(outOfStock || []);

      // Fetch inactive customers (no purchases in last 90 days)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .or(`last_purchase_date.is.null,last_purchase_date.lt.${ninetyDaysAgo.toISOString()}`)
        .eq("status", "active")
        .limit(10);

      if (!customersError) setInactiveCustomers(customers || []);

      // Calculate transaction type distribution
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("payment_method, amount");

      if (!paymentsError && payments) {
        const typeBreakdown = payments.reduce((acc: any, payment) => {
          const method = payment.payment_method;
          if (!acc[method]) {
            acc[method] = { count: 0, total: 0 };
          }
          acc[method].count += 1;
          acc[method].total += parseFloat(payment.amount.toString());
          return acc;
        }, {});
        setTransactionTypes(typeBreakdown);
      }

      setStats({
        totalSales,
        totalTransactions,
        averageTransaction: totalTransactions > 0 ? totalSales / totalTransactions : 0,
        totalItems,
        todaySales,
        weekSales,
        monthSales,
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch reports");
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (reportType: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    let csvData: any[] = [];
    let filename = '';

    switch (reportType) {
      case 'sales':
        csvData = [
          ['Sales Analytics Report'],
          ['Generated', new Date().toLocaleString()],
          ['Period', period],
          [''],
          ['Metric', 'Value'],
          ['Total Sales', `₹${stats.totalSales.toFixed(2)}`],
          ['Total Transactions', stats.totalTransactions.toString()],
          ['Average Transaction', `₹${stats.averageTransaction.toFixed(2)}`],
          ['Total Items Sold', stats.totalItems.toString()],
          ['Today Sales', `₹${stats.todaySales.toFixed(2)}`],
          ['Week Sales', `₹${stats.weekSales.toFixed(2)}`],
          ['Month Sales', `₹${stats.monthSales.toFixed(2)}`],
        ];
        filename = `sales-report-${timestamp}.csv`;
        break;

      case 'low-stock':
        csvData = [
          ['Low Stock Items Report'],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['Product Name', 'SKU', 'Current Stock', 'Reorder Point', 'Reorder Quantity', 'Location'],
          ...lowStockProducts.map(item => [
            item.products?.name || 'N/A',
            item.products?.sku || 'N/A',
            item.quantity_on_hand.toString(),
            item.reorder_point.toString(),
            item.reorder_quantity.toString(),
            item.location || 'N/A'
          ])
        ];
        filename = `low-stock-report-${timestamp}.csv`;
        break;

      case 'out-of-stock':
        csvData = [
          ['Out of Stock Items Report'],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['Product Name', 'SKU', 'Stock Status', 'Reorder Point', 'Reorder Quantity', 'Location'],
          ...outOfStockProducts.map(item => [
            item.products?.name || 'N/A',
            item.products?.sku || 'N/A',
            'Out of Stock',
            item.reorder_point.toString(),
            item.reorder_quantity.toString(),
            item.location || 'N/A'
          ])
        ];
        filename = `out-of-stock-report-${timestamp}.csv`;
        break;

      case 'inactive-customers':
        csvData = [
          ['Inactive Customers Report'],
          ['Generated', new Date().toLocaleString()],
          ['Criteria', 'No purchase in last 90 days'],
          [''],
          ['Customer Number', 'First Name', 'Last Name', 'Phone', 'Email', 'Last Purchase Date', 'Total Purchases'],
          ...inactiveCustomers.map(customer => [
            customer.customer_number || 'N/A',
            customer.first_name || 'N/A',
            customer.last_name || 'N/A',
            customer.phone || 'N/A',
            customer.email || 'N/A',
            customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never',
            `₹${customer.total_purchases || 0}`
          ])
        ];
        filename = `inactive-customers-report-${timestamp}.csv`;
        break;

      case 'transaction-types':
        csvData = [
          ['Transaction Types Report'],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['Payment Method', 'Transaction Count', 'Total Amount', 'Average Amount'],
          ...Object.entries(transactionTypes).map(([method, data]: [string, any]) => [
            method.toUpperCase(),
            data.count.toString(),
            `₹${data.total.toFixed(2)}`,
            `₹${(data.total / data.count).toFixed(2)}`
          ])
        ];
        filename = `transaction-types-report-${timestamp}.csv`;
        break;

      case 'all':
        csvData = [
          ['Comprehensive POS Report'],
          ['Generated', new Date().toLocaleString()],
          [''],
          ['=== SALES SUMMARY ==='],
          ['Total Sales', `₹${stats.totalSales.toFixed(2)}`],
          ['Total Transactions', stats.totalTransactions.toString()],
          ['Average Transaction', `₹${stats.averageTransaction.toFixed(2)}`],
          [''],
          ['=== PAYMENT METHODS ==='],
          ['Method', 'Count', 'Total'],
          ...Object.entries(transactionTypes).map(([method, data]: [string, any]) => 
            [method, data.count.toString(), `₹${data.total.toFixed(2)}`]
          ),
          [''],
          ['=== LOW STOCK ALERTS ==='],
          ['Product', 'SKU', 'Stock'],
          ...lowStockProducts.map(item => [
            item.products?.name || 'N/A',
            item.products?.sku || 'N/A',
            item.quantity_on_hand.toString()
          ]),
          [''],
          ['=== OUT OF STOCK ==='],
          ['Product', 'SKU'],
          ...outOfStockProducts.map(item => [
            item.products?.name || 'N/A',
            item.products?.sku || 'N/A'
          ]),
          [''],
          ['=== INACTIVE CUSTOMERS ==='],
          ['Customer', 'Phone', 'Last Purchase'],
          ...inactiveCustomers.map(customer => [
            `${customer.first_name} ${customer.last_name}`,
            customer.phone,
            customer.last_purchase_date ? new Date(customer.last_purchase_date).toLocaleDateString() : 'Never'
          ])
        ];
        filename = `comprehensive-report-${timestamp}.csv`;
        break;

      default:
        return;
    }

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`${reportType === 'all' ? 'Comprehensive' : reportType.replace('-', ' ')} report exported successfully`);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            {role === 'cashier' ? "Your performance reports" : 
             role === 'stock_manager' ? "Inventory and sales analytics" :
             role === 'marketing_manager' ? "Campaign and sales performance" :
             "Comprehensive business analytics"}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Reports
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => exportToCSV('sales')}>
                <FileText className="mr-2 h-4 w-4" />
                Sales Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('low-stock')}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Low Stock Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('out-of-stock')}>
                <XCircle className="mr-2 h-4 w-4" />
                Out of Stock Report
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('inactive-customers')}>
                <Users className="mr-2 h-4 w-4" />
                Inactive Customers
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('transaction-types')}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Transaction Types
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportToCSV('all')} className="font-semibold">
                <Download className="mr-2 h-4 w-4" />
                All Reports (Combined)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {period === 'today' ? "Today's Sales" : 
               period === 'week' ? "This Week" :
               period === 'month' ? "This Month" : "Total Sales"}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{(period === 'today' ? stats.todaySales :
                  period === 'week' ? stats.weekSales :
                  period === 'month' ? stats.monthSales :
                  stats.totalSales).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {period === 'all' ? `${stats.totalTransactions} transactions` : 'Revenue generated'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.averageTransaction.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Per sale</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
            <p className="text-xs text-muted-foreground">Total quantity</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Reorder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockProducts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.products?.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.products?.sku}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{item.quantity_on_hand} units</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {item.reorder_point} / {item.reorder_quantity}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No low stock items</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Out of Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outOfStockProducts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outOfStockProducts.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.products?.name}</TableCell>
                      <TableCell className="font-mono text-sm">{item.products?.sku}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Out of Stock</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No out of stock items</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Inactive Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inactiveCustomers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Last Purchase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>{customer.first_name} {customer.last_name}</TableCell>
                      <TableCell className="text-sm">{customer.phone}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {customer.last_purchase_date 
                          ? new Date(customer.last_purchase_date).toLocaleDateString() 
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No inactive customers</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(transactionTypes).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Count</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Avg Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(transactionTypes).map(([method, data]: [string, any]) => (
                    <TableRow key={method}>
                      <TableCell className="capitalize font-medium">{method.replace('_', ' ')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{data.count}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">₹{data.total.toFixed(2)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        ₹{(data.total / data.count).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No transactions yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.todaySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Daily revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.weekSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Weekly revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.monthSales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Monthly revenue</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
