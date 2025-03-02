import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true,
  },
  serialNumber: {
    type: Number,
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  inputImageUrls: [
    {
      type: String,
    },
  ],
  outputImageUrls: [
    {
      type: String,
    },
  ],
  processed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Product = mongoose.model("Product", ProductSchema);
