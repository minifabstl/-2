import { isInitialized, setInitialized, setUsers, setVideos } from './store.js';
import { generateId, getRandomColor } from './utils.js';

const CATEGORIES = ['Music', 'Gaming', 'Education', 'Sports', 'News', 'Entertainment', 'Technology', 'Comedy', 'Cooking'];

const MOCK_CHANNELS = [
    { username: 'techvision', displayName: 'TechVision', bio: 'The latest in technology and programming.', category: 'Technology' },
    { username: 'gamezone', displayName: 'GameZone', bio: 'Daily gaming streams and reviews.', category: 'Gaming' },
    { username: 'musicvibes', displayName: 'MusicVibes', bio: 'Chill beats and live performances.', category: 'Music' },
    { username: 'learnhub', displayName: 'LearnHub', bio: 'Educational content for lifelong learners.', category: 'Education' },
    { username: 'sportsfan', displayName: 'SportsFan', bio: 'Highlights and analysis of recent games.', category: 'Sports' },
    { username: 'comedyclub', displayName: 'ComedyClub', bio: 'Stand-up clips and sketches.', category: 'Comedy' },
    { username: 'newsdaily', displayName: 'NewsDaily', bio: 'Your daily news digest.', category: 'News' },
    { username: 'cookmaster', displayName: 'CookMaster', bio: 'Recipes and cooking techniques.', category: 'Cooking' }
];

const MOCK_TITLES = [
    "Building a Neural Network from Scratch",
    "Top 10 RPGs of the Decade",
    "LoFi Beats to Study To",
    "Understanding Quantum Physics in 10 Minutes",
    "Finals Highlights 2025",
    "Standup Comedy Special - Live",
    "Global Tech Summit Keynote",
    "How to Make the Perfect Sourdough",
    "Next.js vs Remix - Which is Better?",
    "Speedrun World Record Compilation",
    "Acoustic Covers Collection",
    "History of the Roman Empire",
    "10 Essential CSS Tricks",
    "Let's Play Minecraft Ep 1",
    "Easy Dinners for Busy Weeknights",
    "The Future of Artificial Intelligence",
    "Top 5 Goals of the Week",
    "Hilarious Prank Goes Wrong!",
    "Breaking News: Space Exploration",
    "Baking Perfect Croissants",
    "React Performance Optimization",
    "E3 Trailer Reactions",
    "Piano Tutorial for Beginners",
    "Learn Spanish in 30 Days"
];

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

export function initializeSeedData() {
    if (isInitialized()) return;

    console.log("Initializing seed data for VidFlow...");

    // Create users/channels
    const users = MOCK_CHANNELS.map(c => ({
        id: generateId(),
        username: c.username,
        displayName: c.displayName,
        email: `${c.username}@example.com`,
        password: 'password123', // Just for mock
        avatarBg: getRandomColor(),
        bio: c.bio,
        subscriberCount: Math.floor(Math.random() * 5000000) + 1000,
        joinDate: randomDate(new Date(2020, 0, 1), new Date()),
        subscriptions: []
    }));

    // Make channels subscribe to some others randomly
    users.forEach(u => {
        const numSubs = Math.floor(Math.random() * 4);
        for (let i = 0; i < numSubs; i++) {
            const randomSub = users[Math.floor(Math.random() * users.length)].id;
            if (randomSub !== u.id && !u.subscriptions.includes(randomSub)) {
                u.subscriptions.push(randomSub);
            }
        }
    });

    setUsers(users);

    // Create videos
    const videos = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    for (let i = 0; i < 24; i++) {
        const uploader = users[Math.floor(Math.random() * users.length)];
        const category = uploader.category;
        const title = MOCK_TITLES[i % MOCK_TITLES.length] + ` - ${Math.floor(Math.random()*100)}`;
        const views = Math.floor(Math.random() * 5000000) + 1000;
        
        const numLikes = Math.floor(views * (Math.random() * 0.1));
        const numDislikes = Math.floor(numLikes * (Math.random() * 0.1));

        // Create dummy liked users array
        const likes = [];
        const dislikes = [];
        
        videos.push({
            id: generateId(),
            title: title,
            description: `This is a great video about ${category.toLowerCase()}. Thanks for watching! Don't forget to like and subscribe.\n\nCreated by ${uploader.displayName}.`,
            channelId: uploader.id,
            channelName: uploader.displayName,
            channelAvatar: uploader.avatarBg,
            category: category,
            views: views,
            likes: likes,
            dislikes: dislikes,
            duration: Math.floor(Math.random() * 3000) + 60, // 1 min to 50 mins
            uploadDate: randomDate(thirtyDaysAgo, now),
            thumbnail: null, // Will use CSS gradient fallback
            videoUrl: null, // Will use placeholder
            tags: [category.toLowerCase(), 'trending', '2025']
        });
    }

    // Sort by newest
    videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    setVideos(videos);

    setInitialized();
    console.log("Seed data initialized.");
}
