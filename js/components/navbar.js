import { navigateTo } from '../router.js';
import { getState, setState, atoms } from '../state.js';
import { getCurrentUser, clearCurrentUser } from '../store.js';
import { showToast } from './toast.js';
import { getInitials } from '../utils.js';

export function renderNavbar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const currentUser = getCurrentUser();
    const theme = getState('theme');

    container.innerHTML = `
        <header class="navbar">
            <div class="nav-left">
                <button id="menu-btn" class="icon-btn" aria-label="Menu">
                    <span class="material-icons">menu</span>
                </button>
                <div class="logo" id="logo-btn">
                    <span class="material-icons logo-icon">play_circle_filled</span>
                    <span class="logo-text">VidFlow</span>
                </div>
            </div>
            <div class="nav-center">
                <form id="search-form" class="search-bar">
                    <input type="text" id="search-input" placeholder="Search" value="${getState('searchQuery') || ''}">
                    <button type="submit" class="search-btn" aria-label="Search">
                        <span class="material-icons">search</span>
                    </button>
                </form>
            </div>
            <div class="nav-right">
                <button id="theme-toggle" class="icon-btn" aria-label="Toggle theme">
                    <span class="material-icons">${theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
                </button>
                ${currentUser ? `
                    <button id="upload-btn" class="icon-btn" aria-label="Upload">
                        <span class="material-icons">video_call</span>
                    </button>
                    <button id="notifications-btn" class="icon-btn" aria-label="Notifications">
                        <span class="material-icons">notifications</span>
                    </button>
                    <div class="user-menu-container">
                        <button id="user-profile-btn" class="avatar-btn">
                            <div class="avatar-initials">${getInitials(currentUser.displayName)}</div>
                        </button>
                        <div id="user-dropdown" class="dropdown-menu hidden">
                            <div class="user-info">
                                <span class="user-name">${currentUser.displayName}</span>
                                <span class="user-email">${currentUser.email}</span>
                            </div>
                            <hr>
                            <button id="my-channel-btn" class="dropdown-item"><span class="material-icons">person</span> My channel</button>
                            <button id="sign-out-btn" class="dropdown-item"><span class="material-icons">logout</span> Sign out</button>
                        </div>
                    </div>
                ` : `
                    <button id="sign-in-btn" class="btn btn-outline">
                        <span class="material-icons">account_circle</span> Sign in
                    </button>
                `}
            </div>
        </header>
    `;

    document.getElementById('menu-btn').addEventListener('click', () => {
        setState('sidebarOpen', !getState('sidebarOpen'));
    });

    document.getElementById('logo-btn').addEventListener('click', () => {
        navigateTo('/');
    });

    document.getElementById('search-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('search-input').value.trim();
        if (query) {
            setState('searchQuery', query);
            navigateTo('/search?q=' + encodeURIComponent(query));
        }
    });

    document.getElementById('theme-toggle').addEventListener('click', () => {
        const currentTheme = getState('theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setState('theme', newTheme);
        document.body.className = newTheme + '-theme';
    });

    if (currentUser) {
        document.getElementById('upload-btn').addEventListener('click', () => navigateTo('/upload'));
        
        const profileBtn = document.getElementById('user-profile-btn');
        const dropdown = document.getElementById('user-dropdown');
        
        profileBtn.addEventListener('click', () => {
            dropdown.classList.toggle('hidden');
        });

        document.getElementById('my-channel-btn').addEventListener('click', () => {
            navigateTo('/channel/' + currentUser.id);
            dropdown.classList.add('hidden');
        });

        document.getElementById('sign-out-btn').addEventListener('click', () => {
            clearCurrentUser();
            setState('currentUser', null);
            showToast('Signed out successfully', 'success', 3000);
            navigateTo('/');
        });
    } else {
        document.getElementById('sign-in-btn').addEventListener('click', () => navigateTo('/auth'));
    }
}
