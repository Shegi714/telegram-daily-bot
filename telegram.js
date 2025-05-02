const fetch = require('node-fetch');

async function sendPhoto(photoUrl, caption) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`;
  const payload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    photo: photoUrl,
    caption: caption
  };

  let attempts = 0;

  while (attempts < 5) {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Фото отправлено:', data.result.message_id);
      return data.result.message_id;
    }

    if (data.error_code === 429 && data.parameters?.retry_after) {
      const wait = data.parameters.retry_after;
      console.warn(`⏳ Rate limit. Ждём ${wait} сек...`);
      await new Promise(resolve => setTimeout(resolve, wait * 1000));
    } else if (data.error_code === 400 || data.error_code === 404) {
      console.warn(`⚠️ sendPhoto не сработал (code ${data.error_code}). Используем sendMessage`);
      return await sendMessageWithFallback(photoUrl, caption);
    } else {
      throw new Error(data.description);
    }

    attempts++;
  }

  throw new Error('sendPhoto: не удалось после 5 попыток');
}

async function sendMessageWithFallback(photoUrl, caption) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendMessage`;
  const payload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: `${caption}\n\nФото: ${photoUrl}`
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (data.ok) {
    console.log('✅ Fallback-сообщение отправлено:', data.result.message_id);
    return data.result.message_id;
  }

  throw new Error(`sendMessage fallback: ${data.description}`);
}

async function deleteMessage(messageId) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/deleteMessage`;
  const payload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    message_id: messageId,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!data.ok) {
    if (data.error_code === 429 && data.parameters?.retry_after) {
      const wait = data.parameters.retry_after;
      console.warn(`⏳ Rate limit удаления. Ждём ${wait} сек...`);
      await new Promise(resolve => setTimeout(resolve, wait * 1000));
      return deleteMessage(messageId);
    }

    if (data.error_code === 400) {
      console.warn(`⚠️ Сообщение ${messageId} уже удалено или не найдено`);
      return false;
    }

    console.error(`❌ Ошибка удаления: ${data.description}`);
    return false;
  }

  console.log(`🗑 Удалено сообщение: ${messageId}`);
  return true;
}

module.exports = { sendPhoto, deleteMessage };
