const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    amount: {
      type: Number,
      required: true
    },

    currency: {
      type: String,
      default: "KES"
    },

    status: {
      type: String,
      enum: [
        "pending",
        "success",
        "failed"
      ],
      default: "pending"
    },

    channel: {
      type: String,
      default: null
    },

    paidAt: {
      type: Date,
      default: null
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Payment",
  paymentSchema
);
