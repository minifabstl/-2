import { createElement } from '../utils.js';

let modalRoot = null;
let currentOnClose = null;

function getModalRoot() {
    if (!modalRoot) {
        modalRoot = document.getElementById('modal-root');
        if (!modalRoot) {
            modalRoot = createElement('div', { id: 'modal-root', className: 'modal-root hidden' });
            
            const backdrop = createElement('div', { 
                className: 'modal-backdrop',
                onclick: (e) => {
                    if (e.target === backdrop) closeModal();
                }
            });
            
            const modalContent = createElement('div', { className: 'modal-content' });
            
            modalRoot.appendChild(backdrop);
            modalRoot.appendChild(modalContent);
            document.body.appendChild(modalRoot);

            // Escape key listener
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !modalRoot.classList.contains('hidden')) {
                    closeModal();
                }
            });
        }
    }
    return modalRoot;
}

export function showModal(contentElement, options = {}) {
    const root = getModalRoot();
    const contentContainer = root.querySelector('.modal-content');
    
    contentContainer.innerHTML = ''; // clear
    contentContainer.className = `modal-content ${options.size || 'md'}`;
    
    if (options.title) {
        const header = createElement('div', { className: 'modal-header' }, [
            createElement('h2', { textContent: options.title }),
            createElement('button', { 
                className: 'modal-close-btn', 
                innerHTML: '&times;',
                onclick: closeModal
            })
        ]);
        contentContainer.appendChild(header);
    }

    const body = createElement('div', { className: 'modal-body' });
    body.appendChild(contentElement);
    contentContainer.appendChild(body);

    currentOnClose = options.onClose || null;
    
    root.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // lock scroll
    
    requestAnimationFrame(() => {
        root.classList.add('modal-visible');
    });
}

export function closeModal() {
    const root = getModalRoot();
    root.classList.remove('modal-visible');
    
    setTimeout(() => {
        root.classList.add('hidden');
        document.body.style.overflow = ''; // unlock scroll
        if (currentOnClose) {
            currentOnClose();
            currentOnClose = null;
        }
    }, 200); // match transition duration
}
