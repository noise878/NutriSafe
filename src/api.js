
const API_URL = '/api';  

async function request(url, options = {}) {
  const response = await fetch(`${API_URL}${url}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw { status: response.status, ...data };
  }
  
  return data;
}

export async function getAdminStats() {
  return request('/admin/stats');
}
export async function getAdminProducts() {
  return request('/admin/products/global');
}
export async function addAdminProduct(data) {
  return request('/admin/products/global', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateAdminProduct(data) {
  return request('/admin/products/global', { method: 'PUT', body: JSON.stringify(data) });
}
export async function deleteAdminProduct(id) {
  return request(`/admin/products/global?id=${id}`, { method: 'DELETE' });
}
export async function resolveTicket(ticketId, response) {
  return request(`/admin/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify({ response }) });
}
export async function getPersonalProducts() {
  return request('/products/personal');
}

export async function createPersonalProduct(productData) {
  return request('/products/personal', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}


export async function register(userData) {
  return request('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

export async function login(email, password) {
  return request('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return request('/logout', { method: 'POST' });
}

export async function getCurrentUser() {
  try {
    return await request('/me');
  } catch (e) {
    if (e.status === 401) return null;
    throw e;
  }
}



export async function updateProfile(userData) {
  return request('/profile', {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
}



export async function getGlobalProducts() {
  return request('/products/global');
}

export async function checkUserProductDuplicate(name) {
  return request(`/products/check-duplicate?name=${encodeURIComponent(name)}`);
}



export async function getMeals(date) {
  return request(`/meals?date=${date}`);
}

export async function addMeal(mealData) {
  return request('/meals', {
    method: 'POST',
    body: JSON.stringify(mealData),
  });
}

export async function getUserTickets() {
  return request('/user/tickets');
}

export async function deleteMeal(recordId) {
  return request(`/meals/${recordId}`, { method: 'DELETE' });
}


export async function getWater(date) {
  return request(`/water?date=${date}`);
}

export async function addWater(waterData) {
  return request('/water', {
    method: 'POST',
    body: JSON.stringify(waterData),
  });
}



export async function getWeeklyStats() {
  return request('/stats/weekly');
}

export async function getDailyNorm() {
  return request('/user/daily_norm');
}



export async function getAdminStats() {
  return request('/admin/stats');
}

export async function getAdminProducts() {
  return request('/admin/products/global');
}

export async function addAdminProduct(data) {
  return request('/admin/products/global', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateAdminProduct(data) {
  return request('/admin/products/global', { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteAdminProduct(id) {
  return request(`/admin/products/global?id=${id}`, { method: 'DELETE' });
}

export async function resolveTicket(ticketId, response) {
  return request(`/admin/tickets/${ticketId}`, { method: 'PUT', body: JSON.stringify({ response }) });
}

export async function createSupportTicket(data) {
  return request('/support/ticket', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}