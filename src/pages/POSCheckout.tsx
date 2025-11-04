import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Search, Receipt, Package, Tag, Percent } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useBrand } from "@/contexts/BrandContext";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { PaymentGateway } from "@/components/PaymentGateway";
import { getCashbackAccount, calculateCashbackAmount, recordCashbackEarned, redeemCashback } from "@/lib/cashback";

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
  const [paymentGatewayOpen, setPaymentGatewayOpen] = useState(false);
  const [cashbackBalance, setCashbackBalance] = useState<number>(0);
  const [cashbackToUse, setCashbackToUse] = useState<number>(0);
  const [showCashbackDialog, setShowCashbackDialog] = useState(false);
  const [offerCode, setOfferCode] = useState("");
  const [appliedOffer, setAppliedOffer] = useState<any>(null);
  const [offerDiscount, setOfferDiscount] = useState<number>(0);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
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
    const itemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
    return itemDiscounts + offerDiscount;
  };

  const calculateTax = () => {
    const subtotalAfterDiscount = calculateSubtotal() - calculateDiscount();
    return cart.reduce((sum, item) => {
      const itemTotal = item.product.unit_price * item.quantity - item.discount;
      return sum + (itemTotal * item.product.tax_rate / 100);
    }, 0);
  };

  const calculateTotal = () => {
    const totalBeforeCashback = calculateSubtotal() - calculateDiscount() + calculateTax();
    return Math.max(0, totalBeforeCashback - cashbackToUse);
  };

  const calculateChange = () => {
    if (paymentMethod !== "cash") return 0;
    const received = parseFloat(amountReceived) || 0;
    return Math.max(0, received - calculateTotal());
  };

  const initiatePayment = () => {
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
      processTransaction();
    } else if (paymentMethod === "card" || paymentMethod === "upi" || paymentMethod === "digital_wallet") {
      setPaymentGatewayOpen(true);
    } else {
      processTransaction();
    }
  };

  const processTransaction = async (paymentDetails?: any) => {
    if (!user?.id) {
      toast.error("User not authenticated. Please log in again.");
      return;
    }

    setProcessing(true);
    try {
      // Verify user session is still valid
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error("Session expired. Please log in again.");
        setProcessing(false);
        return;
      }

      console.log("Session user ID:", session.user.id);
      console.log("Context user ID:", user.id);

      // Verify user role
      const { data: userRole, error: roleError } = await supabase.rpc('get_user_role', { 
        user_uuid: session.user.id 
      });

      console.log("User role:", userRole, "Role error:", roleError);

      if (roleError || !userRole) {
        toast.error("Unable to verify user permissions. Please contact support.");
        setProcessing(false);
        return;
      }

      if (!['admin', 'manager', 'cashier'].includes(userRole)) {
        toast.error("You don't have permission to create transactions.");
        setProcessing(false);
        return;
      }

      const { data: txnData, error: txnError } = await supabase.rpc('generate_transaction_number');
      
      if (txnError) throw txnError;

      const transaction = {
        transaction_number: txnData,
        brand_id: currentBrand?.id || null,
        cashier_id: session.user.id,
        customer_id: selectedCustomer || null,
        subtotal: calculateSubtotal(),
        discount_amount: calculateDiscount(),
        tax_amount: calculateTax(),
        total_amount: calculateTotal(),
        amount_paid: paymentMethod === "cash" ? parseFloat(amountReceived) : calculateTotal(),
        change_amount: calculateChange(),
        payment_status: 'completed',
        status: 'completed',
      };

      console.log("Transaction data:", transaction);

      const { data: newTxn, error: insertError } = await supabase
        .from("pos_transactions")
        .insert(transaction)
        .select()
        .single();

      if (insertError) {
        console.error("Transaction insert error:", insertError);
        throw new Error(`Failed to create transaction: ${insertError.message}`);
      }

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

      const paymentRecord = {
        transaction_id: newTxn.id,
        payment_method: paymentMethod,
        amount: paymentMethod === "cash" ? parseFloat(amountReceived) : calculateTotal(),
        payment_status: 'completed',
        authorization_code: paymentDetails?.authCode || null,
        card_last_four: paymentDetails?.cardLastFour || null,
      };

      const { error: paymentError } = await supabase
        .from("payments")
        .insert(paymentRecord);

      if (paymentError) {
        console.error("Payment insert error:", paymentError);
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }

      // Update inventory for each item
      for (const item of cart) {
        const { data: invData, error: invError } = await supabase
          .from('inventory')
          .select('quantity_on_hand, id')
          .eq('product_id', item.product.id)
          .maybeSingle();
        
        if (invData && !invError) {
          const newQuantity = Math.max(0, invData.quantity_on_hand - item.quantity);
          const { error: updateError } = await supabase
            .from('inventory')
            .update({
              quantity_on_hand: newQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', invData.id);
          
          if (updateError) {
            console.warn(`Failed to update inventory for product ${item.product.id}:`, updateError);
          }
        }
      }

      // Update customer's last purchase date and total purchases
      if (selectedCustomer) {
        const { data: customerData } = await supabase
          .from('customers')
          .select('total_purchases')
          .eq('id', selectedCustomer)
          .maybeSingle();
        
        const currentTotal = customerData?.total_purchases || 0;
        const newTotal = parseFloat(currentTotal.toString()) + calculateTotal();
        
        const { error: customerUpdateError } = await supabase
          .from('customers')
          .update({
            last_purchase_date: new Date().toISOString(),
            total_purchases: newTotal,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedCustomer);
        
        if (customerUpdateError) {
          console.warn('Failed to update customer info:', customerUpdateError);
        }
      }

      setLastReceipt({
        ...newTxn,
        items: cart,
        change: calculateChange(),
        payment_method: paymentMethod,
        appliedOffer: appliedOffer,
        offerDiscount: offerDiscount,
      });
      setReceiptOpen(true);

      toast.success(`Transaction completed! Receipt #${txnData}`);
      setCart([]);
      setSelectedCustomer("");
      setAmountReceived("");
      setPaymentMethod("cash");
      setOfferCode("");
      setAppliedOffer(null);
      setOfferDiscount(0);
    } catch (error: any) {
      console.error("Transaction error:", error);
      toast.error(error.message || "Transaction failed. Please try again.");
    } finally {
      setProcessing(false);
      setPaymentGatewayOpen(false);
    }
  };

  const handleCloseReceipt = () => {
    setReceiptOpen(false);
    // Reset all form states
    setCart([]);
    setSelectedCustomer("");
    setCustomerSearch("");
    setAmountReceived("");
    setPaymentMethod("cash");
    setLastReceipt(null);
    setSearchQuery("");
    toast.info("Ready for next transaction");
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !lastReceipt) return;

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt #${lastReceipt.transaction_number}</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            max-width: 300px;
            margin: 20px auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .items {
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 10px 0;
            margin: 10px 0;
          }
          .total {
            font-weight: bold;
            font-size: 1.2em;
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 0.9em;
          }
          @media print {
            body { margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>RetailPro POS</h2>
          <p>Receipt #${lastReceipt.transaction_number}</p>
          <p>${new Date(lastReceipt.transaction_date).toLocaleString()}</p>
        </div>
        
        <div class="items">
          ${lastReceipt.items.map((item: CartItem) => `
            <div class="row">
              <span>${item.product.name} ×${item.quantity}</span>
              <span>₹${(item.product.unit_price * item.quantity).toFixed(2)}</span>
            </div>
          `).join('')}
        </div>
        
        <div class="row">
          <span>Subtotal:</span>
          <span>₹${lastReceipt.subtotal.toFixed(2)}</span>
        </div>
        <div class="row">
          <span>Tax:</span>
          <span>₹${lastReceipt.tax_amount.toFixed(2)}</span>
        </div>
        <div class="row total">
          <span>Total:</span>
          <span>₹${lastReceipt.total_amount.toFixed(2)}</span>
        </div>
        
        ${lastReceipt.payment_method === 'cash' ? `
          <div class="row">
            <span>Paid:</span>
            <span>₹${lastReceipt.amount_paid.toFixed(2)}</span>
          </div>
          <div class="row">
            <span>Change:</span>
            <span>₹${lastReceipt.change.toFixed(2)}</span>
          </div>
        ` : `
          <div class="row">
            <span>Payment Method:</span>
            <span>${lastReceipt.payment_method.toUpperCase()}</span>
          </div>
        `}
        
        <div class="footer">
          <p>Thank you for shopping with us!</p>
          <p>Visit again soon</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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

  const applyOfferCode = async () => {
    if (!offerCode.trim()) {
      toast.error("Please enter an offer code");
      return;
    }

    if (cart.length === 0) {
      toast.error("Add items to cart before applying offer");
      return;
    }

    try {
      const { data: offers, error } = await supabase
        .from("offers")
        .select("*")
        .eq("code", offerCode.toUpperCase())
        .eq("status", "active");

      if (error) {
        console.error("Offer lookup error:", error);
        toast.error("Failed to validate offer code");
        return;
      }

      if (!offers || offers.length === 0) {
        toast.error("Invalid or expired offer code");
        return;
      }

      const offer = offers[0];

      // Check date validity
      const now = new Date();
      if (offer.start_date && new Date(offer.start_date) > now) {
        toast.error("This offer is not yet active");
        return;
      }
      if (offer.end_date && new Date(offer.end_date) < now) {
        toast.error("This offer has expired");
        return;
      }

      // Check minimum purchase
      if (offer.min_purchase_amount && calculateSubtotal() < offer.min_purchase_amount) {
        toast.error(`Minimum purchase of ₹${offer.min_purchase_amount} required`);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (offer.discount_percentage) {
        discount = (calculateSubtotal() * offer.discount_percentage) / 100;
        if (offer.max_discount_cap) {
          discount = Math.min(discount, offer.max_discount_cap);
        }
      } else if (offer.discount_value) {
        discount = offer.discount_value;
      }

      setAppliedOffer(offer);
      setOfferDiscount(discount);
      toast.success(`Offer applied! You save ₹${discount.toFixed(2)}`);
    } catch (error: any) {
      toast.error("Failed to apply offer code");
    }
  };

  const removeOffer = () => {
    setAppliedOffer(null);
    setOfferDiscount(0);
    setOfferCode("");
    toast.info("Offer removed");
  };

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map(item => 
      item.product.id === productId 
        ? { ...item, discount: Math.max(0, discount) }
        : item
    ));
    setEditingDiscount(null);
  };

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
                  <div key={item.product.id} className="border-b pb-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          ₹{item.product.unit_price.toFixed(2)} × {item.quantity} = ₹{(item.product.unit_price * item.quantity).toFixed(2)}
                        </p>
                        {item.discount > 0 && (
                          <p className="text-sm text-primary">
                            Item discount: -₹{item.discount.toFixed(2)}
                          </p>
                        )}
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
                          variant="outline"
                          onClick={() => setEditingDiscount(editingDiscount === item.product.id ? null : item.product.id)}
                          title="Add discount"
                        >
                          <Percent className="h-4 w-4" />
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
                    {editingDiscount === item.product.id && (
                      <div className="flex items-center gap-2 pt-2">
                        <Label className="text-sm whitespace-nowrap">Item Discount:</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={item.product.unit_price * item.quantity}
                          placeholder="0.00"
                          defaultValue={item.discount}
                          className="h-8"
                          onBlur={(e) => updateItemDiscount(item.product.id, parseFloat(e.target.value) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateItemDiscount(item.product.id, parseFloat(e.currentTarget.value) || 0);
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">₹</span>
                      </div>
                    )}
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
              {customerSearch && !selectedCustomer && (
                <div className="border rounded-md max-h-48 overflow-y-auto">
                  {filteredCustomers.length > 0 ? (
                    filteredCustomers.map((customer) => (
                      <div
                        key={customer.id}
                        className="p-3 hover:bg-accent cursor-pointer border-b last:border-0"
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
              {selectedCustomer && (
                <div className="mt-2">
                  <div className="p-3 bg-accent/50 rounded-md border">
                    <p className="text-sm font-medium">Selected Customer</p>
                    <p className="text-sm text-muted-foreground">{customerSearch}</p>
                  </div>
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
            {cart.length > 0 && (
              <div className="space-y-2 pb-4 border-b">
                <Label className="text-sm font-medium">Apply Offer Code</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter offer code"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value.toUpperCase())}
                    disabled={!!appliedOffer}
                    className="flex-1"
                  />
                  {appliedOffer ? (
                    <Button onClick={removeOffer} variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button onClick={applyOfferCode} size="icon">
                      <Tag className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                {appliedOffer && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Badge variant="secondary" className="text-xs">
                      {appliedOffer.code}
                    </Badge>
                    <span>{appliedOffer.name}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              {calculateDiscount() > 0 && (
                <>
                  {cart.some(item => item.discount > 0) && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Item discounts:</span>
                      <span className="text-primary">-₹{cart.reduce((sum, item) => sum + item.discount, 0).toFixed(2)}</span>
                    </div>
                  )}
                  {offerDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Offer discount:</span>
                      <span className="text-primary">-₹{offerDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Total Discount:</span>
                    <span className="text-primary">-₹{calculateDiscount().toFixed(2)}</span>
                  </div>
                </>
              )}
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
                  <SelectItem value="upi">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      UPI
                    </div>
                  </SelectItem>
                  <SelectItem value="digital_wallet">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Digital Wallet
                    </div>
                  </SelectItem>
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
              onClick={initiatePayment}
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

      <Dialog open={receiptOpen} onOpenChange={(open) => !open && handleCloseReceipt()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Receipt</DialogTitle>
            <DialogDescription>Transaction completed successfully</DialogDescription>
          </DialogHeader>
          {lastReceipt && (
            <>
              <div className="space-y-4 text-sm" id="receipt-content">
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
                  {lastReceipt.discount_amount > 0 && (
                    <>
                      <div className="flex justify-between text-sm text-primary">
                        <span>Discount:</span>
                        <span>-₹{lastReceipt.discount_amount.toFixed(2)}</span>
                      </div>
                      {lastReceipt.appliedOffer && (
                        <div className="text-xs text-muted-foreground">
                          Applied: {lastReceipt.appliedOffer.name} ({lastReceipt.appliedOffer.code})
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>₹{lastReceipt.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base">
                    <span>Total:</span>
                    <span>₹{lastReceipt.total_amount.toFixed(2)}</span>
                  </div>
                  {lastReceipt.payment_method === "cash" ? (
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
                  ) : (
                    <div className="flex justify-between">
                      <span>Payment Method:</span>
                      <span className="capitalize">{lastReceipt.payment_method.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <Button 
                  onClick={handlePrintReceipt} 
                  variant="outline" 
                  className="flex-1"
                >
                  <Receipt className="mr-2 h-4 w-4" />
                  Print Receipt
                </Button>
                <Button 
                  onClick={handleCloseReceipt}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
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

      <PaymentGateway
        open={paymentGatewayOpen}
        onClose={() => setPaymentGatewayOpen(false)}
        paymentMethod={paymentMethod as "card" | "upi" | "digital_wallet"}
        amount={calculateTotal()}
        onSuccess={processTransaction}
      />
    </div>
  );
}
