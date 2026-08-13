require("dotenv").config();

const path = require("path");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const AUTH_DIR = path.join(
  __dirname,
  "..",
  process.env.SESSION_DIR || "auth_info"
);

let sock = null;
let starting = false;
let connectionState = "closed";

async function startWhatsApp() {

  if (starting || sock) {
    return sock;
  }

  starting = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({

      auth: state,

      printQRInTerminal: false,

      logger: pino({
        level: "silent"
      }),

      browser: [
        process.env.BOT_NAME || "HUMBLEMORDE-MD",
        "Chrome",
        "1.0.0"
      ]

    });

    sock.ev.on(
      "creds.update",
      saveCreds
    );

    sock.ev.on(
      "connection.update",
      ({ connection, lastDisconnect }) => {

        connectionState =
          connection || connectionState;

        if (connection === "connecting") {

          console.log(
            "⏳ WhatsApp connecting..."
          );

        }

        if (connection === "open") {

          starting = false;

          console.log(
            "✅ WhatsApp connected successfully!"
          );

          console.log(
            `📱 ${sock.user?.id || "Unknown"}`
          );

        }

        if (connection === "close") {

          const code =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "❌ WhatsApp connection closed:",
            code || "unknown"
          );

          sock = null;
          starting = false;
          connectionState = "closed";

          if (
            code !==
            DisconnectReason.loggedOut
          ) {

            setTimeout(
              startWhatsApp,
              3000
            );

          }

        }

      }
    );

    starting = false;

    return sock;

  } catch (error) {

    sock = null;
    starting = false;
    connectionState = "closed";

    console.error(
      "❌ Baileys error:",
      error.message
    );

    return null;
  }
}

function getSocket() {
  return sock;
}

function getConnectionState() {
  return connectionState;
}

module.exports = {
  startWhatsApp,
  getSocket,
  getConnectionState
};
