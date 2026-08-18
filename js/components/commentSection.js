import { getCurrentUser, getComments, addComment, deleteComment } from '../store.js';
import { formatDate, getInitials, generateId, escapeHtml } from '../utils.js';
import { showToast } from './toast.js';
import { navigateTo } from '../router.js';

export function renderCommentSection(videoId, container) {
    if (!container) return;
    const currentUser = getCurrentUser();

    function render() {
        const comments = getComments(videoId);

        container.innerHTML = `
            <div class="comment-section">
                <h3 class="comment-count">${comments.length} Comment${comments.length !== 1 ? 's' : ''}</h3>
                ${currentUser ? `
                <div class="comment-input-area">
                    <div class="avatar-circle small" style="background:${currentUser.avatarBg || '#666'}">
                        ${getInitials(currentUser.displayName)}
                    </div>
                    <div class="comment-form">
                        <textarea id="comment-text" placeholder="Add a comment..." rows="1"></textarea>
                        <div class="comment-form-actions hidden" id="comment-actions">
                            <button class="btn btn-secondary btn-sm" id="cancel-comment">Cancel</button>
                            <button class="btn btn-primary btn-sm" id="submit-comment" disabled>Comment</button>
                        </div>
                    </div>
                </div>` : `
                <p class="login-prompt">Sign in to add a comment</p>`}
                <div class="comment-list">
                    ${comments.map(c => `
                        <div class="comment-item" data-id="${c.id}">
                            <div class="avatar-circle small" style="background:${c.avatarBg || '#666'}">
                                ${getInitials(c.username)}
                            </div>
                            <div class="comment-body">
                                <div class="comment-header">
                                    <span class="comment-author">@${escapeHtml(c.username)}</span>
                                    <span class="comment-time">${formatDate(c.date)}</span>
                                </div>
                                <p class="comment-text">${escapeHtml(c.text)}</p>
                                <div class="comment-actions-row">
                                    ${currentUser && currentUser.id === c.userId
                                        ? '<button class="text-btn delete-comment">Delete</button>'
                                        : ''}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // Comment input logic
        if (currentUser) {
            const textarea = container.querySelector('#comment-text');
            const actions = container.querySelector('#comment-actions');
            const submitBtn = container.querySelector('#submit-comment');
            const cancelBtn = container.querySelector('#cancel-comment');

            textarea.addEventListener('focus', () => actions.classList.remove('hidden'));
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
                submitBtn.disabled = !textarea.value.trim();
            });

            cancelBtn.addEventListener('click', () => {
                textarea.value = '';
                textarea.style.height = 'auto';
                actions.classList.add('hidden');
            });

            submitBtn.addEventListener('click', () => {
                const text = textarea.value.trim();
                if (!text) return;
                addComment({
                    id: generateId(),
                    videoId: videoId,
                    userId: currentUser.id,
                    username: currentUser.displayName,
                    avatarBg: currentUser.avatarBg,
                    text: text,
                    date: new Date().toISOString()
                });
                showToast('Comment posted', 'success');
                render(); // Re-render to show new comment
            });
        }

        // Delete comment
        container.querySelectorAll('.delete-comment').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.closest('.comment-item');
                const commentId = item.dataset.id;
                deleteComment(commentId);
                showToast('Comment deleted');
                render();
            });
        });
    }

    render();
}
