import { formatDuration } from '../utils.js';

export function renderVideoPlayer(videoUrl, container, category = 'Entertainment') {
    if (!container) return;

    if (!videoUrl) {
        const gradients = {
            'Music': 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
            'Gaming': 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
            'Education': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'Sports': 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
            'News': 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
            'Entertainment': 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
            'Technology': 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
            'Comedy': 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
            'Cooking': 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)'
        };
        const bg = gradients[category] || 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)';
        container.innerHTML = \`
            <div class="video-placeholder" style="background: \${bg}; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; position: relative;">
                <div style="font-size: 4rem; opacity: 0.8; filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));">▶️</div>
            </div>
        \`;
        return;
    }

    container.innerHTML = \`
        <div class="video-player-wrapper" id="custom-video-player">
            <video src="\${videoUrl}" id="native-video"></video>
            <div class="video-controls-overlay">
                <div class="progress-container" id="progress-container">
                    <div class="progress-unloaded"></div>
                    <div class="progress-buffered" id="progress-buffered"></div>
                    <div class="progress-played" id="progress-played"></div>
                    <div class="progress-scrubber" id="progress-scrubber"></div>
                </div>
                <div class="controls-row">
                    <div class="controls-left">
                        <button id="play-pause-btn" class="control-btn" aria-label="Play">▶️</button>
                        <div class="volume-container">
                            <button id="mute-btn" class="control-btn" aria-label="Mute">🔊</button>
                            <input type="range" id="volume-slider" min="0" max="1" step="0.05" value="1" />
                        </div>
                        <div class="time-display">
                            <span id="current-time">0:00</span> / <span id="total-time">0:00</span>
                        </div>
                    </div>
                    <div class="controls-right">
                        <select id="playback-speed" class="speed-select" aria-label="Playback Speed">
                            <option value="0.5">0.5x</option>
                            <option value="0.75">0.75x</option>
                            <option value="1" selected>1x</option>
                            <option value="1.25">1.25x</option>
                            <option value="1.5">1.5x</option>
                            <option value="2">2x</option>
                        </select>
                        <button id="fullscreen-btn" class="control-btn" aria-label="Fullscreen">⛶</button>
                    </div>
                </div>
            </div>
        </div>
    \`;

    const wrapper = container.querySelector('#custom-video-player');
    const video = container.querySelector('#native-video');
    const playBtn = container.querySelector('#play-pause-btn');
    const muteBtn = container.querySelector('#mute-btn');
    const volumeSlider = container.querySelector('#volume-slider');
    const currentTimeEl = container.querySelector('#current-time');
    const totalTimeEl = container.querySelector('#total-time');
    const speedSelect = container.querySelector('#playback-speed');
    const fullscreenBtn = container.querySelector('#fullscreen-btn');
    const progressContainer = container.querySelector('#progress-container');
    const progressPlayed = container.querySelector('#progress-played');
    const progressBuffered = container.querySelector('#progress-buffered');
    const progressScrubber = container.querySelector('#progress-scrubber');

    let hideControlsTimeout;

    const togglePlay = () => {
        if (video.paused) {
            video.play();
            playBtn.textContent = '⏸️';
        } else {
            video.pause();
            playBtn.textContent = '▶️';
        }
    };

    const toggleMute = () => {
        video.muted = !video.muted;
        muteBtn.textContent = video.muted || video.volume === 0 ? '🔇' : '🔊';
        if (!video.muted && video.volume === 0) {
            video.volume = 1;
            volumeSlider.value = 1;
        } else {
            volumeSlider.value = video.muted ? 0 : video.volume;
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            wrapper.requestFullscreen().catch(err => console.log(err));
        } else {
            document.exitFullscreen();
        }
    };

    const formatTime = (seconds) => {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return \`\${m}:\${s < 10 ? '0' : ''}\${s}\`;
    };

    const updateProgress = () => {
        const percent = (video.currentTime / video.duration) * 100;
        if (!isNaN(percent)) {
            progressPlayed.style.width = \`\${percent}%\`;
            progressScrubber.style.left = \`\${percent}%\`;
            currentTimeEl.textContent = formatTime(video.currentTime);
        }
        
        if (video.buffered.length > 0 && video.duration > 0) {
            const bufferedPercent = (video.buffered.end(video.buffered.length - 1) / video.duration) * 100;
            progressBuffered.style.width = \`\${bufferedPercent}%\`;
        }
    };

    const seek = (e) => {
        if (video.duration) {
            const rect = progressContainer.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            video.currentTime = pos * video.duration;
        }
    };

    const showControls = () => {
        wrapper.classList.remove('controls-hidden');
        clearTimeout(hideControlsTimeout);
        if (!video.paused) {
            hideControlsTimeout = setTimeout(() => {
                wrapper.classList.add('controls-hidden');
            }, 3000);
        }
    };

    playBtn.addEventListener('click', togglePlay);
    video.addEventListener('click', togglePlay);
    muteBtn.addEventListener('click', toggleMute);
    volumeSlider.addEventListener('input', (e) => {
        video.volume = e.target.value;
        video.muted = e.target.value == 0;
        muteBtn.textContent = video.muted ? '🔇' : '🔊';
    });
    speedSelect.addEventListener('change', (e) => {
        video.playbackRate = parseFloat(e.target.value);
    });
    fullscreenBtn.addEventListener('click', toggleFullscreen);
    
    video.addEventListener('loadedmetadata', () => {
        totalTimeEl.textContent = formatTime(video.duration);
    });
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('progress', updateProgress);
    video.addEventListener('ended', () => {
        playBtn.textContent = '▶️';
        showControls();
    });

    let isDragging = false;
    progressContainer.addEventListener('mousedown', (e) => {
        isDragging = true;
        seek(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) seek(e);
    });
    document.addEventListener('mouseup', () => {
        if (isDragging) isDragging = false;
    });

    wrapper.addEventListener('mousemove', showControls);
    wrapper.addEventListener('mouseleave', () => {
        if (!video.paused) wrapper.classList.add('controls-hidden');
    });

    wrapper.tabIndex = 0;
    wrapper.addEventListener('keydown', (e) => {
        switch(e.key.toLowerCase()) {
            case ' ':
            case 'k':
                e.preventDefault();
                togglePlay();
                break;
            case 'm':
                toggleMute();
                break;
            case 'f':
                toggleFullscreen();
                break;
            case 'arrowright':
                if (video.duration) video.currentTime = Math.min(video.duration, video.currentTime + 5);
                break;
            case 'arrowleft':
                if (video.duration) video.currentTime = Math.max(0, video.currentTime - 5);
                break;
        }
        showControls();
    });
}
