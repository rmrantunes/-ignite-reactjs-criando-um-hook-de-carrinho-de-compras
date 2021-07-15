import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

const LOCAL_STORAGE_CART_KEY = "@RocketShoes:cart";

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = window.localStorage.getItem(LOCAL_STORAGE_CART_KEY);

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const increaseExistingProductAmountInCart = (productId: number) => {
    setCart((cart) => {
      const newCartState = cart.map((product) =>
        product.id === productId
          ? {
              ...product,
              amount: product.amount + 1,
            }
          : product
      );

      window.localStorage.setItem(
        LOCAL_STORAGE_CART_KEY,
        JSON.stringify(newCartState)
      );

      return newCartState;
    });
  };

  const addProduct = async (productId: number) => {
    try {
      const { data: productStock } = await api.get<Stock>(
        `/stock/${productId}`
      );
      const { data: productToAdd } = await api.get(`/products/${productId}`);

      const existingProductInCart = cart.find(
        (product) => product.id === productId
      );

      if (existingProductInCart) {
        const isProductAvaliableInStock =
          existingProductInCart.amount < productStock.amount;

        if (!isProductAvaliableInStock) {
          toast.error("Quantidade solicitada fora de estoque");
          return;
        }

        increaseExistingProductAmountInCart(productId);
        return;
      }

      setCart((cart) => {
        const newCartState = [...cart, { ...productToAdd, amount: 1 }];

        window.localStorage.setItem(
          LOCAL_STORAGE_CART_KEY,
          JSON.stringify(newCartState)
        );

        return newCartState;
      });
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const existingProductInCart = cart.find(
        (product) => product.id === productId
      );

      if (!existingProductInCart) {
        toast.error("Erro na remoção do produto");
        return;
      }

      setCart((cart) => {
        const newCartState = cart.filter((product) => product.id !== productId);

        window.localStorage.setItem(
          LOCAL_STORAGE_CART_KEY,
          JSON.stringify(newCartState)
        );

        return newCartState;
      });
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const { data: productStock } = await api.get<Stock>(
        `/stock/${productId}`
      );

      const existingProductInCart = cart.find(
        (product) => product.id === productId
      );

      const isProductAvaliableInStock =
        existingProductInCart &&
        existingProductInCart.amount < productStock.amount;

      if (!isProductAvaliableInStock) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      setCart((cart) => {
        const newCartState = cart.map((product) =>
          product.id === productId ? { ...product, amount } : product
        );

        window.localStorage.setItem(
          LOCAL_STORAGE_CART_KEY,
          JSON.stringify(newCartState)
        );

        return newCartState;
      });
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
