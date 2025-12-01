import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        storeName: '',
        gstin: '',
        storeName: '',
        gstin: '',
        address: '',
        lat: null,
        lng: null
    });
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const [locationStatus, setLocationStatus] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const detectLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('Detecting...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({
                    ...prev,
                    lat: latitude,
                    lng: longitude
                }));
                setLocationStatus('Location detected! ✓');
            },
            (err) => {
                setError('Unable to retrieve your location');
                setLocationStatus('');
            }
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Register
            await axios.post('/auth/register', {
                ...formData,
                role: 'RETAILER'
            });

            // Auto login
            await login(formData.email, formData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Partner Registration</h2>
                <p className="text-center text-gray-500 mb-8 text-sm">Start managing your store today!</p>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm border border-red-100">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Owner Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Phone</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Store Name</label>
                        <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleChange}
                            className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Address</label>
                        <div className="relative">
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none h-20"
                                required
                                placeholder="Enter full address or use Detect Location"
                            />
                            <button
                                type="button"
                                onClick={detectLocation}
                                className="absolute bottom-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md hover:bg-green-200 transition font-bold flex items-center gap-1"
                            >
                                📍 Detect Location
                            </button>
                        </div>
                        {locationStatus && <p className="text-xs text-green-600 mt-1">{locationStatus}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">GSTIN (Optional)</label>
                            <input
                                type="text"
                                name="gstin"
                                value={formData.gstin}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 text-xs font-bold mb-1 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 focus:bg-white transition outline-none"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition duration-200 font-bold shadow-lg shadow-green-200 mt-6"
                    >
                        Register Store
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    Already have an account? <Link to="/login" className="text-green-600 font-bold hover:underline">Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
