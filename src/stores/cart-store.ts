import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  id: string; // Unique cart item ID (productId-variationId-attributes)
  productId: number;
  variationId?: number;
  name: string;
  slug: string;
  price: number;
  regularPrice?: number;
  quantity: number;
  image: string;
  attributes?: Record<string, string>; // e.g., { Size: 'M', Color: 'Black' }
  maxQuantity?: number; // Stock limit
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

interface CartActions {
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

interface CartComputedValues {
  total: number;
  subtotal: number;
  itemCount: number;
  isEmpty: boolean;
}

type CartStore = CartState & CartActions & CartComputedValues;

/**
 * Generate unique ID for cart items based on product, variation, and attributes
 */
function generateCartItemId(
  productId: number,
  variationId?: number,
  attributes?: Record<string, string>
): string {
  let id = String(productId);

  if (variationId) {
    id += `-${variationId}`;
  }

  if (attributes && Object.keys(attributes).length > 0) {
    const attrString = Object.entries(attributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join('-');
    id += `-${attrString}`;
  }

  return id;
}

/**
 * Calculate cart totals
 */
function calculateTotals(items: CartItem[]): { total: number; subtotal: number; itemCount: number } {
  return items.reduce(
    (acc, item) => ({
      total: acc.total + item.price * item.quantity,
      subtotal: acc.subtotal + item.price * item.quantity,
      itemCount: acc.itemCount + item.quantity,
    }),
    { total: 0, subtotal: 0, itemCount: 0 }
  );
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      // State
      items: [],
      isOpen: false,

      // Computed values (recalculated on access)
      get total() {
        return calculateTotals(get().items).total;
      },
      get subtotal() {
        return calculateTotals(get().items).subtotal;
      },
      get itemCount() {
        return calculateTotals(get().items).itemCount;
      },
      get isEmpty() {
        return get().items.length === 0;
      },

      // Actions
      addItem: (item) => {
        const id = generateCartItemId(item.productId, item.variationId, item.attributes);

        set((state) => {
          const existingItemIndex = state.items.findIndex((i) => i.id === id);

          if (existingItemIndex !== -1) {
            // Update quantity if item exists
            const existingItem = state.items[existingItemIndex];
            const newQuantity = existingItem.quantity + item.quantity;
            const maxQty = existingItem.maxQuantity;
            const finalQuantity = maxQty ? Math.min(newQuantity, maxQty) : newQuantity;

            const updatedItems = [...state.items];
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: finalQuantity,
            };

            return {
              items: updatedItems,
              isOpen: true, // Open cart drawer when adding
            };
          }

          // Add new item
          return {
            items: [...state.items, { ...item, id }],
            isOpen: true,
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) };
          }

          return {
            items: state.items.map((item) => {
              if (item.id !== id) return item;

              const maxQty = item.maxQuantity;
              const finalQuantity = maxQty ? Math.min(quantity, maxQty) : quantity;

              return { ...item, quantity: finalQuantity };
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
    }),
    {
      name: 'cart-storage',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }), // Only persist items, not isOpen
    }
  )
);

// Selector hooks for better performance
export const useCartItems = () => useCartStore((state) => state.items);
export const useCartIsOpen = () => useCartStore((state) => state.isOpen);
export const useCartTotal = () => {
  const items = useCartStore((state) => state.items);
  return calculateTotals(items).total;
};
export const useCartItemCount = () => {
  const items = useCartStore((state) => state.items);
  return calculateTotals(items).itemCount;
};
export const useCartIsEmpty = () => useCartStore((state) => state.items.length === 0);
