import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, MapPin, User, ChevronDown, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Header = () => {
    const { user, logout } = useAuth();
    const { cart } = useCart();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleSearch = (e) => {
        e.preventDefault();
        // Implement search logic or navigation
        console.log('Searching for:', searchQuery);
    };

    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
                {/* Logo & Location */}
                <div className="flex items-center gap-6">
                    <Link to="/" className="text-2xl font-extrabold text-brand-primary tracking-tight">
                        Knock<span className="text-gray-900">Knock</span>
                    </Link>

                    <div className="hidden md:flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Delivery in 10 mins</span>
                        <div className="flex items-center gap-1 cursor-pointer group">
                            <span className="text-sm font-bold text-gray-800 group-hover:text-brand-primary transition-colors">
                                Home - 123, Main Street...
                            </span>
                            <ChevronDown size={14} className="text-gray-500 group-hover:text-brand-primary transition-colors" />
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="flex-1 max-w-2xl hidden md:block">
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search for 'milk', 'chips', 'bread'..."
                            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </form>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-6">
                    {user ? (
                        <div className="hidden md:flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <User size={20} className="text-gray-600" />
                            <span className="text-sm font-medium text-gray-700">{user.name}</span>
                            <button onClick={handleLogout} className="ml-2 text-gray-400 hover:text-red-500">
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <Link to="/login" className="text-sm font-bold text-gray-700 hover:text-brand-primary transition-colors">
                            Login
                        </Link>
                    )}

                    <Link to="/cart" className="flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl transition-colors shadow-sm shadow-green-200">
                        <ShoppingCart size={20} />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-[10px] font-medium opacity-80">{cart.length} items</span>
                            <span className="text-sm font-bold">₹{cart.reduce((total, item) => total + item.price * item.quantity, 0)}</span>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Mobile Search (Visible only on mobile) */}
            <div className="md:hidden px-4 pb-3">
                <form onSubmit={handleSearch} className="relative">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </form>
            </div>
        </header>
    );
};

export default Header;
