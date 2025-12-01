import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { ShoppingCart, ArrowLeft, Star, Minus, Plus, ChevronRight, Clock, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import ProductImage from '../components/ProductImage';
import toast from 'react-hot-toast';

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToCart, cart, updateQuantity, removeFromCart } = useCart();

    // Initialize with passed state if available
    const [product, setProduct] = useState(location.state?.product || null);
    const [loading, setLoading] = useState(!location.state?.product);

    // Get quantity from cart
    const cartItem = product ? cart.find(item => item._id === product._id) : null;
    const quantity = cartItem ? cartItem.quantity : 0;

    useEffect(() => {
        if (!product) {
            fetchProduct();
        } else {
            fetchProduct(true);
        }
    }, [id]);

    const fetchProduct = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            const res = await axios.get('/customers/products');
            const found = res.data.find(p => p._id === id);

            if (found) {
                setProduct(found);
                if (!found.images || found.images.length === 0) {
                    fetchAIImage(found._id);
                }
            } else if (!isBackground) {
                setProduct(null);
            }
        } catch (error) {
            console.error('Error fetching product', error);
            if (!isBackground) toast.error('Failed to load product details');
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const [isFetchingImage, setIsFetchingImage] = useState(false);

    const fetchAIImage = async (productId) => {
        setIsFetchingImage(true);
        try {
            const res = await axios.put(`/customers/products/${productId}/ai-image`);
            if (res.data.image) {
                setProduct(prev => ({ ...prev, images: [res.data.image] }));
            }
        } catch (error) {
            console.error('AI Image fetch failed', error);
        } finally {
            setIsFetchingImage(false);
        }
    };

    const handleAdd = () => {
        addToCart(product);
        toast.success('Added to cart');
    };

    const handleIncrement = () => {
        updateQuantity(product._id, quantity + 1);
    };

    const handleDecrement = () => {
        if (quantity > 1) {
            updateQuantity(product._id, quantity - 1);
        } else {
            removeFromCart(product._id);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div></div>;
    if (!product) return <div className="p-8 text-center">Product not found</div>;

    const mrp = product.mrp || Math.round(product.price * 1.2);
    const discount = Math.round(((mrp - product.price) / mrp) * 100);

    return (
        <div className="container mx-auto px-4 py-6 pb-24">
            {/* Breadcrumbs */}
            <div className="flex items-center text-xs text-gray-500 mb-6">
                <Link to="/" className="hover:text-brand-primary">Home</Link>
                <ChevronRight size={14} />
                <span className="hover:text-brand-primary cursor-pointer">{product.category || 'Groceries'}</span>
                <ChevronRight size={14} />
                <span className="text-gray-800 font-medium truncate max-w-[200px]">{product.name}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column: Image */}
                <div className="bg-white rounded-3xl border border-gray-100 p-8 flex items-center justify-center relative h-[400px] shadow-sm">
                    {isFetchingImage ? (
                        <div className="flex flex-col items-center justify-center text-brand-primary animate-pulse">
                            <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                            <p className="font-bold text-sm">Loading image...</p>
                        </div>
                    ) : (
                        <ProductImage product={product} className="w-full h-full object-contain hover:scale-105 transition-transform duration-500" />
                    )}
                    {discount > 0 && (
                        <div className="absolute top-6 left-6 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                            {discount}% OFF
                        </div>
                    )}
                    <button className="absolute top-6 right-6 w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Star size={20} />
                    </button>
                </div>

                {/* Right Column: Details */}
                <div className="flex flex-col">
                    <div className="mb-6">
                        <div className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-2 py-1 rounded w-fit mb-3">
                            {product.retailer?.storeName || 'Partner Store'}
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h1>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {product.unit || '1 pack'}
                            </span>
                            <span className="text-sm text-gray-400">•</span>
                            <div className="flex items-center gap-1 text-yellow-500">
                                <Star size={14} fill="currentColor" />
                                <span className="text-sm font-bold text-gray-700">4.8</span>
                                <span className="text-xs text-gray-400">(25.1k reviews)</span>
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-b border-gray-100 pb-6 mb-6">
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-400 line-through">MRP ₹{mrp}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-3xl font-extrabold text-gray-900">₹{product.price}</span>
                                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                        (Inclusive of all taxes)
                                    </span>
                                </div>
                            </div>

                            {quantity === 0 ? (
                                <button
                                    onClick={handleAdd}
                                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 active:scale-95"
                                >
                                    Add to Cart
                                </button>
                            ) : (
                                <div className="flex items-center bg-green-600 rounded-xl shadow-lg shadow-green-200 overflow-hidden">
                                    <button
                                        onClick={handleDecrement}
                                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-green-700 transition-colors"
                                    >
                                        <Minus size={20} strokeWidth={3} />
                                    </button>
                                    <span className="w-10 text-center font-bold text-white text-lg">
                                        {quantity}
                                    </span>
                                    <button
                                        onClick={handleIncrement}
                                        className="w-12 h-12 flex items-center justify-center text-white hover:bg-green-700 transition-colors"
                                    >
                                        <Plus size={20} strokeWidth={3} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Why shop from us */}
                        <div className="space-y-4 mb-8">
                            <h3 className="font-bold text-gray-900">Why shop from KnockKnock?</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Superfast Delivery</h4>
                                    <p className="text-xs text-gray-500">Get your order delivered to your doorstep in minutes from dark stores near you.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Best Prices & Offers</h4>
                                    <p className="text-xs text-gray-500">Best price destination with offers directly from the manufacturers.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0">
                                    <Truck size={20} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-800">Wide Assortment</h4>
                                    <p className="text-xs text-gray-500">Choose from 5000+ products across food, personal care, household & other categories.</p>
                                </div>
                            </div>
                        </div>

                        {/* Product Description */}
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Product Details</h3>
                            <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                                {product.description || 'No description available.'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
