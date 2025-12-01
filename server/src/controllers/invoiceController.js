const PDFDocument = require('pdfkit');
const Order = require('../models/Order');
const fs = require('fs');
const path = require('path');

// @desc    Generate and download invoice PDF
// @route   GET /api/invoices/:orderId
// @access  Private (Retailer or Customer)
const downloadInvoice = async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('customer', 'name phone email')
            .populate('retailer', 'storeName address gstin')
            .populate('items.product', 'name price');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Authorization check
        const isRetailer = req.user.role === 'RETAILER' && order.retailer._id.toString() === req.user.retailerProfile.toString();
        const isCustomer = req.user.role === 'CUSTOMER' && order.customer._id.toString() === req.user._id.toString();
        const isAdmin = req.user.role === 'ADMIN';

        if (!isRetailer && !isCustomer && !isAdmin) {
            return res.status(403).json({ message: 'Not authorized to view this invoice' });
        }

        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${order._id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(20).text('INVOICE', { align: 'center' });
        doc.moveDown();

        // Store Info
        doc.fontSize(12).font('Helvetica-Bold').text(order.retailer.storeName);
        doc.font('Helvetica').fontSize(10).text(order.retailer.address?.street || 'Store Address');
        if (order.retailer.gstin) {
            doc.text(`GSTIN: ${order.retailer.gstin}`);
        }
        doc.moveDown();

        // Customer Info
        doc.font('Helvetica-Bold').text('Bill To:');
        doc.font('Helvetica').text(order.customer?.name || 'Walk-in Customer');
        doc.text(order.customer?.phone || '');
        doc.moveDown();

        // Order Details
        doc.text(`Order ID: #${order._id.toString().slice(-6).toUpperCase()}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
        doc.text(`Payment Method: ${order.paymentMethod}`);
        doc.moveDown();

        // Table Header
        const tableTop = 250;
        doc.font('Helvetica-Bold');
        doc.text('Item', 50, tableTop);
        doc.text('Qty', 300, tableTop);
        doc.text('Price', 350, tableTop);
        doc.text('Total', 450, tableTop);

        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        // Items
        let y = tableTop + 25;
        doc.font('Helvetica');

        order.items.forEach(item => {
            const itemTotal = item.price * item.quantity;
            doc.text(item.name, 50, y);
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`₹${item.price}`, 350, y);
            doc.text(`₹${itemTotal}`, 450, y);
            y += 20;
        });

        doc.moveTo(50, y).lineTo(550, y).stroke();
        y += 10;

        // Total
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 350, y);

        // Footer
        doc.fontSize(10).font('Helvetica').text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error generating invoice' });
    }
};

module.exports = {
    downloadInvoice
};
