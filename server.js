require("dotenv").config();

const express = require("express");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");
const pino = require("pino");
const mongoose = require("mongoose");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_NAME = process.env.BOT_NAME || "HUMBLEMORDE-MD";

const AUTH_DIR = path.join(
  __dirname,
  process.env.SESSION_DIR || "auth_info"
);

let sock = null;
let startingBot = false;
let pairingInProgress = false;


// ==================================================
// MIDDLEWARE
// ==================================================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));


// ==================================================
// MONGODB
// ==================================================

async function connectDatabase() {

  if (!process.env.MONGO_URI) {
    console.log("⚠️ MONGO_URI not configured.");
    return;
  }

  try {

    await mongoose.connect(process.env.MONGO_URI);

    console.log("✅ MongoDB Connected");

  } catch (error) {

    console.error(
      "❌ MongoDB Error:",
      error.message
    );

  }
}


// ==================================================
// HOME
// ==================================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(__dirname, "public", "index.html")
  );

});


// ==================================================
// SERVER STATUS
// ==================================================

app.get("/api/status", (req, res) => {

  res.json({

    success: true,

    status: "online",

    bot: BOT_NAME,

    whatsapp:
      sock?.user
        ? "connected"
        : "disconnected",

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

    uptime: Math.floor(process.uptime())

  });

});


// ==================================================
// BAILEYS
// ==================================================

async function startWhatsApp() {

  if (startingBot) return;

  startingBot = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);

    const { version } =
      await fetchLatestBaileysVersion();

    console.log("================================");
    console.log(`🤖 ${BOT_NAME}`);
    console.log("📱 Starting WhatsApp...");
    console.log("================================");


    sock = makeWASocket({

      version,

      auth: state,

      printQRInTerminal: false,

      logger: pino({
        level: "silent"
      }),

      browser: [
        BOT_NAME,
        "Chrome",
        "1.0.0"
      ],

      generateHighQualityLinkPreview: true

    });


    // ----------------------------------------------
    // SAVE AUTHENTICATION
    // ----------------------------------------------

    sock.ev.on(
      "creds.update",
      saveCreds
    );


    // ----------------------------------------------
    // CONNECTION
    // ----------------------------------------------

    sock.ev.on(
      "connection.update",
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;


        if (connection === "connecting") {

          console.log(
            "⏳ Connecting to WhatsApp..."
          );

        }


        if (connection === "open") {

          startingBot = false;

          console.log("");
          console.log(
            "✅ HUMBLEMORDE-MD CONNECTED"
          );
          console.log("");

        }


        if (connection === "close") {

          startingBot = false;

          const statusCode =
            lastDisconnect?.error
              ?.output?.statusCode;

          const reconnect =
            statusCode !==
            DisconnectReason.loggedOut;


          console.log(
            "❌ WhatsApp connection closed"
          );


          if (reconnect) {

            console.log(
              "🔄 Reconnecting..."
            );

            setTimeout(
              startWhatsApp,
              3000
            );

          } else {

            console.log(
              "⚠️ WhatsApp session logged out."
            );

          }

        }

      }
    );


    // ----------------------------------------------
    // MESSAGE HANDLER
    // ----------------------------------------------

    sock.ev.on(
      "messages.upsert",
      async ({ messages }) => {

        try {

          const msg = messages[0];

          if (!msg) return;

          if (msg.key.fromMe) return;

          if (!msg.message) return;

          const jid =
            msg.key.remoteJid;

          if (!jid) return;


          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage
              ?.text ||
            "";


          if (!text) return;


          const command =
            text.trim().toLowerCase();


          // ==============================
          // PING
          // ==============================

          if (command === ".ping") {

            await sock.sendMessage(
              jid,
              {
                text:
`🏓 PONG!

🤖 ${BOT_NAME}
⚡ Bot Online
🚀 Node.js + Baileys`
              }
            );

          }


          // ==============================
          // MENU
          // ==============================

          else if (
            command === ".menu" ||
            command === ".help"
          ) {

            await sock.sendMessage(
              jid,
              {
                text:
`╭───────────────╮
   🤖 ${BOT_NAME}
╰───────────────╯

👋 Welcome!

┌── COMMANDS ──┐
│
│ ⚡ .ping
│ 📋 .menu
│ ℹ️ .help
│
└──────────────┘

🔥 Powered by Baileys`
              }
            );

          }

        } catch (error) {

          console.error(
            "Message error:",
            error.message
          );

        }

      }
    );


  } catch (error) {

    startingBot = false;

    console.error(
      "❌ WhatsApp startup error:",
      error.message
    );

    setTimeout(
      startWhatsApp,
      5000
    );

  }

}


// ==================================================
// WHATSAPP PAIRING
// ==================================================

