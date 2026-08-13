require("dotenv").config();

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const {
  startWhatsApp,
  getSocket
} = require("./lib/connection");

const pairRoutes = require("./routes/pair");
const paystackRoutes = require("./routes/paystack");
const statusRoutes = require("./routes/status");
const userRoutes = require("./routes/user");

const app = express();

const PORT = process.env.PORT || 3000;
const BOT_NAME =
  process.env.BOT_NAME || "HUMBLEMORDE-MD";


// ======================================================
// MIDDLEWARE
// ======================================================

app.use(express.json());
app.use(express.urlencoded({
  extended: true
}));


// ======================================================
// PUBLIC FRONTEND
// ======================================================

const publicPath =
  path.join(__dirname, "public");

app.use(
  express.static(publicPath)
);


// ======================================================
// DATABASE
// ======================================================

async function connectDatabase() {

  if (!process.env.MONGO_URI) {

    console.log(
      "⚠️ MONGO_URI not configured"
    );

    return;

  }

  try {

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB connected"
    );

  } catch (error) {

    console.error(
      "❌ MongoDB connection failed:",
      error.message
    );

  }

}


// ======================================================
// FRONTEND
// ======================================================

app.get("/", (req, res) => {

  res.sendFile(
    path.join(
      publicPath,
      "index.html"
    )
  );

});


// ======================================================
// API ROUTES
// ======================================================

// WhatsApp pairing
app.use(
  "/api/pair",
  pairRoutes
);

// Paystack
app.use(
  "/api/paystack",
  paystackRoutes
);

// Bot/server status
app.use(
  "/api/status",
  statusRoutes
);

// Users
app.use(
  "/api/user",
  userRoutes
);


// ======================================================
// DIRECT BOT STATUS
// ======================================================

app.get("/api/bot", (req, res) => {

  const sock = getSocket();

  res.json({

    success: true,

    bot: BOT_NAME,

    whatsapp:
      sock?.user
        ? "connected"
        : "disconnected",

    number:
      sock?.user?.id
        ? sock.user.id.split(":")[0]
        : null,

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

    uptime:
      Math.floor(
        process.uptime()
      )

  });

});


// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/health", (req, res) => {

  const sock = getSocket();

  res.json({

    status: "ok",

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

});


// ======================================================
// API 404
// ======================================================

app.use("/api", (req, res) => {

  res.status(404).json({

    success: false,

    message: "API route not found"

  });

});


// ======================================================
// FRONTEND FALLBACK
// ======================================================

app.use((req, res) => {

  res.sendFile(
    path.join(
      publicPath,
      "index.html"
    )
  );

});


// ======================================================
// START SERVER
// ======================================================

async function startServer() {

  await connectDatabase();

  app.listen(
    PORT,
    "0.0.0.0",
    async () => {

      console.log("");
      console.log(
        "======================================"
      );
      console.log(
        `🤖 ${BOT_NAME}`
      );
      console.log(
        "======================================"
      );
      console.log(
        `🌐 Port: ${PORT}`
      );
      console.log(
        "📁 Public: Connected"
      );
      console.log(
        "🔗 API: Connected"
      );
      console.log(
        "💳 Paystack: Loaded"
      );
      console.log(
        "🗄️ MongoDB: Loaded"
      );
      console.log(
        "📱 Baileys: Starting"
      );
      console.log(
        "======================================"
      );
      console.log("");

      try {

        await startWhatsApp();

      } catch (error) {

        console.error(
          "❌ Failed to start WhatsApp:",
          error.message
        );

      }

    }
  );

}


startServer();
