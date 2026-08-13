const express = require("express");

const {
  startWhatsApp,
  getSocket,
  getConnectionState
} = require("../lib/connection");

const router = express.Router();

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms));

router.post("/", async (req, res) => {

  try {

    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Enter your WhatsApp number."
      });
    }

    // Remove +, spaces and other characters
    phone = String(phone).replace(/\D/g, "");

    if (
      phone.length < 10 ||
      phone.length > 15
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Use international format, for example 2547XXXXXXXX."
      });
    }

    console.log(
      `📱 Pairing requested for ${phone}`
    );

    let sock = getSocket();

    if (!sock) {

      await startWhatsApp();

    }

    // Give Baileys time to initialize
    let tries = 0;

    while (
      !getSocket() &&
      tries < 30
    ) {

      await sleep(500);
      tries++;

    }

    sock = getSocket();

    if (!sock) {

      return res.status(503).json({
        success: false,
        message:
          "WhatsApp connection is still starting. Try again shortly."
      });

    }

    if (sock.user) {

      return res.status(409).json({
        success: false,
        message:
          "This session is already linked to WhatsApp."
      });

    }

    console.log(
      "🔐 Requesting WhatsApp pairing code..."
    );

    /*
     * Important:
     * requestPairingCode expects the number
     * without + or spaces.
     */

    const code =
      await sock.requestPairingCode(phone);

    console.log(
      `🔑 Pairing code: ${code}`
    );

    res.json({
      success: true,
      bot:
        process.env.BOT_NAME ||
        "HUMBLEMORDE-MD",
      code,
      state: getConnectionState(),
      message:
        "Enter this code in WhatsApp Linked Devices."
    });

  } catch (error) {

    console.error(
      "❌ Pairing error:",
      error.message
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Could not generate pairing code."
    });

  }

});

module.exports = router;
