export function formatViews(count) {
    if (count === undefined || count === null) return '0 views';
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M views';
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K views';
    }
    return count.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' views';
}

export function formatDate(isoString) {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) {
        const min = Math.floor(diffInSeconds / 60);
        return `${min} minute${min !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
        const hour = Math.floor(diffInSeconds / 3600);
        return `${hour} hour${hour !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 604800) {
        const day = Math.floor(diffInSeconds / 86400);
        return `${day} day${day !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 2592000) {
        const week = Math.floor(diffInSeconds / 604800);
        return `${week} week${week !== 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 31536000) {
        const month = Math.floor(diffInSeconds / 2592000);
        return `${month} month${month !== 1 ? 's' : ''} ago`;
    }
    const year = Math.floor(diffInSeconds / 31536000);
    return `${year} year${year !== 1 ? 's' : ''} ago`;
}

export function formatDuration(seconds) {
    if (!seconds) return '0:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const formattedMins = hrs > 0 ? String(mins).padStart(2, '0') : mins;
    const formattedSecs = String(secs).padStart(2, '0');

    if (hrs > 0) {
        return `${hrs}:${formattedMins}:${formattedSecs}`;
    }
    return `${formattedMins}:${formattedSecs}`;
}

export function generateId() {
    return 'id_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}

export function throttle(fn, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}

export function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

export function validateEmail(email) {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(String(email).toLowerCase());
}

export function validatePassword(password) {
    return typeof password === 'string' && password.length >= 6;
}

export function getRandomColor() {
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', 
        '#22c55e', '#10b981', '#06b6d4', '#0ea5e9', 
        '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef', 
        '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

export function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(p => p.length > 0);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    
    for (const [key, value] of Object.entries(attributes)) {
        if (key === 'className') {
            element.className = value;
        } else if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.substring(2).toLowerCase(), value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    children.forEach(child => {
        if (typeof child === 'string' || typeof child === 'number') {
            element.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });
    
    return element;
}
