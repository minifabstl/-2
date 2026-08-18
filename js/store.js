// LocalStorage wrappers
const STORAGE_KEYS = {
    USERS: 'vidflow_users',
    VIDEOS: 'vidflow_videos',
    COMMENTS: 'vidflow_comments',
    NOTIFICATIONS: 'vidflow_notifications',
    CURRENT_USER: 'vidflow_currentUser',
    INITIALIZED: 'vidflow_initialized'
};

function readItem(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error(`Error reading ${key} from localStorage`, e);
        return defaultValue;
    }
}

function writeItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Error writing ${key} to localStorage`, e);
    }
}

// Users
export function getUsers() {
    return readItem(STORAGE_KEYS.USERS, []);
}

export function setUsers(users) {
    writeItem(STORAGE_KEYS.USERS, users);
}

// Videos
export function getVideos() {
    return readItem(STORAGE_KEYS.VIDEOS, []);
}

export function setVideos(videos) {
    writeItem(STORAGE_KEYS.VIDEOS, videos);
}

export function addVideo(video) {
    const videos = getVideos();
    videos.unshift(video);
    setVideos(videos);
}

export function updateVideo(id, updates) {
    const videos = getVideos();
    const index = videos.findIndex(v => v.id === id);
    if (index !== -1) {
        videos[index] = { ...videos[index], ...updates };
        setVideos(videos);
    }
}

export function deleteVideo(id) {
    const videos = getVideos();
    setVideos(videos.filter(v => v.id !== id));
}

// Comments
export function getComments(videoId) {
    const comments = readItem(STORAGE_KEYS.COMMENTS, []);
    return comments.filter(c => c.videoId === videoId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addComment(comment) {
    const comments = readItem(STORAGE_KEYS.COMMENTS, []);
    comments.unshift(comment);
    writeItem(STORAGE_KEYS.COMMENTS, comments);
}

export function deleteComment(commentId) {
    const comments = readItem(STORAGE_KEYS.COMMENTS, []);
    writeItem(STORAGE_KEYS.COMMENTS, comments.filter(c => c.id !== commentId));
}

// Auth
export function getCurrentUser() {
    return readItem(STORAGE_KEYS.CURRENT_USER, null);
}

export function setCurrentUser(user) {
    writeItem(STORAGE_KEYS.CURRENT_USER, user);
}

export function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Notifications
export function getNotifications(userId) {
    const notifications = readItem(STORAGE_KEYS.NOTIFICATIONS, []);
    return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addNotification(notification) {
    const notifications = readItem(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.unshift(notification);
    writeItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

export function markNotificationRead(id) {
    const notifications = readItem(STORAGE_KEYS.NOTIFICATIONS, []);
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        writeItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
    }
}

export function markAllRead(userId) {
    const notifications = readItem(STORAGE_KEYS.NOTIFICATIONS, []);
    notifications.forEach(n => {
        if (n.userId === userId) {
            n.read = true;
        }
    });
    writeItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

// Engagement
export function toggleLike(videoId, userId) {
    const videos = getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    video.dislikes = (video.dislikes || []).filter(id => id !== userId);
    video.likes = video.likes || [];
    
    if (video.likes.includes(userId)) {
        video.likes = video.likes.filter(id => id !== userId);
    } else {
        video.likes.push(userId);
    }
    
    setVideos(videos);
}

export function toggleDislike(videoId, userId) {
    const videos = getVideos();
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    video.likes = (video.likes || []).filter(id => id !== userId);
    video.dislikes = video.dislikes || [];
    
    if (video.dislikes.includes(userId)) {
        video.dislikes = video.dislikes.filter(id => id !== userId);
    } else {
        video.dislikes.push(userId);
    }
    
    setVideos(videos);
}

export function toggleSubscription(channelId, userId) {
    const users = getUsers();
    const channel = users.find(u => u.id === channelId);
    const currentUser = users.find(u => u.id === userId);
    
    if (!channel || !currentUser) return;

    currentUser.subscriptions = currentUser.subscriptions || [];
    const isSubscribed = currentUser.subscriptions.includes(channelId);

    if (isSubscribed) {
        currentUser.subscriptions = currentUser.subscriptions.filter(id => id !== channelId);
        channel.subscriberCount = Math.max(0, (channel.subscriberCount || 1) - 1);
    } else {
        currentUser.subscriptions.push(channelId);
        channel.subscriberCount = (channel.subscriberCount || 0) + 1;
    }

    setUsers(users);
    
    // Update current user cache if it's the current user
    const loggedInUser = getCurrentUser();
    if (loggedInUser && loggedInUser.id === userId) {
        setCurrentUser(currentUser);
    }
}

export function getSubscriptions(userId) {
    const users = getUsers();
    const currentUser = users.find(u => u.id === userId);
    if (!currentUser || !currentUser.subscriptions) return [];
    
    return users.filter(u => currentUser.subscriptions.includes(u.id));
}

export function incrementViews(videoId) {
    const videos = getVideos();
    const video = videos.find(v => v.id === videoId);
    if (video) {
        video.views = (video.views || 0) + 1;
        setVideos(videos);
    }
}

// Initialization state
export function isInitialized() {
    return readItem(STORAGE_KEYS.INITIALIZED, false);
}

export function setInitialized() {
    writeItem(STORAGE_KEYS.INITIALIZED, true);
}
