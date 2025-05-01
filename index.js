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

  for (const row of rows) {
    const barcode = row[barcodeIndex];
    const article = row[articleIndex];
    const photo = row[photoIndex];
    const stock = row[stockIndex];
    const ffStock = row[ffStockIndex];
    const size = row[sizeIndex];
    const avgSales = row[avgSalesIndex];
    const fText = row[fTextIndex];
    const gText = row[gTextIndex];
    const manager = row[managerIndex];

    const avgSalesText = !isNaN(avgSales) && avgSales !== '' ? `средние продажи в день ${avgSales}шт.` : '';
    const sizeOrBarcode = size && size !== '0' && size !== '#N/A' ? `На размере ${size}` : `На баркоде ${barcode}`;

    // Формируем сообщение для F
    if (fText && fText.trim() !== '') {
      let caption = `В Артикул ${article}\n\n${sizeOrBarcode}, ${avgSalesText}\n`;
      caption += `${manager ? manager + ', ' : ''}${fText.trim()}\n`;
      caption += `Остаток WB: ${stock}, Остаток ФФ: ${ffStock}`;
      if (photo) {
        try {
          const messageId = await sendPhoto(photo, caption);
          newMessageIds.push(messageId);
        } catch (err) {
          console.error('Ошибка отправки сообщения F:', err.message);
        }
      }
    }

    // Формируем сообщение для G
    if (gText && gText.trim() !== '') {
      let caption = `В Артикул ${article}\n\n${sizeOrBarcode}, ${avgSalesText}\n`;
      caption += `${gText.trim()}\n`;
      caption += `Остаток WB: ${stock}, Остаток ФФ: ${ffStock}`;
      if (photo) {
        try {
          const messageId = await sendPhoto(photo, caption);
          newMessageIds.push(messageId);
        } catch (err) {
          console.error('Ошибка отправки сообщения G:', err.message);
        }
      }
    }
  }

  saveMessages(newMessageIds);
}

function loadMessages() {
  if (!fs.existsSync('messages.json')) return [];
  return JSON.parse(fs.readFileSync('messages.json'));
}

function saveMessages(ids) {
  fs.writeFileSync('messages.json', JSON.stringify(ids));
}

main().catch((error) => {
  console.error('Ошибка выполнения main:', error.message);
});
