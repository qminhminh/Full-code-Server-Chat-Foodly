const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
    {   
        userID: { type: String, required: true },
        username: { type: String, required: true },
        status: { type: Boolean, required: true },
        phone: { type: String, required: false},
        gender: { type: String, required: false},
        birthday: { type: String, required: false},
        profile: {
            type: String,
            require: true,
        },

    }, { timestamps: true }
);
module.exports = mongoose.model("Profile", ProfileSchema)