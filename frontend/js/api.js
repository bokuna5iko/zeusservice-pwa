const API_BASE = 'http://192.168.0.102:3000/api';

export async function authenticate(phone, name) {
    const res = await fetch(`${API_BASE}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name })
    });
    if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || 'Ошибка авторизации');
    }
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    return data.user;
}

export async function checkPhone(phone) {
    const res = await fetch(`${API_BASE}/auth/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    });
    if (res.ok) {
        const data = await res.json();
        return data.exists;
    }
    throw new Error('Ошибка проверки номера');
}

export async function getProfile() {
    let token = localStorage.getItem('accessToken');
    const res = await fetch(`${API_BASE}/user/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
        const refreshed = await refreshTokens();
        if (refreshed) {
            return await getProfile();
        } else {
            throw new Error('Сессия истекла');
        }
    }
    if (!res.ok) throw new Error('Ошибка получения профиля');
    return await res.json();
}

async function refreshTokens() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;
    const res = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
    });
    if (res.ok) {
        const data = await res.json();
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('refreshToken', data.refreshToken);
        return true;
    }
    return false;
}

export function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('carwash_user');
    window.location.reload();
}
