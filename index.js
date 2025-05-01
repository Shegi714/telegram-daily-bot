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

  const headers = data[0];
  const rows = data.slice(1);

  const barcodeIndex = headers.indexOf('Баркод');
  const articleIndex = headers.indexOf('Артикул');
  const photoIndex = headers.indexOf('Фото');
  const stockIndex = headers.indexOf('Остаток WB');
  const ffStockIndex = headers.indexOf('Остаток ФФ');
  const sizeIndex = headers.indexOf('Размер');
  const avgSalesIndex = headers.indexOf('Средние продажи');
  const fTextIndex = 5;
  const gTextIndex = 6;
  const managerIndex = headers.indexOf('менеджеры');

  console.log('Индексы колонок:', {
    barcodeIndex, articleIndex, photoIndex, stockIndex,
    ffStockIndex, sizeIndex, avgSalesIndex, fTextIndex, gTextIndex, managerIndex
  });

  // Удаляем старые сообщения
  const oldMessages = loadMessages();
  for (const id of oldMessages) {
    try {
      await deleteMessage(id);
    } catch (e) {
      console.error('Ошибка удаления сообщения:', e.message);
    }
  }
  saveMessages([]);

  const newMessageIds = [];
  const groupedByArticle = {};

  // Группировка по артикулу
  for (const row of rows) {
    const article = row[articleIndex];
    if (!article) continue;

    if (!groupedByArticle[article]) groupedByArticle[article] = [];

    groupedByArticle[article].push({
      barcode: row[barcodeIndex],
      photo: row[photoIndex],
      stock: row[stockIndex],
      ffStock: row[ffStockIndex],
      size: row[sizeIndex],
      avgSales: row[avgSalesIndex],
      fText: row[fTextIndex],
      gText: row[gTextIndex],
      manager: row[managerIndex]
    });
  }

  const allArticles = Object.keys(groupedByArticle).sort();

  // Сначала обрабатываем F-группу
  for (const article of allArticles) {
    const items = groupedByArticle[article];
    const fItems = items.filter(i => i.fText && i.fText.trim() !== '');

    if (fItems.length > 0) {
      let caption = `В Артикул ${article}\n\n`;

      for (const item of fItems) {
        const hasSize = item.size && item.size !== '0' && item.size !== '' && item.size !== '#N/A';
        const label = hasSize ? `На размере ${item.size}` : `На баркоде ${item.barcode}`;
        const avg = !isNaN(item.avgSales) && item.avgSales !== '' ? `средние продажи в день ${item.avgSales}шт.` : '';

        caption += `${label}, ${avg}\n`;
        caption += `${item.manager ? item.manager + ', ' : ''}${item.fText.trim()}\n`;
        caption += `Остаток WB: ${item.stock}, Остаток ФФ: ${item.ffStock}\n\n`;
      }

      const photoUrl = fItems.find(item => item.photo)?.photo;
      if (photoUrl) {
        try {
          const messageId = await sendPhoto(photoUrl, caption.trim());
          newMessageIds.push(messageId);
        } catch (err) {
          console.error('Ошибка отправки F-сообщения:', err.message);
        }
      }
    }
  }

  // Затем обрабатываем G-группу
  for (const article of allArticles) {
    const items = groupedByArticle[article];
    const gItems = items.filter(i => i.gText && i.gText.trim() !== '');

    if (gItems.length > 0) {
      let caption = `В Артикул ${article}\n\n`;

      for (const item of gItems) {
        const hasSize = item.size && item.size !== '0' && item.size !== '' && item.size !== '#N/A';
        const label = hasSize ? `На размере ${item.size}` : `На баркоде ${item.barcode}`;
        const avg = !isNaN(item.avgSales) && item.avgSales !== '' ? `средние продажи в день ${item.avgSales}шт.` : '';

        caption += `${label}, ${avg}\n`;
        caption += `${item.gText.trim()}\n`;
        caption += `Остаток WB: ${item.stock}, Остаток ФФ: ${item.ffStock}\n\n`;
      }

      const photoUrl = gItems.find(item => item.photo)?.photo;
      if (photoUrl) {
        try {
          const messageId = await sendPhoto(photoUrl, caption.trim());
          newMessageIds.push(messageId);
        } catch (err) {
          console.error('Ошибка отправки G-сообщения:', err.message);
        }
      }
    }
  }

  saveMessages(newMessageIds);
} // <-- вот закрывающая скобка main

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
