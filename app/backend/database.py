import mysql.connector
from mysql.connector import Error
import bcrypt
from db_config import config

def get_db_connection():
    """Получить соединение с MySQL БД"""
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except Error as e:
        print(f"Ошибка подключения к БД: {e}")
        return None

def init_db():
    """Инициализация БД начальными данными"""
    conn = get_db_connection()
    if not conn:
        print("Не удалось подключиться к БД")
        return
    
    cursor = conn.cursor()
    
    # Заполняем аллергены
    allergens = ['milk', 'eggs', 'peanuts', 'gluten', 'fish', 'seafood', 'soy', 'nuts']
    for a in allergens:
        cursor.execute('INSERT IGNORE INTO allergens (name) VALUES (%s)', (a,))
    
    # Заполняем начальные глобальные продукты
    initial_products = [
        ('Куриная грудка', 165, 31, 3.6, 0, '🍗', 'bg-rose-100'),
        ('Рис отварной', 130, 2.7, 0.3, 28, '🍚', 'bg-amber-100'),
        ('Яблоко', 52, 0.3, 0.2, 14, '🍎', 'bg-green-100'),
        ('Молоко', 60, 3.2, 3.2, 4.7, '🥛', 'bg-blue-100'),
        ('Арахис', 567, 25.8, 49.2, 16, '🥜', 'bg-yellow-100'),
        ('Хлеб пшеничный', 265, 7.5, 3.5, 49, '🍞', 'bg-orange-100'),
        ('Творог 5%', 121, 17, 5, 1.8, '🧀', 'bg-indigo-100'),
        ('Гречка', 132, 4.5, 2.3, 25, '🌾', 'bg-emerald-100'),
        ('Яйцо', 155, 12.6, 10.6, 0.8, '🥚', 'bg-slate-100'),
        ('Лосось', 208, 20, 13, 0, '🐟', 'bg-pink-100')
    ]
    
    for p in initial_products:
        cursor.execute('''
            INSERT IGNORE INTO products 
            (name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, is_global)
            VALUES (%s, %s, %s, %s, %s, 1)
        ''', (p[0], p[1], p[2], p[3], p[4]))
    
    # Получаем ID продуктов для связывания с аллергенами
    cursor.execute('SELECT product_id, name FROM products WHERE is_global = 1')
    products = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Получаем ID аллергенов
    cursor.execute('SELECT allergen_id, name FROM allergens')
    allergens_dict = {row[1]: row[0] for row in cursor.fetchall()}
    
    # Связываем продукты с аллергенами
    product_allergen_links = [
        ('Молоко', 'milk'),
        ('Арахис', 'peanuts'),
        ('Хлеб пшеничный', 'gluten'),
        ('Яйцо', 'eggs'),
        ('Лосось', 'fish')
    ]
    
    for product_name, allergen_name in product_allergen_links:
        if product_name in products and allergen_name in allergens_dict:
            cursor.execute('''
                INSERT IGNORE INTO product_allergens (product_id, allergen_id)
                VALUES (%s, %s)
            ''', (products[product_name], allergens_dict[allergen_name]))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("База данных инициализирована начальными данными!")

if __name__ == '__main__':
    init_db()