import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';

const OrderSuccess = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Auto-redirect after 5 seconds
        const timer = setTimeout(() => {
            navigate('/orders');
        }, 5000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-4">
            <div className="mb-8 relative">
                <div className="w-32 h-32 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle size={64} className="text-green-600" />
                </div>
                <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-20"></div>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2 animate-fade-in-up">Order Placed!</h1>
            <p className="text-gray-500 mb-8 max-w-md animate-fade-in-up delay-100">
                Your order has been successfully placed and sent to the store. You can track its status in the Orders page.
            </p>

            <div className="flex gap-4 animate-fade-in-up delay-200">
                <button
                    onClick={() => navigate('/orders')}
                    className="bg-green-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center gap-2"
                >
                    View Orders <ArrowRight size={20} />
                </button>
                <button
                    onClick={() => navigate('/')}
                    className="bg-gray-100 text-gray-700 px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition"
                >
                    Continue Shopping
                </button>
            </div>
        </div>
    );
};

export default OrderSuccess;
