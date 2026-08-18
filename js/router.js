let currentRoute = null;
let currentParams = {};
const listeners = [];

export function parseRoute(hash) {
    const path = hash.replace(/^#\//, '') || '/';
    const parts = path.split('?');
    const pathname = parts[0] === '/' ? '/' : `/${parts[0]}`;
    
    // Simple param parsing (e.g. /watch/123)
    const routeParts = pathname.split('/').filter(Boolean);
    const params = {};
    
    let route = '/';
    if (routeParts.length > 0) {
        const base = routeParts[0];
        if (base === 'watch' && routeParts[1]) {
            route = '/watch';
            params.id = routeParts[1];
        } else if (base === 'channel' && routeParts[1]) {
            route = '/channel';
            params.id = routeParts[1];
        } else if (base === 'category' && routeParts[1]) {
            route = '/category';
            params.name = decodeURIComponent(routeParts[1]);
        } else {
            route = `/${base}`;
        }
    }
    
    return { route, params, fullPath: path };
}

export function navigateTo(path) {
    window.location.hash = path.startsWith('#/') ? path : `#/${path.replace(/^\//, '')}`;
}

export function getCurrentRoute() {
    return currentRoute;
}

export function getRouteParams() {
    return currentParams;
}

export function onRouteChange(callback) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index !== -1) listeners.splice(index, 1);
    };
}

function handleHashChange() {
    const { route, params } = parseRoute(window.location.hash);
    currentRoute = route;
    currentParams = params;
    
    listeners.forEach(callback => callback(route, params));
}

// Initialize router
window.addEventListener('hashchange', handleHashChange);
// Initial parse
handleHashChange();
