import { API_BASE_URL } from '../config';

/**
 * Log a user interaction (VIEW, SKIP, watchTime) asynchronously.
 * 
 * @param {Object} params
 * @param {number} [params.postId] - Post ID if interaction is on a post
 * @param {number} [params.reelId] - Reel ID if interaction is on a reel
 * @param {string} params.type - 'VIEW' | 'SKIP' | 'LIKE' | 'COMMENT' | 'SAVE' | 'SHARE' | 'FOLLOW'
 * @param {number} [params.watchTime] - Watch time in seconds (for reels / video posts)
 */
export const logInteraction = async ({ postId, reelId, type = 'VIEW', watchTime = null }) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const authHeader = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    fetch(`${API_BASE_URL}/api/interactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        postId: postId || null,
        reelId: reelId || null,
        type: type,
        watchTime: watchTime !== null ? parseFloat(watchTime) : null
      })
    }).catch(() => {}); // Fire and forget, don't block UI
  } catch (_) {}
};
