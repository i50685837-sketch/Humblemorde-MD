module.exports = async ({ sock, jid }) => {

  const owner =
    process.env.OWNER_NAME || "MORDE";

  await sock.sendMessage(jid, {
    text:
`👑 BOT OWNER

Name: ${owner}
Bot: HUMBLEMORDE-MD
Engine: Node.js + Baileys

🔥 HUMBLEMORDE-MD TECH`
  });

};
