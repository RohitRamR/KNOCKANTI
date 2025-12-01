import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Header from './Header';

const Layout = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Toaster position="bottom-center" toastOptions={{
                style: {
                    background: '#333',
                    color: '#fff',
                    borderRadius: '10px',
                },
            }} />
            <footer className="bg-white border-t border-gray-100 py-12 mt-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-brand-primary mb-4">KnockKnock</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">
                                Superfast delivery of groceries, essentials, and more. Delivered in 10 minutes.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4">Company</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-brand-primary">About Us</a></li>
                                <li><a href="#" className="hover:text-brand-primary">Careers</a></li>
                                <li><a href="#" className="hover:text-brand-primary">Blog</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4">Help</h4>
                            <ul className="space-y-2 text-sm text-gray-500">
                                <li><a href="#" className="hover:text-brand-primary">Customer Support</a></li>
                                <li><a href="#" className="hover:text-brand-primary">Terms & Conditions</a></li>
                                <li><a href="#" className="hover:text-brand-primary">Privacy Policy</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-800 mb-4">Social</h4>
                            <div className="flex gap-4">
                                {/* Social Icons placeholders */}
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                                <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-100 pt-8 text-center text-gray-400 text-sm">
                        &copy; {new Date().getFullYear()} KnockKnock. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
