import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { MapPin, Plus, Trash2, Home, Briefcase, Map as MapIcon, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const Settings = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newAddress, setNewAddress] = useState({
        label: 'Home',
        addressLine: '',
        city: '',
        zip: '',
        lat: 20.5937,
        lng: 78.9629
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        fetchAddresses();
    }, []);

    // Initialize Map when form is shown
    useEffect(() => {
        if (!showAddForm || !mapRef.current) return;

        // Prevent double initialization
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        // Small timeout to ensure DOM is ready
        const timer = setTimeout(() => {
            if (!mapRef.current) return;

            const map = L.map(mapRef.current).setView([newAddress.lat, newAddress.lng], 13);

            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            const icon = L.icon({
                iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
                iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            const marker = L.marker([newAddress.lat, newAddress.lng], { icon }).addTo(map);

            mapInstanceRef.current = map;
            markerRef.current = marker;
        }, 100);

        return () => {
            clearTimeout(timer);
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [showAddForm]);

    // Update Map when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([newAddress.lat, newAddress.lng], 13);
            markerRef.current.setLatLng([newAddress.lat, newAddress.lng]);
        }
    }, [newAddress.lat, newAddress.lng]);

    const fetchAddresses = async () => {
        try {
            const res = await axios.get('/customers/addresses');
            setAddresses(res.data);
        } catch (error) {
            console.error('Error fetching addresses', error);
            toast.error('Failed to load addresses');
        } finally {
            setLoading(false);
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolocation is not supported');
            return;
        }

        const toastId = toast.loading('Detecting location...');
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;

                // Reverse geocoding
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);

                    // Extract city and zip if available
                    const address = res.data.address;
                    const city = address.city || address.town || address.village || '';
                    const zip = address.postcode || '';

                    setNewAddress(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude,
                        addressLine: res.data.display_name,
                        city: city || prev.city,
                        zip: zip || prev.zip
                    }));
                    toast.success('Location detected!', { id: toastId });
                } catch (error) {
                    console.error('Reverse geocoding failed', error);
                    setNewAddress(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude
                    }));
                    toast.success('Location coordinates detected', { id: toastId });
                }
            },
            (err) => {
                toast.error('Unable to retrieve location', { id: toastId });
            }
        );
    };

    const handleSearch = async () => {
        if (!searchQuery) return;
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
            setSearchResults(res.data);
        } catch (error) {
            console.error('Search failed', error);
            toast.error('Address search failed');
        }
    };

    const selectLocation = (result) => {
        // Extract city and zip if available in display_name (simplified) or fetch details
        // For now just use display name
        setNewAddress(prev => ({
            ...prev,
            addressLine: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        }));
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('/customers/addresses', newAddress);
            setAddresses(res.data);
            setShowAddForm(false);
            setNewAddress({ label: 'Home', addressLine: '', city: '', zip: '', lat: 20.5937, lng: 78.9629 });
            toast.success('Address updated successfully');
        } catch (error) {
            console.error('Error adding address', error);
            toast.error('Failed to add address');
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        try {
            const res = await axios.delete(`/customers/addresses/${addressId}`);
            setAddresses(res.data);
            toast.success('Address deleted successfully');
        } catch (error) {
            console.error('Error deleting address', error);
            toast.error('Failed to delete address');
        }
    };

    const getIcon = (label) => {
        const l = label.toLowerCase();
        if (l.includes('home')) return <Home size={20} />;
        if (l.includes('work') || l.includes('office')) return <Briefcase size={20} />;
        return <MapPin size={20} />;
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-2xl font-bold text-gray-800 mb-8">Account Settings</h1>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <MapIcon size={20} className="text-orange-500" /> Saved Addresses
                    </h2>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="text-sm font-bold text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                    >
                        <Plus size={16} /> Add New
                    </button>
                </div>

                {showAddForm && (
                    <div className="p-6 bg-gray-50 border-b border-gray-100">
                        <form onSubmit={handleAddAddress} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="Label (e.g. Home)"
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 transition"
                                    value={newAddress.label}
                                    onChange={e => setNewAddress({ ...newAddress, label: e.target.value })}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    className="w-full py-3 bg-green-50 text-green-700 border border-green-100 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-green-100 transition"
                                >
                                    <MapPin size={16} /> {newAddress.lat !== 20.5937 ? 'Location Set ✓' : 'Use Current Location'}
                                </button>
                            </div>

                            {/* Address Search */}
                            <div className="relative">
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search address..."
                                        className="flex-1 p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 transition"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSearch}
                                        className="bg-gray-100 text-gray-600 px-4 rounded-xl hover:bg-gray-200 transition"
                                    >
                                        <Search size={20} />
                                    </button>
                                </div>

                                {searchResults.length > 0 && (
                                    <div className="absolute top-12 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-40 overflow-y-auto">
                                        {searchResults.map((result, index) => (
                                            <div
                                                key={index}
                                                onClick={() => selectLocation(result)}
                                                className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-none text-sm"
                                            >
                                                {result.display_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <input
                                type="text"
                                placeholder="Address Line"
                                className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 transition"
                                value={newAddress.addressLine}
                                onChange={e => setNewAddress({ ...newAddress, addressLine: e.target.value })}
                                required
                            />

                            {/* Leaflet Map */}
                            <div className="w-full h-48 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden z-0">
                                <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    placeholder="City"
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 transition"
                                    value={newAddress.city}
                                    onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="ZIP Code"
                                    className="w-full p-3 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-500 transition"
                                    value={newAddress.zip}
                                    onChange={e => setNewAddress({ ...newAddress, zip: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="flex-1 py-2.5 text-sm text-gray-500 font-medium hover:bg-gray-200 rounded-xl transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-2.5 text-sm bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition shadow-lg shadow-orange-200"
                                >
                                    Save Address
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="divide-y divide-gray-100">
                    {addresses.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            No addresses saved yet.
                        </div>
                    ) : (
                        addresses.map((addr, index) => (
                            <div key={index} className="p-4 hover:bg-gray-50 transition flex items-center justify-between group">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-orange-50 text-orange-500 rounded-lg mt-1">
                                        {getIcon(addr.label)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-sm">{addr.label}</h3>
                                        <p className="text-sm text-gray-600 mt-0.5">{addr.addressLine}</p>
                                        <p className="text-xs text-gray-400 mt-1">{addr.city} - {addr.zip}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteAddress(addr._id)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                                    title="Delete Address"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Settings;
