import { addVideo, getCurrentUser, getSubscriptions, addNotification } from '../store.js';
import { getState } from '../state.js';
import { navigateTo } from '../router.js';
import { showToast } from '../components/toast.js';
import { generateId } from '../utils.js';

const CATEGORIES = ['Music', 'Gaming', 'Education', 'Sports', 'News', 'Entertainment', 'Technology', 'Comedy', 'Cooking'];

export function renderUploadPage(container) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        showToast('Please sign in to upload', 'error');
        navigateTo('/auth');
        return;
    }

    container.innerHTML = `
    <div class="upload-page animate-fade-in">
        <h2><span class="material-icons">cloud_upload</span> Upload Video</h2>
        <div class="upload-container">
            <div id="drop-zone" class="drop-zone">
                <div class="drop-content" id="drop-content">
                    <span class="material-icons" style="font-size:64px;color:var(--text-tertiary)">cloud_upload</span>
                    <p>Drag and drop a video file here</p>
                    <p class="text-tertiary">or</p>
                    <button class="btn btn-primary" id="browse-btn">Select File</button>
                    <input type="file" id="file-input" accept="video/*" hidden>
                </div>
                <video id="video-preview" controls hidden></video>
            </div>
            <form id="upload-form" class="upload-form hidden">
                <div class="form-group">
                    <label for="vid-title">Title *</label>
                    <input type="text" id="vid-title" placeholder="Add a title" required>
                </div>
                <div class="form-group">
                    <label for="vid-desc">Description</label>
                    <textarea id="vid-desc" rows="4" placeholder="Tell viewers about your video"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="vid-cat">Category</label>
                        <select id="vid-cat">${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}</select>
                    </div>
                    <div class="form-group">
                        <label for="vid-tags">Tags</label>
                        <input type="text" id="vid-tags" placeholder="gaming, fun, tutorial">
                    </div>
                </div>
                <div class="form-group">
                    <label>Thumbnail Preview</label>
                    <canvas id="thumb-canvas" width="320" height="180"></canvas>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="submit-btn" disabled>Upload</button>
                </div>
                <div class="upload-progress hidden" id="progress-area">
                    <div class="progress-bar"><div class="progress-fill" id="progress-fill"></div></div>
                    <p id="progress-text">Uploading... 0%</p>
                </div>
            </form>
        </div>
    </div>`;

    let selectedFile = null;
    let videoUrl = null;
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const preview = document.getElementById('video-preview');
    const dropContent = document.getElementById('drop-content');
    const form = document.getElementById('upload-form');
    const titleInput = document.getElementById('vid-title');
    const submitBtn = document.getElementById('submit-btn');
    const canvas = document.getElementById('thumb-canvas');

    document.getElementById('browse-btn').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleFile(e.target.files));

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-active'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-active'));
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('drag-active'); handleFile(e.dataTransfer.files); });

    function handleFile(files) {
        if (!files.length || !files[0].type.startsWith('video/')) {
            showToast('Please select a video file', 'error');
            return;
        }
        selectedFile = files[0];
        videoUrl = URL.createObjectURL(selectedFile);
        dropContent.classList.add('hidden');
        preview.src = videoUrl;
        preview.hidden = false;
        form.classList.remove('hidden');

        preview.addEventListener('loadeddata', () => { preview.currentTime = 1; }, { once: true });
        preview.addEventListener('seeked', () => {
            canvas.getContext('2d').drawImage(preview, 0, 0, 320, 180);
        }, { once: true });
    }

    titleInput.addEventListener('input', () => { submitBtn.disabled = !titleInput.value.trim(); });
    document.getElementById('cancel-btn').addEventListener('click', () => navigateTo('/'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!selectedFile || !titleInput.value.trim()) return;

        const progressArea = document.getElementById('progress-area');
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        progressArea.classList.remove('hidden');
        submitBtn.disabled = true;

        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 25 + 10;
            if (progress > 100) progress = 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Uploading... ${Math.round(progress)}%`;
            if (progress >= 100) {
                clearInterval(interval);
                const newVideo = {
                    id: generateId(),
                    title: titleInput.value.trim(),
                    description: document.getElementById('vid-desc').value.trim(),
                    channelId: currentUser.id,
                    channelName: currentUser.displayName,
                    channelAvatar: currentUser.avatarBg,
                    category: document.getElementById('vid-cat').value,
                    views: 0,
                    likes: [],
                    dislikes: [],
                    duration: Math.floor(preview.duration || 0),
                    uploadDate: new Date().toISOString(),
                    thumbnail: canvas.toDataURL('image/jpeg'),
                    videoUrl: videoUrl,
                    tags: document.getElementById('vid-tags').value.split(',').map(t => t.trim()).filter(Boolean)
                };
                addVideo(newVideo);
                showToast('Video uploaded!', 'success');
                navigateTo('/watch/' + newVideo.id);
            }
        }, 300);
    });
}
