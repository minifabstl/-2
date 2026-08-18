import { getVideos, getUsers } from '../store.js';
import { navigateTo } from '../router.js';
import { createVideoCard } from '../components/videoCard.js';
import { debounce } from '../utils.js';

export function renderSearchPage(container, query) {
    const videos = getVideos();
    const q = (query || '').toLowerCase();

    const results = q ? videos.filter(v => {
        return v.title.toLowerCase().includes(q) ||
               (v.description || '').toLowerCase().includes(q) ||
               (v.channelName || '').toLowerCase().includes(q) ||
               (v.tags || []).some(t => t.toLowerCase().includes(q));
    }) : [];

    container.innerHTML = `
    <div class="search-page animate-fade-in">
        <div class="search-controls">
            <input type="text" id="search-input" class="search-field" value="${q}" placeholder="Search videos...">
        </div>
        <p class="results-count">${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"</p>
        <div id="search-results" class="search-results-list"></div>
    </div>`;

    const resultsList = document.getElementById('search-results');
    if (results.length === 0 && q) {
        resultsList.innerHTML = '<div class="empty-state"><span class="material-icons">search_off</span><h3>No results found</h3><p>Try different keywords</p></div>';
    } else {
        results.forEach(v => resultsList.appendChild(createVideoCard(v, 'horizontal')));
    }

    const searchInput = document.getElementById('search-input');
    const doSearch = debounce((val) => {
        if (val) navigateTo('/search?q=' + encodeURIComponent(val));
    }, 500);
    searchInput.addEventListener('input', () => doSearch(searchInput.value.trim()));
}
