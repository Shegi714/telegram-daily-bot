require('dotenv').config();
const { getSheetData } = require('./googleSheets');
const { sendPhoto, deleteMessage } = require('./telegram');
const fs = require('fs');

const MESSAGE_HISTORY_FILE = 'messages.json';

async function main() {
  const data = await getSheetData('bot');
  console.log('Загруженные данные из таблицы:', data);

  if (!data || data.length < 2) {
    console.error('Недостаточно данных для обработки.');
    return;
  }

  const headers = data[0]; // Первая строка — заголовки
  const rows = data.slice(1); // Данные начинаются со второй строки

  const barcodeIndex = headers.indexOf('Баркод');
  const articleIndex = headers.indexOf('Артикул');
  const participateIndex = headers.findIndex(col => col && col.toString().toLowerCase().includes('участвует'));
  const ignoreIndex = headers.findIndex(col => col && col.toString().toLowerCase().includes('исключить'));
  const photoIndex = headers.indexOf('Фото');
  const stockIndex = headers.indexOf('Остаток WB');
  const ffStockIndex = headers.indexOf('Остаток ФФ');
  const sizeIndex = headers.indexOf('Размер');
  const avgSalesIndex = headers.indexOf('Средние продажи');

  console.log('Индексы колонок:', {
    barcodeIndex,
    articleIndex,
    participateIndex,
    ignoreIndex,
    photoIndex,
    stockIndex,
    ffStockIndex,
    sizeIndex,
    avgSalesIndex
  });

  const oldMessages = loadMessages();

  for (const id of oldMessages) {
    try {
      await deleteMessage(id);
    } catch (e) {
      console.error('Ошибка удаления сообщения:', e.message);
    }
  }
  saveMessages([]);

  const grouped = {};

  for (const row of rows) {
    const barcode = row[barcodeIndex];
    const article = row[articleIndex];
    const participate = row[participateIndex];
    const ignore = row[ignoreIndex];

    if (!barcode || !article) continue;

    const isParticipate = String(participate).trim().toLowerCase() === 'true';
    const isIgnore = String(ignore).trim().toLowerCase() === 'true';



    if (isParticipate && isIgnore) {
      if (!grouped[article]) grouped[article] = [];
          grouped[article].push({
            photo: row[photoIndex] || '',
            barcode: barcode,
            stock: row[stockIndex] || 0,
            ffStock: row[ffStockIndex] || 0,
            size: row[sizeIndex] || '',
            avgSales: row[avgSalesIndex] || '',
            fText: row[5] || '',       // Столбец F
            gText: row[6] || '',       // Столбец G
            manager: row[9] || '',     // Столбец J
});

    }
  }

  console.log('Количество артикулов для отправки:', Object.keys(grouped).length);

 const newMessageIds = [];

for (const article in grouped) {
  const items = grouped[article];

  const manager = items[0].manager;
  const fText = items[0].fText;
  const gText = items[0].gText;

  const hasF = fText && fText.toLowerCase() !== 'false';
  const hasG = gText && gText.toLowerCase() !== 'false';

  // --- Обработка F ---
  if (hasF) {
    let caption = `В Артикул ${article} необходим дозаказ❗️\n${manager ? manager + ' ' : ''}${fText}\n`;
    for (const item of items) {
      const hasSize = item.size && item.size !== '0' && item.size !== '' && item.size !== '#N/A';
      const label = hasSize ? `На размере ${item.size}` : `На баркоде ${item.barcode}`;
      caption += `${label}\nОстаток WB: ${item.stock}, Остаток ФФ: ${item.ffStock}\n`;
    }

    const photoUrl = items.find(item => item.photo)?.photo;
    if (photoUrl) {
      try {
        const messageId = await sendPhoto(photoUrl, caption);
        newMessageIds.push(messageId);
      } catch (error) {
        console.error('Ошибка отправки F-сообщения:', error.message);
      }
    }
  }

  // --- Обработка G ---
  if (hasG) {
    let caption = `В Артикул ${article} необходим дозаказ❗️\n${gText}\n`;
    for (const item of items) {
      const hasSize = item.size && item.size !== '0' && item.size !== '' && item.size !== '#N/A';
      const label = hasSize ? `На размере ${item.size}` : `На баркоде ${item.barcode}`;
      caption += `${label}\nОстаток WB: ${item.stock}, Остаток ФФ: ${item.ffStock}\n`;
    }

    const photoUrl = items.find(item => item.photo)?.photo;
    if (photoUrl) {
      try {
        const messageId = await sendPhoto(photoUrl, caption);
        newMessageIds.push(messageId);
      } catch (error) {
        console.error('Ошибка отправки G-сообщения:', error.message);
      }
    }
  }
}


  saveMessages(newMessageIds);
}

function loadMessages() {
  if (!fs.existsSync(MESSAGE_HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(MESSAGE_HISTORY_FILE));
}

function saveMessages(ids) {
  fs.writeFileSync(MESSAGE_HISTORY_FILE, JSON.stringify(ids));
}

main().catch((error) => {
  console.error('Ошибка выполнения main:', error.message);
});
