from flask import Flask, request, jsonify, session
from flask_cors import CORS
import bcrypt
import mysql.connector
from datetime import datetime
import secrets
from db_config import config

app = Flask(__name__)
app.secret_key = secrets.token_hex(16)
CORS(app, supports_credentials=True, origins=['http://localhost:5173', 'http://localhost:3000'])

def get_db():
    try:
        conn = mysql.connector.connect(**config)
        return conn
    except mysql.connector.Error as e:
        print(f"Ошибка БД: {e}")
        return None


def calculate_bmr(gender, weight, height, age):
    if gender == 'male':
        return 10 * weight + 6.25 * height - 5 * age + 5
    else:
        return 10 * weight + 6.25 * height - 5 * age - 161

activity_multipliers = {
    'sedentary': 1.2,
    'light': 1.375,
    'moderate': 1.55,
    'active': 1.725,
    'veryActive': 1.9
}

def calculate_daily_calories(gender, weight, height, age, activity_level, goal):
    bmr = calculate_bmr(gender, weight, height, age)
    tdee = bmr * activity_multipliers.get(activity_level, 1.2)
    
    if goal == 'weight_loss':
        return round(tdee - 500)
    elif goal == 'weight_gain':
        return round(tdee + 500)
    else:
        return round(tdee)



@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    
    if len(data['password']) < 8:
        return jsonify({'error': 'Пароль должен быть минимум 8 символов'}), 400
    
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
    
    daily_calories = calculate_daily_calories(
        data['gender'], data['weight'], data['height'], data['age'],
        data['activity'], data['goal']
    )
    
    daily_protein = round(daily_calories * 0.3 / 4)
    daily_fat = round(daily_calories * 0.3 / 9)
    daily_carbs = round(daily_calories * 0.4 / 4)
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO users (email, password_hash, gender, age, height, weight_current, 
                              goal, activity_level, daily_calories, daily_protein, daily_fat, daily_carbs)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (data['email'], password_hash.decode('utf-8'), data['gender'],
              data['age'], data['height'], data['weight'], data['goal'],
              data['activity'], daily_calories, daily_protein, daily_fat, daily_carbs))
        
        user_id = cursor.lastrowid
        
        for allergen_name in data.get('allergies', []):
            cursor.execute('SELECT allergen_id FROM allergens WHERE name = %s', (allergen_name,))
            allergen = cursor.fetchone()
            if allergen:
                cursor.execute('INSERT INTO user_allergies (user_id, allergen_id) VALUES (%s, %s)',
                              (user_id, allergen[0]))
        
        conn.commit()
        session['user_id'] = user_id
        
        return jsonify({
            'message': 'Регистрация успешна',
            'user_id': user_id,
            'daily_calories': daily_calories
        }), 201
        
    except mysql.connector.IntegrityError:
        return jsonify({'error': 'Пользователь с таким email уже существует'}), 400
    finally:
        cursor.close()
        conn.close()

@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('SELECT * FROM users WHERE email = %s', (data['email'],))
    user = cursor.fetchone()
    
    if not user:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Неверный email или пароль'}), 401
    
    if bcrypt.checkpw(data['password'].encode('utf-8'), user['password_hash'].encode('utf-8')):
        session['user_id'] = user['user_id']
        
        cursor.execute('UPDATE users SET last_login = %s WHERE user_id = %s',
                      (datetime.now(), user['user_id']))
        conn.commit()
        
        cursor.execute('''
            SELECT a.name FROM user_allergies ua
            JOIN allergens a ON ua.allergen_id = a.allergen_id
            WHERE ua.user_id = %s
        ''', (user['user_id'],))
        allergies = [row['name'] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
        'message': 'Вход выполнен',
        'user': {
        'id': user['user_id'],
        'email': user['email'],
        'gender': user['gender'],
        'age': user['age'],
        'height': float(user['height']),
        'weight': float(user['weight_current']),
        'goal': user['goal'],
        'activity': user['activity_level'],
        'allergies': allergies,
        'daily_calories': user['daily_calories'],
        'is_admin': user.get('is_admin', 0)  
    }
}), 200
    else:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Неверный email или пароль'}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'message': 'Выход выполнен'}), 200

