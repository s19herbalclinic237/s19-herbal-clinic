"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth-context";

export interface CartItem {
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { stock?: number }, quantity?: number) => void;
  removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "s19-cart";

function readLocalItems(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CartItem[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore malformed storage
  }
  return [];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    return readLocalItems();
  });
  const itemsRef = useRef<CartItem[]>([]);
  useEffect(() => {
    itemsRef.current = items;
  });

  const [hydrated, setHydrated] = useState(false);

  const saveCart = useCallback((cartItems: CartItem[]) => {
    fetch("/api/cart", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cartItems }),
    }).catch(() => {});
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // storage may be unavailable
    }
  }, [items]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    fetch("/api/cart", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        const serverItems = Array.isArray(data.items) ? (data.items as CartItem[]) : [];
        setItems((local) => (serverItems.length > 0 ? serverItems : local));
        if (serverItems.length === 0) {
          saveCart(itemsRef.current);
        }
        setHydrated(true);
      })
      .catch(() => {
        if (active) setHydrated(true);
      });
    return () => {
      active = false;
      setHydrated(false);
    };
  }, [user?.id, saveCart]);

  useEffect(() => {
    if (!user?.id || !hydrated) return;
    const timer = setTimeout(() => {
      saveCart(itemsRef.current);
    }, 600);
    return () => clearTimeout(timer);
  }, [items, user?.id, hydrated, saveCart]);

  const addItem = useCallback((item: Omit<CartItem, "quantity"> & { stock?: number }, quantity = 1) => {
    // Defence in depth: quote-only products (price 0) and sold-out products have
    // their buy controls disabled, so reaching here means stale state or a
    // direct call. Never put something that cannot be fulfilled into the cart.
    if (item.price <= 0 || (typeof item.stock === "number" && item.stock <= 0)) {
      toast.error("This product is currently out of stock.");
      return;
    }
    setItems((prev) => {
      const existing = prev.find((i) => i.slug === item.slug);
      if (existing) {
        return prev.map((i) =>
          i.slug === item.slug ? { ...i, quantity: Math.min(99, i.quantity + quantity) } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
    toast.success("Added to cart");
  }, []);

  const removeItem = useCallback((slug: string) => {
    setItems((prev) => prev.filter((i) => i.slug !== slug));
  }, []);

  const updateQuantity = useCallback((slug: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.slug !== slug)
        : prev.map((i) => (i.slug === slug ? { ...i, quantity: Math.min(99, quantity) } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(
    () => ({
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.price * i.quantity, 0),
    }),
    [items]
  );

  return (
    <CartContext.Provider
      value={{ items, count, subtotal, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}