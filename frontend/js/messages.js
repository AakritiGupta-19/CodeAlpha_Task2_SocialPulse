// Direct Messaging Controller

const Messages = {
  activeUserId: null,
  activeTargetUser: null,
  pollTimer: null,

  init() {
    this.conversationsList = document.getElementById('chat-conversations-list');
    this.chatWindow = document.getElementById('chat-active-window');
    this.bindEvents();
  },

  bindEvents() {
    const form = document.getElementById('chat-input-form');
    if (form) {
      form.onsubmit = (e) => {
        e.preventDefault();
        this.sendCurrentMessage();
      };
    }
  },

  async loadConversations() {
    if (!Api.getCurrentUser()) {
      Auth.openModal('login');
      return;
    }

    try {
      const data = await Api.getConversations();
      this.renderConversations(data.conversations || []);

      // If no active chat selected and conversations exist, open the first one
      if (!this.activeUserId && data.conversations && data.conversations.length > 0) {
        this.openChatWithUser(data.conversations[0].partner.id);
      }
    } catch (e) {
      console.error('Failed to load conversations', e);
    }
  },

  renderConversations(convs) {
    if (!this.conversationsList) return;

    if (convs.length === 0) {
      this.conversationsList.innerHTML = `
        <div style="padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
          <p>No conversations yet</p>
          <p style="margin-top: 4px; font-size: 12px;">Start a chat by visiting a creator's profile!</p>
        </div>
      `;
      return;
    }

    this.conversationsList.innerHTML = convs.map(c => `
      <div 
        class="chat-thread-item ${this.activeUserId === c.partner.id ? 'active' : ''}" 
        onclick="Messages.openChatWithUser(${c.partner.id})"
      >
        <img src="${c.partner.avatar_url}" class="chat-thread-avatar" alt="${c.partner.username}" />
        <div class="chat-thread-meta">
          <div class="chat-thread-header">
            <span class="chat-thread-username">${c.partner.username}</span>
            <span class="chat-thread-time">${c.lastMessage ? Feed.formatTimeAgo(c.lastMessage.created_at) : ''}</span>
          </div>
          <p class="chat-thread-snippet">${c.lastMessage ? Feed.escapeHTML(c.lastMessage.message_text) : 'Start chat'}</p>
        </div>
        ${c.unread_count > 0 ? `<span class="chat-unread-badge">${c.unread_count}</span>` : ''}
      </div>
    `).join('');
  },

  async openChatWithUser(userId) {
    this.activeUserId = userId;
    this.startPolling();

    // Update conversation item active state
    document.querySelectorAll('.chat-thread-item').forEach(el => el.classList.remove('active'));

    try {
      const data = await Api.getMessages(userId);
      this.activeTargetUser = data.targetUser;
      this.renderChatWindow(data.targetUser, data.messages || []);
    } catch (err) {
      console.error('Failed to open chat', err);
    }
  },

  renderChatWindow(targetUser, messages) {
    const headerEl = document.getElementById('chat-window-header');
    const streamEl = document.getElementById('chat-messages-stream');

    if (headerEl) {
      headerEl.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px; cursor: pointer;" onclick="App.navigateToProfile('${targetUser.username}')">
          <img src="${targetUser.avatar_url}" style="width: 38px; height: 38px; border-radius: 50%; object-fit: cover;" />
          <div>
            <div style="font-weight: 700; font-size: 14px;">${targetUser.username}</div>
            <div style="font-size: 11px; color: #00d26a;">● Active now</div>
          </div>
        </div>
      `;
    }

    if (streamEl) {
      const currentUserId = Api.getCurrentUser().id;

      streamEl.innerHTML = messages.map(m => {
        const isMine = m.sender_id === currentUserId;
        return `
          <div class="chat-bubble-row ${isMine ? 'mine' : 'theirs'}">
            <div class="chat-bubble">
              ${Feed.escapeHTML(m.message_text)}
              <span class="chat-bubble-time">${new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        `;
      }).join('');

      // Auto scroll to bottom
      streamEl.scrollTop = streamEl.scrollHeight;
    }
  },

  async sendCurrentMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input || !this.activeUserId) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = '';

    try {
      await Api.sendMessage(this.activeUserId, text);
      const data = await Api.getMessages(this.activeUserId);
      this.renderChatWindow(this.activeTargetUser, data.messages || []);
      this.loadConversations();
    } catch (err) {
      App.showToast(err.message || 'Message could not be sent');
    }
  },

  startPolling() {
    this.stopPolling();
    this.pollTimer = setInterval(async () => {
      if (App.currentView === 'messages' && this.activeUserId) {
        try {
          const data = await Api.getMessages(this.activeUserId);
          this.renderChatWindow(this.activeTargetUser, data.messages || []);
        } catch (e) {}
      }
    }, 4000);
  },

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
};
