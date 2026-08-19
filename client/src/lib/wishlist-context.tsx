"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { products, type Product } from "./mock-data";
import { toast } from "sonner";
import { api, getAccessToken } from "./api";

type WishlistContextType = {
  wishlist: string[];
  wishlistProducts: Product[];
  toggleWishlist: (productId: string, productName?: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
  wishlistCount: number;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<string[]>(["P-1002", "P-1006"]);

  useEffect(() => {
    if (!getAccessToken()) return;
    api<{ items: Product[] }>("/wishlist").then(({ items }) => setWishlist(items.map((item) => item.id))).catch(() => setWishlist([]));
  }, []);

  const toggleWishlist = (productId: string, productName?: string) => {
    if (getAccessToken()) api<{ saved: boolean }>(`/wishlist/${productId}`, { method: "PUT" }).catch((error) => toast.error(error instanceof Error ? error.message : "Unable to update wishlist"));
    setWishlist((prev) => {
      const isSaved = prev.includes(productId);
      const targetName = productName || products.find((p) => p.id === productId)?.name || "Product";
      if (isSaved) {
        toast.info(`Removed ${targetName} from Wishlist`);
        return prev.filter((id) => id !== productId);
      } else {
        toast.success(`Saved ${targetName} to Wishlist!`);
        return [...prev, productId];
      }
    });
  };

  const isInWishlist = (productId: string) => wishlist.includes(productId);

  const clearWishlist = () => {
    setWishlist([]);
    toast.info("Wishlist cleared");
  };

  const wishlistProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistProducts,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
