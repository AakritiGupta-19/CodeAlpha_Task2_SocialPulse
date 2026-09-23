const bcrypt = require('bcryptjs');
const db = require('./db');

console.log('🌱 Starting database seeding with enhanced features...');

// Clear existing tables in reverse dependency order
db.exec(`
  DELETE FROM stories;
  DELETE FROM reel_likes;
  DELETE FROM reels;
  DELETE FROM saved_posts;
  DELETE FROM notifications;
  DELETE FROM messages;
  DELETE FROM follows;
  DELETE FROM likes;
  DELETE FROM comments;
  DELETE FROM posts;
  DELETE FROM users;
  DELETE FROM sqlite_sequence;
`);

const password_hash = bcrypt.hashSync('password123', 10);

// 1. Seed Users
const usersData = [
  {
    username: 'user',
    email: 'user@example.com',
    full_name: 'user',
    bio: '',
    website: '',
    location: '',
    avatar_url: '/uploads/default-avatar.svg'
  },
  {
    username: 'alex_creative',
    email: 'alex@example.com',
    full_name: 'Alex Rivera',
    bio: 'Visual artist & photographer based in SF 📸 Capturing moments, creating stories.',
    website: 'https://alexrivera.art',
    location: 'San Francisco, CA',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  },
  {
    username: 'sophia_lens',
    email: 'sophia@example.com',
    full_name: 'Sophia Chen',
    bio: 'Traveler & sunset chaser 🌅 Living between mountain trails and ocean breezes.',
    website: 'https://sophiatravels.blog',
    location: 'Kyoto / Paris',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
  },
  {
    username: 'urban_vibes',
    email: 'marcus@example.com',
    full_name: 'Marcus Vance',
    bio: 'Architecture, brutalism, and street culture 🏙️ Always hunting for the perfect coffee ☕',
    website: 'https://marcusvance.design',
    location: 'Berlin, Germany',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
  },
  {
    username: 'nature_explorer',
    email: 'elena@example.com',
    full_name: 'Elena Woods',
    bio: 'Into the wild 🌲 Alpine summits, misty pine forests & film photography ⛰️',
    website: 'https://elenawoods.outdoor',
    location: 'Banff, Canada',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
  }
];

