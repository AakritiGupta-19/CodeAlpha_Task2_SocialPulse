// Reels / Short Videos Controller

const Reels = {
  reels: [],

  init() {
    this.container = document.getElementById('reels-container');
  },

  async loadReels() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="text-align: center; padding: 60px 0; color: var(--text-muted);">
        <p>Loading reels...</p>
      </div>
    `;

    try {
      const data = await Api.getReels();
      this.reels = data.reels || [];
      this.renderReels();
    } catch (err) {
      console.warn('Reels loading fallback:', err);
      this.reels = [];
      this.renderReels();
    }
  },

  renderReels() {
    if (!this.container) return;

    if (this.reels.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <h3>No Reels Available</h3>
          <p>Check back later or upload one!</p>
        </div>
      `;
      return;
    }

    this.container.innerHTML = this.reels.map(r => `
      <div class="reel-card" data-reel-id="${r.id}">
        <video 
          class="reel-video" 
          src="${Api.getMediaUrl(r.video_url)}" 
          loop 
          playsinline 
          onclick="Reels.togglePlay(this)"
        ></video>

        <!-- Video overlay details -->
        <div class="reel-overlay">
          <!-- Author and caption info -->
          <div class="reel-info">
            <div class="reel-author-row" onclick="App.navigateToProfile('${r.author_username}')">
              <img src="${Api.getMediaUrl(r.author_avatar_url)}" class="reel-author-avatar" alt="${r.author_username}" />
              <span class="reel-author-name">${r.author_username}</span>
              ${!r.is_following ? `<button class="reel-follow-btn" onclick="event.stopPropagation(); Reels.followAuthor(this, ${r.author_id})">Follow</button>` : ''}
            </div>
            <p class="reel-caption">${Feed.formatCaption(r.caption)}</p>
            <div class="reel-audio-bar">
              <span>🎵</span>
              <span class="reel-audio-title">${r.audio_title || 'Original Audio'}</span>
            </div>
          </div>

          <!-- Vertical Action Buttons -->
          <div class="reel-actions">
            <button class="reel-action-btn ${r.has_liked ? 'liked' : ''}" onclick="Reels.toggleLike(${r.id}, this)">
              <span class="reel-action-icon">${r.has_liked ? '❤️' : '🤍'}</span>
              <span class="reel-action-count">${r.likes_count}</span>
            </button>
            <button class="reel-action-btn" onclick="Reels.shareReel(${r.id})">
              <span class="reel-action-icon">✈️</span>
              <span class="reel-action-count">Share</span>
            </button>
            <button class="reel-action-btn" onclick="Reels.toggleMute(this)">
              <span class="reel-action-icon">🔊</span>
              <span class="reel-action-count">Audio</span>
            </button>
          </div>
        </div>
      </div>
    `).join('');

    // Setup intersection observer to auto-play active reel
    this.setupIntersectionObserver();
  },

  setupIntersectionObserver() {
    const options = {
      root: null,
      threshold: 0.7
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const video = entry.target.querySelector('video');
        if (!video) return;

        if (entry.isIntersecting) {
          video.play().catch(() => {
            // Autoplay with sound might require user gesture; mute first if needed
            video.muted = true;
            video.play().catch(() => {});
          });
        } else {
          video.pause();
        }
      });
    }, options);

    document.querySelectorAll('.reel-card').forEach(card => observer.observe(card));
  },

  togglePlay(video) {
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  },

  toggleMute(btn) {
    const card = btn.closest('.reel-card');
    const video = card.querySelector('video');
    if (!video) return;

    video.muted = !video.muted;
    const icon = btn.querySelector('.reel-action-icon');
    icon.textContent = video.muted ? '🔇' : '🔊';
  },

  async toggleLike(reelId, btn) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    try {
      const res = await Api.toggleLikeReel(reelId);
      const icon = btn.querySelector('.reel-action-icon');
      const count = btn.querySelector('.reel-action-count');

      if (res.liked) {
        btn.classList.add('liked');
        icon.textContent = '❤️';
      } else {
        btn.classList.remove('liked');
        icon.textContent = '🤍';
      }
      count.textContent = res.likes_count;
    } catch (err) {
      App.showToast(err.message || 'Like failed');
    }
  },

  async followAuthor(btn, authorId) {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    try {
      const res = await Api.toggleFollow(authorId);
      if (res.following) {
        btn.textContent = 'Following';
        btn.classList.add('following');
        App.showToast('Followed creator');
      }
    } catch (e) {
      App.showToast('Action failed');
    }
  },

  shareReel(reelId) {
    const url = window.location.origin + `/#reels`;
    navigator.clipboard.writeText(url).then(() => {
      App.showToast('Reel link copied! 🎬');
    }).catch(() => {
      App.showToast('Reel link ready');
    });
  }
};
