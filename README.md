# ⚡ SocialPulse • Modern Social Media Platform

[![Live Demo](https://img.shields.io/badge/🚀_Live_Demo-Visit_SocialPulse-0095F6?style=for-the-badge&logo=googlechrome&logoColor=white)](https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/)

[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-Modern_Semantic-E34F26?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)
[![CSS3](https://img.shields.io/badge/CSS3-Design_System-1572B6?logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend_API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)
[![GitHub Pages](https://img.shields.io/badge/GitHub_Pages-Live-222222?logo=github&logoColor=white)](https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/)

> 🌐 **Live Demo Website:** [https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/](https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/)  
> *(Experience the full interactive app in your browser with zero setup required — featuring the 2.5s launch splash screen, Stories Creator Studio, Reels, DMs, and integrated AI Co-Pilot!)*

**SocialPulse** is a feature-rich, high-performance modern social media web platform inspired by Instagram and TikTok. Built with clean, vanilla web technologies and an optional Express.js & SQLite backend, SocialPulse delivers smooth animations, immersive stories and reels, interactive direct messaging, smart notifications, and a built-in **AI Co-Pilot Assistant**.

---

## 🌟 Key Highlights at a Glance

- 📱 **App-Style Launch Splash Screen**: Cinematic 2.5-second brand animation featuring glowing radial auras, pulse beacon ripples, and shimmer typography on site open and refresh.
- 🤖 **Integrated SocialPulse AI Assistant**: Your built-in creative partner for photo captions, viral reel ideas, growth hacks, and platform settings guidance.
- 📸 **Stories Studio**: Interactive story creator with real-time photo filters, dynamic typography overlay, music soundtrack tagging, and sticker reactions.
- 🎬 **Immersive Reels View**: Full-height vertical video feed with like counts, audio tracks, and double-tap interactions.
- 💬 **Direct Messaging (DMs)**: Chat threads with conversation history and instant message exchange.
- 👤 **Customizable Profile & Smart Setup**: Clean default `"user"` account with neutral avatar placeholders and a direct notification link to complete your profile with your custom handle and photo.
- 🚀 **Dual-Mode Architecture**: Runs seamlessly with a live Node.js + Express + SQLite backend, or in standalone mode (ready for **GitHub Pages**) via an offline client-side MockDB.

---

> [!IMPORTANT]
> ### 🤖 Highlighted Feature: Integrated SocialPulse AI Assistant (Co-Pilot)
> SocialPulse comes equipped with a dedicated **AI Assistant** (accessible via the sidebar, quick-action home widget, profile settings, or the floating `Ask AI` action button).
>
> #### What the AI Does:
> 1. **Creative Photo & Post Captions**: Generates tailored, viral captions for travel photos, sunsets, lifestyle, and aesthetic moments complete with emojis and hashtags.
> 2. **Trending Reel Ideas & Video Hooks**: Recommends viral reel concepts, 2-second visual hook strategies, and peak posting times to maximize reach.
> 3. **Platform Settings & Privacy Guidance**: Explains how to toggle account privacy, adjust like visibility, manage data, and navigate the Accounts Center.
> 4. **Recovering Deleted Content**: Guides users step-by-step on how the *Recently Deleted* archive works and how to restore posts back to the live feed.
> 5. **Interactive Chat & Quick Prompts**: Features 1-click prompt chips (`Sunset caption ideas`, `How to go private`, `Reel viral tips`, `How to restore deleted posts`) as well as freeform natural language querying.

---

## 📸 Core Features & Modules

### 1. Modern Launch Splash Screen
- **App-Style Intro**: Displays a 2.5-second animation when opening or refreshing the website (no skip button required).
- **Themed Motion Aesthetics**: Uses deep canvas tones with ambient radial pulse gradients matching the brand's coral, magenta, and purple palette.
- **Beacon Animation**: Expanding pulse ripples, a heartbeat badge entrance, and reflective metallic shimmer sweeping across the **SocialPulse** title.
- **Smart Session Behavior**: Triggers on initial site visit or browser reload without interrupting internal Single Page Application (SPA) navigation.

### 2. Dynamic Feed & Interactions
- **Dual Feed Modes**: Toggle between **For You** (personalized discovery) and **Following** (posts from creators you follow).
- **Rich Post Cards**: View high-resolution photos, author avatars, location tags, soundtrack tags, and relative timestamps.
- **Double-Tap & Heart Reactions**: Like and unlike posts with smooth micro-animations.
- **Comments Drawer**: Leave real-time comments, view comment history, and delete your comments.
- **Saved Bookmarks**: Save posts to your private saved collection.

### 3. Stories Creator Studio
- **Dropzone & Upload**: Upload photos directly from your computer or paste any image URL.
- **6 Visual Filters**: Apply filters in real time (`Normal`, `Clarendon`, `Vintage`, `Golden Hour`, `Cyberpunk`, `Noir`).
- **Typography & Color Engine**: Overlay text in 5 distinct font styles (`Modern`, `Serif`, `Neon Glow`, `Handwritten`, `Bold Impact`) with custom colors and size sliders.
- **Music Soundtrack Tags**: Attach soundtrack titles to set the mood (e.g., *Midnight City*, *Golden Hour*, *Starboy*).
- **Stickers & Reactions**: Add expressive emoji sticker badges (`🔥 Lit`, `✨ Sparkles`, `💖 Love`, `🎉 Party`, `💯 100`, `⚡ Energy`).

### 4. Vertical Reels Experience
- Vertical 9:16 aspect ratio video viewing.
- Auto-advancing video player with play/pause and mute/unmute controls.
- Interactive reel likes, sound track badges, and creator details.

### 5. Direct Messaging System
- Left panel conversations list displaying recent chats and unread indicators.
- Thread view showing message history and conversation partners.
- Instant chat input bar with auto-scroll to the latest message.

### 6. User Profile, Activity & Settings
- **Profile Grid & Stats**: View post count, follower count, following count, bio, and website links.
- **Profile Setup Notifications**: If a user is registered with default info (`user`), an unread notification badge and notification card guide them to add their name and profile picture with a single click.
- **Full Profile Editing**: Change username, full name, bio, website, location, and upload custom avatar photos with real-time preview.
- **Time Spent Tracker**: Visual bar chart illustrating daily average time spent on the platform over the last 7 days.
- **Recently Deleted Archive**: Posts deleted from the profile are preserved for 30 days and can be restored with 1 tap or permanently deleted.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend Structure** | HTML5 (Semantic, accessible layout) |
| **Styling & Design** | Vanilla CSS3 (Custom design system, CSS Variables, Glassmorphism, Micro-animations) |
| **Client-Side Logic** | Vanilla Modern JavaScript (ES6+ Modules, Async/Await, Fetch API) |
| **Backend Framework** | Node.js with Express.js REST API |
| **Database** | SQLite via `better-sqlite3` (with complete schema & seed script) |
| **Authentication** | JSON Web Tokens (`jsonwebtoken`) & `bcryptjs` password hashing |
| **File Uploads** | `multer` for multipart form data (photos, story media, avatars) |
| **Deployment Modes** | Live Full-Stack mode OR Standalone GitHub Pages mode (via `MockDB`) |

---

## 📁 Project Directory Structure

```text
SOCIAL MEDIA PLATFORM/
├── index.html                  # Root entry point with auto-launch preview
├── package.json                # Project dependencies and npm scripts
├── package-lock.json
├── .gitignore                  # Git ignore rules for clean commits
├── README.md                   # Complete documentation (this file)
│
├── frontend/                   # Client-side Application
│   ├── index.html              # Main Single Page Application interface
│   ├── css/
│   │   ├── style.css           # Core design system tokens, splash screen, layout & modals
│   │   ├── feed.css            # Feed cards, stories studio, reels & DM styles
│   │   └── profile.css         # Profile page, activity charts & settings styles
│   ├── js/
│   │   ├── app.js              # Application routing, notifications & UI controller
│   │   ├── api.js              # Universal data layer (REST client + Standalone MockDB)
│   │   ├── auth.js             # Authentication, session & modal management
│   │   ├── feed.js             # Feed curation, comments & story viewing
│   │   ├── story-creator.js    # Interactive story studio & canvas builder
│   │   ├── reels.js            # Vertical reels player controller
│   │   ├── messages.js         # Direct messaging thread manager
│   │   ├── profile.js          # Profile loader, AI chat assistant & activity manager
│   │   └── icons.js            # SVG icons library
│   └── uploads/
│       └── default-avatar.svg  # Neutral avatar placeholder (no auto photos)
│
└── backend/                    # Backend Server & API
    ├── server.js               # Express.js server entry point (port 3000)
    ├── db.js                   # SQLite database initialization & table definitions
    ├── seed.js                 # Sample seed data populator
    ├── test_api.js             # Automated API test suite
    ├── middleware/
    │   └── auth.js             # JWT authentication middleware
    └── routes/
        ├── auth.js             # User registration & login endpoints
        ├── posts.js            # Feed, post creation, likes & comments
        ├── users.js            # Profile updates, avatar upload, follow/unfollow
        ├── stories.js          # Story posting & fetching
        ├── reels.js            # Reels retrieval & like toggling
        ├── messages.js         # Direct messages & conversations
        └── notifications.js    # User notifications & read status
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v16 or higher) installed on your system.

### 1. Clone the Repository
```bash
git clone https://github.com/aakritigupta-19/CodeAlpha_Task2_SocialPulse.git
cd CodeAlpha_Task2_SocialPulse
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Seed the Database
Initialize the SQLite database with community creators, posts, stories, and reels:
```bash
npm run seed
```

### 4. Start the Application
Run the local development server:
```bash
npm start
```
The server will start at:
👉 **`http://localhost:3000`**

Open `http://localhost:3000` in your web browser to enjoy the complete **SocialPulse** experience!

---

## 🌐 Deploying to GitHub Pages (Zero-Config Standalone Mode)

SocialPulse includes an intelligent universal data layer in [`frontend/js/api.js`](frontend/js/api.js):
- When running locally with Node.js, it connects automatically to the Express.js API.
- When hosted on **GitHub Pages** (or opened via `file://`), it automatically switches to the built-in **MockDB** engine stored in `localStorage`.

### 🌐 Live Deployment
- **Live Demo Link:** 🔗 **[https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/](https://aakritigupta-19.github.io/CodeAlpha_Task2_SocialPulse/)**
- **Repository:** `aakritigupta-19/CodeAlpha_Task2_SocialPulse`

### To configure GitHub Pages:
1. Push your repository to GitHub.
2. In your repository on GitHub, navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, choose **Deploy from a branch**.
4. Select the `main` branch and `/ (root)` folder, then click **Save**.
5. Your website is live and interactive immediately!

---

## 👤 Default Demo Accounts

If running with the seeded database or standalone mock data, you can explore using:

| Username | Password | Role | Description |
|---|---|---|---|
| `user` | `password123` | Default User | Fresh account ready to set custom name & profile photo |
| `alex_creative` | `password123` | Creator | Photographer & visual artist in San Francisco |
| `sophia_lens` | `password123` | Creator | Travel enthusiast & sunset chaser |
| `urban_vibes` | `password123` | Creator | Architecture & street culture photographer |

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
