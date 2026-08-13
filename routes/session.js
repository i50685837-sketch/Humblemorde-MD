const express = require("express");
const fs = require("fs");
const path = require("path");

const {
  startWhatsApp,
  getSocket,
  getConnectionState
} = require("../lib/connection");

const router = express.Router();

const SESSION_DIR = path.join(
  __dirname,
  "..",
  process.env.SESSION_DIR || "session"
);

const sleep = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));


// =====================================================
// GENERATE PAIRING CODE
// POST /api/session/pair
// =====================================================

router.post("/pair", async (req, res) => {

  try {

    let { phone } = req.body;

    if (!phone) {

      return res.status(400).json({
        success: false,
        message: "WhatsApp number is required."
      });

    }

    // Remove +, spaces, -, etc.
    phone = String(phone).replace(/\D/g, "");

    if (
      phone.length < 10 ||
      phone.length > 15
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Use international format, e.g. 2547XXXXXXXX."
      });

    }

    console.log(
      `📱 Session pairing request: ${phone}`
    );


    let sock = getSocket();

    // Start WhatsApp if it isn't running
    if (!sock) {

      await startWhatsApp();

    }


    // Wait for Baileys socket
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
          "WhatsApp connection is still starting. Try again shortly."
      });

    }


    // Already authenticated
    if (sock.user) {

      return res.status(409).json({
        success: false,
        message:
          "This WhatsApp session is already connected."
      });

    }


    console.log(
      "🔐 Requesting WhatsApp pairing code..."
    );


    const code =
      await sock.requestPairingCode(phone);


    console.log(
      `✅ Pairing code generated: ${code}`
    );


    return res.json({

      success: true,

      bot:
        process.env.BOT_NAME ||
        "HUMBLEMORDE-MD",

      code,

      phone,

      state:
        getConnectionState(),

      message:
        "Pairing code generated successfully."

    });


  } catch (error) {

    console.error(
      "❌ Session pairing error:",
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


// =====================================================
// SESSION STATUS
// GET /api/session/status
// =====================================================

router.get("/status", (req, res) => {

  try {

    const sock = getSocket();

    const sessionExists =
      fs.existsSync(SESSION_DIR);

    res.json({

      success: true,

      bot:
        process.env.BOT_NAME ||
        "HUMBLEMORDE-MD",

      connected:
        Boolean(sock?.user),

      state:
        getConnectionState(),

      sessionExists,

      phone:
        sock?.user?.id
          ? sock.user.id.split(":")[0]
          : null

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

});


// =====================================================
// LOGOUT
// POST /api/session/logout
// =====================================================

router.post("/logout", async (req, res) => {

  try {

    const sock = getSocket();

    if (!sock) {

      return res.status(400).json({

        success: false,

        message:
          "WhatsApp is not connected."

      });

    }


    await sock.logout();


    res.json({

      success: true,

      message:
        "WhatsApp session logged out."

    });


  } catch (error) {

    console.error(
      "❌ Logout error:",
      error.message
    );

    res.status(500).json({

      success: false,

      message:
        "Failed to logout session."

    });

  }

});


// =====================================================
// RECONNECT
// POST /api/session/reconnect
// =====================================================

router.post("/reconnect", async (req, res) => {

  try {

    await startWhatsApp();

    res.json({

      success: true,

      message:
        "WhatsApp reconnect requested."

    });

  } catch (error) {

    console.error(
      "❌ Reconnect error:",
      error.message
    );

    res.status(500).json({

      success: false,

      message:
        error.message

    });

  }

});


module.exports = router;
