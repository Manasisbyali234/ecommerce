"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { products, type Product } from "./mock-data";
import { api, getAccessToken } from "./api";

export type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load the authenticated customer cart; retain demo data only while offline/unauthenticated.
  useEffect(() => {
    if (getAccessToken()) {
      api<{ cart: { items: Array<{ product: Product; quantity: number }> } }>("/cart")
        .then(({ cart }) => setItems(cart.items.map((item) => ({ product: item.product, quantity: item.quantity }))))
        .catch(() => setItems([]));
      return;
    }
    const seedProduct1 = products.find((p) => p.id === "P-1001");
    const seedProduct3 = products.find((p) => p.id === "P-1003");
    const initial: CartItem[] = [];
    if (seedProduct1) initial.push({ product: seedProduct1, quantity: 1 });
    if (seedProduct3) initial.push({ product: seedProduct3, quantity: 2 });
    setItems(initial);
  }, []);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        if (getAccessToken()) api("/cart/items", { method: "PUT", body: JSON.stringify({ productId: product.id, quantity: next[existingIndex].quantity }) }).catch(() => undefined);
        return next;
      }
      if (getAccessToken()) api("/cart/items", { method: "PUT", body: JSON.stringify({ productId: product.id, quantity }) }).catch(() => undefined);
      return [...prev, { product, quantity }];
    });
    setIsOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
    if (getAccessToken()) api(`/cart/items/${productId}`, { method: "DELETE" }).catch(() => undefined);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
    if (getAccessToken()) api("/cart/items", { method: "PUT", body: JSON.stringify({ productId, quantity }) }).catch(() => undefined);
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        isOpen,
        setIsOpen,
        openCart: () => setIsOpen(true),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
