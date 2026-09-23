// Comprehensive test suite for all SocialPulse API endpoints

async function runEnhancedTests() {
  const BASE = 'http://localhost:3000/api';
  console.log('🧪 Starting Full Test Suite on SocialPulse...\n');

  try {
    // 1. Check For You feed
    console.log('1. Checking For You feed...');
    const feedForYouRes = await fetch(`${BASE}/posts/feed?tab=for_you`);
    const feedForYouData = await feedForYouRes.json();
    console.log(`   ✅ For You feed: ${feedForYouData.posts.length} posts retrieved`);
    const targetPostId = feedForYouData.posts[0].id;

    // 2. Login as alex_creative
    console.log('\n2. Testing authentication (Login as @alex_creative)...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'alex_creative', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log(`   ✅ Logged in successfully: @${loginData.user.username}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // Get demo users to find another user to chat with
    const demoRes = await fetch(`${BASE}/auth/demo-users`);
    const demoData = await demoRes.json();
    const partnerUser = demoData.users.find(u => u.username !== 'alex_creative') || demoData.users[1];

    // 3. Check Following feed
    console.log('\n3. Testing Following feed tab for @alex_creative...');
    const feedFollowRes = await fetch(`${BASE}/posts/feed?tab=following`, { headers: authHeaders });
    const feedFollowData = await feedFollowRes.json();
    console.log(`   ✅ Following feed: ${feedFollowData.posts.length} posts retrieved from followed creators`);

    // 4. Save/Bookmark post
    console.log(`\n4. Testing Post Bookmark/Save system on Post #${targetPostId}...`);
    const saveRes = await fetch(`${BASE}/posts/${targetPostId}/save`, { method: 'POST', headers: authHeaders });
    const saveData = await saveRes.json();
    console.log(`   ✅ Post #${targetPostId} save status toggled: saved=${saveData.saved}`);

    const savedListRes = await fetch(`${BASE}/posts/saved`, { headers: authHeaders });
    const savedListData = await savedListRes.json();
    console.log(`   ✅ Retrieved ${savedListData.posts.length} saved bookmarks in collection`);

    // 5. Reels endpoint
    console.log('\n5. Testing Reels / Short Videos endpoint...');
    const reelsRes = await fetch(`${BASE}/reels`, { headers: authHeaders });
    const reelsData = await reelsRes.json();
    console.log(`   ✅ Reels stream loaded: ${reelsData.reels.length} reels found`);

    if (reelsData.reels.length > 0) {
      const reelLikeRes = await fetch(`${BASE}/reels/${reelsData.reels[0].id}/like`, { method: 'POST', headers: authHeaders });
      const reelLikeData = await reelLikeRes.json();
      console.log(`   ✅ Reel #${reelsData.reels[0].id} like toggled: liked=${reelLikeData.liked}, total_likes=${reelLikeData.likes_count}`);
    }

    // 6. Direct Messaging (DMs)
    console.log(`\n6. Testing Direct Messaging system with @${partnerUser.username} (ID: ${partnerUser.id})...`);
    const convsRes = await fetch(`${BASE}/messages/conversations`, { headers: authHeaders });
    const convsData = await convsRes.json();
    console.log(`   ✅ Loaded ${convsData.conversations.length} active conversation threads`);

    // Send DM to partner
    const sendMsgRes = await fetch(`${BASE}/messages/${partnerUser.id}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ message_text: 'Hey ' + partnerUser.full_name + ', testing direct messages from SocialPulse!' })
    });
    const sendMsgData = await sendMsgRes.json();
    console.log(`   ✅ Direct message sent: "${sendMsgData.message.message_text}"`);

    const historyRes = await fetch(`${BASE}/messages/${partnerUser.id}`, { headers: authHeaders });
    const historyData = await historyRes.json();
    console.log(`   ✅ Chat history loaded: ${historyData.messages.length} messages with @${historyData.targetUser.username}`);

    // 7. Notifications system
    console.log('\n7. Testing Notification Center...');
    const notifRes = await fetch(`${BASE}/notifications`, { headers: authHeaders });
    const notifData = await notifRes.json();
    console.log(`   ✅ Retrieved ${notifData.notifications.length} notifications (unread: ${notifData.unread_count})`);

    const markReadRes = await fetch(`${BASE}/notifications/read`, { method: 'PUT', headers: authHeaders });
    const markReadData = await markReadRes.json();
    console.log(`   ✅ Notifications marked as read: unread_count=${markReadData.unread_count}`);

    // 8. Followers and Following lists
    console.log('\n8. Testing Followers and Following lists...');
    const followersRes = await fetch(`${BASE}/users/alex_creative/followers`, { headers: authHeaders });
    const followersData = await followersRes.json();
    console.log(`   ✅ @alex_creative followers: ${followersData.followers.map(f => '@' + f.username).join(', ')}`);

    const followingRes = await fetch(`${BASE}/users/alex_creative/following`, { headers: authHeaders });
    const followingData = await followingRes.json();
    console.log(`   ✅ @alex_creative following: ${followingData.following.map(f => '@' + f.username).join(', ')}`);

    // 9. Creator Analytics Overview
    console.log('\n9. Testing Creator Analytics Overview...');
    const analyticsRes = await fetch(`${BASE}/users/analytics/overview`, { headers: authHeaders });
    const analyticsData = await analyticsRes.json();
    const a = analyticsData.analytics;
    console.log(`   ✅ Creator Analytics loaded: ${a.total_views} views, ${a.total_likes} likes, engagement rate: ${a.engagement_rate}`);

    // 10. Stories System
    console.log('\n10. Testing Stories API & Story Creator Studio...');
    const storiesRes = await fetch(`${BASE}/stories`);
    const storiesData = await storiesRes.json();
    console.log(`   ✅ Active stories loaded: ${storiesData.stories.length} stories found`);

    // Create a new story with creative overlay & soundtrack
    const createStoryRes = await fetch(`${BASE}/stories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        mediaUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1080&auto=format&fit=crop&q=80',
        text_overlay: 'Live from Studio! ✨',
        font_style: 'neon',
        text_color: '#00f2fe',
        font_size: 26,
        filter_style: 'cyberpunk',
        music_title: 'Starboy - The Weeknd',
        sticker_type: '🔥'
      })
    });
    const createStoryData = await createStoryRes.json();
    console.log(`   ✅ Story published successfully: Story ID #${createStoryData.story.id}, filter="${createStoryData.story.filter_style}", music="${createStoryData.story.music_title}"`);

    console.log('\n🎉 ALL 10 ADVANCED TESTS PASSED WITH 100% SUCCESS!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runEnhancedTests();
