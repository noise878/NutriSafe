## Структура проекта

```text
├── backend/            # Бэкенд-часть на Python
│   ├── app.py          # Точка входа в API
│   ├── database.py     # Подключение к БД
│   └── ...
├── src/                # Фронтенд-часть на React (Vite)
├── package.json        # Зависимости фронтенда
├── requirements.txt    # Зависимости бэкенда
└── README.md           # Инструкция по запуску

Инструкция по развертыванию

Клонирование репозитория
git clone https://github.com/noise878/NutriSafe
cd nutrisafe

Настройка и запуск Бэкенда 

cd backend
python -m venv venv
.\venvScripts\Activate

Установите все необходимые зависимости

pip install -r requirements.txt

Запустите бэкенд-сервер

python app.py

Настройка и запуск Фронтенда (React + Vite)

npm install

npm run dev

