// =============================================
// CLIENTE API - Grow House (Versión Admin Único)
// =============================================

console.log('🔌 Inicializando cliente API Grow House');

const API_CONFIG = {
    baseURL: window.GROW_HOUSE_API,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
};

class APIError extends Error {
    constructor(message, status, data = null) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

function isValidObjectId(id) {
    return typeof id === 'string' && /^[a-fA-F0-9]{24}$/.test(id);
}

class APIClient {
    constructor(baseURL = API_CONFIG.baseURL) {
        this.baseURL = baseURL;
        this.timeout = API_CONFIG.timeout;
    }

    // --- GESTIÓN DE TOKENS ---

    getToken() {
        return localStorage.getItem('growhouse_token');
    }

    setToken(token) {
        localStorage.setItem('growhouse_token', token);
    }

    removeToken() {
        localStorage.removeItem('growhouse_token');
        localStorage.removeItem('growhouse_user');
        console.log('🚪 Sesión de Admin finalizada');
    }

    getHeaders(includeAuth = false) {
        const headers = { ...API_CONFIG.headers };
        if (includeAuth) {
            const token = this.getToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    // --- NÚCLEO DE PETICIONES ---

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            ...options,
            headers: this.getHeaders(options.auth || false)
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.message || 'Error en la petición', response.status, data);
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') throw new APIError('Timeout de conexión', 408);
            throw error;
        }
    }

    // --- MÉTODOS HTTP ---

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

    // --- MÉTODOS DE PRODUCTOS (CATÁLOGO) ---

    async getProducts(filters = {}) {
        return this.get('/products', filters);
    }

    async getProduct(id) {
        if (!id || !isValidObjectId(id)) throw new APIError('ID de producto no válido', 400);
        return this.get(`/products/${id}`);
    }

    // Acciones exclusivas de Admin (requieren auth = true)
    async createProduct(productData) {
        return this.post('/products', productData, true);
    }

    async updateProduct(id, productData) {
        return this.put(`/products/${id}`, productData, true);
    }

    async deleteProduct(id) {
        return this.delete(`/products/${id}`, true);
    }

    // --- AUTENTICACIÓN ADMIN ---

    async login(email, password) {
        const response = await this.post('/auth/login', { email, password });
        if (response.token) {
            this.setToken(response.token);
            localStorage.setItem('growhouse_user', JSON.stringify(response.user));
            console.log('✅ Acceso Admin concedido');
        }
        return response;
    }

    logout() {
        this.removeToken();
        window.location.href = '../index.html';
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('growhouse_user');
        return userStr ? JSON.parse(userStr) : null;
    }
}

// Instancia única para toda la app
const api = new APIClient();
window.api = api;