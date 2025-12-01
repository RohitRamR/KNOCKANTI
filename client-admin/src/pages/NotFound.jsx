import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <AlertTriangle size={48} />
            </div>
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">404</h1>
            <h2 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-6">Page Not Found</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/30"
            >
                <Home size={20} /> Back to Dashboard
            </button>
        </div>
    );
};

export default NotFound;
