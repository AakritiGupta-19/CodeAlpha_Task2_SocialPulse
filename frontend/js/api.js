// ==========================================================================
// SocialPulse API Client & Universal Data Layer
// Supports BOTH:
// 1. Live Express.js + SQLite backend (when running on localhost:3000)
// 2. Standalone Preview, GitHub Pages & Offline Interactive Mode (via MockDB)
// ==========================================================================

const getApiBase = () => {
  if (typeof window !== 'undefined') {
    // If hosted on GitHub Pages or external static host, don't try localhost
    if (window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:') {
      return '';
    }
    if (window.location.port && window.location.port !== '3000') {
      return 'http://localhost:3000/api';
    }
  }
  return '/api';
};

const API_BASE = getApiBase();
const TOKEN_KEY = 'socialpulse_token';
const USER_KEY = 'socialpulse_user';
const MOCK_STORAGE_KEY = 'socialpulse_standalone_db_v1';

// Seamless migration from legacy storage keys if present
try {
  if (typeof localStorage !== 'undefined') {
    if (!localStorage.getItem(TOKEN_KEY) && localStorage.getItem('vibegram_token')) {
      localStorage.setItem(TOKEN_KEY, localStorage.getItem('vibegram_token'));
    }
    if (!localStorage.getItem(USER_KEY) && localStorage.getItem('vibegram_user')) {
      localStorage.setItem(USER_KEY, localStorage.getItem('vibegram_user'));
    }
    if (!localStorage.getItem(MOCK_STORAGE_KEY) && localStorage.getItem('vibegram_standalone_db_v1')) {
      localStorage.setItem(MOCK_STORAGE_KEY, localStorage.getItem('vibegram_standalone_db_v1'));
    }
  }
} catch (e) {}

