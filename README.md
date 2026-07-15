Инструкция по развертыванию
Клонирование репозитория
Bash

git clone [https://github.com/noise878/NutriSafe](https://github.com/noise878/NutriSafe)
cd nutrisafe

Настройка и запуск Бэкенда

    Перейдите в папку бэкенда, создайте и активируйте виртуальное окружение:
    Bash

    cd backend
    python -m venv venv
    # Для Windows:
    .\\venv\\Scripts\\activate
    # Для Linux/macOS:
    source venv/bin/activate

    Установите все необходимые зависимости:
    Bash

    pip install -r requirements.txt

    Запустите бэкенд-сервер:
    Bash

    python app.py

Настройка и запуск Фронтенда (React + Vite)

    Перейдите в корневую директорию проекта (или туда, где находится package.json) и установите зависимости:
    Bash

    npm install

    Запустите сервер разработки:
    Bash

    npm run dev
