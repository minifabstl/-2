import { getUsers, setUsers, setCurrentUser } from '../store.js';
import { setState } from '../state.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';
import { generateId, validateEmail, validatePassword, getRandomColor } from '../utils.js';

export function renderAuthPage(container) {
    let mode = 'signin';

    function render() {
        container.innerHTML = `
        <div class="auth-page animate-fade-in">
            <div class="auth-card">
                <div class="auth-logo"><span class="material-icons">play_circle</span> VidFlow</div>
                <div class="auth-tabs">
                    <button class="auth-tab ${mode === 'signin' ? 'active' : ''}" data-mode="signin">Sign In</button>
                    <button class="auth-tab ${mode === 'signup' ? 'active' : ''}" data-mode="signup">Sign Up</button>
                </div>
                <form id="auth-form">
                    ${mode === 'signup' ? `
                    <div class="form-group">
                        <label for="displayName">Display Name</label>
                        <input type="text" id="displayName" placeholder="John Doe" required>
                    </div>
                    <div class="form-group">
                        <label for="username">Username</label>
                        <input type="text" id="username" placeholder="johndoe" required>
                    </div>` : ''}
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" placeholder="you@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="password">Password</label>
                        <input type="password" id="password" placeholder="••••••••" required>
                    </div>
                    ${mode === 'signup' ? `
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" placeholder="••••••••" required>
                    </div>` : ''}
                    <button type="submit" class="btn btn-primary full-width">${mode === 'signin' ? 'Sign In' : 'Create Account'}</button>
                </form>
                <p class="auth-switch">
                    ${mode === 'signin'
                        ? "Don't have an account? <a href='#' id='switch-mode'>Sign up</a>"
                        : "Already have an account? <a href='#' id='switch-mode'>Sign in</a>"}
                </p>
            </div>
        </div>`;

        // Tab switching
        container.querySelectorAll('.auth-tab').forEach(tab => {
            tab.addEventListener('click', () => { mode = tab.dataset.mode; render(); });
        });
        container.querySelector('#switch-mode')?.addEventListener('click', (e) => {
            e.preventDefault();
            mode = mode === 'signin' ? 'signup' : 'signin';
            render();
        });

        // Form submit
        container.querySelector('#auth-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            if (!validateEmail(email)) return showToast('Invalid email address', 'error');
            if (!validatePassword(password)) return showToast('Password must be at least 6 characters', 'error');

            const users = getUsers();

            if (mode === 'signin') {
                const user = users.find(u => u.email === email && u.password === password);
                if (user) {
                    loginUser(user);
                } else {
                    showToast('Invalid email or password', 'error');
                }
            } else {
                const displayName = document.getElementById('displayName').value.trim();
                const username = document.getElementById('username').value.trim();
                const confirmPassword = document.getElementById('confirmPassword').value;

                if (!displayName || !username) return showToast('All fields are required', 'error');
                if (password !== confirmPassword) return showToast('Passwords do not match', 'error');
                if (users.some(u => u.email === email)) return showToast('Email already in use', 'error');
                if (users.some(u => u.username === username)) return showToast('Username taken', 'error');

                const newUser = {
                    id: generateId(),
                    username, displayName, email, password,
                    avatarBg: getRandomColor(),
                    bio: '',
                    subscriberCount: 0,
                    joinDate: new Date().toISOString(),
                    subscriptions: []
                };
                users.push(newUser);
                setUsers(users);
                loginUser(newUser);
                showToast('Account created!', 'success');
            }
        });
    }

    function loginUser(user) {
        setCurrentUser(user);
        setState('currentUser', user);
        showToast(`Welcome, ${user.displayName}!`, 'success');
        navigateTo('/');
    }

    render();
}
