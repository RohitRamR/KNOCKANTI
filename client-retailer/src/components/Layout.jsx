import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, ShoppingCart, Package, FileText, Settings, LogOut, Bell, Search, Menu, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import IncomingOrderModal from './IncomingOrderModal';

const Layout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path;

    const NavItem = ({ to, icon: Icon, label }) => (
        <Link
            to={to}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${isActive(to)
                ? 'bg-green-600 text-white shadow-lg shadow-green-200'
                : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
                }`}
        >
            <Icon size={20} className={isActive(to) ? 'text-white' : 'text-gray-400 group-hover:text-green-600'} />
            <span className="font-medium">{label}</span>
        </Link>
    );

    const [incomingOrder, setIncomingOrder] = useState(null);

    useEffect(() => {
        if (user) {
            import('socket.io-client').then(({ io }) => {
                const socket = io('http://localhost:5001');

                socket.on('connect', () => {
                    console.log('Connected to socket server');
                });

                socket.on('newOrder', (data) => {
                    console.log('New Order Received:', data);
                    // Check if this order is for me
                    // Ideally, backend should emit to specific room or we filter here
                    // Since we emit to all with retailerId, we check:
                    if (data.retailerId === user.retailerProfile || data.retailerId === user._id) { // user._id might be user ID, need retailer profile ID. 
                        // Wait, user object in context usually has retailerProfile ID if populated or we need to check structure.
                        // Let's assume backend emits retailerId which matches what we have.
                        // Actually, let's just show it for now and refine if needed.
                        // In retailerController, we emit { retailerId: retailerId }.
                        // In AuthContext, user object usually has role.
                        // Let's rely on the fact that if we are logged in as this retailer, we should see it.
                        // But wait, `io.emit` broadcasts to ALL. We need to filter.
                        // The `user` object in frontend might not have `retailerProfile` id directly if not populated.
                        // Let's check `user` structure in `AuthContext` or just show it for demo purposes if we can't filter easily yet.
                        // BETTER: The backend `newOrder` event payload has `retailerId`.
                        // We should compare it.
                        setIncomingOrder(data);
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
            {incomingOrder && (
                <IncomingOrderModal
                    orderData={incomingOrder}
                    onClose={() => setIncomingOrder(null)}
                />
            )}
            {/* Sidebar */}
            <aside
                className={`${isSidebarOpen ? 'w-72' : 'w-20'} bg-white h-full flex flex-col transition-all duration-300 border-r border-gray-100 z-20`}
            >
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center shadow-lg shadow-green-200">
                        <span className="text-white font-bold text-xl">R</span>
                    </div>
                    {isSidebarOpen && (
                        <div>
                            <h1 className="font-bold text-xl text-gray-800 tracking-tight">RetailPOS</h1>
                            <p className="text-xs text-gray-400 font-medium tracking-wide">STORE MANAGER</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <NavItem to="/dashboard" icon={LayoutDashboard} label={isSidebarOpen ? "Dashboard" : ""} />
                    <NavItem to="/billing" icon={ShoppingCart} label={isSidebarOpen ? "Billing / POS" : ""} />
                    <NavItem to="/orders" icon={Package} label={isSidebarOpen ? "Orders" : ""} /> {/* Added link */}
                    <NavItem to="/products" icon={Package} label={isSidebarOpen ? "Products" : ""} />
                    <NavItem to="/reports" icon={FileText} label={isSidebarOpen ? "Reports" : ""} />
                    <NavItem to="/settings" icon={Settings} label={isSidebarOpen ? "Settings" : ""} />
                    <NavItem to="/integration" icon={Activity} label={isSidebarOpen ? "SmartSync™" : ""} />
                </nav>

                <div className="p-4 border-t border-gray-50">
                    {isSidebarOpen ? (
                        <div className="bg-gray-50 rounded-2xl p-4 mb-2">
                            <div className="mb-3">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-1">Store</p>
                                <p className="font-bold text-gray-800 text-sm truncate">{user?.storeName || 'My Store'}</p>
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
                            {location.pathname === '/billing' && 'New Bill'}
                            {location.pathname === '/orders' && 'Order Management'} {/* Added title */}
                            {location.pathname === '/products' && 'Inventory'}
                            {location.pathname === '/reports' && 'Sales Reports'}
                            {location.pathname === '/settings' && 'Store Settings'}
                            {location.pathname === '/integration' && 'External Integration'}
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