@app.route('/api/me', methods=['GET'])
def get_current_user():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('SELECT * FROM users WHERE user_id = %s', (session['user_id'],))
    user = cursor.fetchone()
    
    if not user:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    cursor.execute('''
        SELECT a.name FROM user_allergies ua
        JOIN allergens a ON ua.allergen_id = a.allergen_id
        WHERE ua.user_id = %s
    ''', (session['user_id'],))
    allergies = [row['name'] for row in cursor.fetchall()]
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'id': user['user_id'],
        'email': user['email'],
        'gender': user['gender'],
        'age': user['age'],
        'height': float(user['height']),
        'weight': float(user['weight_current']),
        'goal': user['goal'],
        'activity': user['activity_level'],
        'allergies': allergies,
        'daily_calories': user['daily_calories'],
        'is_admin': user.get('is_admin', 0)  
    }), 200

@app.route('/api/profile', methods=['PUT'])
def update_profile():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    data = request.json
    
    daily_calories = calculate_daily_calories(
        data['gender'], data['weight'], data['height'], data['age'],
        data['activity'], data['goal']
    )
    
    daily_protein = round(daily_calories * 0.3 / 4)
    daily_fat = round(daily_calories * 0.3 / 9)
    daily_carbs = round(daily_calories * 0.4 / 4)
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE users 
        SET gender = %s, age = %s, height = %s, weight_current = %s, 
            goal = %s, activity_level = %s, daily_calories = %s,
            daily_protein = %s, daily_fat = %s, daily_carbs = %s
        WHERE user_id = %s
    ''', (data['gender'], data['age'], data['height'], data['weight'],
          data['goal'], data['activity'], daily_calories,
          daily_protein, daily_fat, daily_carbs, session['user_id']))
    
    cursor.execute('DELETE FROM user_allergies WHERE user_id = %s', (session['user_id'],))
    
    for allergen_name in data.get('allergies', []):
        cursor.execute('SELECT allergen_id FROM allergens WHERE name = %s', (allergen_name,))
        allergen = cursor.fetchone()
        if allergen:
            cursor.execute('INSERT INTO user_allergies (user_id, allergen_id) VALUES (%s, %s)',
                          (session['user_id'], allergen[0]))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Профиль обновлён', 'daily_calories': daily_calories}), 200

@app.route('/api/products/global', methods=['GET'])
def get_global_products():
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT product_id as id, name, calories_per_100g as calories,
               protein_per_100g as protein, fat_per_100g as fat, carbs_per_100g as carbs
        FROM products
        WHERE is_global = 1
    ''')
    products = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(products), 200

@app.route('/api/meals', methods=['GET', 'POST'])
def meals():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor()
    
    if request.method == 'GET':
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        cursor.execute('''
            SELECT mr.record_id as id, p.name as productName, mr.date, mr.meal_type as mealType,
                   mr.weight_grams as weight, mr.calories, mr.protein, mr.fat, mr.carbs
            FROM meal_records mr
            JOIN products p ON mr.product_id = p.product_id
            WHERE mr.user_id = %s AND mr.date = %s
            ORDER BY mr.created_at
        ''', (session['user_id'], date))
        
        records = []
        for row in cursor.fetchall():
            records.append({
                'id': row[0],
                'productName': row[1],
                'date': row[2].isoformat() if hasattr(row[2], 'isoformat') else row[2],
                'mealType': row[3],
                'weight': row[4],
                'calories': row[5],
                'protein': float(row[6]) if row[6] else 0,
                'fat': float(row[7]) if row[7] else 0,
                'carbs': float(row[8]) if row[8] else 0
            })
        
        cursor.close()
        conn.close()
        return jsonify(records), 200
    
    else:
        data = request.json
        
        cursor.execute('''
            INSERT INTO meal_records (user_id, product_id, date, meal_type, weight_grams, 
                                      calories, protein, fat, carbs)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        ''', (session['user_id'], data['productId'], data['date'], data['mealType'],
              data['weight'], data['calories'], data['protein'], data['fat'], data['carbs']))
        
        conn.commit()
        record_id = cursor.lastrowid
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Запись добавлена', 'id': record_id}), 201

@app.route('/api/meals/<int:record_id>', methods=['DELETE'])
def delete_meal(record_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM meal_records WHERE record_id = %s AND user_id = %s',
                  (record_id, session['user_id']))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Запись удалена'}), 200

