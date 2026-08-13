module.exports = async (sock, jid) => {
  await sock.sendMessage(jid, {
    text:
`🏓 PONG!

🤖 HUMBLEMORDE-MD
⚡ Bot: Online
🚀 Engine: Baileys
`
  });
};
