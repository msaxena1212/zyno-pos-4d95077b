import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingCart, Clock, CheckCircle2 } from "lucide-react";

export function CashierDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cashier Dashboard</h1>
        <p className="text-muted-foreground">Your shift overview and quick actions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Sales"
          value="$1,234"
          icon={DollarSign}
        />
        <StatCard
          title="Transactions"
          value="42"
          icon={ShoppingCart}
        />
        <StatCard
          title="Shift Duration"
          value="4h 32m"
          icon={Clock}
        />
        <StatCard
          title="Completed"
          value="38"
          icon={CheckCircle2}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for your shift</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 cursor-pointer">
              <ShoppingCart className="h-5 w-5" />
              <div>
                <p className="font-medium">New Transaction</p>
                <p className="text-sm opacity-90">Start a new sale</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer">
              <DollarSign className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">Process Return</p>
                <p className="text-sm text-muted-foreground">Handle customer returns</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-secondary rounded-md hover:bg-secondary/80 cursor-pointer">
              <CheckCircle2 className="h-5 w-5 text-secondary-foreground" />
              <div>
                <p className="font-medium">View Today's Sales</p>
                <p className="text-sm text-muted-foreground">Review shift transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Your last 5 transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { id: "#TXN-001", amount: "$45.99", time: "2 min ago" },
                { id: "#TXN-002", amount: "$123.50", time: "8 min ago" },
                { id: "#TXN-003", amount: "$78.25", time: "15 min ago" },
                { id: "#TXN-004", amount: "$234.00", time: "22 min ago" },
                { id: "#TXN-005", amount: "$56.80", time: "28 min ago" },
              ].map((txn) => (
                <div key={txn.id} className="flex items-center justify-between border-b border-border pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{txn.id}</p>
                    <p className="text-sm text-muted-foreground">{txn.time}</p>
                  </div>
                  <p className="font-semibold">{txn.amount}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
