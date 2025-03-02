import mongoose, { Schema } from "mongoose";

const requestSchema = new mongoose.Schema({
  status: {
    type: String,
    default: "pending",
    enum: ["pending", "processing", "completed", "failed"],
  },
  requestId: {
    type: String,
    required: true,
    unique: true,
  },
  webhookUrl: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: {
    type: Date,
  },
  totalImages: {
    type: Number,
    default: 0,
  },
  totalProcessedImages: {
    type: Number,
    default: 0,
  },
  products: [
    {
      type: Schema.Types.ObjectId,
      ref: "Product",
    },
  ],
  outputCsvUrl: {
    type: String,
  },
});

export const Request = mongoose.model("Request", requestSchema);
