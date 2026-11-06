document.addEventListener('DOMContentLoaded', () => {
    if (Auth.isLoggedIn()) {
        location.replace('index.html');
        return;
    }

    const message = document.getElementById('authMessage');
    const showError = (text) => { message.textContent = text; };

    async function submit(form, path, buildBody) {
        showError('');
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        try {
            const body = buildBody(new FormData(form));
            const data = await Api.post(path, body);
            Auth.saveSession(data);
            location.href = 'index.html';
        } catch (err) {
            showError(err.message);
            button.disabled = false;
        }
    }

    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submit(loginForm, '/auth/login', (f) => ({
                email: f.get('email'),
                password: f.get('password'),
            }));
        });
    }

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            submit(signupForm, '/auth/signup', (f) => {
                if (f.get('password') !== f.get('confirm')) {
                    throw new Error('Passwords do not match');
                }
                return {
                    username: f.get('username'),
                    email: f.get('email'),
                    password: f.get('password'),
                };
            });
        });
    }
});
