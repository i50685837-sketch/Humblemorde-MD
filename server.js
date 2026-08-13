require("dotenv").config();

const express = require("express");
const path = require("path");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();

const PORT = process.env.PORT || 3000;

const AUTH_DIR = path.join(__dirname, "auth_info");

let sock = null;
let connecting = false;
let pairingInProgress = false;


// ===============================
// EXPRESS CONFIG
// ===============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));


// ===============================
// HOME
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


// ===============================
// SERVER STATUS
// ===============================

app.get("/api/status", (req, res) => {

  res.json({
    status: "online",
    bot: "HUMBLEMORDE-MD",
    engine: "Baileys",
    connected: !!sock?.user,
    uptime: process.uptime()
  });

});


// ===============================
// BAILEYS CONNECTION
// ===============================

async function startWhatsApp() {

  if (connecting) return;

  connecting = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);

    const { version } = await fetchLatestBaileysVersion();

    console.log("=================================");
    console.log("   HUMBLEMORDE-MD");
    console.log("   Starting WhatsApp...");
    console.log("=================================");

    sock = makeWASocket({

      version,

      auth: state,

      printQRInTerminal: false,

      logger: pino({
        level: "silent"
      }),

      browser: [
        "HUMBLEMORDE-MD",
        "Chrome",
        "1.0.0"
      ],

      generateHighQualityLinkPreview: true

    });


    // =============================
    // SAVE SESSION
    // =============================

    sock.ev.on("creds.update", saveCreds);


    // =============================
    // CONNECTION UPDATE
    // =============================

    sock.ev.on("connection.update", async (update) => {

      const {
        connection,
        lastDisconnect
      } = update;


      if (connection === "connecting") {

        console.log("⏳ Connecting to WhatsApp...");

      }


      if (connection === "open") {

        connecting = false;

        console.log("");
        console.log("=================================");
        console.log("✅ HUMBLEMORDE-MD CONNECTED");
        console.log("=================================");

        if (sock.user) {

          console.log(
            "📱 Number:",
            sock.user.id.split(":")[0]
          );

        }

      }


      if (connection === "close") {

        connecting = false;

        const statusCode =
          lastDisconnect?.error?.output?.statusCode;

        const shouldReconnect =
          statusCode !== DisconnectReason.loggedOut;

        console.log("❌ WhatsApp connection closed");

        if (shouldReconnect) {

          console.log("🔄 Reconnecting...");

          setTimeout(() => {
            startWhatsApp();
          }, 3000);

        } else {

          console.log(
            "⚠️ Session logged out. Delete auth_info and pair again."
          );

        }

      }

    });


    // =============================
    // MESSAGE HANDLER
    // =============================

    sock.ev.on("messages.upsert", async ({ messages }) => {

      try {

        const msg = messages[0];

        if (!msg || msg.key.fromMe) return;

        if (!msg.message) return;

        const jid = msg.key.remoteJid;

        if (!jid) return;

        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          "";

        if (!text) return;

        const command = text.trim().toLowerCase();


        // -------------------------
        // PING
        // -------------------------

        if (command === ".ping") {

          await sock.sendMessage(jid, {
            text: "🏓 Pong!\n\n🤖 HUMBLEMORDE-MD\n⚡ Bot is online."
          });

        }


        // -------------------------
        // MENU
        // -------------------------

        else if (
          command === ".menu" ||
          command === ".help"
        ) {

          const menu = `
╭──────────────╮
   🤖 HUMBLEMORDE-MD
╰──────────────╯

👋 Welcome!

┌─── COMMANDS ───┐
│
│ ⚡ .ping
│ 📋 .menu
│ ℹ️ .help
│
└────────────────┘

🔥 Powered by Baileys
`;

          await sock.sendMessage(jid, {
            text: menu
          });

        }

      } catch (error) {

        console.error(
          "Message handler error:",
          error.message
        );

      }

    });

  } catch (error) {

    connecting = false;

    console.error(
      "❌ Baileys startup error:",
      error
    );

    setTimeout(() => {
      startWhatsApp();
    }, 5000);

  }

}


// ===============================
// PAIRING API
// ===============================

app.post("/api/pair", async (req, res) => {

  try {

    let { phone } = req.body;

    if (!phone) {

      return res.status(400).json({
        message: "WhatsApp number is required."
      });

    }


    // Remove spaces, + and other formatting
    phone = phone.replace(/\D/g, "");


    if (phone.length < 10 || phone.length > 15) {

      return res.status(400).json({
        message: "Enter a valid international WhatsApp number."
      });

    }


    if (pairingInProgress) {

      return res.status(429).json({
        message:
          "A pairing request is already being processed. Please wait."
      });

    }


    pairingInProgress = true;


    // Start Baileys if necessary
    if (!sock) {

      await startWhatsApp();

    }


    // Give the socket a moment to initialize
    let attempts = 0;

    while (!sock && attempts < 20) {

      await new Promise(resolve =>
        setTimeout(resolve, 500)
      );

      attempts++;

    }


    if (!sock) {

      pairingInProgress = false;

      return res.status(503).json({
        message:
          "WhatsApp connection is not ready. Try again."
      });

    }


    // Already paired
    if (sock.user) {

      pairingInProgress = false;

      return res.status(409).json({
        message:
          "This bot is already connected to WhatsApp."
      });

    }


    console.log(
      `📱 Pairing request: ${phone}`
    );


    // Baileys pairing code
    const code =
      await sock.requestPairingCode(phone);


    pairingInProgress = false;


    console.log(
      `🔑 Pairing code generated: ${code}`
    );


    return res.json({

      success: true,

      code: code,

      bot: "HUMBLEMORDE-MD",

      message:
        "Enter this code in WhatsApp Linked Devices."

    });


  } catch (error) {

    pairingInProgress = false;

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


// ===============================
// HEALTH CHECK
// ===============================

app.get("/health", (req, res) => {

  res.json({

    ok: true,

    bot: "HUMBLEMORDE-MD",

    whatsapp:
      sock?.user
        ? "connected"
        : "disconnected",

    uptime:
      Math.floor(process.uptime())

  });

});


// ===============================
// 404
// ===============================

app.use((req, res) => {

  res.status(404).json({
    error: "Route not found"
  });

});


// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

  console.log("");
  console.log("=================================");
  console.log("      HUMBLEMORDE-MD SERVER");
  console.log("=================================");
  console.log(`🌐 Port: ${PORT}`);
  console.log(`📂 Public: ${path.join(__dirname, "public")}`);
  console.log("🤖 Starting WhatsApp...");
  console.log("=================================");
  console.log("");

  startWhatsApp();

});