// Helper: Convert File or Blob to Base64 Data URL
const fileToDataUrl = (file) => {
  return new Promise((resolve) => {
    if (!file || !(file instanceof Blob)) {
      return resolve('');
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
};

// ==========================================================================
// Client-side Mock Data Store (Seed Data & LocalStorage Persistence)
// ==========================================================================
const DefaultSeedData = {
  users: [
    {
      id: 1,
      username: 'user',
      email: 'user@example.com',
      full_name: 'user',
      bio: '',
      website: '',
      location: '',
      avatar_url: 'uploads/default-avatar.svg'
    },
    {
      id: 2,
      username: 'alex_creative',
      email: 'alex@example.com',
      full_name: 'Alex Rivera',
      bio: 'Visual artist & photographer based in SF 📸 Capturing moments, creating stories.',
      website: 'https://alexrivera.art',
      location: 'San Francisco, CA',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 3,
      username: 'sophia_lens',
      email: 'sophia@example.com',
      full_name: 'Sophia Chen',
      bio: 'Traveler & sunset chaser 🌅 Living between mountain trails and ocean breezes.',
      website: 'https://sophiatravels.blog',
      location: 'Kyoto / Paris',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 4,
      username: 'urban_vibes',
      email: 'marcus@example.com',
      full_name: 'Marcus Vance',
      bio: 'Architecture, brutalism, and street culture 🏙️ Always hunting for the perfect coffee ☕',
      website: 'https://marcusvance.design',
      location: 'Berlin, Germany',
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80'
    },
    {
      id: 5,
      username: 'nature_explorer',
      email: 'elena@example.com',
      full_name: 'Elena Woods',
      bio: 'Into the wild 🌲 Alpine summits, misty pine forests & film photography ⛰️',
      website: 'https://elenawoods.outdoor',
      location: 'Banff, Canada',
      avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80'
    }
  ],
  follows: [
    { follower_id: 1, following_id: 2 },
    { follower_id: 1, following_id: 3 },
    { follower_id: 2, following_id: 1 },
    { follower_id: 3, following_id: 1 }
  ],
  posts: [
    {
      id: 1,
      user_id: 2,
      caption: 'Golden hour reflections along the Pacific coast. The rhythm of the tide never gets old. 🌊🌅 #coastal #goldenhour #photography',
      image_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
      views_count: 342,
      filter_style: 'golden',
      location: 'Big Sur, California',
      music_title: 'Golden Hour • JVKE',
      likes: [1, 3, 4],
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      id: 2,
      user_id: 2,
      caption: 'Lost in the labyrinth of ancient alleyways. Every turn reveals another century of stories. 🏛️✨ #travelgram #wanderlust #europe',
      image_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1080&auto=format&fit=crop&q=80',
      views_count: 512,
      filter_style: 'vintage',
      location: 'Florence, Italy',
      music_title: 'Midnight City • M83',
      likes: [1, 3],
      created_at: new Date(Date.now() - 3600 * 1000 * 5).toISOString()
    },
    {
      id: 3,
      user_id: 3,
      caption: 'Geometric balance in concrete & glass. Modernist dreams reaching up towards the clouds. 🏢📐 #architecture #minimalism #urban',
      image_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80',
      views_count: 220,
      filter_style: 'cyberpunk',
      location: 'Berlin, Germany',
      music_title: 'Night Drive • Synthwave',
      likes: [1, 2],
      created_at: new Date(Date.now() - 3600 * 1000 * 12).toISOString()
    },
    {
      id: 4,
      user_id: 4,
      caption: 'First light cutting through morning mist in the Canadian Rockies. Absolutely breathtaking silence. 🏔️🌲 #nature #rockies #hiking',
      image_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&auto=format&fit=crop&q=80',
      views_count: 678,
      filter_style: 'normal',
      location: 'Banff National Park',
      music_title: 'Acoustic Trail • Banff Echo',
      likes: [1, 2, 3],
      created_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
    },
    {
      id: 5,
      user_id: 2,
      caption: 'Late night studio sessions experimenting with neon lights and prisms. Art is discovery 🎨💡 #creative #neonvibes #visualart',
      image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80',
      views_count: 410,
      filter_style: 'cyberpunk',
      location: 'Studio 8, SF',
      music_title: 'Starboy • The Weeknd',
      likes: [1, 3],
      created_at: new Date(Date.now() - 3600 * 1000 * 36).toISOString()
    },
    {
      id: 6,
      user_id: 2,
      caption: 'Morning espresso in Florence with a view over the Duomo rooftops. Pure bliss ☕🥐 #italy #coffeetime #travel',
      image_url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1080&auto=format&fit=crop&q=80',
      views_count: 290,
      filter_style: 'vintage',
      location: 'Florence, Italy',
      music_title: 'Italian Breeze • Florence',
      likes: [1],
      created_at: new Date(Date.now() - 3600 * 1000 * 48).toISOString()
    }
  ],
  comments: [
    { id: 1, post_id: 1, user_id: 2, comment_text: 'The tones in this are unreal! What lens did you shoot with? 🔥', created_at: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString() },
    { id: 2, post_id: 1, user_id: 3, comment_text: 'Such soothing colors. Perfect wallpaper material!', created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString() },
    { id: 3, post_id: 2, user_id: 1, comment_text: 'Take me there right now! Stunning composition Sophia 👏', created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString() },
    { id: 4, post_id: 3, user_id: 4, comment_text: 'Love the brutalist lines here Marcus!', created_at: new Date(Date.now() - 3600 * 1000 * 10).toISOString() },
    { id: 5, post_id: 4, user_id: 1, comment_text: 'That mist is magic ✨ Reminds me of Banff.', created_at: new Date(Date.now() - 3600 * 1000 * 20).toISOString() },
    { id: 6, post_id: 4, user_id: 2, comment_text: 'Incredible shot Elena! Must have been freezing!', created_at: new Date(Date.now() - 3600 * 1000 * 18).toISOString() },
    { id: 7, post_id: 6, user_id: 3, comment_text: 'Best coffee spot in town, love it! ☕', created_at: new Date(Date.now() - 3600 * 1000 * 40).toISOString() }
  ],
  saved_posts: [
    { user_id: 1, post_id: 2 },
    { user_id: 1, post_id: 4 }
  ],
  stories: [
    {
      id: 1,
      user_id: 2,
      media_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80',
      text_overlay: 'Golden hour magic along the coast ✨',
      font_style: 'neon',
      text_color: '#ffdd59',
      font_size: 26,
      filter_style: 'golden',
      music_title: 'Sunset Lofi • Coastline',
      sticker_type: '🔥',
      created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
    },
    {
      id: 2,
      user_id: 2,
      media_url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1080&auto=format&fit=crop&q=80',
      text_overlay: 'Lost in ancient alleyways 🇮🇹',
      font_style: 'handwriting',
      text_color: '#ffffff',
      font_size: 28,
      filter_style: 'vintage',
      music_title: 'Italian Breeze • Florence',
      sticker_type: '📍 Rome, Italy',
      created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString()
    },
    {
      id: 3,
      user_id: 3,
      media_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1080&auto=format&fit=crop&q=80',
      text_overlay: 'Lines, concrete & morning coffee ☕',
      font_style: 'modern',
      text_color: '#00d26a',
      font_size: 24,
      filter_style: 'cyberpunk',
      music_title: 'Night Drive • Synthwave',
      sticker_type: '☕ Coffee First',
      created_at: new Date(Date.now() - 3600 * 1000 * 8).toISOString()
    },
    {
      id: 4,
      user_id: 4,
      media_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&auto=format&fit=crop&q=80',
      text_overlay: 'High above the clouds 🏔️🌲',
      font_style: 'classic',
      text_color: '#ffffff',
      font_size: 30,
      filter_style: 'normal',
      music_title: 'Acoustic Trail • Banff Echo',
      sticker_type: '🌲 Into The Wild',
      created_at: new Date(Date.now() - 3600 * 1000 * 14).toISOString()
    }
  ],
  reels: [
    {
      id: 1,
      user_id: 2,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-set-of-plateaus-seen-from-the-sky-in-a-sunset-26070-large.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
      caption: 'Sunset flight across volcanic plateaus ✨ Nothing compares to this golden serenity #aerial #nature #reels',
      audio_title: 'Chillhop Vibes • Golden Waves',
      likes: [1, 3]
    },
    {
      id: 2,
      user_id: 3,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-urban-traffic-at-night-in-a-busy-city-43187-large.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
      caption: 'Tokyo metropolis pulse after dark 🌃 Light trails & cyber energy #tokyo #citylights #urban',
      audio_title: 'Synthwave Neon • Night Drive',
      likes: [1]
    },
    {
      id: 3,
      user_id: 4,
      video_url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-a-foggy-forest-with-conifers-41487-large.mp4',
      thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600',
      caption: 'Misty morning over ancient pines 🌲 Take a deep breath of fresh mountain air #pacificnorthwest #forest',
      audio_title: 'Acoustic Solitude • Forest Echo',
      likes: []
    }
  ],
  messages: [
    { id: 1, sender_id: 2, receiver_id: 1, message_text: 'Hey Alex! Loved your latest ocean sunset photo!', is_read: 1, created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString() },
    { id: 2, sender_id: 1, receiver_id: 2, message_text: 'Thank you Sophia! Trying out some new film presets lately.', is_read: 1, created_at: new Date(Date.now() - 3600 * 1000 * 2.5).toISOString() },
    { id: 3, sender_id: 2, receiver_id: 1, message_text: 'Are you planning a trip to Japan this autumn?', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString() },
    { id: 4, sender_id: 3, receiver_id: 1, message_text: 'Hey man, let me know if you want to collaborate on the architecture series!', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 4).toISOString() }
  ],
  notifications: [
    { id: 100, user_id: 1, actor_id: 2, type: 'profile_setup', post_id: null, content: 'Welcome to SocialPulse! Please add your custom name and profile picture to complete your profile.', is_read: 0, created_at: new Date().toISOString() },
    { id: 1, user_id: 1, actor_id: 2, type: 'like', post_id: 1, content: 'liked your post', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString() },
    { id: 2, user_id: 1, actor_id: 3, type: 'comment', post_id: 1, content: 'Welcome to the platform! Excited to see your creations! 🔥', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString() },
    { id: 3, user_id: 1, actor_id: 3, type: 'follow', post_id: null, content: 'started following you', is_read: 0, created_at: new Date(Date.now() - 3600 * 1000 * 3).toISOString() }
  ],
  recently_deleted: [
    {
      id: 991,
      user_id: 1,
      caption: 'Moody reflections in the Pacific tide pools. Draft version. 🌊 #archive #deleted',
      image_url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1080&auto=format&fit=crop&q=80',
      views_count: 85,
      likes: [2],
      created_at: new Date(Date.now() - 3600 * 1000 * 72).toISOString(),
      deleted_at: new Date(Date.now() - 3600 * 1000 * 24).toISOString()
    }
  ],
  settings: {
    is_private: false,
    hide_likes: false,
    pause_notifications: false,
    close_friends_count: 2
  }
};

const MockDB = {
  getStore() {
    try {
      const raw = localStorage.getItem(MOCK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        const u1 = parsed.users && parsed.users.find(u => u.id === 1);
        if (u1 && (u1.username === 'alex_creative' || (u1.avatar_url && u1.avatar_url.includes('unsplash')))) {
          // Reset/migrate store to default 'user'
          const fresh = JSON.parse(JSON.stringify(DefaultSeedData));
          this.saveStore(fresh);
          return fresh;
        }
        return parsed;
      }
    } catch (e) {}
    const fresh = JSON.parse(JSON.stringify(DefaultSeedData));
    this.saveStore(fresh);
    return fresh;
  },

  saveStore(store) {
    try {
      localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(store));
    } catch (e) {}
  },

  getUser(id, store) {
    return (store || this.getStore()).users.find(u => u.id === Number(id));
  },

  getUserByUsername(username, store) {
    return (store || this.getStore()).users.find(u => u.username.toLowerCase() === String(username).toLowerCase());
  },

  getCurrentUserId() {
    const u = Api.getCurrentUser();
    return u ? Number(u.id) : 1;
  },

  // Process Mock Requests
  async handleRequest(endpoint, options = {}) {
    const store = this.getStore();
    const currentUserId = this.getCurrentUserId();
    const currentUser = this.getUser(currentUserId, store) || store.users[0];
    const method = (options.method || 'GET').toUpperCase();
    const url = new URL('http://dummy' + endpoint);
    const pathname = url.pathname;
    const searchParams = url.searchParams;

    // --- AUTH ---
    if (pathname === '/auth/demo-users') {
      return { users: store.users };
    }

    if (pathname === '/auth/me') {
      return { user: currentUser };
    }

    if (pathname === '/auth/login' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const identifier = (body.identifier || '').trim().toLowerCase();
      const user = store.users.find(u => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier);
      if (!user) throw new Error('Invalid username/email or password');
      return { token: 'mock-token-' + user.id, user };
    }

    if (pathname === '/auth/register' && method === 'POST') {
      const body = JSON.parse(options.body || '{}');
      const username = (body.username || '').trim();
      const email = (body.email || '').trim();
      if (!username || !email) throw new Error('Username and email required');
      if (store.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        throw new Error('Username already taken');
      }
      const newUser = {
        id: Date.now(),
        username,
        email,
        full_name: (body.full_name && body.full_name.trim()) ? body.full_name.trim() : 'user',
        bio: '',
        website: '',
        location: '',
        avatar_url: 'uploads/default-avatar.svg'
      };
      store.users.push(newUser);

      // Add profile completion notification for newly registered user
      if (!store.notifications) store.notifications = [];
      store.notifications.push({
        id: Date.now() + 1,
        user_id: newUser.id,
        actor_id: 2,
        type: 'profile_setup',
        post_id: null,
        content: 'Welcome to SocialPulse! Please add your custom name and profile picture to complete your profile.',
        is_read: 0,
        created_at: new Date().toISOString()
      });

      this.saveStore(store);
      return { token: 'mock-token-' + newUser.id, user: newUser };
    }

    // --- FEED ---
    if (pathname === '/posts/feed') {
      const tab = searchParams.get('tab') || 'for_you';
      const followedIds = store.follows
        .filter(f => f.follower_id === currentUserId)
        .map(f => f.following_id);

      let posts = store.posts.slice();
      if (tab === 'following') {
        posts = posts.filter(p => followedIds.includes(p.user_id));
      }

      // Sort newest first
      posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      const enriched = posts.map(p => {
        const author = this.getUser(p.user_id, store) || { username: 'creator', full_name: 'Creator', avatar_url: '' };
        const postComments = store.comments.filter(c => c.post_id === p.id);
        const hasLiked = (p.likes || []).includes(currentUserId);
        const hasSaved = store.saved_posts.some(s => s.user_id === currentUserId && s.post_id === p.id);

        return {
          id: p.id,
          caption: p.caption,
          image_url: p.image_url,
          views_count: p.views_count || 0,
          filter_style: p.filter_style || 'normal',
          location: p.location || '',
          music_title: p.music_title || '',
          created_at: p.created_at,
          author_id: author.id,
          author_username: author.username,
          author_name: author.full_name,
          author_avatar_url: author.avatar_url,
          likes_count: (p.likes || []).length,
          comments_count: postComments.length,
          has_liked: hasLiked,
          has_saved: hasSaved
        };
      });

      return { posts: enriched };
    }

    // --- POSTS CRUD ---
    if (pathname === '/posts' && method === 'POST') {
      let caption = '';
      let filter = 'normal';
      let location = '';
      let music = '';
      let imageUrl = '';

      if (options.body instanceof FormData) {
        caption = options.body.get('caption') || '';
        filter = options.body.get('filter_style') || 'normal';
        location = options.body.get('location') || '';
        music = options.body.get('music_title') || '';
        const file = options.body.get('image');
        const urlStr = options.body.get('imageUrl');

        if (file && file instanceof Blob) {
          imageUrl = await fileToDataUrl(file);
        } else if (urlStr) {
          imageUrl = urlStr;
        }
      }

      if (!imageUrl) {
        imageUrl = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1080&auto=format&fit=crop&q=80';
      }

      const newPost = {
        id: Date.now(),
        user_id: currentUserId,
        caption,
        image_url: imageUrl,
        views_count: 1,
        filter_style: filter,
        location,
        music_title: music,
        likes: [],
        created_at: new Date().toISOString()
      };

      store.posts.unshift(newPost);
      this.saveStore(store);

      return { message: 'Post created successfully', post: newPost };
    }

    // Delete Post (Soft delete to recently_deleted)
    const deleteMatch = pathname.match(/^\/posts\/(\d+)$/);
    if (deleteMatch && method === 'DELETE') {
      const postId = Number(deleteMatch[1]);
      const pIdx = store.posts.findIndex(p => p.id === postId);
      if (pIdx >= 0) {
        const deletedPost = store.posts.splice(pIdx, 1)[0];
        deletedPost.deleted_at = new Date().toISOString();
        store.recently_deleted = store.recently_deleted || [];
        store.recently_deleted.unshift(deletedPost);
      }
      store.comments = store.comments.filter(c => c.post_id !== postId);
      store.saved_posts = store.saved_posts.filter(s => s.post_id !== postId);
      this.saveStore(store);
      return { message: 'Post moved to Recently Deleted' };
    }

    // Toggle Like Post
    const likeMatch = pathname.match(/^\/posts\/(\d+)\/like$/);
    if (likeMatch && method === 'POST') {
      const postId = Number(likeMatch[1]);
      const post = store.posts.find(p => p.id === postId);
      if (!post) throw new Error('Post not found');
      post.likes = post.likes || [];
      const idx = post.likes.indexOf(currentUserId);
      let liked = false;
      if (idx >= 0) {
        post.likes.splice(idx, 1);
      } else {
        post.likes.push(currentUserId);
        liked = true;
      }
      this.saveStore(store);
      return { liked, likes_count: post.likes.length };
    }

    // Toggle Save Post
    const saveMatch = pathname.match(/^\/posts\/(\d+)\/save$/);
    if (saveMatch && method === 'POST') {
      const postId = Number(saveMatch[1]);
      const idx = store.saved_posts.findIndex(s => s.user_id === currentUserId && s.post_id === postId);
      let saved = false;
      if (idx >= 0) {
        store.saved_posts.splice(idx, 1);
      } else {
        store.saved_posts.push({ user_id: currentUserId, post_id: postId });
        saved = true;
      }
      this.saveStore(store);
      return { saved };
    }

    // Saved Posts List
    if (pathname === '/posts/saved') {
      const savedIds = store.saved_posts.filter(s => s.user_id === currentUserId).map(s => s.post_id);
      const savedPosts = store.posts
        .filter(p => savedIds.includes(p.id))
        .map(p => {
          const author = this.getUser(p.user_id, store) || { username: 'creator', full_name: 'Creator', avatar_url: '' };
          return {
            id: p.id,
            caption: p.caption,
            image_url: p.image_url,
            likes_count: (p.likes || []).length,
            comments_count: store.comments.filter(c => c.post_id === p.id).length,
            author_username: author.username,
            author_avatar_url: author.avatar_url
          };
        });
      return { posts: savedPosts };
    }

    // Record Post View
    const viewMatch = pathname.match(/^\/posts\/(\d+)\/view$/);
    if (viewMatch && method === 'POST') {
      const postId = Number(viewMatch[1]);
      const post = store.posts.find(p => p.id === postId);
      if (post) {
        post.views_count = (post.views_count || 0) + 1;
        this.saveStore(store);
      }
      return { success: true };
    }

    // Post Comments
    const commentsMatch = pathname.match(/^\/posts\/(\d+)\/comments$/);
    if (commentsMatch) {
      const postId = Number(commentsMatch[1]);
      if (method === 'GET') {
        const comments = store.comments
          .filter(c => c.post_id === postId)
          .map(c => {
            const commenter = this.getUser(c.user_id, store) || { username: 'user', full_name: 'User', avatar_url: '' };
            return {
              id: c.id,
              post_id: c.post_id,
              user_id: c.user_id,
              comment_text: c.comment_text,
              created_at: c.created_at,
              username: commenter.username,
              full_name: commenter.full_name,
              avatar_url: commenter.avatar_url
            };
          });
        return { comments };
      }

      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const text = (body.comment_text || '').trim();
        if (!text) throw new Error('Comment text is required');
        const newComment = {
          id: Date.now(),
          post_id: postId,
          user_id: currentUserId,
          comment_text: text,
          created_at: new Date().toISOString()
        };
        store.comments.push(newComment);
        this.saveStore(store);
        return {
          comment: {
            ...newComment,
            username: currentUser.username,
            full_name: currentUser.full_name,
            avatar_url: currentUser.avatar_url
          }
        };
      }
    }

    // --- STORIES ---
    if (pathname === '/stories') {
      if (method === 'GET') {
        const enrichedStories = (store.stories || []).map(s => {
          const author = this.getUser(s.user_id, store) || { username: 'creator', full_name: 'Creator', avatar_url: '' };
          return {
            id: s.id,
            user_id: s.user_id,
            username: author.username,
            name: author.full_name,
            avatar: author.avatar_url,
            avatar_url: author.avatar_url,
            media: s.media_url,
            media_url: s.media_url,
            text_overlay: s.text_overlay || '',
            font_style: s.font_style || 'modern',
            text_color: s.text_color || '#ffffff',
            font_size: s.font_size || 24,
            filter_style: s.filter_style || 'normal',
            music_title: s.music_title || '',
            sticker_type: s.sticker_type || '',
            created_at: s.created_at
          };
        });
        return { stories: enrichedStories };
      }

      if (method === 'POST') {
        let mediaUrl = '';
        let textOverlay = '';
        let fontStyle = 'modern';
        let textColor = '#ffffff';
        let fontSize = 24;
        let filterStyle = 'normal';
        let musicTitle = '';
        let stickerType = '';

        if (options.body instanceof FormData) {
          const file = options.body.get('media');
          const urlStr = options.body.get('mediaUrl');
          if (file && file instanceof Blob) {
            mediaUrl = await fileToDataUrl(file);
          } else if (urlStr) {
            mediaUrl = urlStr;
          }
          textOverlay = options.body.get('text_overlay') || '';
          fontStyle = options.body.get('font_style') || 'modern';
          textColor = options.body.get('text_color') || '#ffffff';
          fontSize = Number(options.body.get('font_size')) || 24;
          filterStyle = options.body.get('filter_style') || 'normal';
          musicTitle = options.body.get('music_title') || '';
          stickerType = options.body.get('sticker_type') || '';
        } else {
          const body = JSON.parse(options.body || '{}');
          mediaUrl = body.mediaUrl || '';
          textOverlay = body.text_overlay || '';
          fontStyle = body.font_style || 'modern';
          textColor = body.text_color || '#ffffff';
          fontSize = body.font_size || 24;
          filterStyle = body.filter_style || 'normal';
          musicTitle = body.music_title || '';
          stickerType = body.sticker_type || '';
        }

        if (!mediaUrl) {
          mediaUrl = 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&auto=format&fit=crop&q=80';
        }

        const newStory = {
          id: Date.now(),
          user_id: currentUserId,
          media_url: mediaUrl,
          text_overlay: textOverlay,
          font_style: fontStyle,
          text_color: textColor,
          font_size: fontSize,
          filter_style: filterStyle,
          music_title: musicTitle,
          sticker_type: stickerType,
          created_at: new Date().toISOString()
        };

        store.stories = store.stories || [];
        store.stories.unshift(newStory);
        this.saveStore(store);

        return { message: 'Story created', story: newStory };
      }
    }

    // --- REELS ---
    if (pathname === '/reels') {
      if (method === 'GET') {
        const enrichedReels = (store.reels || []).map(r => {
          const author = this.getUser(r.user_id, store) || { username: 'creator', full_name: 'Creator', avatar_url: '' };
          const hasLiked = (r.likes || []).includes(currentUserId);
          const isFollowing = store.follows.some(f => f.follower_id === currentUserId && f.following_id === r.user_id);
          return {
            id: r.id,
            video_url: r.video_url,
            thumbnail_url: r.thumbnail_url,
            caption: r.caption,
            audio_title: r.audio_title,
            likes_count: (r.likes || []).length,
            has_liked: hasLiked,
            is_following: isFollowing,
            author_id: author.id,
            author_username: author.username,
            author_name: author.full_name,
            author_avatar_url: author.avatar_url
          };
        });
        return { reels: enrichedReels };
      }

      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const newReel = {
          id: Date.now(),
          user_id: currentUserId,
          video_url: body.video_url,
          thumbnail_url: body.thumbnail_url || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
          caption: body.caption || '',
          audio_title: body.audio_title || 'Original Audio',
          likes: []
        };
        store.reels.push(newReel);
        this.saveStore(store);
        return { reel: newReel };
      }
    }

    const reelLikeMatch = pathname.match(/^\/reels\/(\d+)\/like$/);
    if (reelLikeMatch && method === 'POST') {
      const reelId = Number(reelLikeMatch[1]);
      const reel = store.reels.find(r => r.id === reelId);
      if (!reel) throw new Error('Reel not found');
      reel.likes = reel.likes || [];
      const idx = reel.likes.indexOf(currentUserId);
      let liked = false;
      if (idx >= 0) {
        reel.likes.splice(idx, 1);
      } else {
        reel.likes.push(currentUserId);
        liked = true;
      }
      this.saveStore(store);
      return { liked, likes_count: reel.likes.length };
    }

    // --- MESSAGES & CHAT ---
    if (pathname === '/messages/conversations') {
      const partnersMap = new Map();
      store.messages.forEach(m => {
        let partnerId = null;
        if (m.sender_id === currentUserId) partnerId = m.receiver_id;
        else if (m.receiver_id === currentUserId) partnerId = m.sender_id;

        if (partnerId) {
          const partner = this.getUser(partnerId, store);
          if (partner) {
            const existing = partnersMap.get(partnerId);
            if (!existing || new Date(m.created_at) > new Date(existing.last_message.created_at)) {
              const unread = store.messages.filter(msg => msg.sender_id === partnerId && msg.receiver_id === currentUserId && !msg.is_read).length;
              partnersMap.set(partnerId, {
                partner,
                last_message: m,
                unread_count: unread
              });
            }
          }
        }
      });
      return { conversations: Array.from(partnersMap.values()) };
    }

    const messagesMatch = pathname.match(/^\/messages\/(\d+)$/);
    if (messagesMatch) {
      const partnerId = Number(messagesMatch[1]);
      const partner = this.getUser(partnerId, store);
      if (!partner) throw new Error('User not found');

      if (method === 'GET') {
        const msgs = store.messages.filter(m =>
          (m.sender_id === currentUserId && m.receiver_id === partnerId) ||
          (m.sender_id === partnerId && m.receiver_id === currentUserId)
        );
        msgs.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Mark read
        msgs.forEach(m => {
          if (m.sender_id === partnerId && m.receiver_id === currentUserId) {
            m.is_read = 1;
          }
        });
        this.saveStore(store);

        return { targetUser: partner, messages: msgs };
      }

      if (method === 'POST') {
        const body = JSON.parse(options.body || '{}');
        const text = (body.message_text || '').trim();
        if (!text) throw new Error('Message cannot be empty');

        const newMsg = {
          id: Date.now(),
          sender_id: currentUserId,
          receiver_id: partnerId,
          message_text: text,
          is_read: 0,
          created_at: new Date().toISOString()
        };
        store.messages.push(newMsg);
        this.saveStore(store);
        return { message: newMsg };
      }
    }

    // --- NOTIFICATIONS ---
    if (pathname === '/notifications') {
      const userNotifs = (store.notifications || [])
        .filter(n => n.user_id === currentUserId)
        .map(n => {
          const actor = this.getUser(n.actor_id, store) || { username: 'user', avatar_url: '' };
          const post = n.post_id ? store.posts.find(p => p.id === n.post_id) : null;
          return {
            id: n.id,
            actor_id: n.actor_id,
            actor_username: actor.username,
            actor_avatar_url: actor.avatar_url,
            type: n.type,
            post_id: n.post_id,
            content: n.content,
            is_read: n.is_read,
            created_at: n.created_at,
            post_image_url: post ? post.image_url : null
          };
        });

      userNotifs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const unreadCount = userNotifs.filter(n => !n.is_read).length;
      return { notifications: userNotifs, unread_count: unreadCount };
    }

    if (pathname === '/notifications/read' && method === 'PUT') {
      (store.notifications || []).forEach(n => {
        if (n.user_id === currentUserId) n.is_read = 1;
      });
      this.saveStore(store);
      return { success: true, unread_count: 0 };
    }

    // --- USERS & PROFILES ---
    const profileMatch = pathname.match(/^\/users\/profile\/(.+)$/);
    if (profileMatch && method === 'GET') {
      const username = decodeURIComponent(profileMatch[1]);
      const targetUser = this.getUserByUsername(username, store);
      if (!targetUser) throw new Error('User not found');

      const isSelf = targetUser.id === currentUserId;
      const isFollowing = store.follows.some(f => f.follower_id === currentUserId && f.following_id === targetUser.id);
      const followersCount = store.follows.filter(f => f.following_id === targetUser.id).length;
      const followingCount = store.follows.filter(f => f.follower_id === targetUser.id).length;

      const userPosts = store.posts
        .filter(p => p.user_id === targetUser.id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map(p => ({
          id: p.id,
          caption: p.caption,
          image_url: p.image_url,
          likes_count: (p.likes || []).length,
          comments_count: store.comments.filter(c => c.post_id === p.id).length
        }));

      return {
        user: targetUser,
        stats: {
          posts_count: userPosts.length,
          followers_count: followersCount,
          following_count: followingCount
        },
        isFollowing,
        isSelf,
        posts: userPosts
      };
    }

    // Followers list
    const followersMatch = pathname.match(/^\/users\/(.+)\/followers$/);
    if (followersMatch) {
      const username = decodeURIComponent(followersMatch[1]);
      const targetUser = this.getUserByUsername(username, store);
      if (!targetUser) throw new Error('User not found');

      const followerIds = store.follows.filter(f => f.following_id === targetUser.id).map(f => f.follower_id);
      const followers = store.users.filter(u => followerIds.includes(u.id));
      return { followers };
    }

    // Following list
    const followingMatch = pathname.match(/^\/users\/(.+)\/following$/);
    if (followingMatch) {
      const username = decodeURIComponent(followingMatch[1]);
      const targetUser = this.getUserByUsername(username, store);
      if (!targetUser) throw new Error('User not found');

      const followingIds = store.follows.filter(f => f.follower_id === targetUser.id).map(f => f.following_id);
      const following = store.users.filter(u => followingIds.includes(u.id));
      return { following };
    }

    // Analytics
    if (pathname === '/users/analytics/overview') {
      const myPosts = store.posts.filter(p => p.user_id === currentUserId);
      const totalViews = myPosts.reduce((acc, p) => acc + (p.views_count || 0), 0);
      const totalLikes = myPosts.reduce((acc, p) => acc + (p.likes ? p.likes.length : 0), 0);
      const totalComments = myPosts.reduce((acc, p) => acc + store.comments.filter(c => c.post_id === p.id).length, 0);
      const topPost = myPosts.slice().sort((a, b) => (b.likes ? b.likes.length : 0) - (a.likes ? a.likes.length : 0))[0] || null;

      return {
        analytics: {
          total_posts: myPosts.length,
          total_views: totalViews,
          total_likes: totalLikes,
          total_comments: totalComments,
          engagement_rate: myPosts.length ? (((totalLikes + totalComments) / Math.max(1, totalViews)) * 100).toFixed(1) + '%' : '0.0%',
          top_post: topPost
        }
      };
    }

    // Toggle Follow
    const followMatch = pathname.match(/^\/users\/(\d+)\/follow$/);
    if (followMatch && method === 'POST') {
      const targetId = Number(followMatch[1]);
      const idx = store.follows.findIndex(f => f.follower_id === currentUserId && f.following_id === targetId);
      let following = false;
      if (idx >= 0) {
        store.follows.splice(idx, 1);
      } else {
        store.follows.push({ follower_id: currentUserId, following_id: targetId });
        following = true;
      }
      this.saveStore(store);
      return { following };
    }

    // Update Profile
    if (pathname === '/users/profile' && method === 'PUT') {
      const updates = JSON.parse(options.body || '{}');
      const targetUser = this.getUser(currentUserId, store);
      if (targetUser) {
        if (updates.username) {
          const cleanU = updates.username.trim().toLowerCase();
          const taken = store.users.some(u => u.id !== currentUserId && u.username.toLowerCase() === cleanU);
          if (taken) throw new Error('Username already taken');
          targetUser.username = cleanU;
        }
        if (updates.full_name !== undefined) targetUser.full_name = updates.full_name.trim();
        if (updates.avatar_url) targetUser.avatar_url = updates.avatar_url;
        if (updates.bio !== undefined) targetUser.bio = updates.bio;
        if (updates.website !== undefined) targetUser.website = updates.website;
        if (updates.location !== undefined) targetUser.location = updates.location;
        this.saveStore(store);
        return { message: 'Profile updated successfully', user: targetUser };
      }
      throw new Error('User not found');
    }

    // Upload Avatar
    if (pathname === '/users/avatar' && method === 'POST') {
      let avatarUrl = '';
      if (options.body instanceof FormData) {
        const file = options.body.get('avatar');
        avatarUrl = await fileToDataUrl(file);
      }
      if (!avatarUrl) {
        avatarUrl = 'uploads/default-avatar.svg';
      }
      const targetUser = this.getUser(currentUserId, store);
      if (targetUser) {
        targetUser.avatar_url = avatarUrl;
        this.saveStore(store);
      }
      return { avatar_url: avatarUrl };
    }

    // Search Users
    if (pathname === '/users/search') {
      const q = (searchParams.get('q') || '').toLowerCase();
      const results = store.users
        .filter(u => u.username.toLowerCase().includes(q) || (u.full_name && u.full_name.toLowerCase().includes(q)))
        .map(u => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          followers_count: store.follows.filter(f => f.following_id === u.id).length
        }));
      return { users: results };
    }

    // Suggestions
    if (pathname === '/users/suggestions') {
      const followedIds = store.follows.filter(f => f.follower_id === currentUserId).map(f => f.following_id);
      const suggestions = store.users
        .filter(u => u.id !== currentUserId && !followedIds.includes(u.id))
        .map(u => ({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          avatar_url: u.avatar_url,
          mutual_follows_count: 1
        }));
      return { suggestions };
    }

    // --- ACTIVITY: LIKES ---
    if (pathname === '/users/activity/likes') {
      const likedPosts = store.posts.filter(p => (p.likes || []).includes(currentUserId)).map(p => {
        const author = this.getUser(p.user_id, store) || { username: 'creator', avatar_url: '' };
        return {
          id: p.id,
          caption: p.caption,
          image_url: p.image_url,
          created_at: p.created_at,
          likes_count: (p.likes || []).length,
          author_username: author.username,
          author_avatar_url: author.avatar_url,
          type: 'post'
        };
      });

      const likedReels = (store.reels || []).filter(r => (r.likes || []).includes(currentUserId)).map(r => {
        const author = this.getUser(r.user_id, store) || { username: 'creator', avatar_url: '' };
        return {
          id: r.id,
          caption: r.caption,
          video_url: r.video_url,
          thumbnail_url: r.thumbnail_url,
          created_at: r.created_at || new Date().toISOString(),
          likes_count: (r.likes || []).length,
          author_username: author.username,
          author_avatar_url: author.avatar_url,
          type: 'reel'
        };
      });

      return { liked_posts: likedPosts, liked_reels: likedReels };
    }

    // --- ACTIVITY: COMMENTS ---
    if (pathname === '/users/activity/comments') {
      const comments = (store.comments || []).filter(c => c.user_id === currentUserId).map(c => {
        const post = store.posts.find(p => p.id === c.post_id) || { caption: 'Post', image_url: '' };
        return {
          id: c.id,
          post_id: c.post_id,
          comment_text: c.comment_text,
          created_at: c.created_at,
          post_image_url: post.image_url,
          post_caption: post.caption
        };
      });
      comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { comments };
    }

    // --- ACTIVITY: RECENTLY DELETED ---
    if (pathname === '/users/activity/deleted') {
      return { deleted_posts: store.recently_deleted || [] };
    }

    const restoreMatch = pathname.match(/^\/users\/activity\/restore\/(\d+)$/);
    if (restoreMatch && method === 'POST') {
      const postId = Number(restoreMatch[1]);
      store.recently_deleted = store.recently_deleted || [];
      const idx = store.recently_deleted.findIndex(p => p.id === postId);
      if (idx >= 0) {
        const restoredPost = store.recently_deleted.splice(idx, 1)[0];
        delete restoredPost.deleted_at;
        store.posts.unshift(restoredPost);
        this.saveStore(store);
        return { message: 'Post restored successfully', post: restoredPost };
      }
      throw new Error('Item not found in recently deleted');
    }

    const permDeleteMatch = pathname.match(/^\/users\/activity\/deleted\/(\d+)$/);
    if (permDeleteMatch && method === 'DELETE') {
      const postId = Number(permDeleteMatch[1]);
      store.recently_deleted = (store.recently_deleted || []).filter(p => p.id !== postId);
      this.saveStore(store);
      return { message: 'Permanently deleted' };
    }

    // --- SETTINGS ---
    if (pathname === '/users/settings') {
      if (method === 'GET') {
        return {
          settings: store.settings || {
            is_private: false,
            hide_likes: false,
            pause_notifications: false,
            close_friends_count: 2
          }
        };
      }
      if (method === 'PUT') {
        const body = JSON.parse(options.body || '{}');
        store.settings = { ...(store.settings || {}), ...body };
        this.saveStore(store);
        return { message: 'Settings updated', settings: store.settings };
      }
    }

    throw new Error(`Endpoint not found: ${pathname}`);
  }
};

