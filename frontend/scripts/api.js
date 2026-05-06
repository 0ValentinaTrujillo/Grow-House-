// =============================================
// CLIENTE API - Grow House
// =============================================

console.log('🔌 Inicializando cliente API Grow House');

const API_CONFIG = {
    baseURL: window.GROW_HOUSE_API,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' }
};

class APIClient {
    constructor(baseURL = API_CONFIG.baseURL) {
        this.baseURL  = baseURL;
        this.timeout  = API_CONFIG.timeout;
        // ✅ Claves unificadas con auth-api.js y admin-auth.js
        this.TOKEN_KEY = 'growhouse-auth-token';
        this.USER_KEY  = 'growhouse-user-data';
    }

    getToken() { return localStorage.getItem(this.TOKEN_KEY); }
    setToken(token) { localStorage.setItem(this.TOKEN_KEY, token); }
    removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
    }

    getHeaders(includeAuth = false) {
        const headers = { ...API_CONFIG.headers };
        if (includeAuth) {
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth || false)
        };

        try {
            const controller = new AbortController();
            const timeoutId  = setTimeout(() => controller.abort(), this.timeout);
            const response   = await fetch(url, { ...config, signal: controller.signal });
            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    this.removeToken();
                    window.location.href = 'login.html';
                    return;
                }
                throw new Error(data.message || 'Error en la petición');
            }

            return data;

        } catch (error) {
            if (error.name === 'AbortError') throw new Error('Timeout de conexión');
            throw error;
        }
    }

    async get(endpoint, params = {}, auth = false) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET', auth });
    }

    async post(endpoint, data, auth = false) {
        return this.request(endpoint, { method: 'POST', body: JSON.stringify(data), auth });
    }

    async put(endpoint, data, auth = false) {
        return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data), auth });
    }

    async delete(endpoint, auth = false) {
        return this.request(endpoint, { method: 'DELETE', auth });
    }

    // ─── Productos públicos ───────────────────────────────────────────────────
    async getProducts(filters = {}) { return this.get('/products', filters); }
    async getProduct(id)            { return this.get(`/products/${id}`); }

    // ─── Productos admin ──────────────────────────────────────────────────────
    async createProduct(data)     { return this.post('/admin/products', data, true); }
    async updateProduct(id, data) { return this.put(`/admin/products/${id}`, data, true); }
    async deleteProduct(id)       { return this.delete(`/admin/products/${id}`, true); }

    // ─── Auth ─────────────────────────────────────────────────────────────────
    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.token) {
            this.setToken(response.token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(response.data));
        }
        return response;
    }

    logout() {
        this.removeToken();
        window.location.href = 'index.html';
    }

    isAuthenticated() {
        const token = this.getToken();
        const user  = this.getCurrentUser();
        return !!(token && user && user.role === 'admin');
    }

    getCurrentUser() {
        try {
            const str = localStorage.getItem(this.USER_KEY);
            return str ? JSON.parse(str) : null;
        } catch { return null; }
    }
}

const api = new APIClient();
window.api = api;
console.log('✅ APIClient inicializado:', api.baseURL);