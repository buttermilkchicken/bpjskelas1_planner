const Auth = {
    TOKEN_KEY: 'planner_token',
    USER_KEY: 'planner_user',

    isLoggedIn() {
        return !!localStorage.getItem(Auth.TOKEN_KEY);
    },
    getUser() {
        try { return JSON.parse(localStorage.getItem(Auth.USER_KEY)); } catch { return null; }
    },
    saveSession({ token, user }) {
        localStorage.setItem(Auth.TOKEN_KEY, token);
        localStorage.setItem(Auth.USER_KEY, JSON.stringify(user));
    },
    logout() {
        localStorage.removeItem(Auth.TOKEN_KEY);
        localStorage.removeItem(Auth.USER_KEY);
        location.replace('login.html');
    },
    requireLogin() {
        if (!Auth.isLoggedIn()) location.replace('login.html');
    },
};

const Api = {
    async request(method, path, body) {
        const headers = { 'Content-Type': 'application/json' };
        const token = localStorage.getItem(Auth.TOKEN_KEY);
        if (token) headers.Authorization = `Bearer ${token}`;

        const res = await fetch(`/api${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        let data = null;
        try { data = await res.json(); } catch { /* 204 / empty body */ }

        if (res.status === 401 && !path.startsWith('/auth/')) {
            Auth.logout();
            throw new Error(data?.message || 'Session expired');
        }
        if (!res.ok) throw new Error(data?.message || 'Request failed');
        return data;
    },
    get: (path) => Api.request('GET', path),
    post: (path, body) => Api.request('POST', path, body),
    put: (path, body) => Api.request('PUT', path, body),
    delete: (path) => Api.request('DELETE', path),
};
