// Authentication and Session Handling

const Auth = {
  init() {
    this.modal = document.getElementById('auth-modal');
    this.loginForm = document.getElementById('login-form');
    this.registerForm = document.getElementById('register-form');
    this.authTabs = document.querySelectorAll('.auth-tab');
    this.demoList = document.getElementById('demo-users-list');

    this.bindEvents();
    this.checkSession();
    this.loadDemoUsers();
  },

  bindEvents() {
    // Tab switching (Login vs Register)
    this.authTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.authTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const mode = tab.dataset.mode;
        if (mode === 'login') {
          this.loginForm.style.display = 'flex';
          this.registerForm.style.display = 'none';
        } else {
          this.loginForm.style.display = 'none';
          this.registerForm.style.display = 'flex';
        }
      });
    });

    // Login submit
    if (this.loginForm) {
      this.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('login-identifier').value.trim();
        const password = document.getElementById('login-password').value;
        const errBox = document.getElementById('login-error');
        errBox.textContent = '';

        try {
          await Api.login(identifier, password);
          this.closeModal();
          this.updateUserUI();
          App.showToast('Welcome back! ✨');
          App.refreshCurrentView();
        } catch (err) {
          errBox.textContent = err.message || 'Login failed';
        }
      });
    }

    // Register submit
    if (this.registerForm) {
      this.registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const fullName = document.getElementById('reg-fullname').value.trim();
        const password = document.getElementById('reg-password').value;
        const errBox = document.getElementById('reg-error');
        errBox.textContent = '';

        try {
          await Api.register(username, email, password, fullName);
          this.closeModal();
          this.updateUserUI();
          App.showToast('Account created successfully! 🎉');
          App.refreshCurrentView();
        } catch (err) {
          errBox.textContent = err.message || 'Registration failed';
        }
      });
    }

    // Modal close button
    const closeBtn = document.getElementById('close-auth-modal');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    // Logout button
    const logoutBtn = document.getElementById('sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  },

  async loadDemoUsers() {
    if (!this.demoList) return;
    try {
      const data = await Api.getDemoUsers();
      if (!data.users || data.users.length === 0) return;

      this.demoList.innerHTML = data.users.map(u => `
        <button type="button" class="demo-user-pill" data-username="${u.username}">
          <img src="${u.avatar_url}" alt="${u.username}" />
          <span>@${u.username}</span>
        </button>
      `).join('');

      this.demoList.querySelectorAll('.demo-user-pill').forEach(pill => {
        pill.addEventListener('click', async () => {
          const username = pill.dataset.username;
          try {
            await Api.login(username, 'password123');
            this.closeModal();
            this.updateUserUI();
            App.showToast(`Logged in as @${username} 🚀`);
            App.refreshCurrentView();
          } catch (err) {
            App.showToast(err.message || 'Demo login failed');
          }
        });
      });
    } catch (e) {
      console.error('Failed to load demo accounts', e);
    }
  },

  async checkSession() {
    const user = Api.getCurrentUser();
    if (user && Api.getToken()) {
      try {
        await Api.getMe();
      } catch (e) {
        console.warn('Session check fallback:', e);
      }
    }
    this.updateUserUI();
  },

  updateUserUI() {
    const user = Api.getCurrentUser();
    const userAvatarEls = document.querySelectorAll('.current-user-avatar');
    const userNameEls = document.querySelectorAll('.current-user-name');
    const userFullnameEls = document.querySelectorAll('.current-user-fullname');
    const authTriggerBtn = document.getElementById('sidebar-auth-btn');
    const userCard = document.getElementById('sidebar-user-card');

    if (user) {
      userAvatarEls.forEach(el => el.src = Api.getMediaUrl(user.avatar_url));
      userNameEls.forEach(el => el.textContent = `@${user.username}`);
      userFullnameEls.forEach(el => el.textContent = user.full_name || '');
      if (authTriggerBtn) authTriggerBtn.style.display = 'none';
      if (userCard) userCard.style.display = 'flex';
    } else {
      userAvatarEls.forEach(el => el.src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80');
      userNameEls.forEach(el => el.textContent = 'Guest');
      userFullnameEls.forEach(el => el.textContent = 'Sign in');
      if (authTriggerBtn) authTriggerBtn.style.display = 'flex';
      if (userCard) userCard.style.display = 'none';
    }
  },

  openModal(mode = 'login') {
    if (!this.modal) return;
    this.modal.classList.add('open');
    const targetTab = Array.from(this.authTabs).find(t => t.dataset.mode === mode);
    if (targetTab) targetTab.click();
  },

  closeModal() {
    if (this.modal) this.modal.classList.remove('open');
  },

  logout() {
    Api.clearSession();
    this.updateUserUI();
    App.showToast('Logged out successfully');
    App.navigate('feed');
  }
};
