import { getVideos, getCurrentUser, getSubscriptions } from '../store.js';
import { navigateTo } from '../router.js';
import { createVideoCard } from '../components/videoCard.js';
import { showToast } from '../components/toast.js';

export function renderSubscriptionsPage(container) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Sign in to view subscriptions', 'error');
        navigateTo('/auth');
        return;
    }

    const subChannels = getSubscriptions(currentUser.id);
    const subIds = subChannels.map(c => c.id);
    const videos = getVideos().filter(v => subIds.includes(v.channelId))
        .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));

    container.innerHTML = `
    <div class="subscriptions-page animate-fade-in">
        <h2>Subscriptions</h2>
        <div id="subs-grid"></div>
    </div>`;

    const grid = document.getElementById('subs-grid');
    if (videos.length === 0) {
        grid.innerHTML = '<div class="empty-state"><span class="material-icons">subscriptions</span><h3>No subscription videos</h3><p>Subscribe to channels to see their videos here</p></div>';
    } else {
        const g = document.createElement('div');
        g.className = 'video-grid';
        videos.forEach(v => g.appendChild(createVideoCard(v)));
        grid.appendChild(g);
    }
}