@app.route('/api/water', methods=['GET', 'POST'])
def water():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor()
    
    if request.method == 'GET':
        date = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
        
        cursor.execute('''
            SELECT water_id as id, volume_ml as amount, time
            FROM water_records
            WHERE user_id = %s AND date = %s
            ORDER BY time
        ''', (session['user_id'], date))
        
        records = []
        for row in cursor.fetchall():
            records.append({
                'id': row[0],
                'amount': row[1],
                'time': str(row[2]) if row[2] else ''
            })
        
        cursor.close()
        conn.close()
        return jsonify(records), 200
    
    else:
        data = request.json
        
        cursor.execute('''
            INSERT INTO water_records (user_id, date, time, volume_ml)
            VALUES (%s, %s, %s, %s)
        ''', (session['user_id'], data['date'], data['time'], data['amount']))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Вода добавлена'}), 201

@app.route('/api/stats/weekly', methods=['GET'])
def weekly_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT date,
               SUM(calories) as calories,
               SUM(protein) as protein,
               SUM(fat) as fat,
               SUM(carbs) as carbs
        FROM meal_records
        WHERE user_id = %s AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY date
    ''', (session['user_id'],))
    
    meal_stats = {}
    for row in cursor.fetchall():
        date_str = row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date'])
        meal_stats[date_str] = {
            'calories': row['calories'] or 0,
            'protein': float(row['protein'] or 0),
            'fat': float(row['fat'] or 0),
            'carbs': float(row['carbs'] or 0)
        }
    
    cursor.execute('''
        SELECT date, SUM(volume_ml) as water
        FROM water_records
        WHERE user_id = %s AND date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY date
    ''', (session['user_id'],))
    
    water_stats = {}
    for row in cursor.fetchall():
        date_str = row['date'].isoformat() if hasattr(row['date'], 'isoformat') else str(row['date'])
        water_stats[date_str] = row['water'] or 0
    
    cursor.close()
    conn.close()
    
    from datetime import datetime, timedelta
    result = []
    for i in range(6, -1, -1):
        date = (datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d')
        result.append({
            'date': date[5:],
            'calories': meal_stats.get(date, {}).get('calories', 0),
            'protein': meal_stats.get(date, {}).get('protein', 0),
            'fat': meal_stats.get(date, {}).get('fat', 0),
            'carbs': meal_stats.get(date, {}).get('carbs', 0),
            'water': water_stats.get(date, 0)
        })
    
    return jsonify(result), 200

@app.route('/api/user/daily_norm', methods=['GET'])
def get_daily_norm():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    if not conn:
        return jsonify({'error': 'Ошибка подключения к БД'}), 500
    
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('SELECT daily_calories, weight_current FROM users WHERE user_id = %s',
                  (session['user_id'],))
    user = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    water_norm = round(user['weight_current'] * 30)
    
    return jsonify({
        'calories': user['daily_calories'],
        'water': water_norm
    }), 200

@app.route('/api/support/ticket', methods=['POST'])
def create_support_ticket():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    data = request.json
    subject = data.get('subject')
    message = data.get('message')
    ticket_type = data.get('type', 'other')
    
    if not subject or not message:
        return jsonify({'error': 'Тема и сообщение обязательны'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO support_tickets (user_id, subject, message, type, status, created_at)
        VALUES (%s, %s, %s, %s, 'new', NOW())
    ''', (session['user_id'], subject, message, ticket_type))
    
    conn.commit()
    ticket_id = cursor.lastrowid
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Обращение отправлено', 'ticket_id': ticket_id}), 201

@app.route('/api/products/personal', methods=['GET', 'POST'])
def personal_products():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    if request.method == 'GET':
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT product_id as id, name, calories_per_100g as calories,
                   protein_per_100g as protein, fat_per_100g as fat, carbs_per_100g as carbs,
                   0 as is_global
            FROM products
            WHERE user_id = %s AND is_global = 0
        ''', (session['user_id'],))
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(products), 200
    
    else:  
        data = request.json
        

        cursor.execute('''
            SELECT 1 FROM products 
            WHERE user_id = %s AND name = %s AND is_global = 0
        ''', (session['user_id'], data['name']))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'error': 'Продукт с таким названием уже существует'}), 400
        
        cursor.execute('''
            INSERT INTO products (name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g,
                                 is_global, user_id)
            VALUES (%s, %s, %s, %s, %s, 0, %s)
        ''', (data['name'], data['calories'], data['protein'], data['fat'], data['carbs'], session['user_id']))
        
        product_id = cursor.lastrowid
        conn.commit()
        

        for allergen_name in data.get('allergens', []):
            cursor.execute('SELECT allergen_id FROM allergens WHERE name = %s', (allergen_name,))
            allergen = cursor.fetchone()
            if allergen:
                cursor.execute('INSERT INTO product_allergens (product_id, allergen_id) VALUES (%s, %s)',
                              (product_id, allergen[0]))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Продукт создан', 'product': {'id': product_id, 'name': data['name']}}), 201

@app.route('/api/products/check-duplicate', methods=['GET'])
def check_product_duplicate():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    name = request.args.get('name')
    if not name:
        return jsonify({'error': 'Не указано название'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        SELECT 1 FROM products 
        WHERE user_id = %s AND name = %s AND is_global = 0
    ''', (session['user_id'], name))
    
    exists = cursor.fetchone() is not None
    cursor.close()
    conn.close()
    
    return jsonify({'exists': exists}), 200



