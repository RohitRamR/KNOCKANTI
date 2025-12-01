import { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingCart } from 'lucide-react';

const ProductImage = ({ product, className }) => {
    // Priority: 1. AI Fetched Image (imageUrl), 2. Manual Upload (images[0]), 3. Fallback
    const imageSrc = product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null);

    if (imageSrc) {
        return (
            <img
                src={imageSrc}
                alt={product.name}
                className={className}
                onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/400?text=No+Image'; }}
            />
        );
    }

    return (
        <div className={`bg-gray-100 flex items-center justify-center text-gray-300 ${className}`}>
            <ShoppingCart size={40} />
        </div>
    );
};

export default ProductImage;
