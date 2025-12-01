import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Clock, LogOut, Truck, Menu, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import IncomingDeliveryModal from './IncomingDeliveryModal';

const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(to)
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                : 'text-gray-500 hover:bg-indigo-50 hover:text-indigo-600'
                }`}
        >
            <Icon size={20} className={isActive(to) ? 'text-white' : 'text-gray-400 group-hover:text-indigo-600'} />
            <span className="font-medium">{label}</span>
        </Link>
    );

    const [incomingRequest, setIncomingRequest] = useState(null);

    useEffect(() => {
        if (user) {
            import('socket.io-client').then(({ io }) => {
                const socket = io('http://localhost:5002');

                socket.on('connect', () => {
                    console.log('Connected to socket server');
                });

                socket.on('deliveryRequest', (data) => {
                    console.log('Delivery Request Received:', data);
                    if (data.partnerId === user._id) {
                        setIncomingRequest(data);
                    }
                });

                return () => {
                    socket.disconnect();
                };
            });
        }
    }, [user]);

    return (
        <div className="flex h-screen bg-[#F8FAFC]">
            {incomingRequest && (
                <IncomingDeliveryModal
                    requestData={incomingRequest}
                    onClose={() => setIncomingRequest(null)}
                />
            )}
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-white h-full flex flex-col transition-all duration-300 border-r border-gray-100 z-20`}
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                        <Truck className="text-white" size={24} />
                    </div>
                    {isSidebarOpen && (
                        <div>
                            <h1 className="font-bold text-xl text-gray-800 tracking-tight">KnockKnock</h1>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">DELIVERY PARTNER</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem to="/dashboard" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} />
                    <NavItem to="/history" icon={Clock} label={isSidebarOpen ? "History" : ""} />
                </nav>

                <div className="p-4 border-t border-gray-50">
                    {isSidebarOpen ? (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-2">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                    {user?.name?.[0] || 'D'}
                                </div>
                                <div className="overflow-hidden">
                                    <p className="font-bold text-gray-800 text-sm truncate">{user?.name}</p>
                                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 w-full py-2 rounded-lg transition text-sm font-medium"
                            >
                                <LogOut size={16} /> Logout
                            </button>
                        </div>
                    ) : (
                        <button onClick={handleLogout} className="w-full flex justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <LogOut size={20} />
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Header */}
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex justify-between items-center px-8 z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
                        >
                            <Menu size={20} />
                        </button>
                        <h2 className="text-xl font-bold text-gray-800 tracking-tight">
                            {location.pathname === '/dashboard' && 'Overview'}
                            {location.pathname === '/history' && 'Delivery History'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden md:block">
                            <p className="text-sm font-bold text-gray-800">{new Date().toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{new Date().toLocaleTimeString()}</p>
                        </div>
                        <button className="p-2.5 hover:bg-gray-50 rounded-xl text-gray-500 relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto p-6 bg-[#F8FAFC]">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default Layout;
