const express = require("express");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "WhatsApp number is required"
      });
    }

    phone = phone.replace(/\D/g, "");

    if (phone.length < 10 || phone.length > 15) {
      return res.status(400).json({
        success: false,
        message: "Invalid WhatsApp number"
      });
    }

    if (!global.sock) {
      return res.status(503).json({
        success: false,
        message: "WhatsApp connection is not ready"
      });
    }

    if (global.sock.user) {
      return res.status(409).json({
        success: false,
        message: "Bot is already connected"
      });
    }

    const code =
      await global.sock.requestPairingCode(phone);

    res.json({
      success: true,
      bot: process.env.BOT_NAME || "HUMBLEMORDE-MD",
      code
    });

  } catch (error) {

    console.error("Pairing error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate pairing code"
    });

  }
});

module.exports = router;
