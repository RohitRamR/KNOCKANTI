import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Package, CheckCircle, Clock, Navigation, Phone, X, Check, Truck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { toast } from 'react-hot-toast';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to update map center when coordinates change
const MapUpdater = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

const Dashboard = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isOnline, setIsOnline] = useState(false);
    const [currentLocation, setCurrentLocation] = useState(null);
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        fetchOrders();
        // Poll for new orders every 10 seconds (keep as backup)
        const interval = setInterval(fetchOrders, 10000);

        // Socket connection
        const newSocket = io('http://localhost:5001');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Delivery Dashboard connected to socket');
        });

        newSocket.on('orderPlaced', () => {
            console.log('New order placed, refreshing list...');
            fetchOrders();
        });

        // Also listen for assignment if we implement it specifically
        // socket.on('deliveryAssigned', () => fetchOrders());

        return () => {
            clearInterval(interval);
            newSocket.disconnect();
        };
    }, []);

    // Ref approach for interval
    const locationRef = useRef(null);
    useEffect(() => {
        locationRef.current = currentLocation;
    }, [currentLocation]);

    useEffect(() => {
        let watchId;
        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(
                (position) => {
                    const newLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setCurrentLocation(newLocation);
                },
                (error) => console.error("Error watching location", error),
                { enableHighAccuracy: true }
            );
        }

        const locationInterval = setInterval(() => {
            if (locationRef.current) {
                axios.patch('/delivery/location', {
                    lat: locationRef.current.lat,
                    lng: locationRef.current.lng
                }).catch(err => console.error('Error sending location update', err));
            }
        }, 30000);

        return () => {
            clearInterval(locationInterval);
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, []);

    const fetchOrders = async () => {
        try {
            const res = await axios.get('/delivery/orders/assigned');
            setOrders(res.data);
        } catch (error) {
            console.error('Error fetching orders', error);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, status) => {
        try {
            await axios.patch(`/delivery/orders/${orderId}/status`, { status });
            toast.success(`Order marked as ${status}`);
            fetchOrders();
        } catch (error) {
            console.error('Error updating status', error);
            toast.error('Failed to update status');
        }
    };

    const openMap = (address) => {
        if (!address) return;
        // Handle both string and object addresses
        let query = '';
        if (typeof address === 'string') {
            query = address;
        } else if (typeof address === 'object') {
            query = `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`;
        }

        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`, '_blank');
    };

    const toggleOnline = async () => {
        try {
            const newStatus = !isOnline;
            await axios.patch('/delivery/status', { isOnline: newStatus });
            setIsOnline(newStatus);
            if (newStatus) toast.success('You are now Online');
            else toast.success('You are now Offline');
        } catch (error) {
            console.error('Error updating online status', error);
            toast.error('Failed to update online status');
        }
    };

    if (loading) return <div className="flex items-center justify-center h-screen bg-gray-50 text-indigo-600 font-medium">Loading...</div>;

    // Filter active order (if any)
    const activeOrder = orders.find(o => ['ACCEPTED', 'ARRIVED_PICKUP', 'PICKED_UP'].includes(o.status));
    const pendingOrders = orders.filter(o => ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY'].includes(o.status) && !['ACCEPTED', 'ARRIVED_PICKUP', 'PICKED_UP'].includes(o.status));

    return (
        <div className="space-y-6 pb-20">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Welcome back, {user?.name || 'Partner'}!</h1>
                    <p className="text-gray-500 text-sm">You have {orders.filter(o => o.status === 'DELIVERED').length} new delivered parcels.</p>
                </div>
                <button
                    onClick={toggleOnline}
                    className={`px-6 py-2.5 rounded-xl font-bold shadow-lg transition ${isOnline ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-200' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200'}`}
                >
                    {isOnline ? 'You are Online' : 'Go Online'}
                </button>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-900 text-white rounded-full">
                            <Package size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">↑ 25%</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Today's Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{orders.filter(o => o.status === 'DELIVERED').length}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-900 text-white rounded-full">
                            <Truck size={24} />
                        </div>
                        <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">↑ 12%</span>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Today's Earnings</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">₹{orders.filter(o => o.status === 'DELIVERED').reduce((acc, o) => acc + (o.totalAmount * 0.1), 0).toFixed(0)}</p>
                </div>
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-gray-900 text-white rounded-full">
                            <Navigation size={24} />
                        </div>
                    </div>
                    <h3 className="text-gray-500 text-sm font-medium">Pending Orders</h3>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{pendingOrders.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Active Order & Requests */}
                <div className="space-y-6 lg:col-span-8">

                    {/* Active Order Card */}
                    {activeOrder ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
                                <span className="text-orange-700 font-bold text-sm flex items-center gap-2">
                                    <Package size={18} /> Active Order
                                </span>
                                <span className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded-lg border border-orange-100">
                                    #{activeOrder._id.slice(-6)}
                                </span>
                            </div>

                            <div className="p-5 space-y-4">
                                {/* Pickup */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <MapPin size={16} />
                                        </div>
                                        <div className="w-0.5 h-full bg-gray-100 my-1"></div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Pickup</p>
                                        <h3 className="font-bold text-gray-800">{activeOrder.retailer?.storeName || 'Store'}</h3>
                                        <p className="text-sm text-gray-500">{activeOrder.retailer?.address?.street || 'Address not available'}</p>
                                        <div className="flex gap-3 mt-2">
                                            <a href={`tel:${activeOrder.retailer?.phone}`} className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                                                <Phone size={12} /> Call Store
                                            </a>
                                            <button
                                                onClick={() => openMap(activeOrder.retailer?.address?.street)}
                                                className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100 transition"
                                            >
                                                <Navigation size={12} /> Navigate
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Drop */}
                                <div className="flex gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                            <Navigation size={16} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Drop</p>
                                        <h3 className="font-bold text-gray-800">{activeOrder.customer?.name || 'Customer'}</h3>
                                        <p className="text-sm text-gray-500">{activeOrder.deliveryAddress?.addressLine || 'Address not available'}</p>
                                        <div className="flex gap-3 mt-2">
                                            <a href={`tel:${activeOrder.customer?.phone}`} className="inline-flex items-center gap-1 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-lg hover:bg-blue-100 transition">
                                                <Phone size={12} /> Call Customer
                                            </a>
                                            <button
                                                onClick={() => openMap(activeOrder.deliveryAddress)}
                                                className="inline-flex items-center gap-1 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-lg hover:bg-green-100 transition"
                                            >
                                                <Navigation size={12} /> Navigate
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3">
                                    {activeOrder.status === 'ACCEPTED' && (
                                        <button
                                            onClick={() => updateStatus(activeOrder._id, 'ARRIVED_PICKUP')}
                                            className="col-span-2 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                                        >
                                            Arrived at Store
                                        </button>
                                    )}
                                    {activeOrder.status === 'ARRIVED_PICKUP' && (
                                        <button
                                            onClick={() => updateStatus(activeOrder._id, 'PICKED_UP')}
                                            className="col-span-2 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200"
                                        >
                                            Confirm Pickup
                                        </button>
                                    )}
                                    {activeOrder.status === 'PICKED_UP' && (
                                        <button
                                            onClick={() => updateStatus(activeOrder._id, 'DELIVERED')}
                                            className="col-span-2 bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
                                        >
                                            Confirm Delivery
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Package size={32} />
                            </div>
                            <h3 className="font-bold text-gray-800 mb-1">No Active Orders</h3>
                            <p className="text-sm text-gray-500">Stay online to receive new delivery requests.</p>
                        </div>
                    )}

                    {/* Incoming Requests List */}
                    {pendingOrders.length > 0 && (
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-800 mb-4">Incoming Requests</h3>
                            <div className="space-y-4">
                                {pendingOrders.map(order => (
                                    <div key={order._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="font-bold text-gray-800">New Order #{order._id.slice(-4)}</p>
                                            <p className="text-xs text-gray-500">₹{order.totalAmount}</p>
                                        </div>
                                        <button
                                            onClick={() => updateStatus(order._id, 'ACCEPTED')}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition"
                                        >
                                            Accept
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Map Overview */}
                <div className="space-y-6 lg:col-span-4">
                    <h2 className="text-xl font-bold text-gray-800">Map Overview</h2>
                    <div className="bg-gray-200 rounded-3xl overflow-hidden h-[600px] relative shadow-sm border border-gray-100">

                        {/* Leaflet Map */}
                        <div className="w-full h-full z-0">
                            <MapContainer
                                center={currentLocation || { lat: 20.5937, lng: 78.9629 }}
                                zoom={15}
                                style={{ height: '100%', width: '100%' }}
                                zoomControl={false}
                            >
                                <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                />
                                {currentLocation && <Marker position={[currentLocation.lat, currentLocation.lng]} />}
                                <MapUpdater center={currentLocation} />
                            </MapContainer>
                        </div>

                        {/* Map Overlay Card */}
                        <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 z-[1000]">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase">Current Location</p>
                                    <p className="font-bold text-gray-800">
                                        {currentLocation ? `${currentLocation.lat.toFixed(4)}, ${currentLocation.lng.toFixed(4)}` : 'Fetching location...'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => activeOrder && openMap(activeOrder.deliveryAddress)}
                                    className="bg-indigo-600 p-3 rounded-xl text-white hover:bg-indigo-700 transition"
                                >
                                    <Navigation size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
