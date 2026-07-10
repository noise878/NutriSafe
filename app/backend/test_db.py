import mysql.connector
from db_config import config

print("Конфигурация:", config)

try:
    conn = mysql.connector.connect(**config)
    print("✅ Подключение успешно!")
    conn.close()
except mysql.connector.Error as e:
    print(f"❌ Ошибка: {e}")