import { getVideos, getUsers } from '../store.js';
import { navigateTo } from '../router.js';
import { createVideoCard } from '../components/videoCard.js';
import { formatViews, formatDate, formatDuration } from '../utils.js';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'Sports', 'News', 'Entertainment', 'Technology', 'Comedy', 'Cooking'];

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

export function renderHomePage(container, mode) {
    const videos = getVideos();
    if (!videos || videos.length === 0) {
        container.innerHTML = '<div class="empty-state"><span class="material-icons">videocam_off</span><h3>No videos yet</h3><p>Be the first to upload!</p></div>';
        return;
    }

    const sorted = [...videos].sort((a, b) => b.views - a.views);
    const featured = sorted[0];
    const trending = sorted.slice(0, 12);
    let activeCategory = 'All';

    const wrapper = document.createElement('div');
    wrapper.className = 'home-page animate-fade-in';

    // Category chips
    const chipsHtml = CATEGORIES.map(c =>
        `<button class="chip ${c === 'All' ? 'active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');

    // Featured section
    const featGradient = CATEGORY_GRADIENTS[featured.category] || 'linear-gradient(135deg,#667eea,#764ba2)';
    const featuredHtml = `
        <section class="featured-section" data-id="${featured.id}">
            <div class="featured-thumb" style="background:${featGradient}">
                <div class="featured-play"><span class="material-icons">play_circle</span></div>
                <span class="duration-badge">${formatDuration(featured.duration)}</span>
            </div>
            <div class="featured-info">
                <h2>${featured.title}</h2>
                <p class="featured-meta">${featured.channelName} • ${formatViews(featured.views)} • ${formatDate(featured.uploadDate)}</p>
                <p class="featured-desc">${featured.description || ''}</p>
            </div>
        </section>
    `;

    wrapper.innerHTML = `
        <div class="category-chips-scroll">
            <div class="category-chips">${chipsHtml}</div>
        </div>
        ${mode !== 'trending' ? featuredHtml : ''}
        <section class="video-section">
            <div class="section-header">
                <h3>${mode === 'trending' ? '🔥 Trending' : 'Trending Now'}</h3>
            </div>
            <div class="video-grid" id="home-grid"></div>
        </section>
    `;

    container.appendChild(wrapper);

    // Render video grid
    const grid = wrapper.querySelector('#home-grid');
    trending.forEach(v => grid.appendChild(createVideoCard(v)));

    // Featured click
    const featEl = wrapper.querySelector('.featured-section');
    if (featEl) {
        featEl.style.cursor = 'pointer';
        featEl.addEventListener('click', () => navigateTo('/watch/' + featured.id));
    }

    // Category chip filtering
    wrapper.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
            wrapper.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            const cat = chip.dataset.cat;
            grid.innerHTML = '';
            const filtered = cat === 'All' ? sorted : sorted.filter(v => v.category === cat);
            filtered.slice(0, 20).forEach(v => grid.appendChild(createVideoCard(v)));
            if (filtered.length === 0) {
                grid.innerHTML = '<div class="empty-state"><p>No videos in this category</p></div>';
            }
        });
    });
}
