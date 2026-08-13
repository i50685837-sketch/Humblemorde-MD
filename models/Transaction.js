const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    amount: {
      type: Number,
      required: true,
      min: 0
    },

    currency: {
      type: String,
      default: "KES"
    },

    type: {
      type: String,
      enum: [
        "deposit",
        "withdrawal",
        "payment"
      ],
      default: "deposit"
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

    provider: {
      type: String,
      default: "paystack"
    },

    providerData: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model(
  "Transaction",
  transactionSchema
);
