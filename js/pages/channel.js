import { getUsers, getVideos } from '../store.js';
import { getState } from '../state.js';
import { navigateTo } from '../router.js';
import { createVideoCard } from '../components/videoCard.js';
import { formatViews, getInitials, formatDate } from '../utils.js';

export function renderChannelPage(container, channelId) {
    const users = getUsers();
    const channel = users.find(u => u.id === channelId);
    if (!channel) {
        container.innerHTML = '<div class="empty-state"><h2>Channel not found</h2></div>';
        return;
    }

    const videos = getVideos().filter(v => v.channelId === channelId);
    const totalViews = videos.reduce((s, v) => s + (v.views || 0), 0);
    const currentUser = getState('currentUser');
    const isOwn = currentUser && currentUser.id === channelId;

    // Banner gradient
    const hash = Array.from(channelId).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0);
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 40) % 360;

    const wrapper = document.createElement('div');
    wrapper.className = 'channel-page animate-fade-in';
    wrapper.innerHTML = `
        <div class="channel-banner" style="background:linear-gradient(135deg,hsl(${hue1},70%,50%),hsl(${hue2},70%,50%))"></div>
        <div class="channel-header">
            <div class="channel-profile">
                <div class="large-avatar" style="background:${channel.avatarBg || '#666'}">${getInitials(channel.displayName)}</div>
                <div class="channel-details">
                    <h1>${channel.displayName}</h1>
                    <p class="channel-handle">@${channel.username}</p>
                    <p class="channel-stats">${formatViews(channel.subscriberCount || 0)} • ${videos.length} videos</p>
                    <p class="channel-bio">${channel.bio || ''}</p>
                </div>
            </div>
        </div>
        <div class="channel-tabs">
            <button class="tab-btn active" data-tab="videos">Videos</button>
            <button class="tab-btn" data-tab="about">About</button>
        </div>
        <div id="tab-videos" class="tab-panel">
            <div id="channel-grid"></div>
        </div>
        <div id="tab-about" class="tab-panel hidden">
            <div class="about-section">
                <h3>Description</h3>
                <p>${channel.bio || 'No description'}</p>
                <h3>Stats</h3>
                <ul>
                    <li>Joined ${formatDate(channel.joinDate)}</li>
                    <li>${formatViews(totalViews)} total views</li>
                </ul>
            </div>
        </div>
    `;

    container.appendChild(wrapper);

    // Render videos
    const grid = document.getElementById('channel-grid');
    if (videos.length) {
        videos.forEach(v => grid.appendChild(createVideoCard(v)));
    } else {
        grid.innerHTML = '<div class="empty-state"><p>No videos uploaded yet</p></div>';
    }

    // Tabs
    wrapper.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            wrapper.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            wrapper.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
            document.getElementById('tab-' + btn.dataset.tab)?.classList.remove('hidden');
        });
    });
}
