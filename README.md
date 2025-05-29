# 🤖 Telegram Daily Bot
**Автоматизированная система отправки данных из Google Sheets в Telegram-канал по расписанию**

[![Python Version](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Telegram API](https://img.shields.io/badge/Telegram%20Bot%20API-20.0a6-orange?logo=telegram)](https://core.telegram.org/bots/api)

![Бот в действии](https://via.placeholder.com/800x400?text=Screenshot+Placeholder) <!-- Замените на реальный скриншот -->

## 🌟 Основные возможности
- 📆 **Автоматическая отправка** данных по расписанию (ежедневно/еженедельно)
- 📊 Парсинг данных из **Google Sheets** через API
- ⏱️ Гибкая настройка времени отправки через конфиг
- 🔐 Безопасное хранение учетных данных с помощью `.env`
- 📦 Простая установка и настройка через Docker
- 📤 Отправка в **Telegram-каналы** и групповые чаты

## ⚙️ Технологический стек
```python
Python 3.10+ · python-telegram-bot 20.0a6 · gspread · oauth2client · python-dotenv · APScheduler · Docker
🚀 Быстрый старт
Предварительные требования
Telegram Bot Token

Google Service Account

ID Google Sheets документа (из URL)

ID Telegram-канала (в формате @channelname или ID)

Установка через Docker (рекомендуется)
bash
# 1. Клонируйте репозиторий
git clone https://github.com/Shegi714/telegram-daily-bot.git
cd telegram-daily-bot

# 2. Создайте .env файл (пример в env.example)
cp env.example .env

# 3. Заполните .env своими данными
nano .env

# 4. Запустите контейнер
docker-compose up -d --build
Ручная установка
bash
# Установите зависимости
pip install -r requirements.txt

# Настройте переменные окружения
cp env.example .env
nano .env  # заполните своими данными

# Запустите бота
python main.py
⚙️ Конфигурация
Образец .env файла:

ini
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHANNEL_ID=@your_channel_name

GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_CREDENTIALS=credentials.json

TIME_ZONE=Europe/Moscow
SCHEDULE_TIME=09:00  # Время ежедневной отправки
Настройка Google Sheets
Создайте Service Account в Google Cloud Console

Скачайте JSON-ключ и поместите в credentials.json

Предоставьте доступ к таблице для service account email

🛠 Использование
После запуска бот автоматически:

Подключается к Google Sheets каждый день в указанное время

Читает данные из указанного листа

Форматирует сообщение

Отправляет в указанный Telegram-канал

Пример структуры таблицы:

Дата	Заголовок	Описание	Ссылка
2023-10-01	Новость 1	Описание...	example.com
🐛 Отладка
Проверьте статус бота:

bash
docker-compose logs -f bot
Тестовый запуск без планировщика:

bash
python main.py --test
🤝 Как помочь проекту
PR приветствуются! Порядок действий:

Форкните репозиторий

Создайте ветку: git checkout -b feat/new-feature

Зафиксируйте изменения: git commit -m 'Add some feature'

Отправьте в форк: git push origin feat/new-feature

Создайте Pull Request
