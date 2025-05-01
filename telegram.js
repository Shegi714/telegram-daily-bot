const fetch = require('node-fetch');

async function sendPhoto(photoUrl, caption) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendPhoto`;
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
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.ok) {
      console.log('✅ Отправлено сообщение:', data.result.message_id);
      return data.result.message_id;
    }

    if (data.error_code === 429 && data.parameters?.retry_after) {
      const waitTime = data.parameters.retry_after;
      console.warn(`⏳ Rate limit: ждём ${waitTime} секунд...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    } else {
      console.error('❌ Ошибка Telegram:', data.description);
      throw new Error(data.description);
    }

    attempts++;
  }

  throw new Error('Не удалось отправить сообщение после 5 попыток.');
}

async function deleteMessage(messageId) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/deleteMessage`;
  const payload = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    message_id: messageId,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!data.ok) {
    if (data.error_code === 429 && data.parameters?.retry_after) {
      const waitTime = data.parameters.retry_after;
      console.warn(`⏳ Rate limit на удаление: ждём ${waitTime} секунд...`);
      await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
      return deleteMessage(messageId); // retry
    }

    // ✅ Просто логируем, если сообщение уже удалено или не найдено
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
