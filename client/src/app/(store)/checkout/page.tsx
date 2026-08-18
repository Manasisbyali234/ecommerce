"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  ShoppingCart,
  Ticket,
  X,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MapPin,
  Plus,
  Star,
  Trash2,
  Minus,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useStore, store, type Coupon } from "@/lib/store";
import { evaluateCoupon, type CartLine } from "@/lib/coupons";
import {
  formatCurrency,
  savedAddresses,
  type SavedAddress,
  type Order,
} from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const SHIPPING_COST = 50; // ₹50 shipping
const TAX_RATE = 0.08;

export default function StorefrontCheckoutPage() {
  const { items, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const coupons = useStore((s) => s.coupons);
  const router = useRouter();

  // Wizard Step State (1: Cart Details, 2: Shipping Address)
  const [step, setStep] = useState<1 | 2>(1);

  // Address Selection State
  const [selectedAddressId, setSelectedAddressId] = useState<string>("addr-1");
  const [isAddingCustomAddress, setIsAddingCustomAddress] = useState(false);

  const [customAddress, setCustomAddress] = useState({
    name: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Selected Address Details
  const activeAddress = useMemo(() => {
    if (isAddingCustomAddress) {
      return {
        name: customAddress.name || "Customer",
        street: customAddress.street,
        city: customAddress.city,
        pincode: customAddress.pincode,
        state: customAddress.state,
      };
    }
    const found = savedAddresses.find((a) => a.id === selectedAddressId);
    return found || savedAddresses[0];
  }, [selectedAddressId, isAddingCustomAddress, customAddress]);

  // Convert cart items to CartLine format for coupon evaluation
  const cartLines: CartLine[] = useMemo(
    () =>
      items.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        category: i.product.category,
        price: i.product.price,
        qty: i.quantity,
        image: i.product.image,
      })),
    [items]
  );

  const appliedCoupon = appliedId ? coupons.find((c) => c.id === appliedId) : null;

  const evaluation = useMemo(() => {
    if (!appliedCoupon) return null;
    return evaluateCoupon(appliedCoupon, cartLines, subtotal, SHIPPING_COST);
  }, [appliedCoupon, cartLines, subtotal]);

  const discount = evaluation?.ok ? evaluation.discount : 0;
  const shippingDiscount = evaluation?.ok ? evaluation.shippingDiscount : 0;
  const shipping = Math.max(0, SHIPPING_COST - shippingDiscount);
  const taxable = Math.max(0, subtotal - discount);
  const tax = taxable * TAX_RATE;
  const total = taxable + shipping + tax;

  const applyByCode = () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    const match = coupons.find((c) => c.code === code);
    if (!match) {
      toast.error(`No coupon matches "${code}"`);
      return;
    }
    tryApply(match.id);
  };

  const tryApply = (id: string) => {
    const c = coupons.find((x) => x.id === id);
    if (!c) return;
    const evalResult = evaluateCoupon(c, cartLines, subtotal, SHIPPING_COST);
    if (!evalResult.ok) {
      toast.error(evalResult.reason ?? "Coupon can't be applied");
      return;
    }
    setAppliedId(id);
    setCouponCode(c.code);
    toast.success(`Applied coupon ${c.code}`);
  };

  const clearCoupon = () => {
    setAppliedId(null);
    setCouponCode("");
  };

  const handlePlaceOrder = () => {
    if (items.length === 0) {
      toast.error("Your shopping cart is empty");
      return;
    }

    if (isAddingCustomAddress) {
      if (!customAddress.name.trim() || !customAddress.street.trim() || !customAddress.city.trim()) {
        toast.error("Please complete all required fields for the new address");
        return;
      }
    }

    const seq = 10240 + store.getOrders().length;
    const orderId = `#${seq}`;

    const newOrder: Order = {
      id: orderId,
      customer: activeAddress.name,
      email: `${activeAddress.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      total: Math.round(total),
      items: items.reduce((sum, i) => sum + i.quantity, 0),
      status: "processing",
      paymentStatus: "paid",
      date: new Date().toISOString().slice(0, 10),
    };

    // Add order to shared store & update coupon usage
    store.addOrder(newOrder);
    if (appliedCoupon) {
      store.incrementCouponUsage(appliedCoupon.id);
    }

    // Clear cart & navigate to confirmation page
    clearCart();
    toast.success(`Order ${orderId} placed successfully!`, {
      description: "Order synced live to Admin Dashboard under Orders",
    });

    router.push(`/order-success?orderId=${encodeURIComponent(orderId)}`);
  };

  const availableCoupons = coupons.filter((c) => c.active);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Title & Wizard Step Progress Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Customer Checkout
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review shopping cart items and select your shipping address to complete purchase.
          </p>
        </div>

        {/* 2-Step Sequential Wizard Progress */}
        <div className="flex items-center gap-3 bg-muted/30 p-2 rounded-xl border">
          <button
            onClick={() => setStep(1)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              step === 1
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
              1
            </span>
            <span>Shopping Cart</span>
          </button>

          <ArrowRight className="h-4 w-4 text-muted-foreground" />

          <button
            onClick={() => {
              if (items.length === 0) {
                toast.error("Add products to shopping cart first");
                return;
              }
              setStep(2);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              step === 2
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground/20 text-[11px]">
              2
            </span>
            <span>Shipping Address</span>
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Step Content Column */}
        <div className="space-y-6 lg:col-span-2">
          {step === 1 ? (
            /* STEP 1: Shopping Cart & Order Items List */
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-primary" /> Step 1: Shopping Cart Items ({items.length})
                </CardTitle>
                <Link href="/#products" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
                  + Add More Products
                </Link>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {items.length === 0 ? (
                  <div className="text-center py-12 space-y-4">
                    <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <h3 className="text-base font-semibold text-foreground">Your Shopping Cart is Empty</h3>
                      <p className="text-xs text-muted-foreground">Add products from the storefront to start checkout.</p>
                    </div>
                    <Button asChild>
                      <Link href="/#products">Explore Products Collection</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Cart Items List */}
                    <div className="divide-y rounded-xl border">
                      {items.map((item) => {
                        const mrp = item.product.originalPrice || Math.round(item.product.price * 1.28);
                        const discountPercent = Math.round(((mrp - item.product.price) / mrp) * 100);

                        return (
                          <div
                            key={item.product.id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 hover:bg-muted/10 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="h-20 w-20 rounded-xl object-cover border shrink-0 shadow-sm"
                              />
                              <div className="space-y-1">
                                {/* Category & In Stock Tags (ABOVE Product Name) */}
                                <div className="flex flex-wrap items-center gap-2 pb-0.5">
                                  <Badge variant="secondary" className="text-[10px] font-semibold">
                                    {item.product.category}
                                  </Badge>
                                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    In Stock
                                  </span>
                                </div>

                                {/* Product Name */}
                                <Link href={`/products/${item.product.id}`}>
                                  <h4 className="font-bold text-sm text-foreground hover:text-primary transition-colors line-clamp-1">
                                    {item.product.name}
                                  </h4>
                                </Link>

                                {/* Short 1-Line Product Description */}
                                <p className="text-xs text-muted-foreground line-clamp-1 max-w-sm">
                                  {item.product.description || "High-quality premium product with exceptional craftsmanship."}
                                </p>

                                {/* Color & Size Variant Details */}
                                {((item.product.colors && item.product.colors.length > 0) || (item.product.sizes && item.product.sizes.length > 0)) && (
                                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-0.5 font-medium">
                                    {item.product.colors && item.product.colors.length > 0 && (
                                      <span className="flex items-center gap-1.5">
                                        <span>Color:</span>
                                        <span
                                          className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700 shadow-xs inline-block shrink-0"
                                          style={{ backgroundColor: item.product.colors[0].hex }}
                                        />
                                        <strong className="text-foreground font-semibold">{item.product.colors[0].name}</strong>
                                      </span>
                                    )}

                                    {item.product.sizes && item.product.sizes.length > 0 && (
                                      <span className="flex items-center gap-1 border-l pl-3 border-muted">
                                        <span>Size:</span>
                                        <strong className="text-foreground font-semibold px-1.5 py-0.5 rounded bg-muted/70 text-[11px]">
                                          {item.product.sizes[0]}
                                        </strong>
                                      </span>
                                    )}
                                  </div>
                                )}

                                {/* Sold By Info (Next Line) */}
                                <div className="text-xs text-muted-foreground font-medium pt-0.5">
                                  Sold by: <strong className="text-foreground font-semibold">Metromindz Retail</strong>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between w-full sm:w-auto gap-6 pt-2 sm:pt-0 border-t sm:border-0">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1.5 border rounded-lg p-1 bg-background">
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                                  title="Decrease quantity"
                                >
                                  <Minus className="h-3.5 w-3.5" />
                                </button>
                                <span className="w-8 text-center text-xs font-bold font-mono">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-muted text-foreground transition-colors"
                                  title="Increase quantity"
                                >
                                  <Plus className="h-3.5 w-3.5" />
                                </button>
                              </div>

                              {/* Item Subtotal, Unit Discount Price, MRP & Discount % */}
                              <div className="text-right min-w-[110px] space-y-0.5">
                                <div className="text-base font-extrabold text-foreground">
                                  {formatCurrency(item.product.price * item.quantity)}
                                </div>
                                <div className="flex items-center justify-end gap-1.5 text-xs">
                                  <span className="font-semibold text-foreground">{formatCurrency(item.product.price)}</span>
                                  <span className="line-through text-[11px] text-muted-foreground">{formatCurrency(mrp)}</span>
                                </div>
                                <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                  {discountPercent}% OFF
                                </div>
                              </div>

                              {/* Delete Item */}
                              <button
                                onClick={() => removeItem(item.product.id)}
                                className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Step 1 Action Button */}
                    <div className="flex items-center justify-end pt-4">
                      <Button
                        size="lg"
                        className="h-12 px-8 font-semibold shadow-md"
                        onClick={() => setStep(2)}
                      >
                        Continue to Shipping Address <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* STEP 2: Shipping Address Selection Options */
            <Card className="border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" /> Step 2: Select Shipping Address
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Available Addresses ({savedAddresses.length})
                </Badge>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Available Saved Address Cards Selection */}
                <div className="space-y-3">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Select From Your Saved Address List:
                  </Label>

                  <div className="grid gap-3 sm:grid-cols-1">
                    {savedAddresses.map((addr) => {
                      const isSelected = !isAddingCustomAddress && selectedAddressId === addr.id;
                      return (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setIsAddingCustomAddress(false);
                            setSelectedAddressId(addr.id);
                          }}
                          className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5 shadow-sm"
                              : "border-muted hover:border-primary/50 bg-background"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground">
                                  {addr.label}
                                </span>
                                {addr.isDefault && (
                                  <Badge className="bg-primary/10 text-primary text-[10px]">
                                    Default
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-foreground">{addr.name} · {addr.phone}</p>
                              <p className="text-xs text-muted-foreground">{addr.street}</p>
                              <p className="text-xs text-muted-foreground">
                                {addr.city}, {addr.state} — {addr.pincode}
                              </p>
                            </div>

                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 ${
                                isSelected ? "border-primary bg-primary text-primary-foreground" : "border-muted"
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Add New Address Option Card */}
                    <div
                      onClick={() => setIsAddingCustomAddress(true)}
                      className={`p-4 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all ${
                        isAddingCustomAddress
                          ? "border-primary bg-primary/5 font-semibold"
                          : "border-muted hover:border-primary/50 text-muted-foreground"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-2 text-xs font-semibold">
                        <Plus className="h-4 w-4 text-primary" /> Deliver to a New Shipping Address
                      </div>
                    </div>
                  </div>
                </div>

                {/* New Address Form (if selected) */}
                {isAddingCustomAddress && (
                  <div className="rounded-xl border bg-muted/20 p-4 space-y-4 pt-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      New Shipping Address Form
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cname" className="text-xs">Full Recipient Name</Label>
                        <Input
                          id="cname"
                          placeholder="e.g. Aakash Sharma"
                          value={customAddress.name}
                          onChange={(e) => setCustomAddress({ ...customAddress, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cphone" className="text-xs">Phone Number</Label>
                        <Input
                          id="cphone"
                          placeholder="+91 98765 43210"
                          value={customAddress.phone}
                          onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <Label htmlFor="cstreet" className="text-xs">Street Address / House No.</Label>
                        <Input
                          id="cstreet"
                          placeholder="Flat, House no., Building, Street"
                          value={customAddress.street}
                          onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="ccity" className="text-xs">City</Label>
                        <Input
                          id="ccity"
                          placeholder="Mumbai"
                          value={customAddress.city}
                          onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="cpincode" className="text-xs">Pincode</Label>
                        <Input
                          id="cpincode"
                          placeholder="400001"
                          value={customAddress.pincode}
                          onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cart
                  </Button>

                  <Button
                    size="lg"
                    className="h-12 px-8 font-semibold shadow-md"
                    onClick={handlePlaceOrder}
                  >
                    Place Order ({formatCurrency(total)}) <CheckCircle2 className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Order Summary & Coupon Card */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-base font-bold">Order Summary</CardTitle>
            </CardHeader>

            <CardContent className="pt-4 space-y-4">
              {/* Items Summary Count */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Subtotal ({items.length} items)</span>
                <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>

              {/* Coupon Discount */}
              {discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Coupon ({appliedCoupon?.code})</span>
                  <span>-{formatCurrency(discount)}</span>
                </div>
              )}

              {/* Shipping */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Standard Delivery</span>
                <span className="font-semibold text-foreground">
                  {shipping === 0 ? "FREE" : formatCurrency(shipping)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">GST / Tax (8%)</span>
                <span className="font-semibold text-foreground">{formatCurrency(tax)}</span>
              </div>

              <Separator />

              {/* Grand Total */}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="text-2xl font-extrabold text-primary">
                  {formatCurrency(total)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Coupon Code Applying Block */}
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Ticket className="h-4 w-4 text-primary" /> Apply Coupon Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. SUMMER25"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="uppercase text-xs"
                />
                <Button variant="outline" size="sm" onClick={applyByCode}>
                  Apply
                </Button>
              </div>

              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 p-2.5 text-xs text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="font-bold">{appliedCoupon.code}</span>
                  </div>
                  <button onClick={clearCoupon} className="hover:text-destructive">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Quick Coupon Codes */}
              {availableCoupons.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[10px] text-muted-foreground font-semibold uppercase">Available Offers</div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableCoupons.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => tryApply(c.id)}
                        className="px-2 py-1 rounded border text-[10px] font-mono hover:border-primary transition-colors"
                      >
                        {c.code}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
