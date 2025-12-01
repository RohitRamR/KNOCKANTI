import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronRight } from 'lucide-react';
import io from 'socket.io-client';
import ProductCard from '../components/ProductCard';

const Home = () => {
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('All');
    const navigate = useNavigate();

    useEffect(() => {
        fetchProducts();

        const socket = io('http://localhost:5001');

        socket.on('connect', () => {
            console.log('Customer Home connected to socket');
        });

        socket.on('productUpdate', () => {
            console.log('Product update received, refreshing...');
            fetchProducts();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/customers/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products', error);
        }
    };

    const categories = [
        { name: 'All', icon: '🛍️' },
        { name: 'Grocery', icon: '🥦' },
        { name: 'Snacks', icon: 'chips' }, // Placeholder for image
        { name: 'Drinks', icon: '🥤' },
        { name: 'Dairy', icon: '🥛' },
        { name: 'Electronics', icon: '🔌' },
        { name: 'Medicines', icon: '💊' },
        { name: 'Home', icon: '🏠' },
    ];

    // Filter products
    const filteredProducts = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    // Group by Category for "Shop by Category" sections if "All" is selected
    const productsByCategory = products.reduce((acc, product) => {
        const cat = product.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(product);
        return acc;
    }, {});

    return (
        <div className="container mx-auto px-4 py-6 pb-24 space-y-8">
            {/* Hero Banners */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl p-6 text-white h-48 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-purple-200">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold mb-2">Paan Corner</h2>
                        <p className="text-purple-100 font-medium mb-4">Your favourite paan shop is now online</p>
                        <button className="bg-white text-purple-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-purple-50 transition-colors">Shop Now</button>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
                        <span className="text-9xl">🍃</span>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-2xl p-6 text-white h-48 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-orange-200">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold mb-2">Pharmacy</h2>
                        <p className="text-orange-100 font-medium mb-4">Cough syrups, pain relief & more</p>
                        <button className="bg-white text-orange-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-orange-50 transition-colors">Order Now</button>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
                        <span className="text-9xl">💊</span>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-blue-400 to-cyan-500 rounded-2xl p-6 text-white h-48 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-blue-200 hidden lg:flex">
                    <div className="relative z-10">
                        <h2 className="text-3xl font-extrabold mb-2">Pet Care</h2>
                        <p className="text-blue-100 font-medium mb-4">Food, treats, toys & more</p>
                        <button className="bg-white text-blue-600 px-4 py-2 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">Order Now</button>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
                        <span className="text-9xl">🐾</span>
                    </div>
                </div>
            </div>

            {/* Categories Grid */}
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">Shop by Category</h3>
                <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                    {categories.map((cat) => (
                        <button
                            key={cat.name}
                            onClick={() => setActiveCategory(cat.name)}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${activeCategory === cat.name
                                ? 'bg-brand-primary/10 ring-2 ring-brand-primary'
                                : 'bg-white hover:bg-gray-50 border border-gray-100'
                                }`}
                        >
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-2xl">
                                {cat.icon === 'chips' ? '🍟' : cat.icon}
                            </div>
                            <span className={`text-xs font-bold text-center ${activeCategory === cat.name ? 'text-brand-primary' : 'text-gray-600'}`}>
                                {cat.name}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Sections */}
            {activeCategory === 'All' ? (
                Object.entries(productsByCategory).map(([category, items]) => (
                    items.length > 0 && (
                        <div key={category} className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-gray-800">{category}</h3>
                                <button
                                    onClick={() => setActiveCategory(category)}
                                    className="text-brand-primary text-sm font-bold flex items-center hover:underline"
                                >
                                    See All <ChevronRight size={16} />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {items.slice(0, 5).map((product) => (
                                    <ProductCard
                                        key={product._id}
                                        product={product}
                                        onClick={() => navigate(`/product/${product._id}`)}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                ))
            ) : (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-800">{activeCategory}</h3>
                    {filteredProducts.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-gray-100">
                            <p>No products found in this category.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredProducts.map((product) => (
                                <ProductCard
                                    key={product._id}
                                    product={product}
                                    onClick={() => navigate(`/product/${product._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Home;
