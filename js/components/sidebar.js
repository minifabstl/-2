import { navigateTo } from '../router.js';
import { getState, subscribeToState } from '../state.js';
import { getCurrentUser } from '../store.js';

export function renderSidebar(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const render = () => {
        const isOpen = getState('sidebarOpen');
        const currentUser = getCurrentUser();

        container.className = `sidebar ${isOpen ? 'open' : 'closed'}`;

        container.innerHTML = `
            <div class="sidebar-menu">
                <button class="nav-item" data-route="/">
                    <span class="material-icons">home</span>
                    <span class="nav-label">Home</span>
                </button>
                <button class="nav-item" data-route="/trending">
                    <span class="material-icons">local_fire_department</span>
                    <span class="nav-label">Trending</span>
                </button>
                <button class="nav-item" data-route="/subscriptions">
                    <span class="material-icons">subscriptions</span>
                    <span class="nav-label">Subscriptions</span>
                </button>
            </div>
            ${currentUser ? `
                <hr>
                <div class="sidebar-section">
                    <h3 class="section-title">You</h3>
                    <button class="nav-item" data-route="/channel/${currentUser.id}">
                        <span class="material-icons">person</span>
                        <span class="nav-label">Your channel</span>
                    </button>
                </div>
            ` : `
                <hr>
                <div class="sidebar-auth-promo">
                    <p>Sign in to like videos, comment, and subscribe.</p>
                    <button class="btn btn-outline sign-in-promo" data-route="/auth">
                        <span class="material-icons">account_circle</span> Sign in
                    </button>
                </div>
            `}
        `;

        container.querySelectorAll('[data-route]').forEach(btn => {
            btn.addEventListener('click', () => {
                navigateTo(btn.getAttribute('data-route'));
            });
        });
    };

    render();
    
    subscribeToState('sidebarOpen', () => {
        const isOpen = getState('sidebarOpen');
        container.className = `sidebar ${isOpen ? 'open' : 'closed'}`;
    });
}
