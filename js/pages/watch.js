import { getVideos, getUsers, incrementViews, toggleLike, toggleDislike, toggleSubscription, getCurrentUser, setCurrentUser } from '../store.js';
import { navigateTo } from '../router.js';
import { formatViews, formatDate, getInitials } from '../utils.js';
import { showToast } from '../components/toast.js';
import { renderVideoPlayer } from '../components/videoPlayer.js';
import { renderCommentSection } from '../components/commentSection.js';
import { createVideoCard } from '../components/videoCard.js';

export function renderWatchPage(container, videoId) {
    const videos = getVideos();
    const video = videos.find(v => v.id === videoId);

    if (!video) {
        container.innerHTML = '<div class="empty-state"><h2>Video not found</h2><button class="btn btn-primary" onclick="location.hash=\'#/\'">Go Home</button></div>';
        return;
    }

    incrementViews(videoId);
    const users = getUsers();
    const channel = users.find(u => u.id === video.channelId);
    const currentUser = getCurrentUser();
    const channelName = channel?.displayName || video.channelName || 'Unknown';
    const subCount = channel?.subscriberCount || 0;
    const isSubscribed = currentUser?.subscriptions?.includes(video.channelId) || false;
    const likeCount = Array.isArray(video.likes) ? video.likes.length : 0;
    const isLiked = currentUser && Array.isArray(video.likes) && video.likes.includes(currentUser.id);
    const isDisliked = currentUser && Array.isArray(video.dislikes) && video.dislikes.includes(currentUser.id);
    const avatarBg = channel?.avatarBg || video.channelAvatar || '#666';

    const recommended = videos.filter(v => v.id !== videoId && v.category === video.category).slice(0, 8);
    const otherRec = recommended.length < 4 ? videos.filter(v => v.id !== videoId && v.category !== video.category).slice(0, 8 - recommended.length) : [];
    const allRec = [...recommended, ...otherRec];

    const wrapper = document.createElement('div');
    wrapper.className = 'watch-page animate-fade-in';
    wrapper.innerHTML = `
        <div class="watch-main">
            <div id="player-mount"></div>
            <h1 class="watch-title">${video.title}</h1>
            <div class="watch-actions-row">
                <div class="watch-channel">
                    <div class="avatar-circle" style="background:${avatarBg}">${getInitials(channelName)}</div>
                    <div class="channel-text">
                        <div class="channel-name-link" data-cid="${video.channelId}">${channelName}</div>
                        <div class="channel-sub-count">${formatViews(subCount)}</div>
                    </div>
                    <button id="sub-btn" class="btn ${isSubscribed ? 'btn-secondary' : 'btn-primary'} btn-pill">
                        ${isSubscribed ? 'Subscribed' : 'Subscribe'}
                    </button>
                </div>
                <div class="watch-buttons">
                    <div class="like-group">
                        <button id="like-btn" class="like-btn ${isLiked ? 'active' : ''}">
                            <span class="material-icons">${isLiked ? 'thumb_up' : 'thumb_up_off_alt'}</span>
                            <span id="like-count">${likeCount}</span>
                        </button>
                        <button id="dislike-btn" class="dislike-btn ${isDisliked ? 'active' : ''}">
                            <span class="material-icons">${isDisliked ? 'thumb_down' : 'thumb_down_off_alt'}</span>
                        </button>
                    </div>
                    <button class="action-btn" onclick="navigator.clipboard.writeText(location.href);">
                        <span class="material-icons">share</span> Share
                    </button>
                </div>
            </div>
            <div class="watch-description">
                <div class="desc-stats">${formatViews(video.views)} • ${formatDate(video.uploadDate)}</div>
                <p class="desc-text line-clamp-3" id="desc-text">${video.description || 'No description.'}</p>
                <button id="desc-toggle" class="text-btn">Show more</button>
            </div>
            <div id="comments-mount"></div>
        </div>
        <div class="watch-sidebar">
            <h3>Recommended</h3>
            <div id="rec-list" class="recommended-list"></div>
        </div>
    `;

    container.appendChild(wrapper);

    // Mount video player
    renderVideoPlayer(video.videoUrl, document.getElementById('player-mount'), video.category);

    // Mount comments
    renderCommentSection(videoId, document.getElementById('comments-mount'));

    // Mount recommended
    const recList = document.getElementById('rec-list');
    allRec.forEach(v => recList.appendChild(createVideoCard(v, 'horizontal')));

    // Description toggle
    const descText = document.getElementById('desc-text');
    const descToggle = document.getElementById('desc-toggle');
    descToggle?.addEventListener('click', () => {
        descText.classList.toggle('line-clamp-3');
        descToggle.textContent = descText.classList.contains('line-clamp-3') ? 'Show more' : 'Show less';
    });

    // Channel link
    wrapper.querySelector('.channel-name-link')?.addEventListener('click', () => {
        navigateTo('/channel/' + video.channelId);
    });

    // Subscribe
    document.getElementById('sub-btn')?.addEventListener('click', () => {
        if (!currentUser) return showToast('Sign in to subscribe', 'error');
        toggleSubscription(video.channelId, currentUser.id);
        const updated = getCurrentUser();
        if (updated) setCurrentUser(updated);
        const nowSub = updated?.subscriptions?.includes(video.channelId);
        const btn = document.getElementById('sub-btn');
        btn.textContent = nowSub ? 'Subscribed' : 'Subscribe';
        btn.className = `btn ${nowSub ? 'btn-secondary' : 'btn-primary'} btn-pill`;
        showToast(nowSub ? 'Subscribed!' : 'Unsubscribed');
    });

    // Like
    document.getElementById('like-btn')?.addEventListener('click', () => {
        if (!currentUser) return showToast('Sign in to like', 'error');
        toggleLike(videoId, currentUser.id);
        const v = getVideos().find(x => x.id === videoId);
        const cnt = Array.isArray(v.likes) ? v.likes.length : 0;
        const liked = v.likes?.includes(currentUser.id);
        document.getElementById('like-count').textContent = cnt;
        const likeBtn = document.getElementById('like-btn');
        likeBtn.className = `like-btn ${liked ? 'active' : ''}`;
        likeBtn.querySelector('.material-icons').textContent = liked ? 'thumb_up' : 'thumb_up_off_alt';
        const dBtn = document.getElementById('dislike-btn');
        dBtn.className = 'dislike-btn';
        dBtn.querySelector('.material-icons').textContent = 'thumb_down_off_alt';
    });

    // Dislike
    document.getElementById('dislike-btn')?.addEventListener('click', () => {
        if (!currentUser) return showToast('Sign in to dislike', 'error');
        toggleDislike(videoId, currentUser.id);
        const v = getVideos().find(x => x.id === videoId);
        const disliked = v.dislikes?.includes(currentUser.id);
        const dBtn = document.getElementById('dislike-btn');
        dBtn.className = `dislike-btn ${disliked ? 'active' : ''}`;
        dBtn.querySelector('.material-icons').textContent = disliked ? 'thumb_down' : 'thumb_down_off_alt';
        const lBtn = document.getElementById('like-btn');
        lBtn.className = 'like-btn';
        lBtn.querySelector('.material-icons').textContent = 'thumb_up_off_alt';
        const cnt = Array.isArray(v.likes) ? v.likes.length : 0;
        document.getElementById('like-count').textContent = cnt;
    });
}
