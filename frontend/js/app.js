// Main Application Controller & View Routing

const App = {
  currentView: 'feed',
  notifTimer: null,

  init() {
    this.initSplashScreen();
    Auth.init();
    Feed.init();
    StoryCreator.init();
    Profile.init();
    Reels.init();
    Messages.init();

    this.bindNavigation();
    this.bindCreatePostModal();
    this.bindPostDetailModal();
    this.bindSearchAndExplore();
    this.bindNotificationsModal();
    this.handleHashChange();

    window.addEventListener('hashchange', () => this.handleHashChange());

    // Connection status indicator
    Api.onStatusChange((status) => this.updateStatusPill(status));

    // Start notification polling if user is logged in
    this.startNotificationPolling();
  },

  initSplashScreen() {
    const splash = document.getElementById('splash-screen');
    if (!splash) return;

    // Splash animation runs for 2.5 seconds total (2-3s app-style launch animation, no skip option)
    // Starts smooth cinematic fade-out at 2000ms, completes at ~2500ms
    setTimeout(() => {
      splash.classList.add('splash-fade-out');
      setTimeout(() => {
        splash.style.display = 'none';
        splash.setAttribute('aria-hidden', 'true');
      }, 520);
    }, 2000);
  },

  updateStatusPill(status) {
    const pill = document.getElementById('connection-status-pill');
    if (!pill) return;
    const text = pill.querySelector('.status-text');
    if (status === 'online') {
      pill.classList.add('online');
      if (text) text.textContent = 'Live Server';
      pill.title = 'Connected to local Express server';
    } else {
      pill.classList.remove('online');
      if (text) text.textContent = 'Preview Mode';
      pill.title = 'Running in standalone preview mode (GitHub Pages ready)';
    }
  },

  bindNavigation() {
    // Left sidebar links
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const action = item.dataset.nav;

        if (action === 'create') {
          this.openCreateModal();
          return;
        }

        if (action === 'notifications') {
          this.openNotificationsModal();
          return;
        }

        if (action === 'ai-assistant') {
          if (window.Profile && Profile.openAiAssistant) {
            Profile.openAiAssistant();
          }
          return;
        }

        if (action === 'profile') {
          const currentUser = Api.getCurrentUser();
          if (currentUser) {
            this.navigateToProfile(currentUser.username);
          } else {
            Auth.openModal('login');
          }
          return;
        }

        this.navigate(action);
      });
    });

    // Mobile bottom nav links
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const action = item.dataset.nav;
        if (action === 'create') {
          this.openCreateModal();
        } else if (action === 'profile') {
          const currentUser = Api.getCurrentUser();
          if (currentUser) {
            this.navigateToProfile(currentUser.username);
          } else {
            Auth.openModal('login');
          }
        } else {
          this.navigate(action);
        }
      });
    });

    // Logo click goes home
    const logo = document.querySelector('.logo-area');
    if (logo) {
      logo.addEventListener('click', () => this.navigate('feed'));
    }

    // Sidebar auth trigger
    const authBtn = document.getElementById('sidebar-auth-btn');
    if (authBtn) {
      authBtn.addEventListener('click', () => Auth.openModal('login'));
    }

    // User card click goes to current user's profile
    const userCard = document.getElementById('sidebar-user-card');
    if (userCard) {
      userCard.addEventListener('click', () => {
        const user = Api.getCurrentUser();
        if (user) this.navigateToProfile(user.username);
      });
    }
  },

  handleHashChange() {
    const hash = window.location.hash.slice(1);
    if (!hash || hash === 'feed') {
      this.switchView('feed');
      Feed.loadFeed(Feed.currentTab);
    } else if (hash === 'explore') {
      this.switchView('explore');
      this.loadExploreGrid();
    } else if (hash === 'reels') {
      this.switchView('reels');
      Reels.loadReels();
    } else if (hash === 'messages') {
      this.switchView('messages');
      Messages.loadConversations();
    } else if (hash.startsWith('profile/')) {
      const username = hash.split('/')[1];
      this.switchView('profile');
      Profile.loadProfile(username);
    } else if (hash === 'ai' || hash === 'ai-assistant') {
      if (window.Profile && Profile.openAiAssistant) {
        Profile.openAiAssistant();
      }
    }
  },

  navigate(view) {
    window.location.hash = view;
  },

  navigateToProfile(username) {
    window.location.hash = `profile/${username}`;
  },

  startDirectMessage(userId) {
    window.location.hash = 'messages';
    setTimeout(() => {
      Messages.openChatWithUser(userId);
    }, 150);
  },

  switchView(viewName) {
    this.currentView = viewName;
    document.querySelectorAll('.view-container').forEach(el => el.classList.remove('active-view'));

    const targetEl = document.getElementById(`${viewName}-view`);
    if (targetEl) targetEl.classList.add('active-view');

    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
      if (item.dataset.nav === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  refreshCurrentView() {
    this.checkNotifications();
    if (this.currentView === 'feed') {
      Feed.loadFeed(Feed.currentTab);
      Feed.loadSuggestions();
    } else if (this.currentView === 'profile' && Profile.currentUserProfile) {
      Profile.loadProfile(Profile.currentUserProfile.user.username);
    } else if (this.currentView === 'reels') {
      Reels.loadReels();
    } else if (this.currentView === 'messages') {
      Messages.loadConversations();
    }
  },

  // ==========================================
  // NOTIFICATIONS SYSTEM
  // ==========================================
  startNotificationPolling() {
    this.checkNotifications();
    setInterval(() => this.checkNotifications(), 15000);
  },

  async checkNotifications() {
    const currentUser = Api.getCurrentUser();
    if (!currentUser) return;
    try {
      const data = await Api.getNotifications();
      const needsProfileSetup = (!currentUser.full_name || currentUser.full_name.toLowerCase() === 'user' || !currentUser.avatar_url || currentUser.avatar_url.includes('default-avatar'));
      const badge = document.getElementById('notif-badge');
      if (badge) {
        const totalUnread = (data.unread_count || 0) + (needsProfileSetup ? 1 : 0);
        if (totalUnread > 0) {
          badge.textContent = totalUnread;
          badge.style.display = 'inline-flex';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (e) {}
  },

  async openNotificationsModal() {
    const currentUser = Api.getCurrentUser();
    if (!currentUser) {
      Auth.openModal('login');
      return;
    }

    const modal = document.getElementById('notifications-modal');
    const container = document.getElementById('notifications-list-container');
    if (!modal || !container) return;

    modal.classList.add('open');
    container.innerHTML = `<p style="padding: 24px; text-align: center; color: var(--text-muted);">Loading notifications...</p>`;

    try {
      const data = await Api.getNotifications();
      const needsProfileSetup = (!currentUser.full_name || currentUser.full_name.toLowerCase() === 'user' || !currentUser.avatar_url || currentUser.avatar_url.includes('default-avatar'));

      let setupNotificationHtml = '';
      if (needsProfileSetup) {
        setupNotificationHtml = `
          <div class="notification-item unread profile-setup-notif" onclick="document.getElementById('notifications-modal').classList.remove('open'); Profile.openEditModal();" style="cursor: pointer; background: rgba(220, 39, 67, 0.12); border-left: 3px solid #dc2743; padding: 14px 16px; margin: 8px 12px; border-radius: 10px; transition: all 0.2s ease;">
            <div class="notif-avatar-badge" style="width: 44px; height: 44px; border-radius: 50%; background: var(--ig-gradient); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; box-shadow: 0 4px 14px rgba(220,39,67,0.4);">
              📸
            </div>
            <div class="notif-body" style="flex: 1;">
              <div>
                <span class="notif-username" style="color: #fff; font-weight: 700; font-size: 14px;">Complete your profile</span>
                <p class="notif-text" style="color: var(--text-secondary); font-size: 13px; margin-top: 3px; line-height: 1.4;">
                  Add your custom username, name and profile picture to make your account stand out!
                </p>
              </div>
              <div style="margin-top: 8px;">
                <span class="notif-setup-link" style="color: var(--accent-blue); font-weight: 700; font-size: 13px; text-decoration: underline; display: inline-flex; align-items: center; gap: 4px;">
                  Tap here to edit profile & photo →
                </span>
              </div>
              <span class="notif-time" style="font-size: 11px; color: #dc2743; font-weight: 700; margin-top: 4px; display: inline-block;">● Action Recommended</span>
            </div>
          </div>
        `;
      }

      const notifsList = (data.notifications || []).filter(n => n.type !== 'profile_setup');

      if (!setupNotificationHtml && notifsList.length === 0) {
        container.innerHTML = `<div style="padding: 36px 16px; text-align: center; color: var(--text-muted);"><p>No notifications yet</p></div>`;
        return;
      }

      const regularHtml = notifsList.map(n => `
        <div class="notification-item ${!n.is_read ? 'unread' : ''}">
          <img src="${Api.getMediaUrl(n.actor_avatar_url)}" class="notif-avatar" alt="${n.actor_username}" />
          <div class="notif-body">
            <div>
              <span class="notif-username" onclick="document.getElementById('notifications-modal').classList.remove('open'); App.navigateToProfile('${n.actor_username}')">${n.actor_username}</span>
              <span class="notif-text">${Feed.escapeHTML(n.content)}</span>
            </div>
            <span class="notif-time">${Feed.formatTimeAgo(n.created_at)}</span>
          </div>
          ${n.post_image_url ? `<img src="${Api.getMediaUrl(n.post_image_url)}" class="notif-post-thumb" />` : ''}
        </div>
      `).join('');

      container.innerHTML = setupNotificationHtml + regularHtml;

      // Mark all read (except profile setup badge)
      Api.markNotificationsRead().then(() => {
        const badge = document.getElementById('notif-badge');
        if (badge) {
          if (needsProfileSetup) {
            badge.textContent = '1';
            badge.style.display = 'inline-flex';
          } else {
            badge.style.display = 'none';
          }
        }
      });
    } catch (e) {
      container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Failed to load notifications</p>`;
    }
  },

  bindNotificationsModal() {
    const modal = document.getElementById('notifications-modal');
    const closeBtn = document.getElementById('close-notifications-modal');
    if (closeBtn && modal) {
      closeBtn.onclick = () => modal.classList.remove('open');
    }
  },

  // ==========================================
  // CREATE POST MODAL & AI CAPTION GENERATOR
  // ==========================================
  openCreateModal() {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }
    const modal = document.getElementById('create-post-modal');
    if (modal) modal.classList.add('open');
  },

  closeCreateModal() {
    const modal = document.getElementById('create-post-modal');
    if (modal) {
      modal.classList.remove('open');
      this.resetCreatePostForm();
    }
  },

  resetCreatePostForm() {
    const fileInput = document.getElementById('post-file-input');
    const urlInput = document.getElementById('post-url-input');
    const captionInput = document.getElementById('post-caption-input');
    const previewContainer = document.getElementById('create-post-preview-container');
    const dropzone = document.getElementById('create-dropzone');

    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (captionInput) captionInput.value = '';
    if (previewContainer) {
      previewContainer.style.display = 'none';
      previewContainer.innerHTML = '';
    }
    if (dropzone) dropzone.style.display = 'flex';
    const locInput = document.getElementById('post-location-input');
    const musicInput = document.getElementById('post-music-input');
    const filterInput = document.getElementById('post-filter-input');
    if (locInput) locInput.value = '';
    if (musicInput) musicInput.value = '';
    if (filterInput) filterInput.value = 'normal';
    document.querySelectorAll('#post-filter-pills .filter-pill').forEach(p => {
      p.classList.toggle('active', p.dataset.filter === 'normal');
    });
  },

  bindCreatePostModal() {
    const closeBtn = document.getElementById('close-create-modal');
    const dropzone = document.getElementById('create-dropzone');
    const fileInput = document.getElementById('post-file-input');
    const urlInput = document.getElementById('post-url-input');
    const form = document.getElementById('create-post-form');
    const aiBtn = document.getElementById('ai-caption-btn');

    if (closeBtn) closeBtn.onclick = () => this.closeCreateModal();

    // AI Caption Generator
    if (aiBtn) {
      aiBtn.onclick = () => this.generateAiCaption();
    }

    // Filter pill selector
    document.querySelectorAll('#post-filter-pills .filter-pill').forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll('#post-filter-pills .filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const filterInput = document.getElementById('post-filter-input');
        if (filterInput) filterInput.value = pill.dataset.filter;
        const img = document.querySelector('#create-post-preview-container img');
        if (img) img.className = `filter-${pill.dataset.filter}`;
      };
    });

    if (dropzone && fileInput) {
      dropzone.onclick = () => fileInput.click();

      dropzone.ondragover = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--accent-blue)';
      };

      dropzone.ondragleave = () => {
        dropzone.style.borderColor = 'var(--border-color)';
      };

      dropzone.ondrop = (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border-color)';
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          fileInput.files = e.dataTransfer.files;
          this.previewSelectedImage(e.dataTransfer.files[0]);
        }
      };

      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          this.previewSelectedImage(fileInput.files[0]);
        }
      };
    }

    if (urlInput) {
      urlInput.oninput = () => {
        const val = urlInput.value.trim();
        if (val.startsWith('http')) {
          this.previewImageUrl(val);
        }
      };
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const submitBtn = document.getElementById('submit-post-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sharing...';

        try {
          const formData = new FormData();
          const file = fileInput.files[0];
          const url = urlInput.value.trim();
          const caption = document.getElementById('post-caption-input').value.trim();
          const filter = document.getElementById('post-filter-input')?.value || 'normal';
          const location = document.getElementById('post-location-input')?.value.trim() || '';
          const music = document.getElementById('post-music-input')?.value.trim() || '';

          if (file) {
            formData.append('image', file);
          } else if (url) {
            formData.append('imageUrl', url);
          } else {
            throw new Error('Please select an image file or provide an image link');
          }

          formData.append('caption', caption);
          formData.append('filter_style', filter);
          formData.append('location', location);
          formData.append('music_title', music);

          await Api.createPost(formData);
          this.closeCreateModal();
          this.showToast('Post shared to feed! 📸');
          this.navigate('feed');
          Feed.loadFeed(Feed.currentTab);
        } catch (err) {
          this.showToast(err.message || 'Failed to create post');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Share';
        }
      };
    }
  },

  generateAiCaption() {
    const captionInput = document.getElementById('post-caption-input');
    if (!captionInput) return;

    const templates = [
      'Finding poetry in the ordinary moments. The light always finds a way ✨📸 #visualart #goldenhour #moment',
      'Chasing horizons and timeless architecture. Built to withstand the test of time 🏛️🌆 #cityvibes #minimalism #explore',
      'Lost in the rhythm of the great outdoors. Deep breath, clear mind 🌲⛰️ #naturelovers #wanderlust #serenity',
      'Late night coffee, ambient lights, and endless creation ☕🎨 #aesthetic #creativeflow #vibes',
      'Small steps every single day. Trusting the process and enjoying the journey 🚀✨ #lifestyle #growth #inspiration'
    ];

    const randomCaption = templates[Math.floor(Math.random() * templates.length)];
    captionInput.value = randomCaption;
    this.showToast('✨ AI Caption generated!');
  },

  previewSelectedImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      this.showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  },

  previewImageUrl(url) {
    this.showImagePreview(url);
  },

  showImagePreview(src) {
    const dropzone = document.getElementById('create-dropzone');
    const previewContainer = document.getElementById('create-post-preview-container');
    if (!previewContainer) return;

    if (dropzone) dropzone.style.display = 'none';
    previewContainer.style.display = 'block';
    previewContainer.innerHTML = `
      <div style="position: relative; max-height: 280px; overflow: hidden; border-radius: 8px;">
        <img src="${src}" alt="Preview" style="width: 100%; height: 260px; object-fit: cover; display: block;" />
        <button type="button" onclick="App.resetCreatePostForm()" style="position: absolute; top: 10px; right: 10px; background: rgba(0,0,0,0.6); color: #fff; border-radius: 50%; width: 28px; height: 28px;">✕</button>
      </div>
    `;
  },

  // ==========================================
  // POST DETAIL MODAL
  // ==========================================
  async openPostDetailModal(postId) {
    const modal = document.getElementById('post-detail-modal');
    if (!modal) return;

    const post = Feed.posts.find(p => p.id === postId) || (Profile.currentUserProfile && Profile.currentUserProfile.posts.find(p => p.id === postId));
    if (!post) return;

    document.getElementById('modal-post-image').src = Api.getMediaUrl(post.image_url);
    document.getElementById('modal-author-avatar').src = Api.getMediaUrl(post.author_avatar_url || (Profile.currentUserProfile ? Profile.currentUserProfile.user.avatar_url : ''));
    document.getElementById('modal-author-username').textContent = post.author_username || (Profile.currentUserProfile ? Profile.currentUserProfile.user.username : '');
    document.getElementById('modal-post-caption').innerHTML = Feed.formatCaption(post.caption || '');
    document.getElementById('modal-caption-username').textContent = post.author_username || (Profile.currentUserProfile ? Profile.currentUserProfile.user.username : '');

    modal.classList.add('open');
    this.loadModalComments(postId);

    const form = document.getElementById('modal-comment-form');
    form.onsubmit = async (e) => {
      e.preventDefault();
      const input = document.getElementById('modal-comment-input');
      const text = input.value.trim();
      if (!text) return;

      if (!Api.getCurrentUser()) {
        Auth.openModal('login');
        return;
      }

      input.value = '';
      try {
        await Api.addComment(postId, text);
        this.showToast('Comment added');
        this.loadModalComments(postId);
      } catch (err) {
        this.showToast(err.message || 'Comment failed');
      }
    };
  },

  async loadModalComments(postId) {
    const listEl = document.getElementById('modal-comments-list');
    if (!listEl) return;

    try {
      const data = await Api.getComments(postId);
      if (!data.comments || data.comments.length === 0) {
        listEl.innerHTML = `<p style="font-size: 13px; color: var(--text-muted); padding: 10px 0;">No comments yet. Say something!</p>`;
        return;
      }

      listEl.innerHTML = data.comments.map(c => `
        <div class="comment-row" style="margin-bottom: 12px;">
          <img src="${c.avatar_url}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;" />
          <div style="font-size: 13px;">
            <span class="comment-user" onclick="App.navigateToProfile('${c.username}')" style="cursor: pointer;">${c.username}</span>
            <span class="comment-text">${Feed.escapeHTML(c.comment_text)}</span>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">${Feed.formatTimeAgo(c.created_at)}</div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      listEl.innerHTML = `<p style="color: var(--text-muted);">Failed to load comments</p>`;
    }
  },

  bindPostDetailModal() {
    const modal = document.getElementById('post-detail-modal');
    const closeBtn = document.getElementById('close-post-detail-modal');
    if (closeBtn && modal) {
      closeBtn.onclick = () => modal.classList.remove('open');
    }
  },

  // ==========================================
  // EXPLORE & SEARCH
  // ==========================================
  bindSearchAndExplore() {
    const searchInput = document.getElementById('explore-search-input');
    const resultsContainer = document.getElementById('explore-search-results');

    let debounceTimer;
    if (searchInput && resultsContainer) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (!query) {
          resultsContainer.innerHTML = '';
          return;
        }

        debounceTimer = setTimeout(async () => {
          try {
            const data = await Api.searchUsers(query);
            if (!data.users || data.users.length === 0) {
              resultsContainer.innerHTML = `<div style="padding: 12px; color: var(--text-muted); font-size: 13px;">No accounts found matching "${query}"</div>`;
              return;
            }

            resultsContainer.innerHTML = data.users.map(u => `
              <div class="suggestion-item" style="padding: 8px 12px; border-radius: 8px; cursor: pointer; transition: background 0.15s;" onclick="App.navigateToProfile('${u.username}')">
                <div class="suggestion-user">
                  <img src="${u.avatar_url}" alt="${u.username}" class="suggestion-avatar" />
                  <div class="suggestion-meta">
                    <span class="suggestion-username">${u.username}</span>
                    <span class="suggestion-subtitle">${u.full_name} • ${u.followers_count} followers</span>
                  </div>
                </div>
              </div>
            `).join('');
          } catch (e) {
            console.error('Search failed', e);
          }
        }, 250);
      });
    }
  },

  async loadExploreGrid() {
    const gridEl = document.getElementById('explore-grid');
    if (!gridEl) return;

    try {
      const data = await Api.getFeed('for_you');
      if (!data.posts || data.posts.length === 0) {
        gridEl.innerHTML = `<div class="empty-grid-msg"><h3>No photos to explore yet</h3></div>`;
        return;
      }

      gridEl.innerHTML = data.posts.map(p => `
        <div class="grid-post-item" onclick="App.openPostDetailModal(${p.id})">
          <img src="${Api.getMediaUrl(p.image_url)}" alt="Explore photo" class="grid-post-img" loading="lazy" />
          <div class="grid-post-overlay">
            <div class="overlay-metric">
              <svg viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
              <span>${p.likes_count}</span>
            </div>
            <div class="overlay-metric">
              <svg viewBox="0 0 24 24"><path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18z"/></svg>
              <span>${p.comments_count}</span>
            </div>
          </div>
        </div>
      `).join('');
    } catch (e) {
      console.error('Explore grid error', e);
    }
  },

  showPostMenu(postId, authorUsername) {
    const user = Api.getCurrentUser();
    const isOwner = user && user.username.toLowerCase() === authorUsername.toLowerCase();

    const choice = confirm(isOwner ? "Delete this post?" : "Copy link to post?");
    if (choice) {
      if (isOwner) {
        Api.deletePost(postId).then(() => {
          App.showToast('Post deleted');
          App.refreshCurrentView();
        }).catch(err => {
          App.showToast(err.message || 'Failed to delete');
        });
      } else {
        Feed.sharePost(postId);
      }
    }
  },

  showToast(message) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
