import React from 'react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '', ...props }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`glass-card p-6 ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
};

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = "px-4 py-2 rounded-xl font-medium transition-all duration-200 active:scale-95 flex items-center justify-center gap-2";
    const variants = {
        primary: "bg-brand-primary text-white shadow-lg shadow-brand-primary/30 hover:bg-blue-600",
        secondary: "bg-brand-secondary text-white shadow-lg shadow-brand-secondary/30 hover:bg-emerald-600",
        outline: "border border-border hover:bg-bg-primary text-text-primary",
        ghost: "hover:bg-bg-primary text-text-primary"
    };

    return (
        <motion.button
            whileTap={{ scale: 0.95 }}
            className={`${baseStyle} ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </motion.button>
    );
};

export const Badge = ({ children, variant = 'default', className = '' }) => {
    const variants = {
        default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
        danger: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
    };

    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
