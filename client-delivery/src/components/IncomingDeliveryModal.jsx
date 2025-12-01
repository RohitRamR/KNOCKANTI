import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapPin, Check, X, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

const IncomingDeliveryModal = ({ requestData, onClose }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    if (!requestData) return null;

    const handleAccept = async () => {
        setLoading(true);
        try {
            await axios.post(`/delivery/orders/${requestData.orderId}/accept`);
            toast.success('Delivery Accepted!');
            onClose();
            navigate('/dashboard'); // Redirect to dashboard
        } catch (error) {
            console.error(error);
            toast.error('Failed to accept delivery');
        } finally {
            setLoading(false);
        }
    };

    const handleDecline = async () => {
        setLoading(true);
        try {
            await axios.post(`/delivery/orders/${requestData.orderId}/decline`);
            toast.success('Delivery Declined');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to decline delivery');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="bg-blue-600 p-4 flex items-center gap-3 text-white">
                    <div className="bg-white/20 p-2 rounded-full animate-pulse">
                        <Navigation size={24} />
                    </div>
                    <h3 className="font-bold text-lg">New Delivery Request!</h3>
                </div>

                <div className="p-6">
                    <div className="mb-4">
                        <label className="text-xs text-gray-500 font-bold uppercase">Pickup From</label>
                        <div className="flex items-start gap-2 mt-1">
                            <MapPin size={16} className="text-orange-500 mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700">
                                {requestData.pickupAddress?.street || 'Store Location'}
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 bg-gray-50 p-3 rounded-lg">
                        <span className="text-gray-500 text-sm">Order Value</span>
                        <span className="font-bold text-gray-800">₹{requestData.totalAmount}</span>
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
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition"
                        >
                            {loading ? 'Processing...' : <><Check size={20} /> Accept</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingDeliveryModal;