// ==========================================================================
// Primary API Client
// ==========================================================================
const Api = {
  backendStatus: 'probing', // 'online' | 'offline' | 'probing'
  statusListeners: [],

  onStatusChange(fn) {
    this.statusListeners.push(fn);
    if (this.backendStatus !== 'probing') {
      fn(this.backendStatus);
    }
  },

  notifyStatus(status) {
    if (this.backendStatus === status) return;
    this.backendStatus = status;
    this.statusListeners.forEach(fn => {
      try { fn(status); } catch (e) {}
    });
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    try {
      if (raw) {
        const u = JSON.parse(raw);
        if (u.username === 'alex_creative') {
          const freshUser = MockDB.getUser(1);
          if (freshUser) {
            this.setSession('demo-token-1', freshUser);
            return freshUser;
          }
        }
        return u;
      }
    } catch (e) {}
    // If no user set, automatically default to User 1 ('user')
    const defaultUser = MockDB.getUser(1);
    if (defaultUser) {
      this.setSession('demo-token-1', defaultUser);
      return defaultUser;
    }
    return null;
  },

  getMediaUrl(url) {
    if (!url || url.includes('default-avatar')) {
      return 'uploads/default-avatar.svg';
    }
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    // If live backend is verified online
    if (this.backendStatus === 'online') {
      const origin = (window.location.protocol === 'file:' || (window.location.port && window.location.port !== '3000'))
        ? 'http://localhost:3000'
        : '';
      return origin + (url.startsWith('/') ? url : '/' + url);
    }
    return url.startsWith('/') ? '.' + url : url;
  },

  async request(endpoint, options = {}) {
    // If we are already confirmed in offline mode or on GitHub Pages / file protocol
    if (this.backendStatus === 'offline' || !API_BASE) {
      return await MockDB.handleRequest(endpoint, options);
    }

    try {
      const headers = options.headers || {};
      const token = this.getToken();

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);

      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! Status: ${response.status}`);
      }

      this.notifyStatus('online');
      return data;
    } catch (err) {
      // Gracefully switch to MockDB client-side database
      this.notifyStatus('offline');
      return await MockDB.handleRequest(endpoint, options);
    }
  },

  // Auth Endpoints
  async register(username, email, password, full_name) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password, full_name })
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async login(identifier, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    });
    this.setSession(data.token, data.user);
    return data;
  },

  async getMe() {
    const data = await this.request('/auth/me');
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async getDemoUsers() {
    return await this.request('/auth/demo-users');
  },

  // Posts Endpoints
  async getFeed(tab = 'for_you') {
    return await this.request(`/posts/feed?tab=${tab}`);
  },

  async createPost(formData) {
    return await this.request('/posts', {
      method: 'POST',
      body: formData
    });
  },

  async deletePost(id) {
    return await this.request(`/posts/${id}`, {
      method: 'DELETE'
    });
  },

  async toggleLike(postId) {
    return await this.request(`/posts/${postId}/like`, {
      method: 'POST'
    });
  },

  async toggleSavePost(postId) {
    return await this.request(`/posts/${postId}/save`, {
      method: 'POST'
    });
  },

  async getSavedPosts() {
    return await this.request('/posts/saved');
  },

  async recordPostView(postId) {
    return await this.request(`/posts/${postId}/view`, {
      method: 'POST'
    }).catch(() => {});
  },

  async getComments(postId) {
    return await this.request(`/posts/${postId}/comments`);
  },

  async addComment(postId, commentText) {
    return await this.request(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ comment_text: commentText })
    });
  },

  // Stories Endpoints
  async getStories() {
    return await this.request('/stories');
  },

  async createStory(formData) {
    return await this.request('/stories', {
      method: 'POST',
      body: formData
    });
  },

  // Reels Endpoints
  async getReels() {
    return await this.request('/reels');
  },

  async toggleLikeReel(reelId) {
    return await this.request(`/reels/${reelId}/like`, {
      method: 'POST'
    });
  },

  async createReel(reelData) {
    return await this.request('/reels', {
      method: 'POST',
      body: JSON.stringify(reelData)
    });
  },

  // Messages Endpoints
  async getConversations() {
    return await this.request('/messages/conversations');
  },

  async getMessages(userId) {
    return await this.request(`/messages/${userId}`);
  },

  async sendMessage(userId, text) {
    return await this.request(`/messages/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ message_text: text })
    });
  },

  // Notifications Endpoints
  async getNotifications() {
    return await this.request('/notifications');
  },

  async markNotificationsRead() {
    return await this.request('/notifications/read', {
      method: 'PUT'
    });
  },

  // User & Analytics Endpoints
  async getProfile(username) {
    return await this.request(`/users/profile/${encodeURIComponent(username)}`);
  },

  async getFollowers(username) {
    return await this.request(`/users/${encodeURIComponent(username)}/followers`);
  },

  async getFollowing(username) {
    return await this.request(`/users/${encodeURIComponent(username)}/following`);
  },

  async getAnalyticsOverview() {
    return await this.request('/users/analytics/overview');
  },

  async toggleFollow(userId) {
    return await this.request(`/users/${userId}/follow`, {
      method: 'POST'
    });
  },

  async updateProfile(updates) {
    const data = await this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    if (data.user) {
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  async uploadAvatar(formData) {
    return await this.request('/users/avatar', {
      method: 'POST',
      body: formData
    });
  },

  async searchUsers(query) {
    return await this.request(`/users/search?q=${encodeURIComponent(query)}`);
  },

  async getSuggestions() {
    return await this.request('/users/suggestions');
  },

  // Activity & Settings Endpoints
  async getActivityLikes() {
    return await this.request('/users/activity/likes');
  },

  async getActivityComments() {
    return await this.request('/users/activity/comments');
  },

  async getActivityDeleted() {
    return await this.request('/users/activity/deleted');
  },

  async restoreDeletedPost(postId) {
    return await this.request(`/users/activity/restore/${postId}`, { method: 'POST' });
  },

  async permanentlyDeletePost(postId) {
    return await this.request(`/users/activity/deleted/${postId}`, { method: 'DELETE' });
  },

  async getUserSettings() {
    return await this.request('/users/settings');
  },

  async updateUserSettings(settings) {
    return await this.request('/users/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
};
