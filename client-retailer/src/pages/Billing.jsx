import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Trash2, ShoppingCart, CreditCard, Banknote, Package } from 'lucide-react';

const Billing = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/retailer/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products', error);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find((item) => item._id === product._id);
        if (existing) {
            setCart(
                cart.map((item) =>
                    item._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                )
            );
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item._id !== productId));
    };

    const updateQuantity = (productId, qty) => {
        if (qty < 1) {
            removeFromCart(productId);
            return;
        }
        setCart(
            cart.map((item) =>
                item._id === productId ? { ...item, quantity: qty } : item
            )
        );
    };

    const calculateTotal = () => {
        return cart.reduce((acc, item) => acc + (item.price || 0) * (item.quantity || 0), 0);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            const items = cart.map((item) => ({
                productId: item._id,
                quantity: item.quantity,
            }));

            await axios.post('/retailer/billing/checkout', {
                items,
                paymentMethod: 'CASH_POS',
            });

            alert('Bill generated successfully!');
            setCart([]);
            fetchProducts(); // Refresh stock
        } catch (error) {
            alert('Checkout failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredProducts = Array.isArray(products) ? products.filter((p) =>
        p?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p?.sku?.includes(searchTerm) ||
        p?.barcode?.includes(searchTerm)
    ) : [];

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Product List Section */}
            <div className="flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search products by name, SKU, or barcode..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-100 focus:bg-white transition-all outline-none text-gray-700"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition">All</button>
                        <button className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition">Drinks</button>
                        <button className="px-4 py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition">Snacks</button>
                    </div>
                </div>

                {/* Grid */}
                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filteredProducts.map((product) => (
                            <div
                                key={product._id}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-green-200 cursor-pointer transition-all group flex flex-col h-full"
                                onClick={() => addToCart(product)}
                            >
                                <div className="h-32 bg-gray-50 rounded-xl mb-4 flex items-center justify-center text-gray-300 group-hover:bg-green-50 group-hover:text-green-300 transition-colors">
                                    <Package size={40} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 mb-1 line-clamp-2">{product.name || 'Unknown Product'}</h3>
                                    <p className="text-xs text-gray-500 mb-2">SKU: {product.sku}</p>
                                </div>
                                <div className="flex justify-between items-end mt-2">
                                    <span className="font-bold text-lg text-gray-900">₹{product.price || 0}</span>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.stockQuantity > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.stockQuantity} Left
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cart / Bill Section */}
            <div className="w-96 bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <ShoppingCart className="text-green-600" /> Current Order
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Order #12345</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <ShoppingCart size={48} className="mb-4 opacity-20" />
                            <p>Cart is empty</p>
                            <p className="text-sm">Select products to add</p>
                        </div>
                    ) : (
                        cart.map((item) => (
                            <div key={item._id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0">
                                    <Package size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-gray-800 text-sm truncate">{item.name || 'Unknown'}</h4>
                                    <div className="text-xs text-gray-500">₹{item.price || 0} x {item.quantity || 0}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className="font-bold text-gray-800 text-sm">₹{((item.price || 0) * (item.quantity || 0)).toFixed(2)}</span>
                                    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-0.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, item.quantity - 1); }}
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                        >
                                            -
                                        </button>
                                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateQuantity(item._id, item.quantity + 1); }}
                                            className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100">
                    <div className="space-y-2 mb-6">
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Subtotal</span>
                            <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Tax (0%)</span>
                            <span>₹0.00</span>
                        </div>
                        <div className="flex justify-between text-xl font-bold text-gray-800 pt-2 border-t border-gray-200">
                            <span>Total</span>
                            <span>₹{calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-green-600 text-green-600 font-bold hover:bg-green-50 transition">
                            <Banknote size={18} /> Cash
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-100 transition">
                            <CreditCard size={18} /> Card
                        </button>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={loading || cart.length === 0}
                        className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg shadow-green-200 transition transform active:scale-95 ${loading || cart.length === 0
                            ? 'bg-gray-400 cursor-not-allowed shadow-none'
                            : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {loading ? 'Processing...' : 'Complete Order'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Billing;
