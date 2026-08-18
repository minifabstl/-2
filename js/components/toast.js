import { createElement } from '../utils.js';

let toastContainer = null;

function getToastContainer() {
    if (!toastContainer) {
        toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = createElement('div', { id: 'toast-container', className: 'toast-container' });
            document.body.appendChild(toastContainer);
        }
    }
    return toastContainer;
}

export function showToast(message, type = 'info', duration = 3000) {
    const container = getToastContainer();
    
    const toast = createElement('div', { className: `toast toast-${type}` }, [
        createElement('div', { className: 'toast-message', textContent: message }),
        createElement('button', { 
            className: 'toast-close', 
            innerHTML: '&times;',
            onclick: () => removeToast(toast)
        }),
        createElement('div', { className: 'toast-progress' })
    ]);

    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('toast-show');
        toast.querySelector('.toast-progress').style.transition = `width ${duration}ms linear`;
        toast.querySelector('.toast-progress').style.width = '0%';
    });

    const timeoutId = setTimeout(() => {
        removeToast(toast);
    }, duration);

    toast.dataset.timeoutId = timeoutId;
}

function removeToast(toast) {
    if (toast.dataset.timeoutId) {
        clearTimeout(toast.dataset.timeoutId);
    }
    toast.classList.remove('toast-show');
    toast.addEventListener('transitionend', () => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    });
}
