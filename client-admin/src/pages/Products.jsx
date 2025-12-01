import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Plus, Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Badge, Button } from '../components/ui/Components';
import toast from 'react-hot-toast';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState('ALL');
    const [search, setSearch] = useState('');
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [uploadFiles, setUploadFiles] = useState([]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/admin/products', {
                params: { page, category: categoryFilter, search }
            });
            setProducts(res.data.products);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            toast.error('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, categoryFilter]);

    const handleSearch = (e) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    const handleFileChange = (e) => {
        setUploadFiles(Array.from(e.target.files));
    };

    const handleUpload = async () => {
        if (!selectedProduct || uploadFiles.length === 0) return;

        // Admin product upload is not yet implemented in the backend
        toast('Product image upload for Admin is coming soon!', { icon: '🚧' });
        setShowUploadModal(false);
        setUploadFiles([]);
        setSelectedProduct(null);
    };

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <Card className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <h2 className="text-xl font-bold text-text-primary">Products</h2>
                    <span className="px-3 py-1 rounded-full bg-brand-secondary/10 text-brand-secondary text-xs font-bold">
                        {products.length} Items
                    </span>
                </div>

                <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                    {/* Search */}
                    <form onSubmit={handleSearch} className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Search Product..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-xl border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-brand-primary w-full md:w-64 text-sm text-text-primary placeholder-text-muted transition-all"
                        />
                    </form>

                    {/* Filter */}
                    <div className="relative">
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="pl-4 pr-10 py-2 rounded-xl border border-border bg-bg-primary focus:outline-none focus:ring-2 focus:ring-brand-primary appearance-none text-sm cursor-pointer text-text-primary transition-all"
                        >
                            <option value="ALL">All Categories</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Home">Home</option>
                            <option value="Grocery">Grocery</option>
                        </select>
                        <Filter size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
                    </div>
                </div>
            </Card>

            {/* Products Grid */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-20 text-gray-500">No products found.</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <Card key={product._id} className="group hover:shadow-xl transition-shadow duration-300 p-0 overflow-hidden flex flex-col h-full border border-border">
                            <div className="relative h-48 bg-bg-secondary overflow-hidden">
                                {product.images && product.images.length > 0 ? (
                                    <img
                                        src={`http://localhost:5002${product.images[0]}`}
                                        alt={product.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-text-muted">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => {
                                            setSelectedProduct(product);
                                            setShowUploadModal(true);
                                        }}
                                        className="p-2 bg-white rounded-full text-gray-800 hover:bg-brand-primary hover:text-white transition-colors"
                                        title="Upload Image"
                                    >
                                        <Upload size={18} />
                                    </button>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <Badge variant="default" className="bg-white/90 backdrop-blur-sm text-gray-800">
                                        {product.category}
                                    </Badge>
                                </div>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-text-primary line-clamp-2 text-sm h-10">{product.name}</h3>
                                </div>
                                <p className="text-xs text-text-secondary mb-4 line-clamp-2">{product.description}</p>

                                <div className="mt-auto flex justify-between items-center pt-4 border-t border-border">
                                    <div>
                                        <p className="text-xs text-text-muted">Price</p>
                                        <p className="font-bold text-brand-primary">₹{product.price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-text-muted">Stock</p>
                                        <p className={`font-bold ${product.stock > 10 ? 'text-green-500' : 'text-red-500'}`}>
                                            {product.stock}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-2 text-xs text-text-muted truncate">
                                    Store: {product.retailer?.storeName || 'Unknown'}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && (
                <div className="flex justify-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft size={18} /> Previous
                    </Button>
                    <span className="flex items-center text-sm font-medium text-text-secondary">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next <ChevronRight size={18} />
                    </Button>
                </div>
            )}

            {/* Upload Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-bg-card w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-border"
                        >
                            <div className="p-6 border-b border-border flex justify-between items-center">
                                <h3 className="text-lg font-bold text-text-primary">Upload Product Image</h3>
                                <button onClick={() => setShowUploadModal(false)} className="text-text-muted hover:text-text-primary transition-colors">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                <p className="text-sm text-text-secondary">
                                    Upload new images for <span className="font-bold">{selectedProduct?.name}</span>
                                </p>

                                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-brand-primary transition-colors cursor-pointer relative bg-bg-primary">
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click or drag images here</p>
                                </div>

                                {uploadFiles.length > 0 && (
                                    <div className="text-sm text-green-500 font-medium">
                                        {uploadFiles.length} file(s) selected
                                    </div>
                                )}

                                <div className="flex justify-end gap-3 mt-4">
                                    <Button variant="ghost" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                                    <Button variant="primary" onClick={handleUpload}>Upload</Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Products;
