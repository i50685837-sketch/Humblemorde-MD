module.exports = async ({ sock, jid }) => {

  await sock.sendMessage(jid, {
    text:
`❓ HUMBLEMORDE-MD HELP

Available commands:

⚡ .ping
Check bot response.

📋 .menu
Show the main menu.

❓ .help
Show this help message.

👑 .owner
Show bot owner information.

Prefix:
.`
  });

};
