require("dotenv").config();

const path = require("path");
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");

const SESSION_DIR = path.join(
  __dirname,
  "..",
  process.env.SESSION_DIR || "session"
);

let sock = null;
let starting = false;
let connectionState = "closed";

async function startWhatsApp() {

  if (starting) {
    return sock;
  }

  starting = true;

  try {

    const {
      state,
      saveCreds
    } = await useMultiFileAuthState(
      SESSION_DIR
    );

    sock = makeWASocket({

      auth: state,

      logger: pino({
        level: "silent"
      }),

      printQRInTerminal: false,

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
            "================================"
          );

          console.log(
            "✅ WHATSAPP CONNECTED"
          );

          console.log(
            `🤖 ${process.env.BOT_NAME || "HUMBLEMORDE-MD"}`
          );

          console.log(
            `📱 ${sock.user?.id || "Unknown"}`
          );

          console.log(
            "================================"
          );

        }


        if (connection === "close") {

          const statusCode =
            lastDisconnect
              ?.error
              ?.output
              ?.statusCode;

          console.log(
            "❌ WhatsApp connection closed"
          );

          console.log(
            "Status:",
            statusCode || "unknown"
          );


          sock = null;
          starting = false;
          connectionState = "closed";


          if (
            statusCode !==
            DisconnectReason.loggedOut
          ) {

            console.log(
              "🔄 Reconnecting..."
            );

            setTimeout(
              startWhatsApp,
              3000
            );

          } else {

            console.log(
              "⚠️ Session logged out."
            );

          }

        }

      }
    );


    starting = false;

    return sock;


  } catch (error) {

    console.error(
      "❌ Baileys startup error:",
      error
    );

    sock = null;
    starting = false;
    connectionState = "closed";

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
