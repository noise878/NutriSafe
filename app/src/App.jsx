import { useState, useEffect, useRef } from 'react';
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


const COLORS = {
  accent: '#C9A961',
  protein: '#C98787',
  fat: '#D6A56B',
  carbs: '#83AC91',
  water: '#7CA3CC',
  danger: '#C97575',
};

function GlobalStyle() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      :root {
        --bg-base: #0D0F12;
        --bg-raised: #15171B;
        --bg-raised-2: #1B1E23;
        --bg-input: #131519;
        --border-subtle: rgba(255,255,255,0.08);
        --border-medium: rgba(255,255,255,0.16);
        --text-primary: #F1F0EB;
        --text-secondary: #9CA1AA;
        --text-tertiary: #676C75;
        --accent: ${COLORS.accent};
        --accent-soft: rgba(201,169,97,0.12);
        --accent-border: rgba(201,169,97,0.38);
        --accent-hover: #DBC181;
        --protein: ${COLORS.protein};
        --fat: ${COLORS.fat};
        --carbs: ${COLORS.carbs};
        --water: ${COLORS.water};
        --danger: ${COLORS.danger};
        --radius-lg: 20px;
        --radius-md: 14px;
        --radius-sm: 10px;
        --ease: cubic-bezier(0.4, 0, 0.2, 1);
      }

      .app-bg, .app-bg * { font-family: 'Inter', system-ui, -apple-system, sans-serif; }
      .app-bg {
        min-height: 100vh;
        background:
          radial-gradient(circle at 18% -10%, rgba(201,169,97,0.05), transparent 45%),
          radial-gradient(circle at 100% 0%, rgba(124,163,204,0.04), transparent 40%),
          var(--bg-base);
        color: var(--text-primary);
      }

      ::-webkit-scrollbar { width: 10px; height: 10px; }
      ::-webkit-scrollbar-track { background: var(--bg-base); }
      ::-webkit-scrollbar-thumb { background: var(--bg-raised-2); border-radius: 999px; border: 2px solid var(--bg-base); }
      ::-webkit-scrollbar-thumb:hover { background: #262A31; }

      .glass-card {
        background: var(--bg-raised);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-lg);
        box-shadow: 0 24px 60px -30px rgba(0,0,0,0.6);
        transition: border-color .3s var(--ease);
      }
      .glass-card:hover { border-color: var(--border-medium); }

      .glass-panel {
        background: var(--bg-raised-2);
        border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md);
      }

      .nav-shell {
        background: rgba(13,15,18,0.72);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-bottom: 1px solid var(--border-subtle);
      }
      .nav-link {
        padding: .6rem 1.05rem;
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        font-size: .84rem;
        font-weight: 500;
        border: 1px solid transparent;
        transition: all .3s var(--ease);
        white-space: nowrap;
      }
      .nav-link:hover { color: var(--text-primary); background: rgba(255,255,255,0.045); }
      .nav-link.active { color: var(--accent); background: var(--accent-soft); border-color: var(--accent-border); }

      .btn {
        display: inline-flex; align-items: center; justify-content: center; gap: .5rem;
        padding: .75rem 1.5rem; border-radius: var(--radius-md);
        font-weight: 500; font-size: .875rem; letter-spacing: .01em;
        border: 1px solid transparent; cursor: pointer;
        transition: all .3s var(--ease);
      }
      .btn:disabled { opacity: .4; cursor: not-allowed; transform: none !important; box-shadow: none !important; }
      .btn-primary { background: var(--accent-soft); color: var(--accent); border-color: var(--accent-border); }
      .btn-primary:hover:not(:disabled) { background: rgba(201,169,97,0.2); border-color: var(--accent); transform: translateY(-1px); box-shadow: 0 10px 28px -12px rgba(201,169,97,0.4); }
      .btn-secondary { background: var(--bg-raised-2); color: var(--text-primary); border-color: var(--border-subtle); }
      .btn-secondary:hover:not(:disabled) { border-color: var(--border-medium); background: #202329; }
      .btn-ghost { background: transparent; color: var(--text-secondary); border-color: var(--border-subtle); }
      .btn-ghost:hover:not(:disabled) { color: var(--text-primary); border-color: var(--border-medium); }
      .btn-danger { background: rgba(201,117,117,0.1); color: var(--danger); border-color: rgba(201,117,117,0.32); }
      .btn-danger:hover:not(:disabled) { background: rgba(201,117,117,0.18); border-color: var(--danger); }
      .btn-sm { padding: .45rem 1rem; font-size: .8rem; }

      .field {
        width: 100%; background: var(--bg-input); border: 1px solid var(--border-subtle);
        border-radius: var(--radius-md); padding: .75rem 1rem; color: var(--text-primary);
        font-size: .875rem; transition: all .3s var(--ease);
      }
      .field::placeholder { color: var(--text-tertiary); }
      .field:focus { outline: none; border-color: var(--accent-border); box-shadow: 0 0 0 3px var(--accent-soft); }
      .field-label {
        display: block; font-size: .7rem; letter-spacing: .08em; text-transform: uppercase;
        color: var(--text-tertiary); margin-bottom: .5rem; font-weight: 600;
      }

      .eyebrow { font-size: .7rem; letter-spacing: .18em; text-transform: uppercase; color: var(--accent); font-weight: 600; }
      .heading-xl { font-size: 1.9rem; font-weight: 600; letter-spacing: -.01em; color: var(--text-primary); }
      .heading-lg { font-size: 1.4rem; font-weight: 600; letter-spacing: -.005em; color: var(--text-primary); }
      .heading-md { font-size: 1.05rem; font-weight: 600; color: var(--text-primary); letter-spacing: .01em; }
      .text-muted { color: var(--text-secondary); }
      .text-faint { color: var(--text-tertiary); }

      .progress-track { background: var(--bg-raised-2); border-radius: 999px; height: .5rem; overflow: hidden; border: 1px solid var(--border-subtle); }
      .progress-fill { height: 100%; border-radius: 999px; transition: width .7s var(--ease); }

      .badge {
        display: inline-flex; align-items: center; padding: .3rem .8rem; border-radius: 999px;
        font-size: .68rem; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; border: 1px solid transparent;
      }
      .badge-pending { background: rgba(214,165,107,0.12); color: var(--fat); border-color: rgba(214,165,107,0.32); }
      .badge-resolved { background: rgba(131,172,145,0.12); color: var(--carbs); border-color: rgba(131,172,145,0.32); }
      .badge-neutral { background: var(--bg-raised-2); color: var(--text-secondary); border-color: var(--border-subtle); }

      .stat-number { font-size: 1.9rem; font-weight: 600; color: var(--accent); letter-spacing: -.01em; }

      .data-table { width: 100%; border-collapse: collapse; }
      .data-table th {
        text-align: left; padding: 1rem 1.25rem; font-size: .68rem; text-transform: uppercase;
        letter-spacing: .08em; color: var(--text-tertiary); font-weight: 600; border-bottom: 1px solid var(--border-subtle);
      }
      .data-table td { padding: 1rem 1.25rem; border-bottom: 1px solid var(--border-subtle); color: var(--text-secondary); font-size: .875rem; }
      .data-table tr:last-child td { border-bottom: none; }
      .data-table tbody tr { transition: background .3s var(--ease); }
      .data-table tbody tr:hover { background: rgba(255,255,255,0.02); }

      .alert-success { background: rgba(131,172,145,0.1); border: 1px solid rgba(131,172,145,0.32); color: var(--carbs); padding: 1rem 1.25rem; border-radius: var(--radius-md); font-size: .875rem; }
      .alert-pending { background: rgba(214,165,107,0.08); border: 1px solid rgba(214,165,107,0.25); color: var(--fat); padding: 1rem 1.25rem; border-radius: var(--radius-md); font-size: .875rem; }

      .modal-overlay {
        position: fixed; inset: 0; background: rgba(5,6,8,0.72); backdrop-filter: blur(6px);
        display: flex; align-items: center; justify-content: center; z-index: 50; padding: 1rem;
        animation: fadeIn .25s var(--ease);
      }
      .modal-card { animation: scaleIn .3s var(--ease); }

      .row-divider { border-bottom: 1px solid var(--border-subtle); }

      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scaleIn { from { opacity: 0; transform: scale(.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      @keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
      .reveal { opacity: 0; transform: translateY(14px); }
      .reveal.in-view { animation: fadeInUp .7s var(--ease) forwards; }

      .icon-btn { opacity: 0; transition: all .3s var(--ease); }
      .group:hover .icon-btn { opacity: 1; }
    `}</style>
  );
}


function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${visible ? 'in-view' : ''} ${className}`} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const CHART_GRID = 'rgba(255,255,255,0.08)';
const CHART_TEXT = '#9CA1AA';
const chartTooltipStyle = {
  background: '#15171B',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 12,
  color: '#F1F0EB',
  fontSize: 13,
};

function Navigation({ setPage, onLogout, currentPage }) {
  const isAdmin = localStorage.getItem('is_admin') === 'true';
  const links = [
    { key: 'dashboard', label: 'Дашборд', icon: '📊' },
    { key: 'stats', label: 'Статистика', icon: '📈' },
    { key: 'water', label: 'Вода', icon: '💧' },
    { key: 'profile', label: 'Профиль', icon: '👤' },
    { key: 'myTickets', label: 'Мои обращения', icon: '📋' },
    { key: 'support', label: 'Поддержка', icon: '💬' },
  ];

  return (
    <nav className="nav-shell sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-center flex-wrap gap-2 py-4">
          {links.map(l => (
            <button
              key={l.key}
              onClick={() => setPage(l.key)}
              className={`nav-link ${currentPage === l.key ? 'active' : ''}`}
            >
              <span className="mr-1.5">{l.icon}</span>{l.label}
            </button>
          ))}

          {isAdmin && (
            <button
              onClick={() => setPage('admin')}
              className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
            >
              ⚙️ Админка
            </button>
          )}

          <button onClick={onLogout} className="nav-link" style={{ color: 'var(--danger)' }}>
            🚪 Выход
          </button>
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
    <div className="app-bg flex items-center justify-center p-4">
      <GlobalStyle />
      <Reveal className="glass-card w-full max-w-md p-10">
        <div className="text-center mb-10">
          <div className="text-5xl mb-5">🍎</div>
          <h1 className="heading-xl">NutriTrack</h1>
          <p className="text-muted mt-2 text-sm">Ваш персональный трекер питания</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="field" required />
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} className="field" required />
          {error && <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading ? 'Вход...' : 'Войти'}</button>
        </form>
        <button onClick={onSwitchToRegister} className="btn btn-ghost w-full mt-4">Регистрация</button>
      </Reveal>
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
    <div className="app-bg flex items-center justify-center p-4">
      <GlobalStyle />
      <Reveal className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10">
        <h2 className="heading-lg text-center mb-8">Создать аккаунт</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="field" required />
          <input placeholder="Пароль (мин 8 символов)" type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="field" required />
          <input placeholder="Подтвердите пароль" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="field" required />
          <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="field"><option value="male">Мужской</option><option value="female">Женский</option></select>
          <input type="number" placeholder="Возраст" value={formData.age} onChange={(e) => setFormData({...formData, age: Number(e.target.value)})} className="field" />
          <input type="number" placeholder="Рост (см)" value={formData.height} onChange={(e) => setFormData({...formData, height: Number(e.target.value)})} className="field" />
          <input type="number" placeholder="Вес (кг)" value={formData.weight} onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})} className="field" />
          <select value={formData.goal} onChange={(e) => setFormData({...formData, goal: e.target.value})} className="field"><option value="weight_loss">Похудение</option><option value="maintain">Поддержание</option><option value="weight_gain">Набор веса</option></select>
          <select value={formData.activity} onChange={(e) => setFormData({...formData, activity: e.target.value})} className="field"><option value="sedentary">Сидячий</option><option value="light">Лёгкая</option><option value="moderate">Умеренная</option><option value="active">Активная</option><option value="veryActive">Очень активная</option></select>
          <div className="md:col-span-2">
            <label className="field-label">Аллергии (Ctrl+выбор):</label>
            <select multiple value={formData.allergies} onChange={(e) => { const options = Array.from(e.target.selectedOptions, option => option.value); setFormData({...formData, allergies: options}); }} className="field h-24">
              <option value="milk">🥛 Молоко</option><option value="eggs">🥚 Яйца</option><option value="peanuts">🥜 Арахис</option><option value="gluten">🌾 Глютен</option><option value="fish">🐟 Рыба</option>
            </select>
          </div>
          {error && <p className="text-sm md:col-span-2" style={{ color: 'var(--danger)' }}>{error}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary md:col-span-2">{loading ? 'Регистрация...' : 'Зарегистрироваться'}</button>
        </form>
        <button onClick={onSwitchToLogin} className="btn btn-ghost w-full mt-4">Назад</button>
      </Reveal>
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
    <div className="app-bg">
      <GlobalStyle />
      <Navigation setPage={setPage} onLogout={onLogout} currentPage="support" />
      <div className="max-w-2xl mx-auto px-4 py-10">
        <Reveal className="glass-card p-10">
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">💬</div>
            <h2 className="heading-lg">Обратная связь</h2>
            <p className="text-muted mt-1 text-sm">Сообщите о проблеме или предложении</p>
          </div>

          {success && (
            <div className="alert-success mb-5">
              ✅ Сообщение отправлено! Мы ответим вам на email.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="field-label">Тип обращения:</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className="field">
                <option value="bug">🐛 Ошибка / Баг</option>
                <option value="suggestion">💡 Предложение по улучшению</option>
                <option value="question">❓ Вопрос о функционале</option>
                <option value="other">📝 Другое</option>
              </select>
            </div>

            <div>
              <label className="field-label">Тема:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="field"
                placeholder="Кратко опишите суть"
                required
              />
            </div>

            <div>
              <label className="field-label">Сообщение:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="field h-32"
                placeholder="Подробно опишите проблему или предложение..."
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full"
            >
              {loading ? 'Отправка...' : '📨 Отправить'}
            </button>
          </form>
        </Reveal>
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
    if (status === 'new') return <span className="badge badge-pending">Новое</span>;
    if (status === 'resolved') return <span className="badge badge-resolved">Решено</span>;
    return <span className="badge badge-neutral">{status}</span>;
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
      <div className="app-bg">
        <GlobalStyle />
        <Navigation setPage={setPage} onLogout={onLogout} currentPage="myTickets" />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-faint">Загрузка обращений...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-bg">
      <GlobalStyle />
      <Navigation setPage={setPage} onLogout={onLogout} currentPage="myTickets" />

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="heading-lg">📋 Мои обращения</h1>
          <button
            onClick={() => setPage('support')}
            className="btn btn-primary btn-sm"
          >
            + Новое обращение
          </button>
        </div>

        {tickets.length === 0 ? (
          <Reveal className="glass-card p-16 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="heading-md mb-2">Нет обращений</h3>
            <p className="text-faint mb-6 text-sm">У вас ещё нет отправленных обращений</p>
            <button
              onClick={() => setPage('support')}
              className="btn btn-primary"
            >
              Создать обращение
            </button>
          </Reveal>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket, i) => (
              <Reveal key={ticket.ticket_id} delay={i * 40}>
                <div
                  className="glass-card overflow-hidden cursor-pointer"
                  onClick={() => setSelectedTicket(selectedTicket?.ticket_id === ticket.ticket_id ? null : ticket)}
                >
                  <div className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-2xl">{getTypeIcon(ticket.type)}</span>
                          <h3 className="heading-md">{ticket.subject}</h3>
                        </div>
                        <p className="text-muted text-sm line-clamp-2">{ticket.message}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        {getStatusBadge(ticket.status)}
                        <span className="text-xs text-faint">
                          {new Date(ticket.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 text-right">
                      <span className="text-sm" style={{ color: 'var(--accent)' }}>
                        {selectedTicket?.ticket_id === ticket.ticket_id ? '▲ Свернуть' : '▼ Подробнее'}
                      </span>
                    </div>
                  </div>

                  {selectedTicket?.ticket_id === ticket.ticket_id && (
                    <div className="row-divider p-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
                      <div className="flex items-start gap-3">
                        <div className="text-2xl">👨‍💼</div>
                        <div className="flex-1">
                          <div className="field-label mb-2">Ответ администратора:</div>
                          {ticket.admin_response ? (
                            <div className="glass-panel p-4">
                              <p className="text-muted whitespace-pre-wrap text-sm">{ticket.admin_response}</p>
                              <div className="mt-2 text-xs text-faint">
                                {ticket.status === 'resolved' && '✅ Обращение решено'}
                              </div>
                            </div>
                          ) : (
                            <div className="alert-pending">⏳ Ожидает ответа администратора</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Reveal>
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

  if (loading) return (
    <div className="app-bg flex items-center justify-center text-lg text-faint">
      <GlobalStyle />
      Загрузка админ-панели...
    </div>
  );

  return (
    <div className="app-bg">
      <GlobalStyle />
      <nav className="nav-shell sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4 flex-wrap gap-3">
            <div className="flex items-center gap-6 flex-wrap">
              <span className="heading-md" style={{ color: 'var(--accent)' }}>⚙️ AdminPanel</span>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setActiveTab('dashboard')} className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}>📊 Статистика</button>
                <button onClick={() => setActiveTab('products')} className={`nav-link ${activeTab === 'products' ? 'active' : ''}`}>🍽️ Продукты</button>
                <button onClick={() => setActiveTab('tickets')} className={`nav-link ${activeTab === 'tickets' ? 'active' : ''}`}>🎫 Обращения</button>
              </div>
            </div>
            <button onClick={() => setPage('dashboard')} className="btn btn-danger btn-sm">Выйти из админки</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10">
        {activeTab === 'dashboard' && stats && (
          <div>
            <h1 className="heading-lg mb-6">📈 Общая статистика</h1>
            <div className="grid md:grid-cols-4 gap-5 mb-10">
              <Reveal className="glass-card p-6">
                <div className="text-3xl mb-3">👥</div>
                <div className="stat-number">{stats.total_users}</div>
                <div className="text-faint text-sm mt-1">Пользователей</div>
              </Reveal>
              <Reveal className="glass-card p-6" delay={40}>
                <div className="text-3xl mb-3">📔</div>
                <div className="stat-number">{stats.total_meals}</div>
                <div className="text-faint text-sm mt-1">Записей дневника</div>
              </Reveal>
              <Reveal className="glass-card p-6" delay={80}>
                <div className="text-3xl mb-3">🎫</div>
                <div className="stat-number" style={{ color: 'var(--fat)' }}>{stats.pending_tickets}</div>
                <div className="text-faint text-sm mt-1">Новых обращений</div>
              </Reveal>
              <Reveal className="glass-card p-6" delay={120}>
                <div className="text-3xl mb-3">🍽️</div>
                <div className="stat-number">{stats.global_products}</div>
                <div className="text-faint text-sm mt-1">Глобальных продуктов</div>
              </Reveal>
            </div>

            <h2 className="heading-md mb-4">📋 Последние обращения</h2>
            <div className="glass-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Тема</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(ticket => (
                    <tr key={ticket.ticket_id}>
                      <td>#{ticket.ticket_id}</td>
                      <td>{ticket.email}</td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span className={`badge ${ticket.status === 'new' ? 'badge-pending' : 'badge-resolved'}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>
                        {ticket.status === 'new' && (
                          <button onClick={() => handleResolveTicket(ticket.ticket_id)} className="btn btn-secondary btn-sm">
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
            <h1 className="heading-lg mb-6">🍽️ Управление глобальными продуктами</h1>
            <div className="glass-card p-6 mb-8">
              <h2 className="heading-md mb-4">➕ Добавить продукт</h2>
              <div className="grid md:grid-cols-5 gap-4">
                <input placeholder="Название" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="field" />
                <input placeholder="Калории" type="number" value={newProduct.calories} onChange={(e) => setNewProduct({...newProduct, calories: e.target.value})} className="field" />
                <input placeholder="Белки" type="number" step="0.1" value={newProduct.protein} onChange={(e) => setNewProduct({...newProduct, protein: e.target.value})} className="field" />
                <input placeholder="Жиры" type="number" step="0.1" value={newProduct.fat} onChange={(e) => setNewProduct({...newProduct, fat: e.target.value})} className="field" />
                <input placeholder="Углеводы" type="number" step="0.1" value={newProduct.carbs} onChange={(e) => setNewProduct({...newProduct, carbs: e.target.value})} className="field" />
              </div>
              <button onClick={handleAddProduct} className="btn btn-primary mt-4">💾 Добавить</button>
            </div>

            <div className="glass-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Ккал</th>
                    <th>Б/Ж/У</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id}>
                      <td>#{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.calories}</td>
                      <td>{p.protein}/{p.fat}/{p.carbs}</td>
                      <td>
                        <button onClick={() => handleDeleteProduct(p.id)} className="btn btn-danger btn-sm">
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
            <h1 className="heading-lg mb-6">🎫 Все обращения</h1>
            <div className="glass-card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Пользователь</th>
                    <th>Тип</th>
                    <th>Тема</th>
                    <th>Сообщение</th>
                    <th>Статус</th>
                    <th>Действие</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map(t => (
                    <tr key={t.ticket_id}>
                      <td>#{t.ticket_id}</td>
                      <td>{t.email}</td>
                      <td>{t.type}</td>
                      <td>{t.subject}</td>
                      <td className="max-w-xs truncate">{t.message}</td>
                      <td>
                        <span className={`badge ${t.status === 'new' ? 'badge-pending' : 'badge-resolved'}`}>
                          {t.status}
                        </span>
                      </td>
                      <td>
                        {t.status === 'new' && (
                          <button onClick={() => handleResolveTicket(t.ticket_id)} className="btn btn-secondary btn-sm">
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
    return <div className="glass-card p-6 text-center text-faint">Загрузка продуктов...</div>;
  }

  return (
    <div className="glass-card p-6">
      <h3 className="heading-md mb-5">➕ Добавить продукт</h3>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label className="field-label">Выберите продукт:</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(Number(e.target.value))}
            className="field mb-3"
          >
            <option value="">Выберите продукт</option>
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
            className="btn btn-secondary w-full"
          >
            {showProductForm ? '✖️ Отмена' : '✨ Создать свой продукт'}
          </button>
        </div>

        <div>
          <label className="field-label">Прием пищи:</label>
          <select
            value={mealType}
            onChange={(e) => setMealType(e.target.value)}
            className="field mb-3"
          >
            <option value="завтрак">🍳 Завтрак</option>
            <option value="обед">🍲 Обед</option>
            <option value="ужин">🍽️ Ужин</option>
            <option value="перекус">🍎 Перекус</option>
          </select>

          <label className="field-label">Вес (грамм):</label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(Number(e.target.value))}
            className="field"
            min="1"
            max="5000"
          />
        </div>
      </div>

      {selectedProduct && (
        <div className="mt-5 p-5 glass-panel">
          <h4 className="field-label mb-3">📊 КБЖУ для {weight} грамм:</h4>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><span className="text-xl font-semibold" style={{ color: 'var(--accent)' }}>{calculatedCalories}</span><br/><span className="text-xs text-faint">ккал</span></div>
            <div><span className="text-xl font-semibold" style={{ color: 'var(--protein)' }}>{(selectedProduct.protein * multiplier).toFixed(1)}</span><br/><span className="text-xs text-faint">белки</span></div>
            <div><span className="text-xl font-semibold" style={{ color: 'var(--fat)' }}>{(selectedProduct.fat * multiplier).toFixed(1)}</span><br/><span className="text-xs text-faint">жиры</span></div>
            <div><span className="text-xl font-semibold" style={{ color: 'var(--carbs)' }}>{(selectedProduct.carbs * multiplier).toFixed(1)}</span><br/><span className="text-xs text-faint">углеводы</span></div>
          </div>
        </div>
      )}

      <button
        onClick={handleAdd}
        disabled={!selectedProduct}
        className="btn btn-primary w-full mt-5"
      >
        ✅ Добавить продукт
      </button>

      {showProductForm && (
        <div className="mt-8 pt-8 row-divider">
          <h4 className="heading-md mb-5">✨ Новый продукт</h4>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              placeholder="Название продукта"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
              className="field"
            />
            <input
              placeholder="Калории на 100г (ккал)"
              type="number"
              value={newProduct.calories}
              onChange={(e) => setNewProduct({...newProduct, calories: e.target.value})}
              className="field"
            />
            <input
              placeholder="Белки на 100г (г)"
              type="number"
              value={newProduct.protein}
              onChange={(e) => setNewProduct({...newProduct, protein: e.target.value})}
              className="field"
            />
            <input
              placeholder="Жиры на 100г (г)"
              type="number"
              value={newProduct.fat}
              onChange={(e) => setNewProduct({...newProduct, fat: e.target.value})}
              className="field"
            />
            <input
              placeholder="Углеводы на 100г (г)"
              type="number"
              value={newProduct.carbs}
              onChange={(e) => setNewProduct({...newProduct, carbs: e.target.value})}
              className="field"
            />
            <div>
              <label className="field-label">Аллергены (Ctrl+выбор):</label>
              <select
                multiple
                value={newProduct.allergens}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setNewProduct({...newProduct, allergens: options});
                }}
                className="field h-24"
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
            className="btn btn-primary w-full mt-5"
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
    { name: 'Белки', value: dailyTotals.protein, color: COLORS.protein },
    { name: 'Жиры', value: dailyTotals.fat, color: COLORS.fat },
    { name: 'Углеводы', value: dailyTotals.carbs, color: COLORS.carbs }
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
    return (
      <div className="app-bg flex items-center justify-center text-lg text-faint">
        <GlobalStyle />
        Загрузка... 🍎
      </div>
    );
  }

  if (!user && page !== 'register') {
    return <LoginPage onLogin={handleLogin} onSwitchToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return <RegisterPage onRegister={handleLogin} onSwitchToLogin={() => setPage('login')} />;
  }

  if (page === 'dashboard') {
    return (
      <div className="app-bg">
        <GlobalStyle />
        <Navigation setPage={setPage} onLogout={handleLogout} currentPage="dashboard" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Reveal className="glass-card p-6">
              <h3 className="heading-md mb-4">🔥 Прогресс по калориям</h3>
              <div className="flex justify-between text-sm text-muted mb-2"><span>{dailyTotals.calories} ккал</span><span>{dailyNorm.calories} ккал</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: 'var(--accent)' }}></div></div>
              <div className="grid grid-cols-3 gap-3 mt-5 text-center text-sm">
                <div className="glass-panel p-3"><span className="font-semibold" style={{ color: 'var(--protein)' }}>{dailyTotals.protein}g</span><br/><span className="text-faint text-xs">🥩 Белки</span></div>
                <div className="glass-panel p-3"><span className="font-semibold" style={{ color: 'var(--fat)' }}>{dailyTotals.fat}g</span><br/><span className="text-faint text-xs">🧈 Жиры</span></div>
                <div className="glass-panel p-3"><span className="font-semibold" style={{ color: 'var(--carbs)' }}>{dailyTotals.carbs}g</span><br/><span className="text-faint text-xs">🍚 Углеводы</span></div>
              </div>
            </Reveal>
            <Reveal className="glass-card p-6" delay={60}>
              <h3 className="heading-md mb-4">💧 Прогресс по воде</h3>
              <div className="flex justify-between text-sm text-muted mb-2"><span>{totalWater} мл</span><span>{dailyNorm.water} мл</span></div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(waterProgress, 100)}%`, background: 'var(--water)' }}></div></div>
              <div className="mt-5"><input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="field" /></div>
            </Reveal>
          </div>

          <Reveal delay={100}>
            <AddProductForm products={products} onAdd={handleRefresh} onRefreshProducts={loadData} />
          </Reveal>

          <Reveal delay={140} className="glass-card p-6">
            <h3 className="heading-md mb-5">📔 Дневник питания</h3>
            {foodRecords.length === 0 ? <div className="text-center py-10 text-faint">Нет записей за сегодня</div> : (
              <div className="space-y-6">
                {Object.entries(meals).map(([meal, records]) => records.length > 0 && (
                  <div key={meal}>
                    <h4 className="heading-md row-divider pb-3 mb-3">{meal === 'завтрак' && '🍳'} {meal === 'обед' && '🍲'} {meal === 'ужин' && '🍽️'} {meal === 'перекус' && '🍎'} {meal.charAt(0).toUpperCase() + meal.slice(1)}</h4>
                    {records.map(record => (
                      <div key={record.id} className="flex justify-between items-center py-3 row-divider group">
                        <div className="flex-1">
                          <span className="font-medium">{record.productName}</span>
                          <span className="text-sm text-faint ml-2">{record.weight}г</span>
                          <div className="text-xs text-faint mt-1">
                            🥩{record.protein}г 🧈{record.fat}г 🍚{record.carbs}г
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-semibold" style={{ color: 'var(--accent)' }}>{record.calories} ккал</span>
                          <button
                            onClick={() => handleEditMeal(record)}
                            className="icon-btn"
                            title="Редактировать"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteMeal(record.id)}
                            className="icon-btn"
                            title="Удалить"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="pt-4 mt-2 row-divider text-right heading-md">Всего: {dailyTotals.calories} ккал</div>
              </div>
            )}
            {editingMeal && (
              <div className="modal-overlay">
                <div className="glass-card modal-card p-8 w-full max-w-sm">
                  <h3 className="heading-md mb-5">Редактировать запись</h3>
                  <p className="mb-4 text-muted text-sm">Продукт: <strong className="text-primary" style={{ color: 'var(--text-primary)' }}>{editingMeal.productName}</strong></p>
                  <label className="field-label">Вес (грамм):</label>
                  <input
                    type="number"
                    value={editWeight}
                    onChange={(e) => setEditWeight(e.target.value)}
                    className="field mb-5"
                    min="1"
                    max="5000"
                  />
                  <div className="flex gap-3">
                    <button onClick={handleSaveEditMeal} className="btn btn-primary flex-1">Сохранить</button>
                    <button onClick={() => { setEditingMeal(null); setEditWeight(''); }} className="btn btn-secondary flex-1">Отмена</button>
                  </div>
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    );
  }

  if (page === 'stats') {
    return (
      <div className="app-bg">
        <GlobalStyle />
        <Navigation setPage={setPage} onLogout={handleLogout} currentPage="stats" />
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          <div className="text-center">
            <span className="eyebrow">Аналитика</span>
            <h2 className="heading-xl mt-1">📊 Статистика за неделю</h2>
          </div>
          <Reveal className="glass-card p-6">
            <h3 className="heading-md mb-5">Динамика калорий</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="date" stroke={CHART_TEXT} tick={{ fill: CHART_TEXT, fontSize: 12 }} />
                <YAxis stroke={CHART_TEXT} tick={{ fill: CHART_TEXT, fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ color: CHART_TEXT, fontSize: 13 }} />
                <Line type="monotone" dataKey="calories" stroke={COLORS.accent} name="Факт (ккал)" strokeWidth={2} dot={{ r: 3 }} />
                <Line
                  type="monotone"
                  dataKey="norm"
                  stroke={COLORS.carbs}
                  name={`Норма: ${dailyNorm.calories} ккал`}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Reveal>
          <Reveal className="glass-card p-6" delay={60}>
            <h3 className="heading-md mb-5">Нутриенты по дням</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID} />
                <XAxis dataKey="date" stroke={CHART_TEXT} tick={{ fill: CHART_TEXT, fontSize: 12 }} />
                <YAxis stroke={CHART_TEXT} tick={{ fill: CHART_TEXT, fontSize: 12 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ color: CHART_TEXT, fontSize: 13 }} />
                <Bar dataKey="protein" fill={COLORS.protein} name="Белки" radius={[4, 4, 0, 0]} />
                <Bar dataKey="fat" fill={COLORS.fat} name="Жиры" radius={[4, 4, 0, 0]} />
                <Bar dataKey="carbs" fill={COLORS.carbs} name="Углеводы" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Reveal>
          <Reveal className="glass-card p-6" delay={120}>
            <h3 className="heading-md mb-5">Распределение КБЖУ за сегодня</h3>
            {bjuData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={bjuData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {bjuData.map((e,i) => <Cell key={i} fill={e.color} stroke="var(--bg-raised)" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend wrapperStyle={{ color: CHART_TEXT, fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : <div className="text-center py-10 text-faint">Нет данных</div>}
          </Reveal>
        </div>
      </div>
    );
  }

  if (page === 'water') {
    return (
      <div className="app-bg">
        <GlobalStyle />
        <Navigation setPage={setPage} onLogout={handleLogout} currentPage="water" />
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          <Reveal className="glass-card p-8">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">💧</div>
              <h2 className="heading-lg">Трекер воды</h2>
            </div>
            <div className="mb-8">
              <div className="flex justify-between text-sm text-muted mb-2">
                <span>Выпито: {totalWater} мл</span>
                <span>Норма: {dailyNorm.water} мл</span>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.min(waterProgress, 100)}%`, background: 'var(--water)' }}></div></div>
            </div>
            <div className="text-center mb-6">
              <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="field max-w-xs mx-auto" />
            </div>
            <div className="mb-8">
              <div className="flex gap-2 flex-wrap mb-4 justify-center">
                {[200, 250, 300, 500].map(amount => (
                  <button key={amount} onClick={() => setWaterAmount(amount)} className={`btn ${waterAmount === amount ? 'btn-primary' : 'btn-secondary'}`}>
                    {amount} мл
                  </button>
                ))}
              </div>
              <input type="number" value={waterAmount} onChange={(e) => setWaterAmount(Number(e.target.value))} className="field" min="50" max="1000" step="50" />
            </div>
            <button onClick={addWater} className="btn btn-primary w-full">
              💧 Добавить воду
            </button>
          </Reveal>
          <Reveal className="glass-card p-6" delay={60}>
            <h3 className="heading-md mb-4">📋 История воды</h3>
            {waterRecords.length === 0 ? (
              <div className="text-center py-10 text-faint">Нет записей</div>
            ) : (
              waterRecords.map(record => (
                <div key={record.id} className="flex justify-between items-center py-3 row-divider">
                  <span>{record.amount} мл</span>
                  <span className="text-sm text-faint">{record.time}</span>
                </div>
              ))
            )}
          </Reveal>
        </div>
      </div>
    );
  }

  if (page === 'profile') {
    return (
      <div className="app-bg">
        <GlobalStyle />
        <Navigation setPage={setPage} onLogout={handleLogout} currentPage="profile" />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Reveal className="glass-card p-10">
            <div className="text-center mb-8">
              <div className="text-5xl mb-3">👤</div>
              <h2 className="heading-lg">Профиль</h2>
            </div>
            {isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input value={editData.email} onChange={(e) => setEditData({...editData, email: e.target.value})} className="field" placeholder="Email" />
                <select value={editData.gender} onChange={(e) => setEditData({...editData, gender: e.target.value})} className="field"><option value="male">Мужской</option><option value="female">Женский</option></select>
                <input type="number" value={editData.age} onChange={(e) => setEditData({...editData, age: Number(e.target.value)})} className="field" placeholder="Возраст" />
                <input type="number" value={editData.height} onChange={(e) => setEditData({...editData, height: Number(e.target.value)})} className="field" placeholder="Рост" />
                <input type="number" value={editData.weight} onChange={(e) => setEditData({...editData, weight: Number(e.target.value)})} className="field" placeholder="Вес" />
                <select value={editData.goal} onChange={(e) => setEditData({...editData, goal: e.target.value})} className="field"><option value="weight_loss">Похудение</option><option value="maintain">Поддержание</option><option value="weight_gain">Набор веса</option></select>
                <select value={editData.activity} onChange={(e) => setEditData({...editData, activity: e.target.value})} className="field"><option value="sedentary">Сидячий</option><option value="light">Лёгкая</option><option value="moderate">Умеренная</option><option value="active">Активная</option><option value="veryActive">Очень активная</option></select>
                <div className="md:col-span-2 flex gap-4">
                  <button onClick={handleProfileSave} className="btn btn-primary flex-1">Сохранить</button>
                  <button onClick={() => setIsEditing(false)} className="btn btn-secondary flex-1">Отмена</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-4"><span className="text-faint">📧 Email:</span> {user?.email}</div>
                  <div className="glass-panel p-4"><span className="text-faint">🎂 Возраст:</span> {user?.age} лет</div>
                  <div className="glass-panel p-4"><span className="text-faint">📏 Рост:</span> {user?.height} см</div>
                  <div className="glass-panel p-4"><span className="text-faint">⚖️ Вес:</span> {user?.weight} кг</div>
                  <div className="glass-panel p-4"><span className="text-faint">🎯 Цель:</span> {user?.goal === 'weight_loss' ? 'Похудение' : user?.goal === 'maintain' ? 'Поддержание' : 'Набор веса'}</div>
                </div>
                <div className="glass-panel p-6 text-center">
                  <div className="text-sm text-faint">Норма калорий</div>
                  <div className="stat-number">{dailyNorm.calories} ккал/день</div>
                  <div className="text-sm text-faint mt-3">Норма воды</div>
                  <div className="text-2xl font-semibold" style={{ color: 'var(--water)' }}>{dailyNorm.water} мл/день</div>
                </div>
                <button
                  onClick={() => { setEditData(user); setIsEditing(true); }}
                  className="btn btn-primary w-full"
                >
                  ✏️ Редактировать профиль
                </button>
              </div>
            )}
          </Reveal>
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
