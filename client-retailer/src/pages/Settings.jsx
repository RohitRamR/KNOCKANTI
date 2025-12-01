import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Save, MapPin, Search, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const Settings = () => {
    const [formData, setFormData] = useState({
        storeName: '',
        phone: '',
        address: '',
        lat: 20.5937, // Default to India
        lng: 78.9629
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    // Initialize Map
    useEffect(() => {
        if (!mapRef.current) return;

        // Prevent double initialization
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        const map = L.map(mapRef.current).setView([formData.lat, formData.lng], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Custom icon to fix default marker issue
        const icon = L.icon({
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        const marker = L.marker([formData.lat, formData.lng], { icon }).addTo(map);

        mapInstanceRef.current = map;
        markerRef.current = marker;

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []); // Init once on mount (or when ref is ready)

    // Update Map when coordinates change
    useEffect(() => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([formData.lat, formData.lng], 13);
            markerRef.current.setLatLng([formData.lat, formData.lng]);
        }
    }, [formData.lat, formData.lng]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get('/retailer/profile');
            const { storeName, phone, address } = res.data;
            setFormData({
                storeName: storeName || '',
                phone: phone || '',
                address: address?.street || '',
                lat: address?.coordinates?.lat || 20.5937,
                lng: address?.coordinates?.lng || 78.9629
            });
        } catch (error) {
            console.error('Error fetching profile', error);
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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

                // Reverse geocoding with Nominatim
                try {
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    setFormData(prev => ({
                        ...prev,
                        lat: latitude,
                        lng: longitude,
                        address: res.data.display_name
                    }));
                    toast.success('Location detected!', { id: toastId });
                } catch (error) {
                    console.error('Reverse geocoding failed', error);
                    setFormData(prev => ({
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
        setFormData(prev => ({
            ...prev,
            address: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
        }));
        setSearchResults([]);
        setSearchQuery('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put('/retailer/profile', {
                storeName: formData.storeName,
                phone: formData.phone,
                address: {
                    street: formData.address,
                    coordinates: {
                        lat: formData.lat,
                        lng: formData.lng
                    }
                }
            });
            toast.success('Address updated successfully');
        } catch (error) {
            console.error('Error saving settings', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading settings...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                    <SettingsIcon size={24} className="text-gray-400" /> Store Settings
                </h2>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Store Address</label>

                        {/* Address Search */}
                        <div className="relative mb-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search for address..."
                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
                                />
                                <button
                                    type="button"
                                    onClick={handleSearch}
                                    className="bg-gray-100 text-gray-600 px-4 rounded-xl hover:bg-gray-200 transition"
                                >
                                    <Search size={20} />
                                </button>
                                <button
                                    type="button"
                                    onClick={detectLocation}
                                    className="bg-green-100 text-green-700 px-4 rounded-xl hover:bg-green-200 transition font-bold flex items-center gap-2"
                                >
                                    <MapPin size={18} /> Detect
                                </button>
                            </div>

                            {/* Search Results Dropdown */}
                            {searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg mt-2 z-10 max-h-60 overflow-y-auto">
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

                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition h-24 resize-none mb-4"
                            required
                            placeholder="Full address will appear here..."
                        />

                        {/* Leaflet Map */}
                        <div className="w-full h-64 bg-gray-100 rounded-xl border border-gray-200 overflow-hidden z-0">
                            <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
                        </div>

                        <p className="text-xs text-gray-400 mt-2">
                            Coordinates: {formData.lat.toFixed(6)}, {formData.lng.toFixed(6)}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 flex items-center justify-center gap-2 disabled:opacity-70"
                        >
                            {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