@app.route('/api/admin/stats', methods=['GET'])
def admin_stats():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    

    cursor.execute('SELECT is_admin FROM users WHERE user_id = %s', (session['user_id'],))
    user = cursor.fetchone()
    if not user or not user.get('is_admin', False):
        cursor.close()
        conn.close()
        return jsonify({'error': 'Доступ запрещён'}), 403

    cursor.execute('SELECT COUNT(*) as total FROM users')
    total_users = cursor.fetchone()['total']
    
    cursor.execute('SELECT COUNT(*) as total FROM meal_records')
    total_meals = cursor.fetchone()['total']
    
    cursor.execute('SELECT COUNT(*) as total FROM support_tickets WHERE status = "new"')
    pending_tickets = cursor.fetchone()['total']
    
    cursor.execute('SELECT COUNT(*) as total FROM products WHERE is_global = 1')
    global_products = cursor.fetchone()['total']
    

    cursor.execute('''
        SELECT t.*, u.email FROM support_tickets t
        JOIN users u ON t.user_id = u.user_id
        ORDER BY t.created_at DESC LIMIT 5
    ''')
    recent_tickets = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'total_users': total_users,
        'total_meals': total_meals,
        'pending_tickets': pending_tickets,
        'global_products': global_products,
        'recent_tickets': recent_tickets
    }), 200

@app.route('/api/admin/products/global', methods=['GET', 'POST', 'DELETE'])
def admin_products():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    

    cursor.execute('SELECT is_admin FROM users WHERE user_id = %s', (session['user_id'],))
    user = cursor.fetchone()
    if not user or not user[0]:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Доступ запрещён'}), 403
    

    if request.method == 'GET':
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT product_id as id, name, calories_per_100g as calories,
                   protein_per_100g as protein, fat_per_100g as fat, carbs_per_100g as carbs
            FROM products WHERE is_global = 1
        ''')
        products = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(products), 200
    

    elif request.method == 'POST':
        data = request.json
        cursor.execute('''
            INSERT INTO products (name, calories_per_100g, protein_per_100g, fat_per_100g, carbs_per_100g, is_global)
            VALUES (%s, %s, %s, %s, %s, 1)
        ''', (data['name'], data['calories'], data['protein'], data['fat'], data['carbs']))
        conn.commit()
        product_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({'message': 'Продукт добавлен', 'id': product_id}), 201
    

    elif request.method == 'DELETE':
        product_id = request.args.get('id')
        cursor.execute('DELETE FROM products WHERE product_id=%s AND is_global=1', (product_id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'message': 'Продукт удалён'}), 200

@app.route('/api/admin/tickets/<int:ticket_id>', methods=['PUT'])
def resolve_ticket(ticket_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT is_admin FROM users WHERE user_id = %s', (session['user_id'],))
    user = cursor.fetchone()
    if not user or not user[0]:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Доступ запрещён'}), 403
    
    data = request.json
    cursor.execute('''
        UPDATE support_tickets SET status = 'resolved', admin_response = %s
        WHERE ticket_id = %s
    ''', (data.get('response', ''), ticket_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({'message': 'Обращение помечено как решённое'}), 200

@app.route('/api/user/tickets', methods=['GET'])
def get_user_tickets():
    if 'user_id' not in session:
        return jsonify({'error': 'Не авторизован'}), 401
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT ticket_id, subject, message, type, status, admin_response, created_at
        FROM support_tickets
        WHERE user_id = %s
        ORDER BY created_at DESC
    ''', (session['user_id'],))
    
    tickets = cursor.fetchall()
    cursor.close()
    conn.close()
    

    for ticket in tickets:
        if ticket['created_at']:
            ticket['created_at'] = ticket['created_at'].isoformat() if hasattr(ticket['created_at'], 'isoformat') else str(ticket['created_at'])
    
    return jsonify(tickets), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)


