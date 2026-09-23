// Profile Page & 3x3 Post Grid Controller

const Profile = {
  currentUserProfile: null,

  init() {
    this.container = document.getElementById('profile-view');
    this.bindEditModalEvents();
  },

  async loadProfile(username) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
        <p>Loading profile...</p>
      </div>
    `;

    try {
      const data = await Api.getProfile(username);
      this.currentUserProfile = data;
      this.renderProfile(data);
    } catch (err) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <h2>User Not Found</h2>
          <p style="margin-top: 8px;">The link you followed may be broken, or the page may have been removed.</p>
          <button class="btn-primary" style="margin-top: 16px;" onclick="App.navigate('feed')">Back to Home</button>
        </div>
      `;
    }
  },

  renderProfile(data) {
    const { user, stats, isFollowing, isSelf, posts } = data;

    let actionBtnHTML = '';
    if (isSelf) {
      actionBtnHTML = `
        <button class="btn-secondary" onclick="Profile.openEditModal()">Edit Profile</button>
        <button class="btn-secondary" onclick="Profile.openAnalyticsModal()">📊 Analytics</button>
        <button class="btn-secondary profile-menu-trigger-btn" onclick="Profile.openSettingsAndActivity()" title="Settings and activity">
          ${Icons.menu()}
        </button>
      `;
    } else {
      const followText = isFollowing ? 'Following' : 'Follow';
      const followClass = isFollowing ? 'btn-secondary' : 'btn-primary';
      actionBtnHTML = `
        <button class="${followClass}" id="profile-follow-toggle-btn" onclick="Profile.toggleFollow(${user.id})">
          ${followText}
        </button>
        <button class="btn-secondary" onclick="App.startDirectMessage(${user.id})">
          ✉️ Message
        </button>
      `;
    }

    const avatarUrl = Api.getMediaUrl(user.avatar_url);

    this.container.innerHTML = `
      <div class="profile-container">
        <!-- Profile Top Bar (Instagram Style) -->
        <div class="profile-top-bar">
          <div class="profile-top-username">
            <span>${user.username}</span>
            <span class="profile-verified-badge" title="Verified Creator">✓</span>
          </div>
          <div class="profile-top-icons">
            ${isSelf ? `
              <button class="profile-top-icon-btn" onclick="App.openCreateModal()" title="Create New Post">${Icons.plus()}</button>
              <button class="profile-top-icon-btn profile-hamburger-btn" onclick="Profile.openSettingsAndActivity()" title="Settings and activity">${Icons.menu()}</button>
            ` : ''}
          </div>
        </div>

        <!-- Profile Header -->
        <header class="profile-header">
          <div class="profile-avatar-wrapper">
            <div class="profile-avatar-ring">
              <img src="${avatarUrl}" alt="${user.username}" class="profile-avatar-img" />
            </div>
          </div>

          <div class="profile-info">
            <div class="profile-title-row">
              <h2 class="profile-username">${user.username}</h2>
              <div class="profile-actions">
                ${actionBtnHTML}
              </div>
            </div>

            <!-- Clickable Stats -->
            <ul class="profile-stats-row">
              <li class="stat-item">
                <span class="stat-count">${stats.posts_count}</span> <span class="stat-label">posts</span>
              </li>
              <li class="stat-item" style="cursor: pointer;" onclick="Profile.openFollowersModal('${user.username}')" title="View Followers">
                <span class="stat-count" id="profile-followers-count">${stats.followers_count}</span> <span class="stat-label">followers</span>
              </li>
              <li class="stat-item" style="cursor: pointer;" onclick="Profile.openFollowingModal('${user.username}')" title="View Following">
                <span class="stat-count">${stats.following_count}</span> <span class="stat-label">following</span>
              </li>
            </ul>

            <!-- Bio, Website & Location -->
            <div class="profile-bio-section">
              <div class="profile-fullname">${user.full_name}</div>
              <p class="profile-bio-text">${user.bio || 'No bio yet.'}</p>
              ${user.location ? `<div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">📍 ${user.location}</div>` : ''}
              ${user.website ? `<div style="font-size: 13px; margin-top: 4px;"><a href="${user.website}" target="_blank" rel="noopener" style="color: var(--text-link); font-weight: 600;">🔗 ${user.website.replace(/^https?:\/\//, '')}</a></div>` : ''}
            </div>
          </div>
        </header>

        <!-- Profile Tabs -->
        <div class="profile-tabs">
          <div class="profile-tab active" data-tab="posts">
            <span>📷 POSTS</span>
          </div>
          <div class="profile-tab" data-tab="saved">
            <span>🔖 SAVED</span>
          </div>
        </div>

        <!-- 3x3 Photo Grid -->
        <div class="posts-grid" id="profile-posts-grid">
          ${this.renderPostsGrid(posts)}
        </div>
      </div>
    `;

    // Bind tab clicks
    this.container.querySelectorAll('.profile-tab').forEach(tab => {
      tab.addEventListener('click', async () => {
        this.container.querySelectorAll('.profile-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const grid = document.getElementById('profile-posts-grid');

        if (tab.dataset.tab === 'saved') {
          if (!isSelf) {
            grid.innerHTML = `
              <div class="empty-grid-msg">
                <span style="font-size: 32px;">🔒</span>
                <h3>Saved Posts are Private</h3>
                <p>Only this user can see what they've saved.</p>
              </div>
            `;
            return;
          }

          grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);"><p>Loading saved collection...</p></div>`;
          try {
            const res = await Api.getSavedPosts();
            if (!res.posts || res.posts.length === 0) {
              grid.innerHTML = `
                <div class="empty-grid-msg">
                  <span style="font-size: 36px;">🔖</span>
                  <h3>Save Photos to See Them Later</h3>
                  <p>When you bookmark photos, they'll show up here.</p>
                </div>
              `;
            } else {
              grid.innerHTML = this.renderPostsGrid(res.posts);
            }
          } catch (e) {
            grid.innerHTML = `<div class="empty-grid-msg"><p>Could not load saved collection</p></div>`;
          }
        } else {
          grid.innerHTML = this.renderPostsGrid(posts);
        }
      });
    });
  },

  renderPostsGrid(posts) {
    if (!posts || posts.length === 0) {
      return `
        <div class="empty-grid-msg">
          <span style="font-size: 36px;">📸</span>
          <h3>No Posts Yet</h3>
          <p>When this user captures moments, they'll show up here.</p>
        </div>
      `;
    }

    return posts.map(p => `
      <div class="grid-post-item" onclick="App.openPostDetailModal(${p.id})">
        <img src="${Api.getMediaUrl(p.image_url)}" alt="Post photo" class="grid-post-img" loading="lazy" />
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
  },

  async toggleFollow(userId) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    const btn = document.getElementById('profile-follow-toggle-btn');
    const followersCountEl = document.getElementById('profile-followers-count');

    try {
      const res = await Api.toggleFollow(userId);
      if (res.following) {
        btn.textContent = 'Following';
        btn.className = 'btn-secondary';
        App.showToast('Followed successfully ✨');
      } else {
        btn.textContent = 'Follow';
        btn.className = 'btn-primary';
        App.showToast('Unfollowed');
      }

      if (followersCountEl) {
        followersCountEl.textContent = res.followers_count;
      }
    } catch (err) {
      App.showToast(err.message || 'Action failed');
    }
  },

  // Followers Modal
  async openFollowersModal(username) {
    const modal = document.getElementById('users-list-modal');
    const title = document.getElementById('users-list-title');
    const container = document.getElementById('users-list-container');
    if (!modal || !container) return;

    title.textContent = 'Followers';
    container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Loading followers...</p>`;
    modal.classList.add('open');

    try {
      const data = await Api.getFollowers(username);
      this.renderUsersList(data.followers || []);
    } catch (e) {
      container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Could not load followers</p>`;
    }
  },

  // Following Modal
  async openFollowingModal(username) {
    const modal = document.getElementById('users-list-modal');
    const title = document.getElementById('users-list-title');
    const container = document.getElementById('users-list-container');
    if (!modal || !container) return;

    title.textContent = 'Following';
    container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Loading following...</p>`;
    modal.classList.add('open');

    try {
      const data = await Api.getFollowing(username);
      this.renderUsersList(data.following || []);
    } catch (e) {
      container.innerHTML = `<p style="padding: 20px; text-align: center; color: var(--text-muted);">Could not load following</p>`;
    }
  },

  renderUsersList(users) {
    const container = document.getElementById('users-list-container');
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `<p style="padding: 24px; text-align: center; color: var(--text-muted);">No users found</p>`;
      return;
    }

    container.innerHTML = users.map(u => `
      <div class="suggestion-item" style="padding: 10px 16px;">
        <div class="suggestion-user" onclick="document.getElementById('users-list-modal').classList.remove('open'); App.navigateToProfile('${u.username}')">
          <img src="${u.avatar_url}" alt="${u.username}" class="suggestion-avatar" />
          <div class="suggestion-meta">
            <span class="suggestion-username">${u.username}</span>
            <span class="suggestion-subtitle">${u.full_name}</span>
          </div>
        </div>
        <button class="follow-btn ${u.is_following ? 'following' : ''}" onclick="Feed.toggleFollowSuggestion(this, ${u.id})">
          ${u.is_following ? 'Following' : 'Follow'}
        </button>
      </div>
    `).join('');
  },

  // Creator Analytics Modal
  async openAnalyticsModal() {
    const modal = document.getElementById('creator-analytics-modal');
    const body = document.getElementById('analytics-content-box');
    if (!modal || !body) return;

    modal.classList.add('open');
    body.innerHTML = `<p style="text-align: center; padding: 40px; color: var(--text-muted);">Aggregating metrics...</p>`;

    try {
      const data = await Api.getAnalyticsOverview();
      const a = data.analytics;

      body.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-bottom: 20px;">
          <div class="analytics-card">
            <span class="analytics-label">Total Impressions</span>
            <span class="analytics-value">${a.total_views.toLocaleString()}</span>
          </div>
          <div class="analytics-card">
            <span class="analytics-label">Engagement Rate</span>
            <span class="analytics-value" style="color: #00d26a;">${a.engagement_rate}</span>
          </div>
          <div class="analytics-card">
            <span class="analytics-label">Total Likes Received</span>
            <span class="analytics-value">❤️ ${a.total_likes.toLocaleString()}</span>
          </div>
          <div class="analytics-card">
            <span class="analytics-label">Total Comments</span>
            <span class="analytics-value">💬 ${a.total_comments.toLocaleString()}</span>
          </div>
        </div>

        ${a.top_post ? `
          <div style="border-top: 1px solid var(--border-color); padding-top: 14px;">
            <span style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase;">🔥 Top Performing Post:</span>
            <div style="display: flex; gap: 12px; margin-top: 10px; align-items: center; background: var(--bg-tertiary); padding: 10px; border-radius: var(--radius-sm);">
              <img src="${a.top_post.image_url}" style="width: 54px; height: 54px; object-fit: cover; border-radius: 6px;" />
              <div>
                <div style="font-size: 13px; font-weight: 600;">${Feed.escapeHTML(a.top_post.caption.slice(0, 45))}...</div>
                <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
                  ❤️ ${a.top_post.likes_count} likes • 💬 ${a.top_post.comments_count} comments • 👁️ ${a.top_post.views_count} views
                </div>
              </div>
            </div>
          </div>
        ` : ''}
      `;
    } catch (e) {
      body.innerHTML = `<p style="color: var(--text-muted); padding: 20px; text-align: center;">Could not load analytics</p>`;
    }
  },

  openEditModal() {
    const user = Api.getCurrentUser();
    if (!user) return;

    const modal = document.getElementById('edit-profile-modal');
    if (!modal) return;

    const usernameInput = document.getElementById('edit-username');
    if (usernameInput) usernameInput.value = user.username || '';

    const fullnameInput = document.getElementById('edit-fullname');
    if (fullnameInput) fullnameInput.value = user.full_name || '';

    const bioInput = document.getElementById('edit-bio');
    if (bioInput) bioInput.value = user.bio || '';

    const websiteInput = document.getElementById('edit-website');
    if (websiteInput) websiteInput.value = user.website || '';

    const locationInput = document.getElementById('edit-location');
    if (locationInput) locationInput.value = user.location || '';

    const preview = document.getElementById('edit-avatar-preview');
    if (preview) preview.src = Api.getMediaUrl(user.avatar_url);

    modal.classList.add('open');
  },

  closeEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.remove('open');
  },

  bindEditModalEvents() {
    const modal = document.getElementById('edit-profile-modal');
    const closeBtn = document.getElementById('close-edit-modal');
    const form = document.getElementById('edit-profile-form');
    const avatarFileInput = document.getElementById('edit-avatar-file');
    const avatarPreview = document.getElementById('edit-avatar-preview');

    if (avatarFileInput && avatarPreview) {
      avatarFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            avatarPreview.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        }
      };
    }

    if (closeBtn) {
      closeBtn.onclick = () => this.closeEditModal();
    }

    if (form) {
      form.onsubmit = async (e) => {
        e.preventDefault();
        const usernameEl = document.getElementById('edit-username');
        const username = usernameEl ? usernameEl.value.trim() : undefined;
        const fullName = document.getElementById('edit-fullname').value.trim();
        const bio = document.getElementById('edit-bio').value.trim();
        const website = document.getElementById('edit-website').value.trim();
        const location = document.getElementById('edit-location').value.trim();
        const avatarFile = document.getElementById('edit-avatar-file').files[0];

        try {
          let newAvatarUrl = undefined;
          if (avatarFile) {
            const formData = new FormData();
            formData.append('avatar', avatarFile);
            const uploadRes = await Api.uploadAvatar(formData);
            newAvatarUrl = uploadRes.avatar_url;
          }

          const updates = { full_name: fullName, bio, website, location };
          if (username) updates.username = username;
          if (newAvatarUrl) updates.avatar_url = newAvatarUrl;

          const res = await Api.updateProfile(updates);
          this.closeEditModal();
          Auth.updateUserUI();
          App.showToast('Profile updated! ✨');

          // Refresh notification count and feed if visible
          if (window.App && App.checkNotifications) {
            App.checkNotifications();
          }
          if (window.Feed && Feed.renderFeed) {
            Feed.loadFeed(Feed.currentTab);
          }

          this.loadProfile(res.user.username);
        } catch (err) {
          App.showToast(err.message || 'Failed to update profile');
        }
      };
    }
  },

  // ==========================================
  // SETTINGS AND ACTIVITY (Instagram Menu System)
  // ==========================================
  async openSettingsAndActivity() {
    const modal = document.getElementById('settings-activity-modal');
    if (!modal) return;
    modal.classList.add('open');

    // Fetch counts & user settings
    try {
      const savedRes = await Api.getSavedPosts();
      const savedCountEl = document.getElementById('settings-saved-count');
      if (savedCountEl) savedCountEl.textContent = savedRes.posts ? savedRes.posts.length : 0;

      const settingsRes = await Api.getUserSettings();
      const privacyToggle = document.getElementById('setting-privacy-toggle');
      const privacyLabel = document.getElementById('setting-privacy-label');
      const hideLikesToggle = document.getElementById('setting-hide-likes-toggle');

      if (settingsRes && settingsRes.settings) {
        if (privacyToggle) privacyToggle.checked = Boolean(settingsRes.settings.is_private);
        if (privacyLabel) privacyLabel.textContent = settingsRes.settings.is_private ? 'Private' : 'Public';
        if (hideLikesToggle) hideLikesToggle.checked = Boolean(settingsRes.settings.hide_likes);
      }
    } catch (e) {}
  },

  closeSettingsAndActivity() {
    const modal = document.getElementById('settings-activity-modal');
    if (modal) modal.classList.remove('open');
  },

  filterSettings(query) {
    const q = query.trim().toLowerCase();
    document.querySelectorAll('.settings-row, .settings-account-card').forEach(row => {
      const text = row.textContent.toLowerCase();
      if (!q || text.includes(q)) {
        row.style.display = 'flex';
      } else {
        row.style.display = 'none';
      }
    });
  },

  async openActivityModal(initialTab = 'likes') {
    this.closeSettingsAndActivity();
    const modal = document.getElementById('your-activity-modal');
    if (!modal) return;
    modal.classList.add('open');
    this.switchActivityTab(initialTab);
  },

  openActivityTab(tab) {
    this.openActivityModal(tab);
  },

  backToSettings() {
    const actModal = document.getElementById('your-activity-modal');
    if (actModal) actModal.classList.remove('open');
    this.openSettingsAndActivity();
  },

  switchActivityTab(tab) {
    document.querySelectorAll('.activity-tab-btn').forEach(btn => {
      if (btn.dataset.actTab === tab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    this.loadActivityData(tab);
  },

  async loadActivityData(tab) {
    const body = document.getElementById('activity-modal-body');
    if (!body) return;
    body.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Loading your ${tab} activity...</div>`;

    try {
      if (tab === 'likes') {
        const data = await Api.getActivityLikes();
        const posts = data.liked_posts || [];
        const reels = data.liked_reels || [];
        const countLikesEl = document.getElementById('act-count-likes');
        if (countLikesEl) countLikesEl.textContent = posts.length + reels.length;

        if (posts.length === 0 && reels.length === 0) {
          body.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--text-muted);"><h3>No Liked Posts Yet</h3><p style="margin-top: 6px;">Posts and reels you like will show up here.</p></div>`;
          return;
        }

        let html = `<div class="activity-grid-posts">`;
        posts.forEach(p => {
          html += `
            <div class="activity-post-card">
              <div class="activity-post-thumb-wrap" onclick="App.openPostDetailModal(${p.id})">
                <img src="${Api.getMediaUrl(p.image_url)}" class="activity-post-thumb" alt="Liked post" />
                <span class="activity-post-type-tag">📷 Photo</span>
              </div>
              <div class="activity-post-card-info">
                <div class="activity-author-row">
                  <img src="${Api.getMediaUrl(p.author_avatar_url)}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;" />
                  <span>@${p.author_username}</span>
                </div>
                <p class="activity-caption-preview">${Feed.escapeHTML(p.caption || 'No caption')}</p>
                <div class="activity-card-action-bar">
                  <span style="font-size: 11px; color: var(--text-muted);">❤️ ${p.likes_count} likes</span>
                  <button class="activity-action-btn-sm unlike" onclick="Profile.unlikeFromActivity(${p.id}, 'post')">Unlike</button>
                </div>
              </div>
            </div>
          `;
        });

        reels.forEach(r => {
          html += `
            <div class="activity-post-card">
              <div class="activity-post-thumb-wrap" onclick="App.navigate('reels')">
                <img src="${Api.getMediaUrl(r.thumbnail_url)}" class="activity-post-thumb" alt="Liked reel" />
                <span class="activity-post-type-tag">🎬 Reel</span>
              </div>
              <div class="activity-post-card-info">
                <div class="activity-author-row">
                  <img src="${Api.getMediaUrl(r.author_avatar_url)}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;" />
                  <span>@${r.author_username}</span>
                </div>
                <p class="activity-caption-preview">${Feed.escapeHTML(r.caption || 'Reel audio')}</p>
                <div class="activity-card-action-bar">
                  <span style="font-size: 11px; color: var(--text-muted);">❤️ ${r.likes_count} likes</span>
                  <button class="activity-action-btn-sm unlike" onclick="Profile.unlikeFromActivity(${r.id}, 'reel')">Unlike</button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
        body.innerHTML = html;

      } else if (tab === 'saved' || tab === 'archive') {
        const data = await Api.getSavedPosts();
        const posts = data.posts || [];
        const countSavedEl = document.getElementById('act-count-saved');
        if (countSavedEl) countSavedEl.textContent = posts.length;

        if (posts.length === 0) {
          body.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--text-muted);"><h3>No Saved Posts</h3><p style="margin-top: 6px;">Tap the bookmark button on any post to save it here.</p></div>`;
          return;
        }

        let html = `<div class="activity-grid-posts">`;
        posts.forEach(p => {
          html += `
            <div class="activity-post-card">
              <div class="activity-post-thumb-wrap" onclick="App.openPostDetailModal(${p.id})">
                <img src="${Api.getMediaUrl(p.image_url)}" class="activity-post-thumb" alt="Saved post" />
                <span class="activity-post-type-tag">🔖 Saved</span>
              </div>
              <div class="activity-post-card-info">
                <div class="activity-author-row">
                  <img src="${Api.getMediaUrl(p.author_avatar_url)}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover;" />
                  <span>@${p.author_username}</span>
                </div>
                <p class="activity-caption-preview">${Feed.escapeHTML(p.caption || 'No caption')}</p>
                <div class="activity-card-action-bar">
                  <span style="font-size: 11px; color: var(--text-muted);">Bookmark</span>
                  <button class="activity-action-btn-sm unlike" onclick="Profile.unsaveFromActivity(${p.id})">Remove</button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
        body.innerHTML = html;

      } else if (tab === 'comments') {
        const data = await Api.getActivityComments();
        const comments = data.comments || [];
        const countCommentsEl = document.getElementById('act-count-comments');
        if (countCommentsEl) countCommentsEl.textContent = comments.length;

        if (comments.length === 0) {
          body.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--text-muted);"><h3>No Comments Yet</h3><p style="margin-top: 6px;">Comments you post will be listed here.</p></div>`;
          return;
        }

        let html = `<div style="display: flex; flex-direction: column; gap: 8px;">`;
        comments.forEach(c => {
          html += `
            <div class="activity-comment-item">
              <div class="activity-comment-left">
                ${c.post_image_url ? `<img src="${Api.getMediaUrl(c.post_image_url)}" class="activity-comment-post-thumb" onclick="App.openPostDetailModal(${c.post_id})" style="cursor: pointer;" />` : ''}
                <div>
                  <div class="activity-comment-text">"${Feed.escapeHTML(c.comment_text)}"</div>
                  <div class="activity-comment-meta">Posted on ${Feed.formatTimeAgo(c.created_at)} • ${Feed.escapeHTML(c.post_caption ? c.post_caption.slice(0, 45) + '...' : 'Post #' + c.post_id)}</div>
                </div>
              </div>
              <button class="activity-action-btn-sm unlike" onclick="Profile.deleteCommentFromActivity(${c.post_id}, ${c.id})">Delete</button>
            </div>
          `;
        });
        html += `</div>`;
        body.innerHTML = html;

      } else if (tab === 'deleted') {
        const data = await Api.getActivityDeleted();
        const deleted = data.deleted_posts || [];
        const countDeletedEl = document.getElementById('act-count-deleted');
        if (countDeletedEl) countDeletedEl.textContent = deleted.length;

        if (deleted.length === 0) {
          body.innerHTML = `<div style="text-align: center; padding: 50px 20px; color: var(--text-muted);"><h3>Recently Deleted is Empty</h3><p style="margin-top: 6px;">Items you delete will be safely kept here for 30 days before permanent deletion.</p></div>`;
          return;
        }

        let html = `
          <div style="margin-bottom: 14px; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: var(--radius-sm); font-size: 12px; color: var(--text-secondary);">
            💡 <strong>Recently Deleted items</strong> can be restored to your profile at any time, or deleted permanently.
          </div>
          <div class="activity-grid-posts">
        `;
        deleted.forEach(p => {
          html += `
            <div class="activity-post-card">
              <div class="activity-post-thumb-wrap">
                <img src="${Api.getMediaUrl(p.image_url)}" class="activity-post-thumb" alt="Deleted post" />
                <span class="activity-post-type-tag" style="background: rgba(239, 68, 68, 0.8);">🗑️ Deleted</span>
              </div>
              <div class="activity-post-card-info">
                <p class="activity-caption-preview">${Feed.escapeHTML(p.caption || 'Deleted post')}</p>
                <div style="font-size: 10.5px; color: #fca5a5; font-weight: 600;">29 days left to restore</div>
                <div class="activity-card-action-bar">
                  <button class="activity-action-btn-sm restore" onclick="Profile.restorePostFromActivity(${p.id})">🔄 Restore</button>
                  <button class="activity-action-btn-sm delete-perm" onclick="Profile.permanentlyDeleteFromActivity(${p.id})">Delete Forever</button>
                </div>
              </div>
            </div>
          `;
        });
        html += `</div>`;
        body.innerHTML = html;

      } else if (tab === 'time') {
        body.innerHTML = `
          <div class="time-spent-container">
            <div class="time-hero-metric">
              <div class="time-metric-number">42 <span style="font-size: 20px; font-weight: 600;">mins</span></div>
              <div class="time-metric-subtitle">Daily average time spent on SocialPulse in the last 7 days</div>
            </div>

            <div style="font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 8px;">Activity this week</div>
            <div class="weekly-bars-chart">
              <div class="chart-day-col"><div class="chart-bar" style="height: 55%;"></div><span class="chart-day-label">M</span></div>
              <div class="chart-day-col"><div class="chart-bar" style="height: 70%;"></div><span class="chart-day-label">T</span></div>
              <div class="chart-day-col"><div class="chart-bar" style="height: 40%;"></div><span class="chart-day-label">W</span></div>
              <div class="chart-day-col"><div class="chart-bar" style="height: 80%;"></div><span class="chart-day-label">T</span></div>
              <div class="chart-day-col"><div class="chart-bar" style="height: 60%;"></div><span class="chart-day-label">F</span></div>
              <div class="chart-day-col"><div class="chart-bar" style="height: 95%;"></div><span class="chart-day-label">S</span></div>
              <div class="chart-day-col"><div class="chart-bar today" style="height: 68%;"></div><span class="chart-day-label" style="color: #fff; font-weight: 800;">S</span></div>
            </div>

            <div class="settings-section">
              <div class="settings-section-header">Manage your time</div>
              <div class="settings-row" style="background: var(--bg-elevated); margin-bottom: 8px;">
                <div class="settings-row-left">
                  <span class="settings-icon">⏰</span>
                  <div>
                    <span class="settings-label">Set daily time limit</span>
                    <div style="font-size: 11px; color: var(--text-muted);">Get a reminder to take a break when you hit 45m</div>
                  </div>
                </div>
                <div class="settings-row-right">
                  <label class="toggle-switch">
                    <input type="checkbox" checked onchange="App.showToast(this.checked ? 'Daily limit set to 45m ⏱️' : 'Daily reminder turned off')" />
                    <span class="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        `;
      }
    } catch (e) {
      body.innerHTML = `<div style="text-align: center; padding: 40px; color: var(--text-muted);">Failed to load ${tab} data.</div>`;
    }
  },

  async unlikeFromActivity(postId, type) {
    try {
      if (type === 'reel') {
        await Api.toggleLikeReel(postId);
      } else {
        await Api.toggleLike(postId);
      }
      App.showToast('Removed from liked');
      this.loadActivityData('likes');
    } catch (e) {
      App.showToast('Action failed');
    }
  },

  async unsaveFromActivity(postId) {
    try {
      await Api.toggleSavePost(postId);
      App.showToast('Post removed from saved');
      this.loadActivityData('saved');
    } catch (e) {
      App.showToast('Action failed');
    }
  },

  async deleteCommentFromActivity(postId, commentId) {
    try {
      const store = (typeof MockDB !== 'undefined') ? MockDB.getStore() : null;
      if (store) {
        store.comments = (store.comments || []).filter(c => c.id !== commentId);
        MockDB.saveStore(store);
      }
      App.showToast('Comment deleted');
      this.loadActivityData('comments');
    } catch (e) {
      App.showToast('Failed to delete comment');
    }
  },

  async restorePostFromActivity(postId) {
    try {
      await Api.restoreDeletedPost(postId);
      App.showToast('Post restored to your profile! 🎉');
      this.loadActivityData('deleted');
      const currentUser = Api.getCurrentUser();
      if (currentUser) {
        this.loadProfile(currentUser.username);
      }
    } catch (e) {
      App.showToast(e.message || 'Failed to restore post');
    }
  },

  async permanentlyDeleteFromActivity(postId) {
    if (!confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) {
      return;
    }
    try {
      await Api.permanentlyDeletePost(postId);
      App.showToast('Deleted permanently');
      this.loadActivityData('deleted');
    } catch (e) {
      App.showToast('Delete failed');
    }
  },

  async toggleAccountPrivacy(isPrivate) {
    try {
      await Api.updateUserSettings({ is_private: isPrivate });
      const label = document.getElementById('setting-privacy-label');
      if (label) label.textContent = isPrivate ? 'Private' : 'Public';
      App.showToast(isPrivate ? 'Account is now Private 🔒' : 'Account is now Public 🌐');
    } catch (e) {
      App.showToast('Failed to update privacy');
    }
  },

  async toggleHideLikes(hideLikes) {
    try {
      await Api.updateUserSettings({ hide_likes: hideLikes });
      App.showToast(hideLikes ? 'Like counts hidden on posts' : 'Like counts visible');
    } catch (e) {}
  },

  openAccountCenter() {
    alert('SocialPulse Accounts Center\nManage connected accounts, password & security, personal information, and creator monetization settings.');
  },

  openCloseFriendsModal() {
    alert('⭐ Close Friends\nYour Close Friends list has 2 members: @sophia_lens, @nature_explorer. You can share exclusive stories only visible to close friends.');
  },

  openBlockedModal() {
    alert('🚫 Blocked Accounts\nYou have 0 blocked accounts.');
  },

  openNotificationSettings() {
    alert('🔔 Notification Preferences\nPush notifications: Active\nPause all: Off\nEmail alerts: Active for security logins.');
  },

  openHelpModal() {
    alert('🛟 SocialPulse Help Center\n- Browse guides for sharing photos & reels\n- Report technical issues or copyright problems\n- Community Guidelines & safety tips.');
  },

  openAboutModal() {
    alert('ℹ️ About SocialPulse\nVersion: 2.4.0 (2026 Edition)\nBuilt with high performance Express.js, SQLite, Vanilla HTML/CSS/JS with standalone preview support.');
  },

  // ==========================================
  // SOCIALPULSE AI ASSISTANT (Inspired by Meta AI)
  // ==========================================
  openAiAssistant(initialPrompt) {
    this.closeSettingsAndActivity();
    const modal = document.getElementById('ai-assistant-modal');
    if (modal) modal.classList.add('open');
    if (initialPrompt) {
      setTimeout(() => {
        this.sendAiQuickPrompt(initialPrompt);
      }, 200);
    }
  },

  sendAiQuickPrompt(promptText) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
      input.value = promptText;
      const form = document.getElementById('ai-chat-form');
      if (form) form.dispatchEvent(new Event('submit'));
    }
  },

  handleAiChatSubmit(e) {
    e.preventDefault();
    const input = document.getElementById('ai-chat-input');
    const msgBox = document.getElementById('ai-chat-messages');
    if (!input || !msgBox) return;
    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    // Append user message
    const userMsgEl = document.createElement('div');
    userMsgEl.className = 'ai-msg user';
    userMsgEl.innerHTML = `<div class="ai-msg-bubble">${Feed.escapeHTML(text)}</div>`;
    msgBox.appendChild(userMsgEl);
    msgBox.scrollTop = msgBox.scrollHeight;

    // Simulate smart AI response
    setTimeout(() => {
      const botMsgEl = document.createElement('div');
      botMsgEl.className = 'ai-msg bot';

      let reply = '';
      const lower = text.toLowerCase();
      if (lower.includes('caption') || lower.includes('sunset')) {
        reply = `✨ Here are 3 captivating captions for your photo:\n1. "Chasing dusk until the horizon turns to gold 🌅✨"\n2. "Proof that endings can be beautiful too. Goodnight sun 🌊"\n3. "Golden hour reflections & endless ocean dreams 📸"`;
      } else if (lower.includes('private')) {
        reply = `🔒 To make your account private:\n1. Open the **☰ Menu** on your profile\n2. Under "Who can see your content", toggle **Account Privacy** to Private\nWhen private, only approved followers can see your posts and stories!`;
      } else if (lower.includes('reel') || lower.includes('viral') || lower.includes('views')) {
        reply = `🎬 Tips to boost your reels:\n- Hook viewers in the first 2 seconds with motion or sound\n- Use trending background audio tracks\n- Keep vertical 9:16 aspect ratio with high contrast lighting\n- Post consistently during peak hours (6 PM - 9 PM)!`;
      } else if (lower.includes('delete') || lower.includes('restore')) {
        reply = `🗑️ How Recently Deleted works:\nWhenever you delete a post, it is safely stored in **Your activity > Recently Deleted** for 30 days.\nYou can tap **Restore** anytime to bring it right back to your feed!`;
      } else {
        reply = `💡 Great question! I'm here to help you get the most out of SocialPulse. Try exploring **Your activity** in your profile menu to review your likes, comments, and deleted moments!`;
      }

      botMsgEl.innerHTML = `<div class="ai-msg-bubble" style="white-space: pre-line;">${reply}</div>`;
      msgBox.appendChild(botMsgEl);
      msgBox.scrollTop = msgBox.scrollHeight;
    }, 450);
  }
};
