const BOT_NAME =
  process.env.BOT_NAME || "HUMBLEMORDE-MD";

async function handleCommand(
  sock,
  jid,
  text
) {

  const command =
    text.trim().toLowerCase();


  // ==========================
  // PING
  // ==========================

  if (command === ".ping") {

    await sock.sendMessage(jid, {
      text:
`🏓 PONG!

🤖 ${BOT_NAME}
⚡ Bot is online
🚀 Node.js + Baileys`
    });

    return true;
  }


  // ==========================
  // MENU
  // ==========================

  if (
    command === ".menu" ||
    command === ".help"
  ) {

    await sock.sendMessage(jid, {
      text:
`╭────────────────╮
   🤖 ${BOT_NAME}
╰────────────────╯

👋 Welcome!

┌── COMMANDS ──┐
│
│ ⚡ .ping
│ 📋 .menu
│ ℹ️ .help
│
└──────────────┘

🔥 HUMBLEMORDE-MD TECH`
    });

    return true;
  }


  return false;
}

module.exports = {
  handleCommand
};
