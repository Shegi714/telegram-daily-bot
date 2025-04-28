require('dotenv').config();
const { getSheetData } = require('./googleSheets');
const { sendPhoto, deleteMessage } = require('./telegram');
const fs = require('fs');

const MESSAGE_HISTORY_FILE = 'messages.json';

async function main() {
  const data = await getSheetData('main');
  const oldMessages = loadMessages();
  
  for (const id of oldMessages) {
    try {
      await deleteMessage(id);
    } catch (e) {
      console.error('Ошибка удаления:', e.message);
    }
  }
  
  saveMessages([]);

  const headers = data[0];
  const rows = data.slice(1);

  const articleIndex = 2;
  const grouped = {};

  for (const row of rows) {
    const isChecked = row[8];
    const isIgnored = row[9];
    if (isChecked === true && isIgnored !== true) {
      const article = row[articleIndex];
      if (!grouped[article]) grouped[article] = [];
      grouped[article].push(row);
    }
  }

  const newMessageIds = [];
  
  for (const article in grouped) {
    const items = grouped[article];
    let caption = `В Артикул ${article} необходим дозаказ❗️\n`;

    for (const item of items) {
      caption += `Баркод: ${item[1]}, Остаток WB: ${item[3]}, Остаток ФФ: ${item[4]}\n`;
    }

    const photoUrl = items.find(r => r[0])?.[0];
    if (photoUrl) {
      const messageId = await sendPhoto(photoUrl, caption);
      newMessageIds.push(messageId);
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

main();
