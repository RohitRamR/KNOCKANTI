import React from 'react';
import { Plus, Minus, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductImage from './ProductImage';
import toast from 'react-hot-toast';

const ProductCard = ({ product, onClick }) => {
    const { cart, addToCart, removeFromCart, updateQuantity } = useCart();
    const cartItem = cart.find(item => item._id === product._id);
    const quantity = cartItem ? cartItem.quantity : 0;

    const handleAdd = (e) => {
        e.stopPropagation();
        addToCart(product);
        toast.success('Added to cart');
    };

    const handleIncrement = (e) => {
        e.stopPropagation();
        updateQuantity(product._id, quantity + 1);
    };

    const handleDecrement = (e) => {
        e.stopPropagation();
        if (quantity > 1) {
            updateQuantity(product._id, quantity - 1);
        } else {
            removeFromCart(product._id);
        }
    };

    // Calculate discount if MRP exists (mock logic for now as schema has purchasePrice but not MRP, using price as selling price)
    // Assuming a mock MRP for visual demo if not present
    const mrp = product.mrp || Math.round(product.price * 1.2);
    const discount = Math.round(((mrp - product.price) / mrp) * 100);

    return (
        <div
            className="flex flex-col h-full bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden cursor-pointer group"
            onClick={onClick}
        >
            {/* Image Container */}
            <div className="relative h-40 p-4 flex items-center justify-center bg-white">
                <ProductImage
                    product={product}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                {/* Discount Badge */}
                {discount > 0 && (
                    <div className="absolute top-0 left-0 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-br-lg z-10">
                        {discount}% OFF
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-3 flex flex-col flex-1">
                <div className="mb-1">
                    <div className="flex items-center gap-1 mb-1">
                        <div className="bg-gray-100 p-0.5 rounded">
                            <div className="w-2 h-2 rounded-full bg-green-600"></div> {/* Veg/Non-veg indicator mock */}
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {product.unit || '1 pc'}
                        </span>
                    </div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight line-clamp-2 h-9 mb-1" title={product.name}>
                        {product.name}
                    </h3>
                    <p className="text-[10px] text-gray-400 truncate">
                        {product.retailer?.storeName || 'Store'}
                    </p>
                </div>

                {/* Price & Action */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 line-through">₹{mrp}</span>
                        <span className="text-sm font-bold text-gray-900">₹{product.price}</span>
                    </div>

                    {quantity === 0 ? (
                        <button
                            onClick={handleAdd}
                            className="px-4 py-1.5 rounded-lg border border-green-600 text-green-600 text-xs font-bold uppercase hover:bg-green-50 transition-colors shadow-sm"
                        >
                            ADD
                        </button>
                    ) : (
                        <div className="flex items-center bg-green-600 rounded-lg shadow-sm overflow-hidden">
                            <button
                                onClick={handleDecrement}
                                className="px-2 py-1.5 text-white hover:bg-green-700 transition-colors"
                            >
                                <Minus size={12} strokeWidth={3} />
                            </button>
                            <span className="px-1 text-xs font-bold text-white min-w-[16px] text-center">
                                {quantity}
                            </span>
                            <button
                                onClick={handleIncrement}
                                className="px-2 py-1.5 text-white hover:bg-green-700 transition-colors"
                            >
                                <Plus size={12} strokeWidth={3} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
