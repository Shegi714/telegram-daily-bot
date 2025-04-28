const fetch = require('node-fetch');

async function sendPhoto(photoUrl, caption) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      photo: photoUrl,
      caption: caption,
    }),
  });
  const data = await response.json();
  if (data.ok) {
    return data.result.message_id;
  } else {
    throw new Error(data.description);
  }
}

async function deleteMessage(messageId) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`;
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_CHAT_ID,
      message_id: messageId,
    }),
  });
}

module.exports = { sendPhoto, deleteMessage };
