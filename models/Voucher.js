const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    discount: {type: Number, required: true},
    addVoucherSwitch: {type: Boolean , required: true, default: false},
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
});

module.exports = mongoose.model('Voucher', voucherSchema);
