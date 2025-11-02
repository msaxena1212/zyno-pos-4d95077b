import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Smartphone, Wallet } from "lucide-react";
import { toast } from "sonner";

interface PaymentGatewayProps {
  open: boolean;
  onClose: () => void;
  paymentMethod: "card" | "upi" | "digital_wallet";
  amount: number;
  onSuccess: (paymentDetails?: { authCode?: string; cardLastFour?: string }) => void;
}

// Mock credentials for testing
const MOCK_CARD = {
  number: "4111111111111111",
  cvv: "123",
  expiry: "12/25",
};

const MOCK_UPI = {
  id: "test@upi",
};

const MOCK_WALLET = {
  phone: "9876543210",
  pin: "1234",
};

export function PaymentGateway({ open, onClose, paymentMethod, amount, onSuccess }: PaymentGatewayProps) {
  const [cardDetails, setCardDetails] = useState({
    number: "",
    cvv: "",
    expiry: "",
    name: "",
  });
  const [upiId, setUpiId] = useState("");
  const [walletDetails, setWalletDetails] = useState({
    phone: "",
    pin: "",
  });
  const [processing, setProcessing] = useState(false);

  const handleCardPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      if (
        cardDetails.number === MOCK_CARD.number &&
        cardDetails.cvv === MOCK_CARD.cvv &&
        cardDetails.expiry === MOCK_CARD.expiry
      ) {
        const authCode = `AUTH${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
        const cardLastFour = cardDetails.number.slice(-4);
        toast.success("Card payment successful!");
        onSuccess({ authCode, cardLastFour });
        onClose();
      } else {
        toast.error("Invalid card details. Try: 4111111111111111, CVV: 123, Expiry: 12/25");
      }
      setProcessing(false);
    }, 1500);
  };

  const handleUpiPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      if (upiId === MOCK_UPI.id) {
        const authCode = `UPI${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
        toast.success("UPI payment successful!");
        onSuccess({ authCode });
        onClose();
      } else {
        toast.error("Invalid UPI ID. Try: test@upi");
      }
      setProcessing(false);
    }, 1500);
  };

  const handleWalletPayment = () => {
    setProcessing(true);
    setTimeout(() => {
      if (
        walletDetails.phone === MOCK_WALLET.phone &&
        walletDetails.pin === MOCK_WALLET.pin
      ) {
        const authCode = `WALLET${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
        toast.success("Digital wallet payment successful!");
        onSuccess({ authCode });
        onClose();
      } else {
        toast.error("Invalid wallet credentials. Try: Phone: 9876543210, PIN: 1234");
      }
      setProcessing(false);
    }, 1500);
  };

  const renderCardForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-6 w-6 text-primary" />
        <h3 className="font-semibold text-lg">Card Payment</h3>
      </div>
      <div className="space-y-2">
        <Label>Card Number *</Label>
        <Input
          placeholder="1234 5678 9012 3456"
          value={cardDetails.number}
          onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
          maxLength={16}
        />
      </div>
      <div className="space-y-2">
        <Label>Cardholder Name *</Label>
        <Input
          placeholder="John Doe"
          value={cardDetails.name}
          onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expiry Date *</Label>
          <Input
            placeholder="MM/YY"
            value={cardDetails.expiry}
            onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
            maxLength={5}
          />
        </div>
        <div className="space-y-2">
          <Label>CVV *</Label>
          <Input
            placeholder="123"
            type="password"
            value={cardDetails.cvv}
            onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
            maxLength={3}
          />
        </div>
      </div>
      <div className="bg-accent/50 p-3 rounded-md text-xs">
        <p className="font-medium mb-1">Test Credentials:</p>
        <p>Card: 4111111111111111</p>
        <p>CVV: 123</p>
        <p>Expiry: 12/25</p>
      </div>
    </div>
  );

  const renderUpiForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-6 w-6 text-primary" />
        <h3 className="font-semibold text-lg">UPI Payment</h3>
      </div>
      <div className="space-y-2">
        <Label>UPI ID *</Label>
        <Input
          placeholder="yourname@upi"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
        />
      </div>
      <div className="bg-accent/50 p-3 rounded-md text-xs">
        <p className="font-medium mb-1">Test UPI ID:</p>
        <p>test@upi</p>
      </div>
    </div>
  );

  const renderWalletForm = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-6 w-6 text-primary" />
        <h3 className="font-semibold text-lg">Digital Wallet</h3>
      </div>
      <div className="space-y-2">
        <Label>Phone Number *</Label>
        <Input
          placeholder="9876543210"
          value={walletDetails.phone}
          onChange={(e) => setWalletDetails({ ...walletDetails, phone: e.target.value })}
          maxLength={10}
        />
      </div>
      <div className="space-y-2">
        <Label>Wallet PIN *</Label>
        <Input
          placeholder="Enter 4-digit PIN"
          type="password"
          value={walletDetails.pin}
          onChange={(e) => setWalletDetails({ ...walletDetails, pin: e.target.value })}
          maxLength={4}
        />
      </div>
      <div className="bg-accent/50 p-3 rounded-md text-xs">
        <p className="font-medium mb-1">Test Credentials:</p>
        <p>Phone: 9876543210</p>
        <p>PIN: 1234</p>
      </div>
    </div>
  );

  const handlePayment = () => {
    if (paymentMethod === "card") {
      handleCardPayment();
    } else if (paymentMethod === "upi") {
      handleUpiPayment();
    } else {
      handleWalletPayment();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Amount to pay: ₹{amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {paymentMethod === "card" && renderCardForm()}
          {paymentMethod === "upi" && renderUpiForm()}
          {paymentMethod === "digital_wallet" && renderWalletForm()}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={processing} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={processing} className="flex-1">
            {processing ? "Processing..." : `Pay ₹${amount.toFixed(2)}`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
