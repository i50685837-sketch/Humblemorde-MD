const express = require("express");

const {
  startWhatsApp,
  getSocket
} = require("../lib/connection");

const router = express.Router();

function sleep(ms) {
  return new Promise(
    resolve => setTimeout(resolve, ms)
  );
}


router.post("/", async (req, res) => {

  try {

    let { phone } = req.body;

    if (!phone) {

      return res.status(400).json({
        success: false,
        message:
          "WhatsApp number is required."
      });

    }

    phone =
      String(phone)
        .replace(/\D/g, "");


    if (
      phone.length < 10 ||
      phone.length > 15
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Invalid international phone number."
      });

    }


    console.log(
      `📱 Pairing request: ${phone}`
    );


    // Start Baileys if necessary

    let sock = getSocket();

    if (!sock) {

      console.log(
        "🚀 Starting WhatsApp..."
      );

      await startWhatsApp();

    }


    // Wait for socket

    let attempts = 0;

    while (
      !getSocket() &&
      attempts < 30
    ) {

      await sleep(500);

      attempts++;

    }


    sock = getSocket();


    if (!sock) {

      return res.status(503).json({

        success: false,

        message:
          "WhatsApp is still starting. Try again in a few seconds."

      });

    }


    // If already paired

    if (sock.user) {

      return res.status(409).json({

        success: false,

        message:
          "This bot is already connected to WhatsApp."

      });

    }


    console.log(
      "🔑 Generating pairing code..."
    );


    const code =
      await sock.requestPairingCode(
        phone
      );


    console.log(
      `✅ Pairing code generated: ${code}`
    );


    return res.json({

      success: true,

      bot:
        process.env.BOT_NAME ||
        "HUMBLEMORDE-MD",

      code,

      message:
        "Pairing code generated successfully."

    });


  } catch (error) {

    console.error(
      "❌ Pairing error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to generate pairing code."

    });

  }

});


module.exports = router;