const insertUser = db.prepare(`
  INSERT INTO users (username, email, password_hash, full_name, bio, website, location, avatar_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const userIds = [];
for (const u of usersData) {
  const res = insertUser.run(u.username, u.email, password_hash, u.full_name, u.bio, u.website, u.location, u.avatar_url);
  userIds.push(res.lastInsertRowid);
}
console.log(`✅ Seeded ${userIds.length} users.`);

// 2. Seed Posts
const postsData = [
  {
    user_id: userIds[1],
    caption: 'Golden hour reflections along the Pacific coast. The rhythm of the tide never gets old. 🌊🌅 #coastal #goldenhour #photography',
    image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
    views_count: 342,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    user_id: userIds[2],
    caption: 'Lost in the labyrinth of ancient alleyways. Every turn reveals another century of stories. 🏛️✨ #travelgram #wanderlust #europe',
    image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1080&auto=format&fit=crop&q=80',
    views_count: 512,
    created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
  },
  {
    user_id: userIds[3],
    caption: 'Geometric balance in concrete & glass. Modernist dreams reaching up towards the clouds. 🏢📐 #architecture #minimalism #urban',
    image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80',
    views_count: 220,
    created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
  },
  {
    user_id: userIds[4],
    caption: 'First light cutting through morning mist in the Canadian Rockies. Absolutely breathtaking silence. 🏔️🌲 #nature #rockies #hiking',
    image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&auto=format&fit=crop&q=80',
    views_count: 678,
    created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
  },
  {
    user_id: userIds[1],
    caption: 'Late night studio sessions experimenting with neon lights and prisms. Art is discovery 🎨💡 #creative #neonvibes #visualart',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80',
    views_count: 410,
    created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
  },
  {
    user_id: userIds[1],
    caption: 'Morning espresso in Florence with a view over the Duomo rooftops. Pure bliss ☕🥐 #italy #coffeetime #travel',
    image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&auto=format&fit=crop&q=80',
    views_count: 290,
    created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
  }
];

const insertPost = db.prepare(`
  INSERT INTO posts (user_id, caption, image_url, views_count, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

const postIds = [];
for (const p of postsData) {
  const res = insertPost.run(p.user_id, p.caption, p.image_url, p.views_count, p.created_at);
  postIds.push(res.lastInsertRowid);
}
console.log(`✅ Seeded ${postIds.length} posts.`);

// 3. Seed Comments
const commentsData = [
  { post_id: postIds[0], user_id: userIds[1], comment_text: 'The tones in this are unreal! What lens did you shoot with? 🔥' },
  { post_id: postIds[0], user_id: userIds[2], comment_text: 'Such soothing colors. Perfect wallpaper material!' },
  { post_id: postIds[1], user_id: userIds[0], comment_text: 'Take me there right now! Stunning composition Sophia 👏' },
  { post_id: postIds[2], user_id: userIds[3], comment_text: 'Love the brutalist lines here Marcus!' },
  { post_id: postIds[3], user_id: userIds[0], comment_text: 'That mist is magic ✨ Reminds me of Banff.' },
  { post_id: postIds[3], user_id: userIds[1], comment_text: 'Incredible shot Elena! Must have been freezing!' },
  { post_id: postIds[5], user_id: userIds[2], comment_text: 'Best coffee spot in town, love it! ☕' }
];

const insertComment = db.prepare(`
  INSERT INTO comments (post_id, user_id, comment_text)
  VALUES (?, ?, ?)
`);

for (const c of commentsData) {
  insertComment.run(c.post_id, c.user_id, c.comment_text);
}
console.log(`✅ Seeded ${commentsData.length} comments.`);

// 4. Seed Likes
const likesData = [
  { post_id: postIds[0], user_id: userIds[1] },
  { post_id: postIds[0], user_id: userIds[2] },
  { post_id: postIds[0], user_id: userIds[3] },
  { post_id: postIds[1], user_id: userIds[0] },
  { post_id: postIds[1], user_id: userIds[2] },
  { post_id: postIds[2], user_id: userIds[0] },
  { post_id: postIds[2], user_id: userIds[1] },
  { post_id: postIds[3], user_id: userIds[0] },
  { post_id: postIds[3], user_id: userIds[1] },
  { post_id: postIds[3], user_id: userIds[2] },
  { post_id: postIds[4], user_id: userIds[1] },
  { post_id: postIds[5], user_id: userIds[0] }
];

const insertLike = db.prepare(`
  INSERT INTO likes (user_id, post_id)
  VALUES (?, ?)
`);

for (const l of likesData) {
  insertLike.run(l.user_id, l.post_id);
}
console.log(`✅ Seeded ${likesData.length} likes.`);

// 5. Seed Follows
const followsData = [
  { follower_id: userIds[0], following_id: userIds[1] },
  { follower_id: userIds[0], following_id: userIds[2] },
  { follower_id: userIds[1], following_id: userIds[0] },
  { follower_id: userIds[1], following_id: userIds[3] },
  { follower_id: userIds[2], following_id: userIds[0] },
  { follower_id: userIds[3], following_id: userIds[0] },
  { follower_id: userIds[3], following_id: userIds[1] }
];

const insertFollow = db.prepare(`
  INSERT INTO follows (follower_id, following_id)
  VALUES (?, ?)
`);

for (const f of followsData) {
  insertFollow.run(f.follower_id, f.following_id);
}
console.log(`✅ Seeded ${followsData.length} follow connections.`);

// 6. Seed Direct Messages
const messagesData = [
  { sender_id: userIds[1], receiver_id: userIds[0], message_text: 'Hey Alex! Loved your latest ocean sunset photo!', is_read: 1, created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString() },
  { sender_id: userIds[0], receiver_id: userIds[1], message_text: 'Thank you Sophia! Trying out some new film presets lately.', is_read: 1, created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString() },
  { sender_id: userIds[1], receiver_id: userIds[0], message_text: 'Are you planning a trip to Japan this autumn?', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString() },
  { sender_id: userIds[2], receiver_id: userIds[0], message_text: 'Hey man, let me know if you want to collaborate on the architecture series!', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString() }
];

const insertMessage = db.prepare(`
  INSERT INTO messages (sender_id, receiver_id, message_text, is_read, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

for (const m of messagesData) {
  insertMessage.run(m.sender_id, m.receiver_id, m.message_text, m.is_read, m.created_at);
}
console.log(`✅ Seeded ${messagesData.length} direct messages.`);

// 7. Seed Notifications
const notificationsData = [
  { user_id: userIds[0], actor_id: userIds[1], type: 'profile_setup', post_id: null, content: 'Welcome to SocialPulse! Please add your custom name and profile picture to complete your profile.', is_read: 0 },
  { user_id: userIds[0], actor_id: userIds[1], type: 'like', post_id: postIds[0], content: 'liked your post', is_read: 0 },
  { user_id: userIds[0], actor_id: userIds[2], type: 'follow', post_id: null, content: 'started following you', is_read: 0 }
];

const insertNotification = db.prepare(`
  INSERT INTO notifications (user_id, actor_id, type, post_id, content, is_read)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const n of notificationsData) {
  insertNotification.run(n.user_id, n.actor_id, n.type, n.post_id, n.content, n.is_read);
}
console.log(`✅ Seeded ${notificationsData.length} notifications.`);

// 8. Seed Saved Posts
const savedData = [
  { user_id: userIds[0], post_id: postIds[1] },
  { user_id: userIds[0], post_id: postIds[3] }
];

const insertSaved = db.prepare(`
  INSERT INTO saved_posts (user_id, post_id)
  VALUES (?, ?)
`);

for (const s of savedData) {
  insertSaved.run(s.user_id, s.post_id);
}
console.log(`✅ Seeded ${savedData.length} saved bookmarks.`);

// 9. Seed Reels (Vertical short videos with real high-performance video CDN links)
const reelsData = [
  {
    user_id: userIds[1], // Sophia
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
    caption: 'Sunset flight across volcanic plateaus ✨ Nothing compares to this golden serenity #aerial #nature #reels',
    audio_title: 'Chillhop Vibes • Golden Waves'
  },
  {
    user_id: userIds[2], // Marcus
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-urban-traffic-at-night-in-a-busy-city-43187-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
    caption: 'Tokyo metropolis pulse after dark 🌃 Light trails & cyber energy #tokyo #citylights #urban',
    audio_title: 'Synthwave Neon • Night Drive'
  },
  {
    user_id: userIds[3], // Elena
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-foggy-forest-with-conifers-41487-large.mp4',
    thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
    caption: 'Misty morning over ancient pines 🌲 Take a deep breath of fresh mountain air #pacificnorthwest #forest',
    audio_title: 'Acoustic Solitude • Forest Echo'
  }
];

const insertReel = db.prepare(`
  INSERT INTO reels (user_id, video_url, thumbnail_url, caption, audio_title)
  VALUES (?, ?, ?, ?, ?)
`);

const reelIds = [];
for (const r of reelsData) {
  const res = insertReel.run(r.user_id, r.video_url, r.thumbnail_url, r.caption, r.audio_title);
  reelIds.push(res.lastInsertRowid);
}
console.log(`✅ Seeded ${reelIds.length} reels.`);

// Seed Reel Likes
db.prepare('INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)').run(userIds[0], reelIds[0]);
db.prepare('INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)').run(userIds[2], reelIds[0]);
db.prepare('INSERT INTO reel_likes (user_id, reel_id) VALUES (?, ?)').run(userIds[0], reelIds[1]);

// 10. Seed Stories
const storiesData = [
  {
    user_id: userIds[1],
    media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
    text_overlay: 'Golden hour magic along the coast ✨',
    font_style: 'neon',
    text_color: '#ffdd59',
    font_size: 26,
    filter_style: 'golden',
    music_title: 'Sunset Lofi • Coastline',
    sticker_type: '🔥'
  },
  {
    user_id: userIds[1],
    media_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1080&auto=format&fit=crop&q=80',
    text_overlay: 'Lost in ancient alleyways 🇮🇹',
    font_style: 'handwriting',
    text_color: '#ffffff',
    font_size: 28,
    filter_style: 'vintage',
    music_title: 'Italian Breeze • Florence',
    sticker_type: '📍 Rome, Italy'
  },
  {
    user_id: userIds[2],
    media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80',
    text_overlay: 'Lines, concrete & morning coffee ☕',
    font_style: 'modern',
    text_color: '#00d26a',
    font_size: 24,
    filter_style: 'cyberpunk',
    music_title: 'Night Drive • Synthwave',
    sticker_type: '☕ Coffee First'
  },
  {
    user_id: userIds[3],
    media_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&auto=format&fit=crop&q=80',
    text_overlay: 'High above the clouds 🏔️🌲',
    font_style: 'classic',
    text_color: '#ffffff',
    font_size: 30,
    filter_style: 'normal',
    music_title: 'Acoustic Trail • Banff Echo',
    sticker_type: '🌲 Into The Wild'
  }
];

const insertStory = db.prepare(`
  INSERT INTO stories (user_id, media_url, text_overlay, font_style, text_color, font_size, filter_style, music_title, sticker_type)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const s of storiesData) {
  insertStory.run(s.user_id, s.media_url, s.text_overlay, s.font_style, s.text_color, s.font_size, s.filter_style, s.music_title, s.sticker_type);
}
console.log(`✅ Seeded ${storiesData.length} active stories.`);

console.log('🎉 Enhanced database seeding completed successfully!');
