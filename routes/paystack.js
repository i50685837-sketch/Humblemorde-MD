const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/initialize", async (req, res) => {

  try {

    const { email, amount } = req.body;

    if (!email || !amount) {
      return res.status(400).json({
        success: false,
        message: "Email and amount are required"
      });
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    if (!process.env.PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Paystack is not configured"
      });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: Math.round(numericAmount * 100),
        currency:
          process.env.PAYSTACK_CURRENCY || "KES",
        callback_url:
          process.env.PAYSTACK_CALLBACK_URL
      },
      {
        headers: {
          Authorization:
            `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      authorization_url:
        response.data.data.authorization_url,
      reference:
        response.data.data.reference
    });

  } catch (error) {

    console.error(
      "Paystack error:",
      error.response?.data || error.message
    );

    res.status(500).json({
      success: false,
      message: "Payment initialization failed"
    });

  }

});

module.exports = router;
