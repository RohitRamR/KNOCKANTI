import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ShoppingBag, Package, Users, Store,
    Truck, FileText, Settings, ChevronLeft, ChevronRight, LogOut, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
    const { logout } = useAuth();

    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: ShoppingBag, label: 'Orders', path: '/orders' },
        { icon: Package, label: 'Products', path: '/products' },
        { icon: Users, label: 'Customers', path: '/customers' },
        { icon: Store, label: 'Retailers', path: '/retailers' },
        { icon: Truck, label: 'Delivery', path: '/delivery' },
        { icon: Activity, label: 'SmartSync™', path: '/smartsync' },
        { icon: FileText, label: 'Reports', path: '/reports' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <motion.aside
            initial={{ width: isCollapsed ? 80 : 260 }}
            animate={{ width: isCollapsed ? 80 : 260 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
            className="h-screen sticky top-0 bg-bg-secondary border-r border-border flex flex-col z-20"
        >
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-border relative">
                <AnimatePresence mode='wait'>
                    {!isCollapsed ? (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-2xl font-bold bg-gradient-to-r from-brand-primary to-brand-neonBlue bg-clip-text text-transparent"
                        >
                            KNOCKKNOCK
                        </motion.h1>
                    ) : (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="w-8 h-8 bg-brand-primary rounded-lg flex items-center justify-center text-white font-bold"
                        >
                            K
                        </motion.div>
                    )}
                </AnimatePresence>

                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 w-6 h-6 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                    {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative
                            ${isActive
                                ? 'bg-brand-primary/10 text-brand-primary'
                                : 'text-text-secondary hover:bg-bg-primary hover:text-text-primary'
                            }
                        `}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon size={22} className={isActive ? 'text-brand-primary dark:text-brand-neonBlue' : ''} />
                                {!isCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="font-medium"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                                {isActive && !isCollapsed && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute left-0 w-1 h-8 bg-brand-primary rounded-r-full"
                                    />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4 border-t border-border">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors"
                >
                    <LogOut size={22} />
                    {!isCollapsed && <span className="font-medium">Logout</span>}
                </button>
            </div>
        </motion.aside>
    );
};

export default Sidebar;
