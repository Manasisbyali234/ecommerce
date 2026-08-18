"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Trash2, ArrowRight, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { formatCurrency } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default function WishlistPage() {
  const { wishlistProducts, toggleWishlist, clearWishlist, wishlistCount } = useWishlist();
  const { addItem, openCart } = useCart();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Breadcrumb Navigation */}
        <nav className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">My Wishlist</span>
        </nav>

        {/* Page Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              <Heart className="h-7 w-7 text-rose-500 fill-rose-500" />
              <span>My Saved Wishlist</span>
              <span className="text-sm font-normal text-muted-foreground">
                ({wishlistCount} {wishlistCount === 1 ? "item" : "items"})
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Items saved in your wishlist are reserved for quick checkout and price drop tracking.
            </p>
          </div>

          {wishlistCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearWishlist}
              className="text-xs font-semibold text-muted-foreground hover:text-rose-500 hover:border-rose-500/40 gap-1.5 self-start sm:self-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Clear All Saved
            </Button>
          )}
        </div>

        {/* Wishlist Items Grid / Empty State */}
        {wishlistCount === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-background border rounded-2xl p-8 text-center shadow-xs space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <Heart className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">Your Wishlist is Empty</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
                You haven't saved any products to your wishlist yet. Tap the heart icon on any product card to save it for later.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 px-6 text-sm font-bold gap-2">
              <Link href="/products">
                Explore Products Catalog <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistProducts.map((product) => {
              const mrp = product.originalPrice || Math.round(product.price * 1.28);
              const discountPercent = Math.round(((mrp - product.price) / mrp) * 100);

              return (
                <Card
                  key={product.id}
                  className="group relative overflow-hidden rounded-2xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Card Media Header */}
                  <div className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900">
                    <Link href={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </Link>

                    {/* Category Tag */}
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md bg-white/80 dark:bg-slate-900/80"
                    >
                      {product.category}
                    </Badge>

                    {/* Remove Trash Button */}
                    <button
                      onClick={() => toggleWishlist(product.id, product.name)}
                      className="absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors shadow-xs"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <Link href={`/products/${product.id}`}>
                        <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-1 leading-relaxed">
                        {product.description || "High-quality premium product with exceptional craftsmanship."}
                      </p>

                      {/* Rating Row */}
                      <div className="flex items-center gap-1.5 pt-1">
                        <div className="flex items-center text-amber-400">
                          <Star className="h-3.5 w-3.5 fill-amber-400" />
                          <span className="text-xs font-bold text-foreground ml-1">
                            {product.rating || 4.8}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">
                          ({product.reviewCount || 48} reviews)
                        </span>
                      </div>
                    </div>

                    {/* Price & Move to Cart Button */}
                    <div className="space-y-3 pt-2 border-t mt-2">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-lg text-foreground">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="line-through text-xs text-muted-foreground font-medium">
                            {formatCurrency(mrp)}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          {discountPercent}% OFF
                        </span>
                      </div>

                      <Button
                        onClick={() => {
                          addItem(product);
                          toast.success(`Moved ${product.name} to Shopping Cart!`);
                          openCart();
                        }}
                        className="w-full h-9 text-xs font-bold gap-2 shadow-xs bg-primary hover:bg-primary/90"
                      >
                        <ShoppingBag className="h-4 w-4" /> Move to Cart
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
