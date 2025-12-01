import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Package, Edit, Trash2 } from 'lucide-react';

import io from 'socket.io-client';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        brand: '',
        description: '',
        price: '',
        stockQuantity: '',
        category: '',
        subCategory: '',
        sku: '',
        barcode: '',
        images: []
    });
    const [loading, setLoading] = useState(false);
    const [isSearchingImage, setIsSearchingImage] = useState(false);

    useEffect(() => {
        fetchProducts();

        const socket = io('http://localhost:5002');

        socket.on('connect', () => {
            console.log('Products connected to socket', socket.id);
        });

        socket.on('orderPlaced', (data) => {
            console.log('Order placed event received', data);
            fetchProducts();
        });
        socket.on('stockUpdate', (data) => {
            console.log('Stock update event received', data);
            fetchProducts();
        });
        socket.on('productUpdate', (data) => {
            console.log('Product update event received', data);
            fetchProducts();
        });
        socket.on('productImageUpdate', (data) => {
            console.log('Product image update event received', data);
            fetchProducts();
        });

        return () => socket.disconnect();
    }, []);

    // Debounced Auto-Image Search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.name && (!formData.images || formData.images.length === 0 || !formData.images[0]) && isModalOpen) {
                setIsSearchingImage(true);
                try {
                    const res = await axios.get(`/integrations/product-search?query=${encodeURIComponent(formData.name)}`);
                    if (res.data && res.data.length > 0) {
                        const imageUrl = res.data[0].image;
                        if (imageUrl) {
                            setFormData(prev => ({ ...prev, images: [imageUrl] }));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching image from web', error);
                } finally {
                    setIsSearchingImage(false);
                }
            }
        }, 1000); // 1 second debounce

        return () => clearTimeout(timer);
    }, [formData.name, isModalOpen]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get('/retailer/products');
            setProducts(res.data);
        } catch (error) {
            console.error('Error fetching products', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (product) => {
        setFormData({
            _id: product._id,
            name: product.name,
            brand: product.brand || '',
            description: product.description || '',
            price: product.price,
            stockQuantity: product.stockQuantity,
            category: product.category,
            subCategory: product.subCategory || '',
            sku: product.sku || '',
            barcode: product.barcode || '',
            images: product.images || []
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            try {
                await axios.delete(`/retailer/products/${id}`);
                fetchProducts();
                alert('Product deleted successfully');
            } catch (error) {
                alert('Error deleting product');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const data = new FormData();
            data.append('name', formData.name);
            data.append('brand', formData.brand);
            data.append('description', formData.description);
            data.append('price', formData.price);
            data.append('stockQuantity', formData.stockQuantity);
            data.append('category', formData.category);
            data.append('subCategory', formData.subCategory || '');
            data.append('sku', formData.sku || '');
            data.append('barcode', formData.barcode || '');

            // Append images array if exists
            if (formData.images && formData.images.length > 0) {
                formData.images.forEach(img => data.append('images', img));
            }

            // Append file if selected
            if (formData.file) {
                data.append('images', formData.file);
            }

            if (formData._id) {
                await axios.put(`/retailer/products/${formData._id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Product updated successfully!');
            } else {
                await axios.post('/retailer/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                alert('Product added successfully!');
            }
            fetchProducts();
            setIsModalOpen(false);
            setFormData({
                name: '',
                brand: '',
                description: '',
                price: '',
                stockQuantity: '',
                category: '',
                sku: '',
                barcode: '',
                images: [],
                file: null
            });
        } catch (error) {
            console.error(error);
            alert('Error saving product');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 tracking-tight">Product Management</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your inventory and pricing.</p>
                </div>
                <button
                    onClick={() => {
                        setFormData({
                            name: '',
                            brand: '',
                            description: '',
                            price: '',
                            stockQuantity: '',
                            category: '',
                            sku: '',
                            barcode: '',
                            images: []
                        });
                        setIsModalOpen(true);
                    }}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200"
                >
                    <Plus size={20} /> Add Product
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">SKU</th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {products.map((product) => (
                            <tr key={product._id} className="hover:bg-gray-50 transition">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 overflow-hidden relative">
                                            {product.imageStatus === 'pending' ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            ) : product.imageUrl ? (
                                                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                                            ) : product.images && product.images.length > 0 ? (
                                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={20} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-800">{product.name}</div>
                                            <div className="text-xs text-gray-500">{product.brand}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4 text-sm text-gray-600">{product.category}</td>
                                <td className="p-4 font-bold text-gray-800">₹{product.price}</td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${product.stockQuantity > 10 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {product.stockQuantity} Units
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-gray-500 font-mono">{product.sku}</td>
                                <td className="p-4">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(product)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(product._id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {products.length === 0 && (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No products found. Add your first product!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 m-4">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">{formData._id ? 'Edit Product' : 'Add New Product'}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                    placeholder="e.g. Amul Butter 500g"
                                    required
                                    onBlur={async () => {
                                        if (formData.name && (!formData.images || formData.images.length === 0 || !formData.images[0])) {
                                            try {
                                                const res = await axios.get(`/integrations/product-search?query=${encodeURIComponent(formData.name)}`);
                                                if (res.data && res.data.length > 0) {
                                                    const imageUrl = res.data[0].image;
                                                    if (imageUrl) {
                                                        setFormData(prev => ({ ...prev, images: [imageUrl] }));
                                                    }
                                                }
                                            } catch (error) {
                                                console.error('Error fetching image from web', error);
                                            }
                                        }
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Brand</label>
                                <input
                                    type="text"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                    placeholder="e.g. Amul, Nestle"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Price (₹)</label>
                                    <input
                                        type="number"
                                        name="price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        placeholder="0.00"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Stock</label>
                                    <input
                                        type="number"
                                        name="stockQuantity"
                                        value={formData.stockQuantity}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        placeholder="0"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="Drinks">Drinks</option>
                                        <option value="Snacks">Snacks</option>
                                        <option value="Dairy">Dairy</option>
                                        <option value="Essentials">Essentials</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Medicines">Medicines</option>
                                        <option value="Groceries">Groceries</option>
                                        <option value="Fruits & Veg">Fruits & Veg</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Sub Category</label>
                                    <input
                                        type="text"
                                        name="subCategory"
                                        value={formData.subCategory || ''}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        placeholder="e.g. Tablets, Syrups, Mobile"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">SKU</label>
                                    <input
                                        type="text"
                                        name="sku"
                                        value={formData.sku}
                                        onChange={handleChange}
                                        className="w-full p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        placeholder="SKU-123"
                                    />
                                </div>
                            </div>

                            {/* Image Upload Section */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Product Image</label>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="file"
                                        name="file"
                                        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                        accept="image/*"
                                    />
                                </div>
                                <div className="text-center text-xs text-gray-400 mb-2">- OR -</div>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        name="image"
                                        value={formData.images?.[0] || ''}
                                        onChange={(e) => setFormData({ ...formData, images: [e.target.value] })}
                                        className="flex-1 p-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-200 outline-none"
                                        placeholder="Image URL"
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!formData.name) {
                                                alert('Please enter a product name first');
                                                return;
                                            }
                                            setIsSearchingImage(true);
                                            try {
                                                const res = await axios.get(`/integrations/product-search?query=${encodeURIComponent(formData.name)}`);
                                                if (res.data && res.data.length > 0) {
                                                    const imageUrl = res.data[0].image;
                                                    if (imageUrl) {
                                                        setFormData({ ...formData, images: [imageUrl] });
                                                    } else {
                                                        alert('No image found for this product on the web.');
                                                    }
                                                } else {
                                                    alert('No products found on the web.');
                                                }
                                            } catch (error) {
                                                alert('Error searching for image.');
                                            } finally {
                                                setIsSearchingImage(false);
                                            }
                                        }}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-blue-700 transition flex items-center gap-2"
                                        disabled={isSearchingImage}
                                    >
                                        {isSearchingImage ? 'Searching...' : '🌐 Web Search'}
                                    </button>
                                </div>
                                {isSearchingImage ? (
                                    <div className="w-full h-48 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-200 border-dashed animate-pulse">
                                        <div className="text-center">
                                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                            <p className="text-xs text-gray-500 font-medium">Finding best image...</p>
                                        </div>
                                    </div>
                                ) : formData.file ? (
                                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                                        <img src={URL.createObjectURL(formData.file)} alt="Preview" className="h-full object-contain" />
                                    </div>
                                ) : formData.images?.[0] ? (
                                    <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center border border-gray-200">
                                        <img src={formData.images[0]} alt="Preview" className="h-full object-contain" />
                                    </div>
                                ) : null}
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition shadow-lg shadow-green-200 mt-4"
                            >
                                {loading ? 'Saving...' : (formData._id ? 'Update Product' : 'Save Product')}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