app.post(
  "/api/pair",
  async (req, res) => {

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
        phone.replace(/\D/g, "");


      if (
        phone.length < 10 ||
        phone.length > 15
      ) {

        return res.status(400).json({
          success: false,
          message:
            "Enter a valid international number."
        });

      }


      if (pairingInProgress) {

        return res.status(429).json({
          success: false,
          message:
            "Pairing request already in progress."
        });

      }


      pairingInProgress = true;


      if (!sock) {

        await startWhatsApp();

      }


      let attempts = 0;

      while (
        !sock &&
        attempts < 20
      ) {

        await new Promise(
          resolve =>
            setTimeout(resolve, 500)
        );

        attempts++;

      }


      if (!sock) {

        pairingInProgress = false;

        return res.status(503).json({
          success: false,
          message:
            "WhatsApp is not ready."
        });

      }


      if (sock.user) {

        pairingInProgress = false;

        return res.status(409).json({
          success: false,
          message:
            "Bot is already connected."
        });

      }


      console.log(
        `📱 Pairing request: ${phone}`
      );


      const code =
        await sock.requestPairingCode(
          phone
        );


      pairingInProgress = false;


      console.log(
        `🔑 Pairing code: ${code}`
      );


      return res.json({

        success: true,

        code,

        bot: BOT_NAME,

        message:
          "Use this code in WhatsApp Linked Devices."

      });


    } catch (error) {

      pairingInProgress = false;

      console.error(
        "❌ Pairing error:",
        error.message
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to generate pairing code."

      });

    }

  }
);


// ==================================================
// PAYSTACK INITIALIZE
// ==================================================

app.post(
  "/api/paystack/initialize",
  async (req, res) => {

    try {

      const {
        email,
        amount
      } = req.body;


      if (!email || !amount) {

        return res.status(400).json({

          success: false,

          message:
            "Email and amount are required."

        });

      }


      if (!process.env.PAYSTACK_SECRET_KEY) {

        return res.status(500).json({

          success: false,

          message:
            "Paystack is not configured."

        });

      }


      const numericAmount =
        Number(amount);


      if (
        !Number.isFinite(numericAmount) ||
        numericAmount <= 0
      ) {

        return res.status(400).json({

          success: false,

          message:
            "Invalid payment amount."

        });

      }


      // Paystack expects the amount
      // in the currency subunit.

      const subunitAmount =
        Math.round(
          numericAmount * 100
        );


      const response =
        await axios.post(

          "https://api.paystack.co/transaction/initialize",

          {
            email,

            amount:
              subunitAmount,

            currency:
              process.env.PAYSTACK_CURRENCY ||
              "KES",

            callback_url:
              process.env.PAYSTACK_CALLBACK_URL

          },

          {

            headers: {

              Authorization:
                `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,

              "Content-Type":
                "application/json"

            }

          }

        );


      return res.json({

        success: true,

        authorization_url:
          response.data.data
            .authorization_url,

        reference:
          response.data.data.reference

      });


    } catch (error) {

      console.error(
        "❌ Paystack error:",
        error.response?.data ||
        error.message
      );


      return res.status(500).json({

        success: false,

        message:
          "Payment initialization failed."

      });

    }

  }
);


// ==================================================
// PAYSTACK WEBHOOK
// ==================================================

app.post(
  "/api/paystack/webhook",
  express.raw({
    type: "application/json"
  }),
  async (req, res) => {

    try {

      const signature =
        req.headers["x-paystack-signature"];


      if (!signature) {

        return res.sendStatus(401);

      }


      const hash =
        crypto
          .createHmac(
            "sha512",
            process.env.PAYSTACK_SECRET_KEY
          )
          .update(req.body)
          .digest("hex");


      if (hash !== signature) {

        return res.sendStatus(401);

      }


      const event =
        JSON.parse(req.body.toString());


      console.log(
        "💳 Paystack event:",
        event.event
      );


      if (
        event.event ===
        "charge.success"
      ) {

        const payment =
          event.data;


        console.log(
          "✅ Payment successful:",
          payment.reference
        );

        // Save/update transaction in MongoDB here.

      }


      return res.sendStatus(200);


    } catch (error) {

      console.error(
        "Webhook error:",
        error.message
      );

      return res.sendStatus(500);

    }

  }
);


// ==================================================
// HEALTH
// ==================================================

app.get(
  "/health",
  (req, res) => {

    res.json({

      ok: true,

      bot: BOT_NAME,

      whatsapp:
        sock?.user
          ? "connected"
          : "disconnected",

      database:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",

      uptime:
        Math.floor(
          process.uptime()
        )

    });

  }
);


// ==================================================
// 404
// ==================================================

app.use(
  (req, res) => {

    res.status(404).json({
      success: false,
      message: "Route not found"
    });

  }
);


// ==================================================
// START
// ==================================================

async function startServer() {

  await connectDatabase();


  app.listen(
    PORT,
    () => {

      console.log("");
      console.log(
        "================================"
      );
      console.log(
        `🤖 ${BOT_NAME}`
      );
      console.log(
        "🚀 SERVER STARTED"
      );
      console.log(
        `🌐 PORT: ${PORT}`
      );
      console.log(
        "💳 PAYSTACK: READY"
      );
      console.log(
        "🗄️ DATABASE: READY"
      );
      console.log(
        "================================"
      );
      console.log("");

      startWhatsApp();

    }
  );

}


startServer();
