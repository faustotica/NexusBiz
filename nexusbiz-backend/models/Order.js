const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    clientName: { type: String, required: true },
    products: [
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true }
    }
    ],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: ['Pendiente', 'Completado', 'Cancelado'], default: 'Completado' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);