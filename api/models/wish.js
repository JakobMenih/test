const mongoose = require("mongoose");

const WishSchema = new mongoose.Schema({
  user: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  phone: { type: mongoose.SchemaTypes.ObjectId, ref: "Phone" },
  createdAt: {
    type: Date,
    immutable: true,
    default: () => Date.now(),
  },
  notified: { type: Boolean, default: false },
});

module.exports = mongoose.model("Wish", WishSchema);
