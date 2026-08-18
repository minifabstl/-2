// VidFlow - Main Application Entry Point
import { initializeSeedData } from './seedData.js';
import { getCurrentUser } from './store.js';
import { setState, atoms } from './state.js';
import { onRouteChange, parseRoute } from './router.js';
import { renderNavbar } from './components/navbar.js';
import { renderSidebar } from './components/sidebar.js';
import { renderHomePage } from './pages/home.js';
import { renderWatchPage } from './pages/watch.js';
import { renderUploadPage } from './pages/upload.js';
import { renderSearchPage } from './pages/search.js';
import { renderChannelPage } from './pages/channel.js';
import { renderSubscriptionsPage } from './pages/subscriptions.js';
import { renderCategoryPage } from './pages/category.js';
import { renderAuthPage } from './pages/auth.js';

function initApp() {
    // 1. Initialize seed data on first visit
    initializeSeedData();

    // 2. Restore user session
    const user = getCurrentUser();
    if (user) {
        setState('currentUser', user);
    }

    // 3. Initialize theme
    const savedTheme = localStorage.getItem('vidflow_theme');
    if (savedTheme) {
        setState('theme', savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const theme = prefersDark ? 'dark' : 'light';
        setState('theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }

    // 4. Listen to theme changes
    atoms.theme.subscribe((theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('vidflow_theme', theme);
    });

    // 5. Setup router
    onRouteChange((route, params) => {
        window.scrollTo(0, 0);
        renderNavbar('navbar');
        renderSidebar('sidebar');
        renderPage(route, params);
    });
}

function renderPage(route, params) {
    const main = document.getElementById('main-content');
    if (!main) return;
    main.innerHTML = '';

    switch (route) {
        case '/':
            renderHomePage(main);
            break;
        case '/watch':
            renderWatchPage(main, params.id);
            break;
        case '/upload':
            renderUploadPage(main);
            break;
        case '/search':
            // Extract query from hash
            const searchHash = window.location.hash;
            const qMatch = searchHash.match(/[?&]q=([^&]*)/);
            const query = qMatch ? decodeURIComponent(qMatch[1]) : '';
            renderSearchPage(main, query);
            break;
        case '/channel':
            renderChannelPage(main, params.id);
            break;
        case '/subscriptions':
            renderSubscriptionsPage(main);
            break;
        case '/category':
            renderCategoryPage(main, params.name);
            break;
        case '/auth':
            renderAuthPage(main);
            break;
        case '/trending':
            renderHomePage(main, 'trending');
            break;
        default:
            main.innerHTML = `
                <div class="empty-state" style="padding:80px 20px;text-align:center;">
                    <span class="material-icons" style="font-size:64px;color:var(--text-tertiary);">explore_off</span>
                    <h2 style="margin-top:16px;">Page not found</h2>
                    <p style="color:var(--text-secondary);margin-top:8px;">The page you're looking for doesn't exist.</p>
                </div>`;
    }
}

document.addEventListener('DOMContentLoaded', initApp);
