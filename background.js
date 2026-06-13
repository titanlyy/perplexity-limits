// background.js — fetches rate limits with session credentials, caches result
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'FETCH_LIMITS') {
    fetch('https://www.perplexity.ai/rest/rate-limit/all', {
      credentials: 'include',
      headers: { 'Accept': 'application/json' }
    })
      .then(r => r.json())
      .then(data => {
        const payload = { data, fetchedAt: Date.now() };
        chrome.storage.local.set({ limits: payload });
        sendResponse({ ok: true, ...payload });
      })
      .catch(err => sendResponse({ ok: false, error: err.message }));
    return true; // keep channel open for async response
  }
});
