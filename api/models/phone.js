const mongoose = require("mongoose");

const PhoneSchema = new mongoose.Schema({
  brand: String,
  model: String,
  fullname: String,
  urlSuffix: String,
  image: String,
  specs: Array,
  visits: {
    type: Number,
    default: 1,
  },
  wishes: [{ type: mongoose.SchemaTypes.ObjectId, ref: "Wish" }],
  stock: Number,
  price: Number,
});

module.exports = mongoose.model("Phone", PhoneSchema);
