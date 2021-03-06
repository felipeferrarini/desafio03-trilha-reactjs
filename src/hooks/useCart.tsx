import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {    
      const productInCart = cart.find(product => product.id === productId);

      if(productInCart){
        updateProductAmount({productId, amount: productInCart.amount + 1});

      } else {
        const productData: Product = await api.get(`/products/${productId}`).then( response => response.data)

        const newCart = [
          ...cart,
          {...productData, amount: 1}
        ];

        setCart(newCart)
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        toast.success('Produto adicionado com sucesso!');
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productInCart = cart.find(product => product.id === productId);

      if (productInCart) {
        const newCart = cart.filter(product => product.id !== productId);
        setCart(newCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
        toast.success('Produto removido com sucesso!');
      } else {
        throw new Error();
      }

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if(amount <= 0){
        return;
      } 

      const {amount: productStock}: Stock = await api.get(`/stock/${productId}`).then( response => response.data);

      if(amount > productStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      } 
      
      const newCart = cart.map(product => {
        if(product.id === productId){
          return {
            ...product,
            amount
          }
        } else {
          return product
        }
      });

      setCart(newCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
