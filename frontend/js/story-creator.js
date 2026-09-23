// Interactive Story Creator & Creative Studio

const StoryCreator = {
  currentFilter: 'normal',
  currentFontStyle: 'modern',
  currentTextColor: '#ffffff',
  currentFontSize: 24,
  currentSticker: '',
  currentMusic: '',
  selectedImageSrc: '',
  selectedFile: null,

  init() {
    this.modal = document.getElementById('story-creator-modal');
    this.bindEvents();
  },

  open() {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }
    this.reset();
    if (this.modal) this.modal.classList.add('open');
  },

  close() {
    if (this.modal) this.modal.classList.remove('open');
  },

  reset() {
    this.currentFilter = 'normal';
    this.currentFontStyle = 'modern';
    this.currentTextColor = '#ffffff';
    this.currentFontSize = 24;
    this.currentSticker = '';
    this.currentMusic = '';
    this.selectedImageSrc = '';
    this.selectedFile = null;

    const fileInput = document.getElementById('story-file-input');
    const urlInput = document.getElementById('story-url-input');
    const textInput = document.getElementById('story-text-overlay-input');
    if (fileInput) fileInput.value = '';
    if (urlInput) urlInput.value = '';
    if (textInput) textInput.value = '';

    this.updatePreview();
  },

  bindEvents() {
    const closeBtn = document.getElementById('close-story-creator-modal');
    if (closeBtn) closeBtn.onclick = () => this.close();

    // Dropzone & File selection
    const dropzone = document.getElementById('story-dropzone');
    const fileInput = document.getElementById('story-file-input');
    const urlInput = document.getElementById('story-url-input');

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
          this.handleFile(e.dataTransfer.files[0]);
        }
      };

      fileInput.onchange = () => {
        if (fileInput.files && fileInput.files[0]) {
          this.handleFile(fileInput.files[0]);
        }
      };
    }

    if (urlInput) {
      urlInput.oninput = () => {
        const val = urlInput.value.trim();
        if (val.startsWith('http')) {
          this.selectedImageSrc = val;
          this.selectedFile = null;
          this.updatePreview();
        }
      };
    }

    // Live Text Overlay Input
    const textInput = document.getElementById('story-text-overlay-input');
    if (textInput) {
      textInput.oninput = () => this.updatePreview();
    }

    // Font Style Buttons
    document.querySelectorAll('.font-style-btn').forEach(btn => {
      btn.onclick = () => {
        document.querySelectorAll('.font-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFontStyle = btn.dataset.font;
        this.updatePreview();
      };
    });

    // Color Swatches
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.onclick = () => {
        document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.currentTextColor = swatch.dataset.color;
        this.updatePreview();
      };
    });

    // Font Size Slider
    const sizeSlider = document.getElementById('story-font-size-slider');
    if (sizeSlider) {
      sizeSlider.oninput = (e) => {
        this.currentFontSize = e.target.value;
        this.updatePreview();
      };
    }

    // Filter Buttons
    document.querySelectorAll('.filter-pill').forEach(pill => {
      pill.onclick = () => {
        document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.currentFilter = pill.dataset.filter;
        this.updatePreview();
      };
    });

    // Sticker Pills
    document.querySelectorAll('.story-sticker-pill').forEach(pill => {
      pill.onclick = () => {
        if (this.currentSticker === pill.dataset.sticker) {
          this.currentSticker = '';
          pill.classList.remove('active');
        } else {
          document.querySelectorAll('.story-sticker-pill').forEach(p => p.classList.remove('active'));
          pill.classList.add('active');
          this.currentSticker = pill.dataset.sticker;
        }
        this.updatePreview();
      };
    });

    // Music Selector
    const musicSelect = document.getElementById('story-music-select');
    if (musicSelect) {
      musicSelect.onchange = () => {
        this.currentMusic = musicSelect.value;
        this.updatePreview();
      };
    }

    // Share Story Button
    const form = document.getElementById('story-creator-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.submitStory();
      };
    }
  },

  handleFile(file) {
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.selectedImageSrc = e.target.result;
      this.updatePreview();
    };
    reader.readAsDataURL(file);
  },

  updatePreview() {
    const previewImg = document.getElementById('story-canvas-img');
    const placeholder = document.getElementById('story-canvas-placeholder');
    const textOverlayEl = document.getElementById('story-canvas-text');
    const stickerBadgeEl = document.getElementById('story-canvas-sticker');
    const musicBadgeEl = document.getElementById('story-canvas-music');
    const textInput = document.getElementById('story-text-overlay-input');

    // Image
    if (this.selectedImageSrc) {
      previewImg.src = this.selectedImageSrc;
      previewImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    } else {
      previewImg.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    }

    // CSS Filter Classes
    previewImg.className = `story-canvas-img filter-${this.currentFilter}`;

    // Text Overlay
    const textVal = textInput ? textInput.value.trim() : '';
    if (textVal) {
      textOverlayEl.textContent = textVal;
      textOverlayEl.style.display = 'block';
      textOverlayEl.style.color = this.currentTextColor;
      textOverlayEl.style.fontSize = `${this.currentFontSize}px`;
      textOverlayEl.className = `story-canvas-text font-${this.currentFontStyle}`;
    } else {
      textOverlayEl.style.display = 'none';
    }

    // Sticker
    if (this.currentSticker) {
      stickerBadgeEl.textContent = this.currentSticker;
      stickerBadgeEl.style.display = 'inline-block';
    } else {
      stickerBadgeEl.style.display = 'none';
    }

    // Music
    if (this.currentMusic) {
      musicBadgeEl.innerHTML = `🎵 ${this.currentMusic}`;
      musicBadgeEl.style.display = 'inline-flex';
    } else {
      musicBadgeEl.style.display = 'none';
    }
  },

  async submitStory() {
    if (!this.selectedFile && !this.selectedImageSrc) {
      App.showToast('Please select a photo for your story');
      return;
    }

    const shareBtn = document.getElementById('share-story-btn');
    if (shareBtn) {
      shareBtn.disabled = true;
      shareBtn.textContent = 'Sharing story...';
    }

    const textInput = document.getElementById('story-text-overlay-input');

    try {
      const formData = new FormData();
      if (this.selectedFile) {
        formData.append('media', this.selectedFile);
      } else {
        formData.append('mediaUrl', this.selectedImageSrc);
      }

      formData.append('text_overlay', textInput ? textInput.value.trim() : '');
      formData.append('font_style', this.currentFontStyle);
      formData.append('text_color', this.currentTextColor);
      formData.append('font_size', this.currentFontSize);
      formData.append('filter_style', this.currentFilter);
      formData.append('music_title', this.currentMusic);
      formData.append('sticker_type', this.currentSticker);

      await Api.createStory(formData);
      this.close();
      App.showToast('Your story has been added! ✨');
      Feed.loadStories();
    } catch (err) {
      App.showToast(err.message || 'Failed to post story');
    } finally {
      if (shareBtn) {
        shareBtn.disabled = false;
        shareBtn.textContent = 'Share to Story';
      }
    }
  }
};
