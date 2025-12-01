import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Bell, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';

const IncomingOrderModal = ({ orderData, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    if (!orderData) return null;

    const handleAccept = async () => {
        setLoading(true);
        try {
            await axios.post(`/retailer/orders/${orderData.orderId}/accept`);
            toast.success('Order Accepted!');
            onClose();
            navigate('/orders'); // Redirect to orders page
        } catch (error) {
            console.error(error);
            toast.error('Failed to accept order');
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        if (!window.confirm('Are you sure you want to decline this order?')) return;
        setLoading(true);
        try {
            await axios.post(`/retailer/orders/${orderData.orderId}/decline`);
            toast.success('Order Declined');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to decline order');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-orange-600 p-4 flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-full animate-bounce">
                        <Bell size={24} />
                    </div>
                    <h3 className="font-bold text-lg">New Order Received!</h3>
                </div>

                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-500">Customer</span>
                        <span className="font-bold text-gray-800">{orderData.customerName}</span>
                    </div>
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-gray-500">Total Amount</span>
                        <span className="font-bold text-2xl text-green-600">₹{orderData.totalAmount}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={handleDecline}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition"
                        >
                            <X size={20} /> Decline
                        </button>
                        <button
                            onClick={handleAccept}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition"
                        >
                            {loading ? 'Processing...' : <><Check size={20} /> Accept</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingOrderModal;
