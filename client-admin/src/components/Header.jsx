import React from 'react';
import { motion } from 'framer-motion';
import { Sun, Moon, Bell, Search, User } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

const Header = ({ title }) => {
    const { theme, toggleTheme } = useTheme();
    const { user } = useAuth();

    return (
        <header className="h-16 px-6 flex items-center justify-between bg-bg-secondary/80 backdrop-blur-md sticky top-0 z-10 border-b border-border">
            {/* Page Title */}
            <motion.h2
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-bold text-text-primary"
            >
                {title}
            </motion.h2>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="hidden md:flex items-center bg-bg-primary px-3 py-2 rounded-lg border border-transparent focus-within:border-brand-primary transition-all">
                    <Search size={18} className="text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="bg-transparent border-none outline-none text-sm ml-2 w-48 text-text-primary placeholder-text-muted"
                    />
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full hover:bg-bg-primary text-text-secondary transition-colors"
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                {/* Notifications */}
                <button className="p-2 rounded-full hover:bg-bg-primary text-text-secondary transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                {/* Profile Dropdown */}
                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right hidden sm:block">
                        <p className="text-sm font-bold text-text-primary">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-text-muted">Super Admin</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-primary to-brand-accent flex items-center justify-center text-white font-bold shadow-lg">
                        {user?.name?.[0] || 'A'}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
