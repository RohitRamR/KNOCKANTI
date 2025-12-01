import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Truck, CheckCircle, Clock } from 'lucide-react';

import io from 'socket.io-client';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);

    useEffect(() => {
        fetchOrders();
        fetchPartners();

        const socket = io('http://localhost:5002');

        socket.on('connect', () => {
            console.log('Retailer Orders connected to socket');
        });

        socket.on('orderPlaced', (data) => {
            console.log('New order placed, refreshing list...');
            fetchOrders();
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/retailer/orders');
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching orders', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPartners = async () => {
        try {
            const res = await axios.get('/retailer/delivery-partners');
            setPartners(res.data);
        } catch (error) {
            console.error('Error fetching partners', error);
        }
    };

    const handleAssign = async (partnerId) => {
        try {
            await axios.post(`/retailer/orders/${selectedOrder._id}/assign`, { deliveryPartnerId: partnerId });
            setShowAssignModal(false);
            fetchOrders();
            alert('Order assigned successfully!');
        } catch (error) {
            console.error('Error assigning order', error);
            alert('Failed to assign order');
        }
    };

    const handleAccept = async (orderId) => {
        try {
            await axios.post(`/retailer/orders/${orderId}/accept`);
            fetchOrders();
            // alert('Order accepted'); // Optional toast
        } catch (error) {
            console.error('Error accepting order', error);
            alert('Failed to accept order');
        }
    };

    const handleDecline = async (orderId) => {
        if (!window.confirm('Are you sure you want to decline this order? It will be cancelled and refunded if prepaid.')) return;
        try {
            await axios.post(`/retailer/orders/${orderId}/decline`);
            fetchOrders();
            alert('Order declined');
        } catch (error) {
            console.error('Error declining order', error);
            alert('Failed to decline order');
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-800">Orders</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-sm font-bold text-gray-500">Order ID</th>
                            <th className="p-4 text-sm font-bold text-gray-500">Customer</th>
                            <th className="p-4 text-sm font-bold text-gray-500">Total</th>
                            <th className="p-4 text-sm font-bold text-gray-500">Status</th>
                            <th className="p-4 text-sm font-bold text-gray-500">Delivery Partner</th>
                            <th className="p-4 text-sm font-bold text-gray-500">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {orders.map(order => (
                            <tr key={order._id} className="hover:bg-gray-50">
                                <td className="p-4 font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</td>
                                <td className="p-4 text-gray-600">
                                    <p className="font-bold text-sm">{order.customer?.name || 'Walk-in'}</p>
                                    <p className="text-xs">{order.customer?.phone}</p>
                                </td>
                                <td className="p-4 font-bold text-gray-800">₹{order.totalAmount.toFixed(2)}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'PLACED' ? 'bg-yellow-100 text-yellow-700' :
                                        order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                                'bg-gray-100 text-gray-700'
                                        }`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">
                                    {order.deliveryPartner ? (
                                        <div className="flex items-center gap-2">
                                            <Truck size={16} className="text-indigo-600" />
                                            <span className="text-sm">{order.deliveryPartner.name}</span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-gray-400">Unassigned</span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {order.status === 'PLACED' && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleAccept(order._id)}
                                                className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => handleDecline(order._id)}
                                                className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    )}
                                    {order.status === 'ACCEPTED' && (
                                        <button
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setShowAssignModal(true);
                                            }}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
                                        >
                                            Assign
                                        </button>
                                    )}
                                    <button
                                        onClick={() => window.open(`http://localhost:5002/api/retailer/invoices/${order._id}`, '_blank')}
                                        className="ml-2 text-gray-400 hover:text-indigo-600 transition"
                                        title="Download Invoice"
                                    >
                                        <Package size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {orders.length === 0 && (
                    <div className="p-8 text-center text-gray-500">No orders found.</div>
                )}
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Assign Delivery Partner</h3>
                        <p className="text-sm text-gray-500 mb-6">Select a delivery partner for Order #{selectedOrder?._id.slice(-6).toUpperCase()}</p>

                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {partners.map(partner => (
                                <button
                                    key={partner._id}
                                    onClick={() => handleAssign(partner._id)}
                                    className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-indigo-600 hover:bg-indigo-50 transition group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="bg-gray-100 p-2 rounded-full group-hover:bg-white">
                                            <Truck size={20} className="text-gray-600 group-hover:text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-bold text-gray-800">{partner.name}</p>
                                            <p className="text-xs text-gray-500">{partner.phone}</p>
                                        </div>
                                    </div>
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-300 group-hover:border-indigo-600"></div>
                                </button>
                            ))}
                            {partners.length === 0 && (
                                <p className="text-center text-gray-500">No active delivery partners found.</p>
                            )}
                        </div>

                        <button
                            onClick={() => setShowAssignModal(false)}
                            className="w-full mt-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Orders;
