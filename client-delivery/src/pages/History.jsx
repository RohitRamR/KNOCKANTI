import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Calendar, MapPin } from 'lucide-react';

const History = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get('/delivery/orders/assigned');
            // Filter for completed orders
            const history = res.data.filter(o => o.status === 'DELIVERED');
            setOrders(history);
        } catch (error) {
            console.error('Error fetching history', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading history...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Order History</h1>

            {orders.length === 0 ? (
                <div className="bg-white p-8 rounded-3xl text-center text-gray-500">
                    No past orders found.
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order._id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">DELIVERED</span>
                                    <span className="text-gray-400 text-xs">{new Date(order.updatedAt).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-gray-800">Order #{order._id.slice(-6).toUpperCase()}</h3>
                                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <MapPin size={14} /> {order.retailer?.storeName}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-indigo-600">₹{(order.totalAmount * 0.1).toFixed(0)}</p>
                                <p className="text-xs text-gray-400">Earnings</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
