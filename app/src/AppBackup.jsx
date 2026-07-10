import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { logEvent } from './logger';

const API_URL = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw { status: response.status, ...data };
  return data;
}

const api = {
  register: (userData) => request('/register', { method: 'POST', body: JSON.stringify(userData) }),
  login: (email, password) => request('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/logout', { method: 'POST' }),
  getCurrentUser: () => request('/me').catch(e => e.status === 401 ? null : Promise.reject(e)),
  updateProfile: (userData) => request('/profile', { method: 'PUT', body: JSON.stringify(userData) }),
  getGlobalProducts: () => request('/products/global'),
  getPersonalProducts: () => request('/products/personal'),
  createPersonalProduct: (data) => request('/products/personal', { method: 'POST', body: JSON.stringify(data) }),
  getMeals: (date) => request(`/meals?date=${date}`),
  addMeal: (mealData) => request('/meals', { method: 'POST', body: JSON.stringify(mealData) }),
  deleteMeal: (recordId) => request(`/meals/${recordId}`, { method: 'DELETE' }),
  getWater: (date) => request(`/water?date=${date}`),
  addWater: (waterData) => request('/water', { method: 'POST', body: JSON.stringify(waterData) }),
  getWeeklyStats: () => request('/stats/weekly'),
  getDailyNorm: () => request('/user/daily_norm'),
  createSupportTicket: (data) => request('/support/ticket', { method: 'POST', body: JSON.stringify(data) }),
  checkUserProductDuplicate: (name) => request(`/products/check-duplicate?name=${encodeURIComponent(name)}`),
  getAdminStats: () => request('/admin/stats'),
  getAdminProducts: () => request('/admin/products/global'),
  addAdminProduct: (data) => request('/admin/products/global', { method: 'POST', body: JSON.stringify(data) }),
  deleteAdminProduct: (id) => request(`/admin/products/global?id=${id}`, { method: 'DELETE' }),
  resolveTicket: (ticketId, response) => request(`/admin/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify({ response }) }),
  getUserTickets: () => request('/user/tickets'),
};

function Navigation({ setPage, onLogout }) {
  const isAdminFromStorage = localStorage.getItem('is_admin') === 'true';
  
  return (
    <nav className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-center space-x-2 py-3 flex-wrap gap-2">
          <button onClick={() => setPage("dashboard")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">📊 Дашборд</button>
          <button onClick={() => setPage("stats")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">📈 Статистика</button>
          <button onClick={() => setPage("water")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">💧 Вода</button>
          <button onClick={() => setPage("profile")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">👤 Профиль</button>
          <button onClick={() => setPage("myTickets")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">📋 Мои обращения</button>
          <button onClick={() => setPage("support")} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">💬 Поддержка</button>
          
          {localStorage.getItem('is_admin') === 'true' && (
            <button onClick={() => setPage("admin")} className="px-5 py-2 rounded-xl font-medium bg-purple-700 text-white hover:bg-purple-800">
              ⚙️ Админка
            </button>
          )}
          
          <button onClick={onLogout} className="px-5 py-2 rounded-xl font-medium text-white hover:bg-white/20">🚪 Выход</button>
        </div>
      </div>
    </nav>
  );
}

function LoginPage({ onLogin, onSwitchToRegister }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api.login(email, password);
      onLogin(result.user);
    } catch (err) {
      setError(err.error || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white/90 rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🍎</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">NutriTrack</h1>
          <p className="text-gray-500 mt-2">Ваш персональный трекер питания</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500" required />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Вход...' : 'Войти'}</button>
        </form>
        <button onClick={onSwitchToRegister} className="w-full mt-4 border-2 border-emerald-500 text-emerald-600 py-3 rounded-xl font-semibold hover:bg-emerald-50">Регистрация</button>
      </div>
    </div>
  );
}

function RegisterPage({ onRegister, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    email: '', password: '', gender: 'male', age: 25, weight: 70, height: 170,
    goal: 'maintain', activity: 'moderate', allergies: []
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (formData.password.length < 8) { setError('Пароль минимум 8 символов'); return; }
    if (formData.age < 1 || formData.age > 120) {
      setError('Возраст должен быть от 1 до 120 лет');
      return;
    }
    if (formData.height < 50 || formData.height > 300) {
      setError('Рост должен быть от 50 до 300 см');
      return;
    }
    if (formData.weight < 20 || formData.weight > 500) {
      setError('Вес должен быть от 20 до 500 кг');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.register(formData);
      const loginResult = await api.login(formData.email, formData.password);
      onRegister(loginResult.user);
    } catch (err) {
      setError(err.error || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-center mb-6">Создать аккаунт</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="px-4 py-2 border rounded-xl" required />
          <input placeholder="Пароль (мин 8 символов)" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="px-4 py-2 border rounded-xl" required />
          <input placeholder="Подтвердите пароль" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="px-4 py-2 border rounded-xl" required />
          <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="male">Мужской</option><option value="female">Женский</option></select>
          <input type="number" placeholder="Возраст" value={formData.age} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" />
          <input type="number" placeholder="Рост (см)" value={formData.height} onChange={(e) => setFormData({...formData, height: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" />
          <input type="number" placeholder="Вес (кг)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" />
          <select value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="weight_loss">Похудение</option><option value="maintain">Поддержание</option><option value="weight_gain">Набор веса</option></select>
          <select value={formData.activity} onChange={(e) => setFormData({...formData, activity: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="sedentary">Сидячий</option><option value="light">Лёгкая</option><option value="moderate">Умеренная</option><option value="active">Активная</option><option value="veryActive">Очень активная</option></select>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Аллергии (Ctrl+выбор):</label>
            <select multiple value={formData.allergies} onChange={(e) => { const options = Array.from(e.target.selectedOptions, option => option.value); setFormData({...formData, allergies: options}); }} className="w-full px-4 py-2 border rounded-xl h-24">
              <option value="milk">🥛 Молоко</option><option value="eggs">🥚 Яйца</option><option value="peanuts">🥜 Арахис</option><option value="gluten">🌾 Глютен</option><option value="fish">🐟 Рыба</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm md:col-span-2">{error}</p>}
          <button type="submit" disabled={loading} className="md:col-span-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
        </form>
        <button onClick={onSwitchToLogin} className="w-full mt-4 border-2 border-gray-300 text-gray-600 py-3 rounded-xl font-semibold hover:bg-gray-50">Назад</button>
      </div>
    </div>
  );
}

function SupportPage({ setPage, onLogout }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('bug');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !message) {
      alert('Заполните тему и сообщение');
      return;
    }
    setLoading(true);
    try {
      await api.createSupportTicket({ subject, message, type });
      setSuccess(true);
      setSubject('');
      setMessage('');
      setTimeout(() => setSuccess(false), 3000);
      logEvent('support_ticket', { type, subject });
    } catch (err) {
      alert('Ошибка отправки');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation setPage={setPage} onLogout={onLogout} />
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">💬</div>
            <h2 className="text-2xl font-bold">Обратная связь</h2>
            <p className="text-gray-500">Сообщите о проблеме или предложении</p>
          </div>
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
              ✅ Сообщение отправлено! Мы ответим вам на email.
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Тип обращения:</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-4 py-2 border rounded-xl">
                <option value="bug">🐛 Ошибка / Баг</option>
                <option value="suggestion">💡 Предложение по улучшению</option>
                <option value="question">❓ Вопрос о функционале</option>
                <option value="other">📝 Другое</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Тема:</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl"
                placeholder="Кратко опишите суть"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Сообщение:</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className="w-full px-4 py-2 border rounded-xl h-32"
                placeholder="Подробно опишите проблему или предложение..."
                required
              />
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
            >
              {loading ? 'Отправка...' : '📨 Отправить'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function UserTicketsPage({ setPage, onLogout }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      const data = await api.getUserTickets();
      setTickets(data);
    } catch (err) {
      console.error('Ошибка загрузки обращений:', err);
      alert('Не удалось загрузить обращения');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'new') return <span className="px-2 py-1 rounded-full text-xs bg-orange-500 text-white">Новое</span>;
    if (status === 'resolved') return <span className="px-2 py-1 rounded-full text-xs bg-green-600 text-white">Решено</span>;
    return <span className="px-2 py-1 rounded-full text-xs bg-gray-500 text-white">{status}</span>;
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'bug': return '🐛';
      case 'suggestion': return '💡';
      case 'question': return '❓';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation setPage={setPage} onLogout={onLogout} />
        <div className="flex items-center justify-center h-64">
          <div className="text-2xl text-gray-400">Загрузка обращений...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navigation setPage={setPage} onLogout={onLogout} />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            📋 Мои обращения
          </h1>
          <button 
            onClick={() => setPage('support')}
            className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
          >
            + Новое обращение
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">Нет обращений</h3>
            <p className="text-gray-400 mb-4">У вас ещё нет отправленных обращений</p>
            <button 
              onClick={() => setPage('support')}
              className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all"
            >
              Создать обращение
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(ticket => (
              <div 
                key={ticket.ticket_id} 
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer"
                onClick={() => setSelectedTicket(selectedTicket?.ticket_id === ticket.ticket_id ? null : ticket)}
              >
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{getTypeIcon(ticket.type)}</span>
                        <h3 className="font-semibold text-lg">{ticket.subject}</h3>
                      </div>
                      <p className="text-gray-600 text-sm line-clamp-2">{ticket.message}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                      {getStatusBadge(ticket.status)}
                      <span className="text-xs text-gray-400">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 text-right">
                    <span className="text-sm text-emerald-500">
                      {selectedTicket?.ticket_id === ticket.ticket_id ? '▲ Свернуть' : '▼ Подробнее'}
                    </span>
                  </div>
                </div>
                
                {selectedTicket?.ticket_id === ticket.ticket_id && (
                  <div className="bg-gray-50 border-t border-gray-100 p-5">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">👨‍💼</div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-700 mb-1">Ответ администратора:</div>
                        {ticket.admin_response ? (
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <p className="text-gray-700 whitespace-pre-wrap">{ticket.admin_response}</p>
                            <div className="mt-2 text-xs text-gray-400">
                              {ticket.status === 'resolved' && '✅ Обращение решено'}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
                            <p className="text-yellow-700">⏳ Ожидает ответа администратора</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminPage({ setPage, onLogout }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', calories: '', protein: '', fat: '', carbs: '' });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, productsData] = await Promise.all([
        api.getAdminStats(),
        api.getAdminProducts()
      ]);
      setStats(statsData);
      setProducts(productsData);
      setTickets(statsData.recent_tickets || []);
    } catch (err) {
      console.error('Ошибка загрузки админ-данных:', err);
      alert('Нет доступа к админ-панели');
      setPage('dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.calories) {
      alert('Заполните название и калории');
      return;
    }
    try {
      await api.addAdminProduct(newProduct);
      await loadData();
      setNewProduct({ name: '', calories: '', protein: '', fat: '', carbs: '' });
      alert('Продукт добавлен');
    } catch (err) {
      alert('Ошибка добавления');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Удалить продукт?')) return;
    try {
      await api.deleteAdminProduct(id);
      await loadData();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    const response = prompt('Ответ пользователю:');
    if (response === null) return;
    try {
      await api.resolveTicket(ticketId, response);
      await loadData();
      alert('Обращение отмечено как решённое');
    } catch (err) {
      alert('Ошибка');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white text-2xl">Загрузка админ-панели...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-bold text-purple-400">⚙️ AdminPanel</span>
              <div className="flex gap-2 ml-8">
                <button onClick={() => setActiveTab('dashboard')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'dashboard' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>📊 Статистика</button>
                <button onClick={() => setActiveTab('products')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'products' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>🍽️ Продукты</button>
                <button onClick={() => setActiveTab('tickets')} className={`px-4 py-2 rounded-lg transition-all ${activeTab === 'tickets' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}>🎫 Обращения</button>
              </div>
            </div>
            <button onClick={() => setPage('dashboard')} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all">Выйти из админки</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && stats && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-purple-300">📈 Общая статистика</h1>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-4xl mb-2">👥</div>
                <div className="text-2xl font-bold text-purple-400">{stats.total_users}</div>
                <div className="text-gray-400 text-sm">Пользователей</div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-4xl mb-2">📔</div>
                <div className="text-2xl font-bold text-purple-400">{stats.total_meals}</div>
                <div className="text-gray-400 text-sm">Записей дневника</div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-4xl mb-2">🎫</div>
                <div className="text-2xl font-bold text-orange-400">{stats.pending_tickets}</div>
                <div className="text-gray-400 text-sm">Новых обращений</div>
              </div>
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-4xl mb-2">🍽️</div>
                <div className="text-2xl font-bold text-purple-400">{stats.global_products}</div>
                <div className="text-gray-400 text-sm">Глобальных продуктов</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-4 text-purple-300">📋 Последние обращения</h2>
            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr className="text-left">
                    <th className="p-4">ID</th>
                    <th className="p-4">Пользователь</th>
                    <th className="p-4">Тема</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.ticket_id} className="border-b border-gray-700 hover:bg-gray-700/50">
                      <td className="p-4">#{ticket.ticket_id}</td>
                      <td className="p-4">{ticket.email}</td>
                      <td className="p-4">{ticket.subject}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${ticket.status === 'new' ? 'bg-orange-600 text-white' : 'bg-green-600 text-white'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {ticket.status === 'new' && (
                          <button onClick={() => handleResolveTicket(ticket.ticket_id)} className="px-3 py-1 bg-green-600 rounded-lg hover:bg-green-700">
                            ✅ Ответить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-purple-300">🍽️ Управление глобальными продуктами</h1>
            <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700 mb-8">
              <h2 className="text-xl font-bold mb-4">➕ Добавить продукт</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <input placeholder="Название" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white" />
                <input placeholder="Калории" type="number" value={newProduct.calories} onChange={(e) => setNewProduct({...newProduct, calories: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white" />
                <input placeholder="Белки" type="number" step="0.1" value={newProduct.protein} onChange={(e) => setNewProduct({...newProduct, protein: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white" />
                <input placeholder="Жиры" type="number" step="0.1" value={newProduct.fat} onChange={(e) => setNewProduct({...newProduct, fat: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white" />
                <input placeholder="Углеводы" type="number" step="0.1" value={newProduct.carbs} onChange={(e) => setNewProduct({...newProduct, carbs: e.target.value})} className="bg-gray-700 border border-gray-600 rounded-xl px-4 py-2 text-white" />
              </div>
              <button onClick={handleAddProduct} className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-xl transition-all">💾 Добавить</button>
            </div>

            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr className="text-left">
                    <th className="p-4">ID</th>
                    <th className="p-4">Название</th>
                    <th className="p-4">Ккал</th>
                    <th className="p-4">Б/Ж/У</th>
                    <th className="p-4">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b border-gray-700">
                      <td className="p-4">#{p.id}</td>
                      <td className="p-4">{p.name}</td>
                      <td className="p-4">{p.calories}</td>
                      <td className="p-4">{p.protein}/{p.fat}/{p.carbs}</td>
                      <td className="p-4">
                        <button onClick={() => handleDeleteProduct(p.id)} className="px-3 py-1 bg-red-600 rounded-lg hover:bg-red-700">
                          🗑️ Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tickets' && (
          <div>
            <h1 className="text-3xl font-bold mb-6 text-purple-300">🎫 Все обращения</h1>
            <div className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr className="text-left">
                    <th className="p-4">ID</th>
                    <th className="p-4">Пользователь</th>
                    <th className="p-4">Тип</th>
                    <th className="p-4">Тема</th>
                    <th className="p-4">Сообщение</th>
                    <th className="p-4">Статус</th>
                    <th className="p-4">Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.ticket_id} className="border-b border-gray-700">
                      <td className="p-4">#{t.ticket_id}</td>
                      <td className="p-4">{t.email}</td>
                      <td className="p-4">{t.type}</td>
                      <td className="p-4">{t.subject}</td>
                      <td className="p-4 max-w-xs truncate">{t.message}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${t.status === 'new' ? 'bg-orange-600' : 'bg-green-600'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {t.status === 'new' && (
                          <button onClick={() => handleResolveTicket(t.ticket_id)} className="px-3 py-1 bg-green-600 rounded-lg hover:bg-green-700">
                            ✅ Ответить
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AddProductForm({ products, onAdd, onRefreshProducts }) {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [weight, setWeight] = useState(100);
  const [mealType, setMealType] = useState('завтрак');
  const [showProductForm, setShowProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '', calories: '', protein: '', fat: '', carbs: '', allergens: []
  });
  const [creating, setCreating] = useState(false);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const multiplier = weight / 100;
  const calculatedCalories = selectedProduct ? Math.round(selectedProduct.calories * multiplier) : 0;

  const handleAdd = async () => {
    if (!selectedProduct) return;
    const currentDate = new Date().toISOString().split('T')[0];
    try {
      await api.addMeal({
        productId: selectedProductId,
        date: currentDate,
        mealType,
        weight,
        calories: calculatedCalories,
        protein: +(selectedProduct.protein * multiplier).toFixed(1),
        fat: +(selectedProduct.fat * multiplier).toFixed(1),
        carbs: +(selectedProduct.carbs * multiplier).toFixed(1)
      });
      onAdd();
      setWeight(100);
    } catch (err) {
      alert('Ошибка добавления продукта');
    }
  };

  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.calories) {
      alert('Заполните название и калорийность');
      return;
    }
    
    setCreating(true);
    try {
      const duplicateCheck = await api.checkUserProductDuplicate(newProduct.name);
      if (duplicateCheck.exists) {
        alert('Продукт с таким названием уже есть в вашей личной базе');
        setCreating(false);
        return;
      }
      
      await api.createPersonalProduct({
        name: newProduct.name,
        calories: Number(newProduct.calories),
        protein: Number(newProduct.protein) || 0,
        fat: Number(newProduct.fat) || 0,
        carbs: Number(newProduct.carbs) || 0,
        allergens: newProduct.allergens
      });
      
      alert('Продукт успешно создан!');
      setShowProductForm(false);
      setNewProduct({ name: '', calories: '', protein: '', fat: '', carbs: '', allergens: [] });
      
      if (onRefreshProducts) {
        await onRefreshProducts();
      }
    } catch (err) {
      alert(err.error || 'Ошибка создания продукта');
    } finally {
      setCreating(false);
    }
  };

  if (products.length === 0) {
    return <div className="bg-white rounded-2xl shadow-lg p-6 text-center">Загрузка продуктов...</div>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-xl font-bold mb-4">➕ Добавить продукт</h3>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-2">Выберите продукт:</label>
          <select 
            value={selectedProductId} 
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="w-full px-4 py-2 border rounded-xl mb-3"
          >
            <option value="">-- Выберите продукт --</option>
            <optgroup label="🍽️ Глобальные продукты">
              {products.filter(p => p.is_global === undefined || p.is_global === true || p.is_global === 1).map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.calories} ккал/100г</option>
              ))}
            </optgroup>
            <optgroup label="👤 Мои продукты">
              {products.filter(p => p.is_global === false || p.is_global === 0).map(p => (
                <option key={p.id} value={p.id}>{p.name} - {p.calories} ккал/100г</option>
              ))}
            </optgroup>
          </select>
          
          <button 
            onClick={() => setShowProductForm(!showProductForm)} 
            className="w-full bg-purple-100 text-purple-700 py-2 rounded-xl hover:bg-purple-200 transition-all"
          >
            {showProductForm ? '✖️ Отмена' : '✨ Создать свой продукт'}
          </button>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Прием пищи:</label>
          <select 
            value={mealType} 
            onChange={(e) => setMealType(e.target.value)} 
            className="w-full px-4 py-2 border rounded-xl mb-3"
          >
            <option value="завтрак">🍳 Завтрак</option>
            <option value="обед">🍲 Обед</option>
            <option value="ужин">🍽️ Ужин</option>
            <option value="перекус">🍎 Перекус</option>
          </select>
          
          <label className="block text-sm font-medium mb-2">Вес (грамм):</label>
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(Number(e.target.value))} 
            className="w-full px-4 py-2 border rounded-xl" 
            min="1" 
            max="5000" 
          />
        </div>
      </div>
      
      {selectedProduct && (
        <div className="mt-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl">
          <h4 className="font-semibold mb-2">📊 КБЖУ для {weight} грамм:</h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><span className="text-2xl font-bold text-orange-600">{calculatedCalories}</span><br/>ккал</div>
            <div><span className="text-2xl font-bold text-red-600">{(selectedProduct.protein * multiplier).toFixed(1)}</span><br/>белки</div>
            <div><span className="text-2xl font-bold text-orange-600">{(selectedProduct.fat * multiplier).toFixed(1)}</span><br/>жиры</div>
            <div><span className="text-2xl font-bold text-green-600">{(selectedProduct.carbs * multiplier).toFixed(1)}</span><br/>углеводы</div>
          </div>
        </div>
      )}
      
      <button 
        onClick={handleAdd} 
        disabled={!selectedProduct}
        className="w-full mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:from-emerald-600 hover:to-teal-600 transition-all"
      >
        ✅ Добавить продукт
      </button>
      
      {showProductForm && (
        <div className="mt-6 pt-6 border-t-2 border-gray-100">
          <h4 className="font-bold text-lg mb-4">✨ Новый продукт</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <input 
              placeholder="Название продукта" 
              value={newProduct.name} 
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
              className="px-4 py-2 border rounded-xl"
            />
            <input 
              placeholder="Калории на 100г (ккал)" 
              type="number" 
              value={newProduct.calories} 
              onChange={(e) => setNewProduct({...newProduct, calories: e.target.value})} 
              className="px-4 py-2 border rounded-xl"
            />
            <input 
              placeholder="Белки на 100г (г)" 
              type="number" 
              value={newProduct.protein} 
              onChange={(e) => setNewProduct({...newProduct, protein: e.target.value})} 
              className="px-4 py-2 border rounded-xl"
            />
            <input 
              placeholder="Жиры на 100г (г)" 
              type="number" 
              value={newProduct.fat} 
              onChange={(e) => setNewProduct({...newProduct, fat: e.target.value})} 
              className="px-4 py-2 border rounded-xl"
            />
            <input 
              placeholder="Углеводы на 100г (г)" 
              type="number" 
              value={newProduct.carbs} 
              onChange={(e) => setNewProduct({...newProduct, carbs: e.target.value})} 
              className="px-4 py-2 border rounded-xl"
            />
            <div>
              <label className="block text-sm font-medium mb-1">Аллергены (Ctrl+выбор):</label>
              <select 
                multiple 
                value={newProduct.allergens} 
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setNewProduct({...newProduct, allergens: options});
                }} 
                className="w-full px-4 py-2 border rounded-xl h-24"
              >
                <option value="milk">🥛 Молоко</option>
                <option value="eggs">🥚 Яйца</option>
                <option value="peanuts">🥜 Арахис</option>
                <option value="gluten">🌾 Глютен</option>
                <option value="fish">🐟 Рыба</option>
              </select>
            </div>
          </div>
          <button 
            onClick={handleCreateProduct} 
            disabled={creating}
            className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50"
          >
            {creating ? 'Создание...' : '💾 Сохранить продукт'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('login');
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [foodRecords, setFoodRecords] = useState([]);
  const [waterRecords, setWaterRecords] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyNorm, setDailyNorm] = useState({ calories: 2000, water: 2100 });
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [waterAmount, setWaterAmount] = useState(250);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editingMeal, setEditingMeal] = useState(null);
  const [editWeight, setEditWeight] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prods, meals, water, stats, norm] = await Promise.all([
        api.getGlobalProducts(),
        api.getMeals(selectedDate),
        api.getWater(selectedDate),
        api.getWeeklyStats(),
        api.getDailyNorm(),
      ]);
      setProducts(prods || []);
      setFoodRecords(meals || []);
      setWaterRecords(water || []);
      setWeeklyStats(stats || []);
      setDailyNorm(norm);
    } catch (err) {
      console.error('Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getCurrentUser().then(setUser).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, selectedDate]);

  useEffect(() => {
    if (weeklyStats.length > 0 && dailyNorm.calories) {
      setWeeklyStats(prev => prev.map(day => ({
        ...day,
        norm: dailyNorm.calories
      })));
    }
  }, [dailyNorm.calories]);

  useEffect(() => {
    if (user?.is_admin && window.location.hash === '#admin') {
      setPage('admin');
    }
  }, [user, window.location.hash]);
  
  const handleLogin = (userData) => {
  setUser(userData);
  setPage('dashboard');
  const isAdminValue = userData.is_admin === 1 ? 'true' : 'false';
  localStorage.setItem('is_admin', isAdminValue);
  console.log('Сохранено в localStorage: is_admin =', isAdminValue);
  logEvent('login', { email: userData.email });
};

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    setPage('login');
    localStorage.removeItem('is_admin');
    logEvent('logout', {});
  };

  const handleRefresh = () => loadData();

  const handleDeleteMeal = async (recordId) => {
    if (!confirm('Удалить запись?')) return;
    try {
      await api.deleteMeal(recordId);
      handleRefresh();
    } catch (err) {
      alert('Ошибка удаления');
    }
  };

  const handleEditMeal = (record) => {
    setEditingMeal(record);
    setEditWeight(record.weight.toString());
  };

  const handleSaveEditMeal = async () => {
    if (!editingMeal) return;
    const newWeight = Number(editWeight);
    if (isNaN(newWeight) || newWeight <= 0) {
      alert('Введите корректный вес');
      return;
    }
    
    try {
      await api.deleteMeal(editingMeal.id);
      
      const product = products.find(p => p.name === editingMeal.productName);
      if (product) {
        const multiplier = newWeight / 100;
        await api.addMeal({
          productId: product.id,
          date: selectedDate,
          mealType: editingMeal.mealType,
          weight: newWeight,
          calories: Math.round(product.calories * multiplier),
          protein: +(product.protein * multiplier).toFixed(1),
          fat: +(product.fat * multiplier).toFixed(1),
          carbs: +(product.carbs * multiplier).toFixed(1)
        });
      }
      
      setEditingMeal(null);
      setEditWeight('');
      handleRefresh();
    } catch (err) {
      alert('Ошибка редактирования');
    }
  };

  const totalWater = waterRecords.reduce((sum, r) => sum + (r.amount || 0), 0);
  const waterProgress = dailyNorm.water > 0 ? (totalWater / dailyNorm.water) * 100 : 0;
  const dailyTotals = foodRecords.reduce((totals, r) => {
    totals.calories += r.calories || 0;
    totals.protein += r.protein || 0;
    totals.fat += r.fat || 0;
    totals.carbs += r.carbs || 0;
    return totals;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  const progress = dailyNorm.calories > 0 ? (dailyTotals.calories / dailyNorm.calories) * 100 : 0;

  const meals = {
    завтрак: foodRecords.filter(r => r.mealType === 'завтрак'),
    обед: foodRecords.filter(r => r.mealType === 'обед'),
    ужин: foodRecords.filter(r => r.mealType === 'ужин'),
    перекус: foodRecords.filter(r => r.mealType === 'перекус')
  };

  const bjuData = [
    { name: 'Белки', value: dailyTotals.protein, color: '#ef4444' },
    { name: 'Жиры', value: dailyTotals.fat, color: '#f59e0b' },
    { name: 'Углеводы', value: dailyTotals.carbs, color: '#10b981' }
  ].filter(d => d.value > 0);

  const addWater = async () => {
    if (waterAmount <= 0) {
      alert('Введите корректное количество воды');
      return;
    }
    if (waterAmount > 5000) {
      alert('Нельзя добавить более 5000 мл за один раз');
      return;
    }
    try {
      await api.addWater({ date: selectedDate, time: new Date().toLocaleTimeString(), amount: waterAmount });
      handleRefresh();
      setWaterAmount(250);
    } catch (err) {
      alert('Ошибка добавления воды');
    }
  };

  const handleProfileSave = async () => {
    if (!editData) return;
    try {
      await api.updateProfile(editData);
      const updated = await api.getCurrentUser();
      setUser(updated);
      const norm = await api.getDailyNorm();
      setDailyNorm(norm);
      setIsEditing(false);
      alert('Профиль обновлён');
      handleRefresh();
    } catch (err) {
      alert('Ошибка обновления профиля');
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-2xl">Загрузка... 🍎</div>;
  }

  if (!user && page !== 'register') {
    return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <RegisterPage onRegister={handleLogin} onSwitchToLogin={() => setPage('login')} />;
  }

  if (page === 'dashboard') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation setPage={setPage} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3">🔥 Прогресс по калориям</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-2"><span>{dailyTotals.calories} ккал</span><span>{dailyNorm.calories} ккал</span></div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden"><div className="bg-gradient-to-r from-orange-500 to-red-500 h-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }}></div></div>
              <div className="grid grid-cols-3 gap-3 mt-4 text-center text-sm">
                <div className="bg-red-50 rounded-xl p-2"><span className="text-red-600 font-bold">{dailyTotals.protein}g</span><br/>🥩 Белки</div>
                <div className="bg-orange-50 rounded-xl p-2"><span className="text-orange-600 font-bold">{dailyTotals.fat}g</span><br/>🧈 Жиры</div>
                <div className="bg-green-50 rounded-xl p-2"><span className="text-green-600 font-bold">{dailyTotals.carbs}g</span><br/>🍚 Углеводы</div>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-3">💧 Прогресс по воде</h3>
              <div className="flex justify-between text-sm text-gray-600 mb-2"><span>{totalWater} мл</span><span>{dailyNorm.water} мл</span></div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden"><div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all" style={{ width: `${Math.min(waterProgress, 100)}%` }}></div></div>
              <div className="mt-4"><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border rounded-xl" /></div>
            </div>
          </div>
          <AddProductForm products={products} onAdd={handleRefresh} onRefreshProducts={loadData} />
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4">📔 Дневник питания</h3>
            {foodRecords.length === 0 ? <div className="text-center py-8 text-gray-400">Нет записей за сегодня</div> : (
              <div className="space-y-4">
                {Object.entries(meals).map(([meal, records]) => records.length > 0 && (
                  <div key={meal}>
                    <h4 className="font-bold text-lg border-b-2 pb-2 mb-2">{meal === 'завтрак' && '🍳'} {meal === 'обед' && '🍲'} {meal === 'ужин' && '🍽️'} {meal === 'перекус' && '🍎'} {meal.charAt(0).toUpperCase() + meal.slice(1)}</h4>
                    {records.map(record => (
                      <div key={record.id} className="flex justify-between items-center py-2 border-b group">
                        <div className="flex-1">
                          <span className="font-medium">{record.productName}</span>
                          <span className="text-sm text-gray-500 ml-2">{record.weight}г</span>
                          <div className="text-xs text-gray-400">
                            🥩{record.protein}г 🧈{record.fat}г 🍚{record.carbs}г
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-orange-600">{record.calories} ккал</span>
                          <button 
                            onClick={() => handleEditMeal(record)}
                            className="opacity-0 group-hover:opacity-100 transition-all text-blue-500 hover:text-blue-700"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button 
                            onClick={() => handleDeleteMeal(record.id)}
                            className="opacity-0 group-hover:opacity-100 transition-all text-red-500 hover:text-red-700"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="pt-3 border-t-2 text-right font-bold text-lg">Всего: {dailyTotals.calories} ккал</div>
              </div>
            )}
            {editingMeal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-6 w-96">
                  <h3 className="text-xl font-bold mb-4">Редактировать запись</h3>
                  <p className="mb-2">Продукт: <strong>{editingMeal.productName}</strong></p>
                  <label className="block text-sm font-medium mb-2">Вес (грамм):</label>
                  <input 
                    type="number" 
                    value={editWeight} 
                    onChange={(e) => setEditWeight(e.target.value)} 
                    className="w-full px-4 py-2 border rounded-xl mb-4"
                    min="1"
                    max="5000"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleSaveEditMeal} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl">Сохранить</button>
                    <button onClick={() => { setEditingMeal(null); setEditWeight(''); }} className="flex-1 border py-2 rounded-xl">Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'stats') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation setPage={setPage} onLogout={handleLogout} />
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">📊 Статистика за неделю</h2>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Динамика калорий</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#f59e0b" name="Факт (ккал)" strokeWidth={2} />
                <Line 
                  type="monotone" 
                  dataKey="norm" 
                  stroke="#10b981" 
                  name={`Норма: ${dailyNorm.calories} ккал`} 
                  strokeDasharray="5 5" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Нутриенты по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" fill="#ef4444" name="Белки" />
                <Bar dataKey="fat" fill="#f59e0b" name="Жиры" />
                <Bar dataKey="carbs" fill="#10b981" name="Углеводы" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Распределение КБЖУ за сегодня</h3>
            {bjuData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={bjuData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {bjuData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-8 text-gray-400">Нет данных</div>}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'water') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation setPage={setPage} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">💧</div>
              <h2 className="text-2xl font-bold">Трекер воды</h2>
            </div>
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Выпито: {totalWater} мл</span>
                <span>Норма: {dailyNorm.water} мл</span>
              </div>
              <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-full transition-all" style={{ width: `${Math.min(waterProgress, 100)}%` }}></div>
              </div>
            </div>
            <div className="text-center mb-4">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="px-4 py-2 border rounded-xl" />
            </div>
            <div className="mb-6">
              <div className="flex gap-2 flex-wrap mb-3">
                {[200, 250, 300, 500].map(amount => (
                  <button key={amount} onClick={() => setWaterAmount(amount)} className={`px-5 py-2 rounded-xl transition-all ${waterAmount === amount ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {amount} мл
                  </button>
                ))}
              </div>
              <input type="number" value={waterAmount} onChange={(e) => setWaterAmount(Number(e.target.value))} className="w-full px-4 py-2 border rounded-xl" min="50" max="1000" step="50" />
            </div>
            <button onClick={addWater} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all">
              💧 Добавить воду
            </button>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold mb-4">📋 История воды</h3>
            {waterRecords.length === 0 ? (
              <div className="text-center py-8 text-gray-400">Нет записей</div>
            ) : (
              waterRecords.map(record => (
                <div key={record.id} className="flex justify-between items-center py-2 border-b">
                  <span>{record.amount} мл</span>
                  <span className="text-sm text-gray-500">{record.time}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation setPage={setPage} onLogout={handleLogout} />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-2">👤</div>
              <h2 className="text-2xl font-bold">Профиль</h2>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="px-4 py-2 border rounded-xl" placeholder="Email" />
                <select value={editData.gender} onChange={(e) => setEditData({...editData, gender: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="male">Мужской</option><option value="female">Женский</option></select>
                <input type="number" value={editData.age} onChange={(e) => setEditData({...editData, age: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" placeholder="Возраст" />
                <input type="number" value={editData.height} onChange={(e) => setEditData({...editData, height: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" placeholder="Рост" />
                <input type="number" value={editData.weight} onChange={(e) => setEditData({...editData, weight: Number(e.target.value)})} className="px-4 py-2 border rounded-xl" placeholder="Вес" />
                <select value={editData.goal} onChange={(e) => setEditData({...editData, goal: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="weight_loss">Похудение</option><option value="maintain">Поддержание</option><option value="weight_gain">Набор веса</option></select>
                <select value={editData.activity} onChange={(e) => setEditData({...editData, activity: e.target.value})} className="px-4 py-2 border rounded-xl"><option value="sedentary">Сидячий</option><option value="light">Лёгкая</option><option value="moderate">Умеренная</option><option value="active">Активная</option><option value="veryActive">Очень активная</option></select>
                <div className="md:col-span-2 flex gap-4">
                  <button onClick={handleProfileSave} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl">Сохранить</button>
                  <button onClick={() => setIsEditing(false)} className="flex-1 border py-2 rounded-xl">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">📧 Email:</span> {user?.email}</div>
                  <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">🎂 Возраст:</span> {user?.age} лет</div>
                  <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">📏 Рост:</span> {user?.height} см</div>
                  <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">⚖️ Вес:</span> {user?.weight} кг</div>
                  <div className="bg-gray-50 rounded-xl p-3"><span className="text-gray-500">🎯 Цель:</span> {user?.goal === 'weight_loss' ? 'Похудение' : user?.goal === 'maintain' ? 'Поддержание' : 'Набор веса'}</div>
                </div>
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 text-center">
                  <div className="text-sm text-gray-600">Норма калорий</div>
                  <div className="text-3xl font-bold text-emerald-600">{dailyNorm.calories} ккал/день</div>
                  <div className="text-sm text-gray-600 mt-2">Норма воды</div>
                  <div className="text-2xl font-bold text-blue-600">{dailyNorm.water} мл/день</div>
                </div>
                <button 
                  onClick={() => { setEditData(user); setIsEditing(true); }} 
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md"
                >
                  ✏️ Редактировать профиль
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (page === 'support') {
    return <SupportPage setPage={setPage} onLogout={handleLogout} />;
  }
  
  if (page === 'myTickets') {
    return <UserTicketsPage setPage={setPage} onLogout={handleLogout} />;
  }
  
  if (page === 'admin') {
    return <AdminPage setPage={setPage} onLogout={handleLogout} />;
  }
  
  return null;
}