// Feed & Stories Controller

const Feed = {
  posts: [],
  currentTab: 'for_you',
  stories: [],

  init() {
    this.storiesContainer = document.getElementById('stories-bar');
    this.feedStream = document.getElementById('feed-stream');
    this.suggestionsList = document.getElementById('suggestions-list');

    this.bindFeedTabs();
    this.loadStories();
    this.loadFeed(this.currentTab);
    this.loadSuggestions();
  },

  bindFeedTabs() {
    const tabs = document.querySelectorAll('.feed-tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentTab = tab.dataset.tab;
        this.loadFeed(this.currentTab);
      });
    });
  },

  async loadStories() {
    try {
      const data = await Api.getStories();
      this.stories = data.stories || [];
    } catch (e) {
      console.warn('Could not load dynamic stories', e);
    }
    this.renderStories();
  },

  renderStories() {
    if (!this.storiesContainer) return;
    const currentUser = Api.getCurrentUser();
    const userAvatar = currentUser && currentUser.avatar_url 
      ? Api.getMediaUrl(currentUser.avatar_url) 
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    // 1. "Your Story" item with plus badge
    let html = `
      <div class="story-item your-story" id="your-story-btn" title="Create your story">
        <div class="story-ring">
          <img src="${userAvatar}" alt="Your Story" class="story-avatar current-user-avatar" />
          <div class="your-story-plus-badge" title="Add to story">
            ${Icons.plus()}
          </div>
        </div>
        <span class="story-username">Your story</span>
      </div>
    `;

    // 2. Dynamic stories loaded from API
    html += this.stories.map((s, idx) => {
      const avatar = Api.getMediaUrl(s.avatar_url || s.avatar);
      const username = s.username;
      const displayName = s.full_name ? s.full_name.split(' ')[0] : (s.name || username);
      return `
        <div class="story-item" data-idx="${idx}">
          <div class="story-ring">
            <img src="${avatar}" alt="${username}" class="story-avatar" />
          </div>
          <span class="story-username">${displayName}</span>
        </div>
      `;
    }).join('');

    this.storiesContainer.innerHTML = html;

    // Bind "Your Story" click
    const yourStoryBtn = document.getElementById('your-story-btn');
    if (yourStoryBtn) {
      yourStoryBtn.onclick = () => {
        StoryCreator.open();
      };
    }

    // Bind other story items click
    this.storiesContainer.querySelectorAll('.story-item:not(.your-story)').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.idx, 10);
        if (this.stories[idx]) {
          this.openStoryModal(this.stories[idx]);
        }
      });
    });
  },

  openStoryModal(story) {
    const modal = document.getElementById('story-preview-modal');
    if (!modal) return;

    const usernameEl = document.getElementById('story-preview-user');
    const avatarEl = document.getElementById('story-preview-avatar');
    const imgEl = document.getElementById('story-preview-img');
    const textEl = document.getElementById('story-preview-text');
    const stickerEl = document.getElementById('story-preview-sticker');
    const musicEl = document.getElementById('story-preview-music');

    if (usernameEl) usernameEl.textContent = `@${story.username}`;
    if (avatarEl) avatarEl.src = Api.getMediaUrl(story.avatar_url || story.avatar);
    
    const mediaUrl = Api.getMediaUrl(story.media_url || story.media);
    if (imgEl) {
      imgEl.src = mediaUrl;
      imgEl.className = `story-preview-img filter-${story.filter_style || 'normal'}`;
    }

    if (textEl) {
      if (story.text_overlay) {
        textEl.textContent = story.text_overlay;
        textEl.style.display = 'block';
        textEl.style.color = story.text_color || '#ffffff';
        textEl.style.fontSize = `${story.font_size || 24}px`;
        textEl.className = `story-preview-text font-${story.font_style || 'modern'}`;
      } else {
        textEl.style.display = 'none';
      }
    }

    if (stickerEl) {
      if (story.sticker_type) {
        stickerEl.textContent = story.sticker_type;
        stickerEl.style.display = 'block';
      } else {
        stickerEl.style.display = 'none';
      }
    }

    if (musicEl) {
      if (story.music_title) {
        musicEl.innerHTML = `🎵 ${story.music_title}`;
        musicEl.style.display = 'block';
      } else {
        musicEl.style.display = 'none';
      }
    }

    modal.classList.add('open');

    const closeBtn = document.getElementById('close-story-modal');
    if (closeBtn) {
      closeBtn.onclick = () => modal.classList.remove('open');
    }
  },

  async loadFeed(tab = 'for_you') {
    if (!this.feedStream) return;
    this.feedStream.innerHTML = `
      <div style="text-align: center; padding: 40px 0; color: var(--text-muted);">
        <p>Curating your ${tab === 'following' ? 'following' : 'personalized'} feed...</p>
      </div>
    `;

    try {
      const data = await Api.getFeed(tab);
      this.posts = data.posts || [];
      this.renderFeed();
    } catch (err) {
      console.warn('Feed loading fallback:', err);
      this.posts = [];
      this.renderFeed();
    }
  },

  renderFeed() {
    if (!this.feedStream) return;

    const currentUser = Api.getCurrentUser();
    const needsProfileSetup = currentUser && (!currentUser.full_name || currentUser.full_name.toLowerCase() === 'user' || !currentUser.avatar_url || currentUser.avatar_url.includes('default-avatar'));

    let setupBannerHtml = '';
    if (needsProfileSetup) {
      setupBannerHtml = `
        <div class="feed-profile-setup-card" id="feed-profile-setup-card">
          <div class="setup-card-left">
            <div class="setup-card-avatar-wrap">
              <img src="${Api.getMediaUrl(currentUser.avatar_url)}" class="setup-card-avatar" alt="Avatar placeholder" />
              <span class="setup-card-plus">+</span>
            </div>
            <div class="setup-card-info">
              <div class="setup-card-title">Complete your profile</div>
              <div class="setup-card-sub">Add your name and profile picture so others can recognize you!</div>
            </div>
          </div>
          <button class="setup-card-btn" onclick="Profile.openEditModal()">Edit Profile</button>
        </div>
      `;
    }

    if (this.posts.length === 0) {
      this.feedStream.innerHTML = setupBannerHtml + `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <h3>No posts found</h3>
          <p style="margin-top: 6px;">${this.currentTab === 'following' ? 'Follow more creators to see their moments here!' : 'Be the first to share a moment!'}</p>
          <button class="btn-primary" style="margin-top: 16px;" onclick="App.openCreateModal()">Create Post</button>
        </div>
      `;
      return;
    }

    this.feedStream.innerHTML = setupBannerHtml + this.posts.map(post => this.createPostCardHTML(post)).join('');
    this.bindPostEvents();
  },

  createPostCardHTML(post) {
    const timeAgo = this.formatTimeAgo(post.created_at);
    const formattedCaption = this.formatCaption(post.caption);
    const likedClass = post.has_liked ? 'liked' : '';
    const savedClass = post.has_saved ? 'saved' : '';
    const imageUrl = Api.getMediaUrl(post.image_url);
    const authorAvatar = Api.getMediaUrl(post.author_avatar_url);
    const filterClass = post.filter_style ? `filter-${post.filter_style}` : '';

    return `
      <article class="post-card" data-post-id="${post.id}">
        <!-- Post Header -->
        <header class="post-header">
          <div class="post-author-link" onclick="App.navigateToProfile('${post.author_username}')">
            <div class="post-author-avatar-ring">
              <img src="${authorAvatar}" alt="${post.author_username}" class="post-author-avatar" />
            </div>
            <div class="post-author-meta">
              <div class="post-author-name-row">
                <span class="post-username">${post.author_username}</span>
                <span class="post-dot">•</span>
                <span class="post-time">${timeAgo}</span>
              </div>
              <span class="post-author-sub">${post.author_full_name}</span>
              ${post.location ? `<span class="post-location-tag">${Icons.location()} ${this.escapeHTML(post.location)}</span>` : ''}
              ${post.music_title ? `<span class="post-music-tag">${Icons.music()} ${this.escapeHTML(post.music_title)}</span>` : ''}
            </div>
          </div>
          <button class="post-more-btn" title="More options" onclick="App.showPostMenu(${post.id}, '${post.author_username}')">•••</button>
        </header>

        <!-- Media Container with Double-tap Listener -->
        <div class="post-media-container" data-post-id="${post.id}">
          <img src="${imageUrl}" alt="Post image" class="post-image ${filterClass}" loading="lazy" />
          <div class="heart-burst">❤️</div>
        </div>

        <!-- Actions Bar with SVG Icons -->
        <div class="post-actions">
          <div class="post-actions-left">
            <button class="action-btn like-btn ${likedClass}" data-post-id="${post.id}" title="Like">
              <span class="like-icon">${Icons.heart(post.has_liked)}</span>
            </button>
            <button class="action-btn comment-btn" data-post-id="${post.id}" title="Comment" onclick="Feed.focusCommentInput(${post.id})">
              ${Icons.comment()}
            </button>
            <button class="action-btn share-btn" title="Share" onclick="Feed.sharePost(${post.id})">
              ${Icons.share()}
            </button>
          </div>
          <button class="action-btn save-btn ${savedClass}" title="Save" onclick="Feed.toggleSave(this, ${post.id})">
            <span class="save-icon">${Icons.bookmark(post.has_saved)}</span>
          </button>
        </div>

        <!-- Metrics & Details -->
        <div class="post-details">
          <div class="post-likes-count" id="likes-count-${post.id}">
            ${post.likes_count.toLocaleString()} ${post.likes_count === 1 ? 'like' : 'likes'}
          </div>

          ${post.caption ? `
            <div class="post-caption-box">
              <span class="post-caption-username" onclick="App.navigateToProfile('${post.author_username}')">${post.author_username}</span>
              <span class="post-caption-text">${formattedCaption}</span>
            </div>
          ` : ''}

          ${post.comments_count > 0 ? `
            <div class="view-comments-btn" onclick="App.openPostDetailModal(${post.id})">
              View all ${post.comments_count} ${post.comments_count === 1 ? 'comment' : 'comments'}
            </div>
          ` : ''}

          <!-- Recent comments preview -->
          <div class="post-recent-comments" id="comments-preview-${post.id}">
            ${(post.recent_comments || []).map(c => `
              <div class="comment-row">
                <span class="comment-user" onclick="App.navigateToProfile('${c.username}')">${c.username}</span>
                <span class="comment-text">${this.escapeHTML(c.comment_text)}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Inline Comment Input -->
        <form class="post-add-comment-box" data-post-id="${post.id}" onsubmit="Feed.submitComment(event, ${post.id})">
          <input 
            type="text" 
            class="comment-input" 
            placeholder="Add a comment..." 
            autocomplete="off"
            oninput="Feed.handleCommentInput(this, ${post.id})"
          />
          <button type="submit" class="comment-post-btn" id="post-comment-btn-${post.id}">Post</button>
        </form>
      </article>
    `;
  },

  bindPostEvents() {
    // Double tap on image
    document.querySelectorAll('.post-media-container').forEach(container => {
      let lastTap = 0;
      const postId = parseInt(container.dataset.postId, 10);
      const burstHeart = container.querySelector('.heart-burst');

      container.addEventListener('click', () => {
        const now = Date.now();
        if (now - lastTap < 350) {
          burstHeart.classList.remove('animate');
          void burstHeart.offsetWidth;
          burstHeart.classList.add('animate');
          this.handleLikeAction(postId, true);
        }
        lastTap = now;
      });

      // Record impression view
      Api.recordPostView(postId);
    });

    // Single click like button
    document.querySelectorAll('.like-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const postId = parseInt(btn.dataset.postId, 10);
        this.handleLikeAction(postId);
      });
    });
  },

  async handleLikeAction(postId, forceLikeOnly = false) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    const post = this.posts.find(p => p.id === postId);
    if (!post) return;

    if (forceLikeOnly && post.has_liked) return;

    const willBeLiked = forceLikeOnly ? true : !post.has_liked;
    const diff = willBeLiked ? 1 : -1;

    post.has_liked = willBeLiked;
    post.likes_count = Math.max(0, post.likes_count + diff);

    this.updatePostLikeUI(postId, post.has_liked, post.likes_count);

    try {
      const res = await Api.toggleLike(postId);
      post.has_liked = res.liked;
      post.likes_count = res.likes_count;
      this.updatePostLikeUI(postId, res.liked, res.likes_count);
    } catch (err) {
      post.has_liked = !willBeLiked;
      post.likes_count = Math.max(0, post.likes_count - diff);
      this.updatePostLikeUI(postId, post.has_liked, post.likes_count);
      App.showToast(err.message || 'Like failed');
    }
  },

  updatePostLikeUI(postId, isLiked, count) {
    const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (!card) return;

    const likeBtn = card.querySelector('.like-btn');
    const likeIcon = card.querySelector('.like-icon');
    const countEl = document.getElementById(`likes-count-${postId}`);

    if (isLiked) {
      likeBtn.classList.add('liked');
      if (likeIcon) likeIcon.innerHTML = Icons.heart(true);
    } else {
      likeBtn.classList.remove('liked');
      if (likeIcon) likeIcon.innerHTML = Icons.heart(false);
    }

    if (countEl) {
      countEl.textContent = `${count.toLocaleString()} ${count === 1 ? 'like' : 'likes'}`;
    }
  },

  async toggleSave(btn, postId) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    try {
      const res = await Api.toggleSavePost(postId);
      const icon = btn.querySelector('.save-icon');
      if (res.saved) {
        btn.classList.add('saved');
        if (icon) icon.innerHTML = Icons.bookmark(true);
        App.showToast('Saved to your collection');
      } else {
        btn.classList.remove('saved');
        if (icon) icon.innerHTML = Icons.bookmark(false);
        App.showToast('Removed from saved collection');
      }
    } catch (err) {
      App.showToast('Could not save post');
    }
  },

  handleCommentInput(input, postId) {
    const btn = document.getElementById(`post-comment-btn-${postId}`);
    if (!btn) return;
    if (input.value.trim().length > 0) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  },

  focusCommentInput(postId) {
    const card = document.querySelector(`.post-card[data-post-id="${postId}"]`);
    if (card) {
      const input = card.querySelector('.comment-input');
      if (input) input.focus();
    }
  },

  async submitComment(event, postId) {
    event.preventDefault();

    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    const form = event.target;
    const input = form.querySelector('.comment-input');
    const commentText = input.value.trim();
    if (!commentText) return;

    input.value = '';
    const btn = document.getElementById(`post-comment-btn-${postId}`);
    if (btn) btn.classList.remove('active');

    try {
      const res = await Api.addComment(postId, commentText);
      App.showToast('Comment posted 💬');

      const previewBox = document.getElementById(`comments-preview-${postId}`);
      if (previewBox) {
        const commentRow = document.createElement('div');
        commentRow.className = 'comment-row';
        commentRow.innerHTML = `
          <span class="comment-user" onclick="App.navigateToProfile('${res.comment.username}')">${res.comment.username}</span>
          <span class="comment-text">${this.escapeHTML(res.comment.comment_text)}</span>
        `;
        previewBox.appendChild(commentRow);
      }

      const post = this.posts.find(p => p.id === postId);
      if (post) {
        post.comments_count = res.comments_count;
      }
    } catch (err) {
      App.showToast(err.message || 'Failed to post comment');
    }
  },

  sharePost(postId) {
    const postUrl = window.location.origin + `/#post/${postId}`;
    navigator.clipboard.writeText(postUrl).then(() => {
      App.showToast('Post link copied! 📋');
    }).catch(() => {
      App.showToast('Post link ready');
    });
  },

  async loadSuggestions() {
    if (!this.suggestionsList) return;
    try {
      const data = await Api.getSuggestions();
      if (!data.suggestions || data.suggestions.length === 0) {
        this.suggestionsList.innerHTML = `<p style="font-size: 12px; color: var(--text-muted);">No suggestions right now</p>`;
        return;
      }

      this.suggestionsList.innerHTML = data.suggestions.map(u => `
        <div class="suggestion-item">
          <div class="suggestion-user" onclick="App.navigateToProfile('${u.username}')">
            <img src="${u.avatar_url}" alt="${u.username}" class="suggestion-avatar" />
            <div class="suggestion-meta">
              <span class="suggestion-username">${u.username}</span>
              <span class="suggestion-subtitle">${u.full_name}</span>
            </div>
          </div>
          <button class="follow-btn" data-user-id="${u.id}" onclick="Feed.toggleFollowSuggestion(this, ${u.id})">Follow</button>
        </div>
      `).join('');
    } catch (e) {
      console.error('Suggestions error', e);
    }
  },

  async toggleFollowSuggestion(btn, userId) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    try {
      const res = await Api.toggleFollow(userId);
      if (res.following) {
        btn.textContent = 'Following';
        btn.classList.add('following');
        App.showToast('Followed creator');
      } else {
        btn.textContent = 'Follow';
        btn.classList.remove('following');
        App.showToast('Unfollowed');
      }
    } catch (err) {
      App.showToast(err.message || 'Follow action failed');
    }
  },

  formatCaption(caption) {
    if (!caption) return '';
    return caption.replace(/(#\w+)/g, '<span class="hashtag">$1</span>');
  },

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  },

  escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
