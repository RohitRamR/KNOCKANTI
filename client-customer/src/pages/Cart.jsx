import { useCart } from '../context/CartContext';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState, useEffect } from 'react';
import ProductImage from '../components/ProductImage';

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();
    const navigate = useNavigate();
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        addressLine: '',
        city: '',
        zip: '',
        lat: null,
        lng: null
    });

    useEffect(() => {
        fetchAddresses();
    }, []);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get('/customers/addresses');
            setAddresses(res.data);
            if (res.data.length > 0) {
                const defaultAddr = res.data.find(a => a.isDefault) || res.data[0];
                setSelectedAddress(defaultAddr);
            }
        } catch (error) {
            console.error('Error fetching addresses', error);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/customers/addresses', newAddress);
            setAddresses(res.data);
            setSelectedAddress(res.data[res.data.length - 1]); // Select new address
            setShowAddressForm(false);
            setNewAddress({ label: 'Home', addressLine: '', city: '', zip: '' });
        } catch (error) {
            console.error('Add address error:', error);
            alert('Failed to add address: ' + (error.response?.data?.message || error.message));
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setNewAddress(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude,
                    // Optional: Reverse geocoding could go here to fill addressLine
                }));
                alert('Location detected! Please fill in the rest of the address.');
            },
            (err) => {
                alert('Unable to retrieve your location');
            }
        );
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        if (!selectedAddress) {
            alert('Please select a delivery address');
            return;
        }
        setLoading(true);
        try {
            const items = cart.map((item) => ({
                productId: item._id,
                quantity: item.quantity,
            }));

            // Assuming all items are from the same retailer for now (MVP)
            const retailerId = cart[0]?.retailer?._id || cart[0]?.retailer;

            await axios.post('/customers/orders', {
                items,
                retailerId,
                deliveryAddress: selectedAddress
            });

            clearCart();
            clearCart();
            // alert('Order placed successfully!');
            navigate('/order-success');
        } catch (error) {
            alert('Checkout failed: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (cart.length === 0) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-200">
                    <ShoppingBag size={48} />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
                <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
                <button
                    onClick={() => navigate('/')}
                    className="bg-orange-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                >
                    Start Shopping
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 pb-24 max-w-4xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Shopping Cart ({cart.length} items)</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.map((item) => (
                        <div key={item._id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-xl flex-shrink-0 overflow-hidden border border-gray-100">
                                <ProductImage
                                    product={item}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-gray-800 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-500">₹{item.price}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-1">
                                    <button
                                        onClick={() => updateQuantity(item._id, item.quantity - 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-600"
                                    >
                                        -
                                    </button>
                                    <span className="w-6 text-center font-bold text-sm">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item._id, item.quantity + 1)}
                                        className="w-8 h-8 flex items-center justify-center bg-white rounded-md shadow-sm text-gray-600 hover:text-orange-600"
                                    >
                                        +
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item._id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary & Address */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Address Selection */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Delivery Address</h3>

                        {addresses.length > 0 && !showAddressForm ? (
                            <div className="space-y-3">
                                {addresses.map(addr => (
                                    <div
                                        key={addr._id}
                                        onClick={() => setSelectedAddress(addr)}
                                        className={`p-3 rounded-xl border cursor-pointer transition ${selectedAddress?._id === addr._id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="font-bold text-sm">{addr.label}</span>
                                            {selectedAddress?._id === addr._id && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                                        </div>
                                        <p className="text-xs text-gray-600">{addr.addressLine}, {addr.city} - {addr.zip}</p>
                                    </div>
                                ))}
                                <button
                                    onClick={() => setShowAddressForm(true)}
                                    className="w-full py-2 text-sm text-orange-600 font-bold hover:bg-orange-50 rounded-lg transition"
                                >
                                    + Add New Address
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.length === 0 && !showAddressForm && (
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 mb-3">No addresses saved.</p>
                                        <button
                                            onClick={() => setShowAddressForm(true)}
                                            className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-bold"
                                        >
                                            Add Address
                                        </button>
                                    </div>
                                )}

                                {showAddressForm && (
                                    <form onSubmit={handleAddAddress} className="space-y-3">
                                        <input
                                            type="text"
                                            placeholder="Label (e.g. Home)"
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={newAddress.label}
                                            onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                            required
                                        />
                                        <input
                                            type="text"
                                            placeholder="Address Line"
                                            className="w-full p-2 border rounded-lg text-sm"
                                            value={newAddress.addressLine}
                                            onChange={e => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={detectLocation}
                                            disabled={loading}
                                            className="w-full py-2 bg-green-50 text-green-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Detecting...' : '📍 Use Current Location'}
                                        </button>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="City"
                                                className="w-full p-2 border rounded-lg text-sm"
                                                value={newAddress.city}
                                                onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                required
                                            />
                                            <input
                                                type="text"
                                                placeholder="ZIP"
                                                className="w-full p-2 border rounded-lg text-sm"
                                                value={newAddress.zip}
                                                onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowAddressForm(false)}
                                                className="flex-1 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                className="flex-1 py-2 text-sm bg-orange-600 text-white rounded-lg font-bold"
                                            >
                                                Save
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h3 className="font-bold text-gray-800 mb-4">Order Summary</h3>
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-gray-500">
                                <span>Subtotal</span>
                                <span>₹{getCartTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-gray-500">
                                <span>Delivery Fee</span>
                                <span className="text-green-600">Free</span>
                            </div>
                            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg text-gray-800">
                                <span>Total</span>
                                <span>₹{getCartTotal().toFixed(2)}</span>
                            </div>
                        </div>
                        <button
                            onClick={handleCheckout}
                            disabled={loading || !selectedAddress}
                            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : 'Checkout'} <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;
