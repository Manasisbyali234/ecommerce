"use client";

import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { StoreNavbar } from "@/components/store/store-navbar";
import { CartDrawer } from "@/components/store/cart-drawer";
import { StoreFooter } from "@/components/store/store-footer";
import { StorefrontDataHydrator } from "@/components/store/storefront-data-hydrator";
import { CustomerDataHydrator } from "@/components/store/customer-data-hydrator";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <WishlistProvider>
        <StorefrontDataHydrator />
        <CustomerDataHydrator />
        <div
          className="flex min-h-screen flex-col bg-background text-foreground"
          suppressHydrationWarning
        >
          <StoreNavbar />
          <main className="flex-1">{children}</main>
          <CartDrawer />
          <StoreFooter />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
