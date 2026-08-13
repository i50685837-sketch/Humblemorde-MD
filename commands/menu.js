module.exports = async (sock, jid) => {

  const menu =
`╭────────────────────╮
     🤖 HUMBLEMORDE-MD
╰────────────────────╯

👋 Welcome to HUMBLEMORDE-MD

┌──── COMMANDS ────┐
│
│ ⚡ .ping
│ 📋 .menu
│ ℹ️ .help
│ 👑 .owner
│
└──────────────────┘

🔥 Fast • Powerful • Reliable
`;

  await sock.sendMessage(jid, {
    text: menu
  });

};
