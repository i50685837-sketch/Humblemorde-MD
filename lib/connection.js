const path = require("path");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const AUTH_DIR = path.join(
  __dirname,
  "..",
  process.env.SESSION_DIR || "auth_info"
);

let sock = null;
let starting = false;

async function startWhatsApp() {

  if (starting) return sock;

  starting = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(AUTH_DIR);

    const { version } =
      await fetchLatestBaileysVersion();

    sock = makeWASocket({

      version,

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
      async (update) => {

        const {
          connection,
          lastDisconnect
        } = update;

        if (connection === "connecting") {
          console.log(
            "⏳ Connecting WhatsApp..."
          );
        }

        if (connection === "open") {

          starting = false;

          console.log(
            "✅ HUMBLEMORDE-MD connected"
          );

        }

        if (connection === "close") {

          starting = false;

          const statusCode =
            lastDisconnect?.error
              ?.output?.statusCode;

          const shouldReconnect =
            statusCode !==
            DisconnectReason.loggedOut;

          sock = null;

          if (shouldReconnect) {

            console.log(
              "🔄 Reconnecting WhatsApp..."
            );

            setTimeout(
              startWhatsApp,
              3000
            );

          } else {

            console.log(
              "⚠️ WhatsApp logged out"
            );

          }

        }

      }
    );

    return sock;

  } catch (error) {

    starting = false;

    console.error(
      "❌ Baileys error:",
      error.message
    );

    setTimeout(
      startWhatsApp,
      5000
    );

    return null;
  }
}

function getSocket() {
  return sock;
}

module.exports = {
  startWhatsApp,
  getSocket
};
