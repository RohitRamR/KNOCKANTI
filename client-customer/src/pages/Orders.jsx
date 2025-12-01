import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle, MapPin, Navigation } from 'lucide-react';
import { io } from 'socket.io-client';

const Orders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trackingOrder, setTrackingOrder] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 mins default
    const socketRef = useRef();

    useEffect(() => {
        fetchOrders();

        // Connect to socket
        socketRef.current = io('http://localhost:5001');

        socketRef.current.on('connect', () => {
            console.log('Connected to socket server');
        });

        socketRef.current.on('deliveryLocationUpdate', (data) => {
            console.log('Location update received:', data);
            setDeliveryLocation(data.location);
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, []);

    // Timer effect
    useEffect(() => {
        if (!trackingOrder) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [trackingOrder]);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/customers/orders');
            setOrders(res.data);

            // Auto-track first active order
            const active = res.data.find(o => ['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(o.status));
            if (active) {
                setTrackingOrder(active);
                // If we had real ETA from backend, we'd set it here. For now, static 30 mins.
            }
        } catch (error) {
            console.error('Error fetching orders', error);
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading...</div>;

    return (
        <div className="container mx-auto px-4 py-8 pb-24 max-w-3xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">My Orders</h1>

            {/* Live Tracking Panel */}
            {trackingOrder && (
                <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>

                    <div className="flex justify-between items-start mb-6 relative z-10">
                        <div>
                            <p className="text-indigo-200 text-sm font-bold uppercase tracking-wider">Arriving In</p>
                            <p className="text-4xl font-bold mt-1">{formatTime(timeLeft)}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                            <Clock size={24} className="text-white" />
                        </div>
                    </div>

                    {/* Map View */}
                    <div className="bg-white/10 rounded-xl overflow-hidden h-48 mb-4 relative border border-white/20">
                        <iframe
                            src={deliveryLocation
                                ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d15000.0!2d${deliveryLocation.lng}!3d${deliveryLocation.lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sin!4v1629783012345!5m2!1sen!2sin`
                                : "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3022.1422937950147!2d-73.98513018459391!3d40.74881717932847!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c259a9b3117469%3A0xd134e199a405a163!2sEmpire%20State%20Building!5e0!3m2!1sen!2sus!4v1629783012345!5m2!1sen!2sus"
                            }
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            className="absolute inset-0 w-full h-full opacity-80"
                        ></iframe>
                        <div className="absolute bottom-3 left-3 bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                            {deliveryLocation ? 'Live Location' : 'Waiting for location...'}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center">
                            <Navigation size={20} />
                        </div>
                        <div>
                            <p className="font-bold">On the way</p>
                            <p className="text-xs text-indigo-200">Your delivery partner is moving</p>
                        </div>
                    </div>
                </div>
            )}

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
                    <Package size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Order #{order._id.slice(-6)}</p>
                                    <p className="font-bold text-gray-800">
                                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                            day: 'numeric', month: 'long', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                                    order.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                                        'bg-blue-100 text-blue-700'
                                    }`}>
                                    {order.status}
                                </span>
                            </div>

                            <div className="divide-y divide-gray-50 mb-4">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="py-3 flex justify-between text-sm">
                                        <span className="text-gray-600">{item.product?.name || 'Unknown Item'} <span className="text-gray-400">x{item.quantity}</span></span>
                                        <span className="font-medium text-gray-800">₹{item.price}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <MapPin size={16} />
                                    <span>Home Delivery</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-gray-900">Total: ₹{order.totalAmount}</p>
                                    {order.status === 'CANCELLED' && order.paymentMethod === 'ONLINE' && (
                                        <p className="text-xs text-red-500 font-bold mt-1">Refund Initiated</p>
                                    )}
                                    <button
                                        onClick={() => window.open(`http://localhost:5001/api/customers/invoices/${order._id}`, '_blank')}
                                        className="text-xs text-indigo-600 font-bold hover:underline mt-2 block"
                                    >
                                        Download Invoice
                                    </button>
                                </div>
                            </div>

                            {['OUT_FOR_DELIVERY', 'PICKED_UP'].includes(order.status) && order._id !== trackingOrder?._id && (
                                <button
                                    onClick={() => setTrackingOrder(order)}
                                    className="w-full mt-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold text-sm hover:bg-indigo-100 transition"
                                >
                                    Track Order
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Orders;
