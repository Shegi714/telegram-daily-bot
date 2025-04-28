const { google } = require('googleapis');

// Создаём объект credentials из переменных окружения
const credentials = {
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // восстанавливаем переносы строк
};

const client = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets.readonly']
);

const sheets = google.sheets({ version: 'v4', auth: client });

async function getSheetData(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: sheetName,
  });
  return res.data.values;
}

module.exports = { getSheetData };
