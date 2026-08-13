const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/", (req, res) => {

  res.json({
    success: true,
    bot: process.env.BOT_NAME || "HUMBLEMORDE-MD",

    whatsapp:
      global.sock?.user
        ? "connected"
        : "disconnected",

    database:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",

    uptime:
      Math.floor(process.uptime())
  });

});

module.exports = router;
