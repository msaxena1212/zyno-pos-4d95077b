import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Search, Receipt, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Product {
  id: string;
  sku: string;
  name: string;
  unit_price: number;
  tax_rate: number;
  barcode: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface Customer {
  id: string;
  customer_number: string;
  first_name: string;
  last_name: string;
  phone: string;
}

export default function POSCheckout() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any>(null);
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
  });
  const { user } = useAuth();
  const { currentBrand } = useBrand();

  useEffect(() => {
    fetchProducts();
    fetchCustomers();
  }, [currentBrand]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("name");

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("Failed to load products");
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_number, first_name, last_name, phone")
        .eq("status", "active")
        .order("first_name");

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      toast.error("Failed to load customers");
    }
  };

  const addToCart = (product: Product) => {
    const existing = cart.find(item => item.product.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }
    setSearchQuery("");
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.product.id === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.product.unit_price * item.quantity), 0);
  };

  const calculateDiscount = () => {
    return cart.reduce((sum, item) => sum + item.discount, 0);
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
    return cart.reduce((sum, item) => {
      const itemTotal = item.product.unit_price * item.quantity - item.discount;
      return sum + (itemTotal * item.product.tax_rate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount() + calculateTax();
  };

  const calculateChange = () => {
    if (paymentMethod !== "cash") return 0;
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - calculateTotal());
  };

  const processTransaction = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (paymentMethod === "cash") {
      const received = parseFloat(amountReceived) || 0;
      if (received < calculateTotal()) {
        toast.error("Insufficient payment amount");
        return;
      }
    }

    setProcessing(true);
    try {
      const { data: txnData, error: txnError } = await supabase.rpc('generate_transaction_number');
      
      if (txnError) throw txnError;

      const transaction = {
        transaction_number: txnData,
        brand_id: currentBrand?.id,
        cashier_id: user?.id,
        customer_id: selectedCustomer,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscount(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal(),
        amount_paid: paymentMethod === "cash" ? parseFloat(amountReceived) : calculateTotal(),
        change_amount: calculateChange(),
        payment_status: 'completed',
        status: 'completed',
      };

      const { data: newTxn, error: insertError } = await supabase
        .from("pos_transactions")
        .insert(transaction)
        .select()
        .single();

      if (insertError) throw insertError;

      const items = cart.map(item => ({
        transaction_id: newTxn.id,
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.unit_price,
        discount_amount: item.discount,
        tax_amount: (item.product.unit_price * item.quantity * item.product.tax_rate / 100),
        line_total: (item.product.unit_price * item.quantity) - item.discount + (item.product.unit_price * item.quantity * item.product.tax_rate / 100),
      }));

      const { error: itemsError } = await supabase
        .from("pos_transaction_items")
        .insert(items);

      if (itemsError) throw itemsError;

      const { error: paymentError } = await supabase
        .from("payments")
        .insert({
          transaction_id: newTxn.id,
          payment_method: paymentMethod,
          amount: paymentMethod === "cash" ? parseFloat(amountReceived) : calculateTotal(),
          payment_status: 'completed',
        });

      if (paymentError) throw paymentError;

      for (const item of cart) {
        const { data: invData } = await supabase
          .from('inventory')
          .select('quantity_on_hand')
          .eq('product_id', item.product.id)
          .single();
        
        if (invData) {
          await supabase
            .from('inventory')
            .update({
              quantity_on_hand: invData.quantity_on_hand - item.quantity
            })
            .eq('product_id', item.product.id);
        }
      }

      setLastReceipt({
        ...newTxn,
        items: cart,
        change: calculateChange(),
      });
      setReceiptOpen(true);

      toast.success(`Transaction completed! Receipt #${txnData}`);
      setCart([]);
      setSelectedCustomer("");
      setAmountReceived("");
      setPaymentMethod("cash");
    } catch (error: any) {
      toast.error(error.message || "Transaction failed");
    } finally {
      setProcessing(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCustomers = customers.filter(c =>
    c.first_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.last_name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone.includes(customerSearch) ||
    c.customer_number.toLowerCase().includes(customerSearch.toLowerCase())
  );

  const handleAddCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name || !newCustomer.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const { data: customerNumber } = await supabase.rpc('generate_customer_number');
      
      const { data, error } = await supabase
        .from("customers")
        .insert({
          ...newCustomer,
          customer_number: customerNumber,
          brand_id: currentBrand?.id,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Customer added successfully");
      setCustomers([...customers, data]);
      setSelectedCustomer(data.id);
      setCustomerSearch(`${data.first_name} ${data.last_name} (${data.phone})`);
      setAddCustomerOpen(false);
      setNewCustomer({ first_name: "", last_name: "", phone: "", email: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to add customer");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or scan barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border rounded-lg p-3 hover:bg-accent hover:border-primary cursor-pointer transition-all duration-200 flex flex-col"
                  onClick={() => addToCart(product)}
                >
                  <div className="flex items-center justify-center h-20 mb-2 bg-secondary/20 rounded">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm line-clamp-2">{product.name}</p>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-bold text-primary">₹{product.unit_price.toFixed(2)}</p>
                      <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No products found
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Shopping Cart ({cart.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between border-b pb-4">
                    <div className="flex-1">
                      <p className="font-semibold">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ₹{item.product.unit_price.toFixed(2)} × {item.quantity} = ₹{(item.product.unit_price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, -1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => updateQuantity(item.product.id, 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Customer *</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or customer #..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {customerSearch && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-3 hover:bg-accent cursor-pointer border-b last:border-0 ${
                          selectedCustomer === customer.id ? 'bg-accent' : ''
                        }`}
                        onClick={() => {
                          setSelectedCustomer(customer.id);
                          setCustomerSearch(`${customer.first_name} ${customer.last_name} (${customer.phone})`);
                        }}
                      >
                        <p className="font-medium">{customer.first_name} {customer.last_name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone} • {customer.customer_number}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-3">No customers found</p>
                      <Button 
                        onClick={() => setAddCustomerOpen(true)}
                        variant="outline"
                        size="sm"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Customer
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount:</span>
                <span className="text-destructive">-₹{calculateDiscount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>₹{calculateTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-4 w-4" />
                      Cash
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Card
                    </div>
                  </SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="wallet">Digital Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paymentMethod === "cash" && (
              <div className="space-y-2">
                <Label>Amount Received</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amountReceived}
                  onChange={(e) => setAmountReceived(e.target.value)}
                />
                {amountReceived && (
                  <p className="text-sm">
                    Change: <span className="font-semibold">₹{calculateChange().toFixed(2)}</span>
                  </p>
                )}
              </div>
            )}

            <Button
              onClick={processTransaction}
              disabled={processing || cart.length === 0}
              className="w-full"
              size="lg"
            >
              <Receipt className="mr-2 h-4 w-4" />
              {processing ? "Processing..." : "Complete Transaction"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={receiptOpen} onOpenChange={setReceiptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>
          {lastReceipt && (
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span>Receipt #:</span>
                <span className="font-mono">{lastReceipt.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(lastReceipt.transaction_date).toLocaleString()}</span>
              </div>
              <div className="border-t pt-4">
                {lastReceipt.items.map((item: CartItem) => (
                  <div key={item.product.id} className="flex justify-between mb-2">
                    <span>{item.product.name} ×{item.quantity}</span>
                    <span>₹{(item.product.unit_price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastReceipt.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax:</span>
                  <span>₹{lastReceipt.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-base">
                  <span>Total:</span>
                  <span>₹{lastReceipt.total_amount.toFixed(2)}</span>
                </div>
                {paymentMethod === "cash" && (
                  <>
                    <div className="flex justify-between">
                      <span>Paid:</span>
                      <span>₹{lastReceipt.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>₹{lastReceipt.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Enter customer details to add them to the system</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newCustomer.first_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name *</Label>
                <Input
                  value={newCustomer.last_name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setAddCustomerOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddCustomer}>
                Add Customer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
