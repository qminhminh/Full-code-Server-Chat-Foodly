const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant',default: null },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',default: null },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    message: { type: String, required: true },
    sender: { type: String, required: true },
    isRead: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
