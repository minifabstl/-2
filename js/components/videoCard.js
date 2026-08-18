import { navigateTo } from '../router.js';
import { formatDate, formatViews, formatDuration, getInitials } from '../utils.js';

const CATEGORY_GRADIENTS = {
    'Music': 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    'Gaming': 'linear-gradient(135deg, #84fab0, #8fd3f4)',
    'Education': 'linear-gradient(135deg, #667eea, #764ba2)',
    'Sports': 'linear-gradient(135deg, #f6d365, #fda085)',
    'News': 'linear-gradient(135deg, #89f7fe, #66a6ff)',
    'Entertainment': 'linear-gradient(135deg, #ff0844, #ffb199)',
    'Technology': 'linear-gradient(135deg, #00c6ff, #0072ff)',
    'Comedy': 'linear-gradient(135deg, #fccb90, #d57eeb)',
    'Cooking': 'linear-gradient(135deg, #ff9a9e, #fecfef)'
};

export function createVideoCard(video, layout = 'grid') {
    const card = document.createElement('div');
    card.className = `video-card ${layout === 'horizontal' ? 'horizontal' : ''}`;
    card.dataset.id = video.id;

    const gradient = CATEGORY_GRADIENTS[video.category] || 'linear-gradient(135deg, #cfd9df, #e2ebf0)';
    const thumbStyle = video.thumbnail
        ? `background-image: url(${video.thumbnail}); background-size: cover; background-position: center;`
        : `background: ${gradient};`;

    card.innerHTML = `
        <div class="thumbnail" style="${thumbStyle}">
            <div class="play-overlay"><span class="material-icons">play_arrow</span></div>
            <span class="duration-badge">${formatDuration(video.duration)}</span>
        </div>
        <div class="video-info">
            ${layout !== 'horizontal' ? `
            <div class="channel-avatar-small" style="background:${video.channelAvatar || '#666'}">
                ${getInitials(video.channelName)}
            </div>` : ''}
            <div class="video-details">
                <h3 class="video-title">${video.title}</h3>
                <div class="channel-name" data-channel="${video.channelId}">${video.channelName}</div>
                <div class="video-meta">${formatViews(video.views)} • ${formatDate(video.uploadDate)}</div>
            </div>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (e.target.closest('.channel-name')) {
            e.stopPropagation();
            navigateTo('/channel/' + video.channelId);
            return;
        }
        navigateTo('/watch/' + video.id);
    });

    return card;
}

export function renderVideoGrid(videos, container) {
    if (typeof container === 'string') container = document.getElementById(container);
    if (!container) return;
    container.innerHTML = '';
    
    if (!videos || videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons">videocam_off</span><p>No videos found</p></div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'video-grid';
    videos.forEach(v => grid.appendChild(createVideoCard(v)));
    container.appendChild(grid);
}
