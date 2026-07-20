# 🚀 Инструкция по развертыванию NutriSafe

## 📥 Клонирование репозитория

```bash
git clone https://github.com/noise878/NutriSafe
cd NutriSafe
```

---

# ⚙️ Настройка и запуск Backend

### 1. Перейдите в папку сервера

```bash
cd backend
```

### 2. Создайте виртуальное окружение

```bash
python -m venv venv
```

### 3. Активируйте виртуальное окружение

**Windows**

```bash
.\venv\Scripts\activate
```

**Linux / macOS**

```bash
source venv/bin/activate
```

### 4. Установите зависимости

```bash
pip install -r requirements.txt
```

### 5. Запустите сервер

```bash
python app.py
```

После успешного запуска backend будет готов принимать запросы.

---

# 💻 Настройка и запуск Frontend (React + Vite)

### 1. Перейдите в корневую папку проекта

Убедитесь, что вы находитесь в директории, где расположен файл `package.json`.

### 2. Установите зависимости

```bash
npm install
```

### 3. Запустите сервер разработки

```bash
npm run dev
```

После запуска Vite откройте в браузере адрес, который появится в терминале (обычно `http://localhost:5173`).

---

## ✅ Готово!

После запуска обоих сервисов:

- 🖥️ **Backend** работает через `python app.py`;
- ⚛️ **Frontend** работает через `npm run dev`;
- 🌐 Откройте приложение в браузере по адресу, который выведет Vite.

---

## 📁 Структура запуска

```text
NutriSafe/
│
├── backend/
│   ├── app.py
│   
│   └── ...
├── requirements.txt
├── src/
├── package.json
└── ...
```
