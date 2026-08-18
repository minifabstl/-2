import { getVideos } from '../store.js';
import { createVideoCard } from '../components/videoCard.js';

const ICONS = { Music:'🎵', Gaming:'🎮', Education:'📚', Sports:'⚽', News:'📰', Entertainment:'🎬', Technology:'💻', Comedy:'😂', Cooking:'🍳' };

export function renderCategoryPage(container, categoryName) {
    const name = decodeURIComponent(categoryName || '');
    const icon = ICONS[name] || '📺';
    const videos = getVideos().filter(v => v.category === name);

    container.innerHTML = `
    <div class="category-page animate-fade-in">
        <div class="category-header">
            <h1><span class="cat-icon">${icon}</span> ${name}</h1>
            <select id="cat-sort"><option value="popular">Most Popular</option><option value="newest">Newest</option></select>
        </div>
        <div id="cat-grid"></div>
    </div>`;

    const grid = document.getElementById('cat-grid');
    function renderSorted(sort) {
        const sorted = [...videos].sort((a, b) => sort === 'newest' ? new Date(b.uploadDate) - new Date(a.uploadDate) : b.views - a.views);
        grid.innerHTML = '';
        if (sorted.length === 0) {
            grid.innerHTML = '<div class="empty-state"><p>No videos in this category</p></div>';
        } else {
            const g = document.createElement('div'); g.className = 'video-grid';
            sorted.forEach(v => g.appendChild(createVideoCard(v)));
            grid.appendChild(g);
        }
    }
    renderSorted('popular');
    document.getElementById('cat-sort').addEventListener('change', (e) => renderSorted(e.target.value));
}
