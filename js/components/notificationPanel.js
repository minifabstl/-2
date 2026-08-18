import { navigateTo } from '../router.js';
import { getNotifications, markAllRead } from '../store.js';
import { getState, setState } from '../state.js';
import { formatDate } from '../utils.js';

export function renderNotificationPanel(containerId, userId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const render = () => {
        const notifications = getNotifications(userId) || [];
        
        container.innerHTML = `
            <div class="notifications-panel">
                <div class="notifications-header">
                    <h3>Notifications</h3>
                    <button id="mark-all-read" class="text-btn">Mark all as read</button>
                </div>
                <div class="notifications-list">
                    ${notifications.length > 0 ? notifications.map(notif => `
                        <div class="notification-item ${notif.read ? 'read' : 'unread'}" data-url="${notif.url}">
                            <div class="notification-content">
                                <p>${notif.message}</p>
                                <span class="notification-date">${formatDate(notif.date)}</span>
                            </div>
                        </div>
                    `).join('') : '<p class="no-notifications">No notifications.</p>'}
                </div>
            </div>
        `;

        document.getElementById('mark-all-read')?.addEventListener('click', () => {
            markAllRead(userId);
            setState('notifications', []);
            render();
        });

        container.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const url = e.currentTarget.getAttribute('data-url');
                if (url) {
                    navigateTo(url);
                }
            });
        });
    };

    render();
}
