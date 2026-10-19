// Toolbar button opens the import / settings page.
chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') chrome.runtime.openOptionsPage();
});

// Content script reports how many badges are on the page; show it on the toolbar icon.
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg && msg.type === 'badges' && sender.tab) {
    chrome.action.setBadgeBackgroundColor({ tabId: sender.tab.id, color: msg.count ? '#2e7d32' : '#757575' });
    chrome.action.setBadgeText({ tabId: sender.tab.id, text: String(msg.count) });
  }
});
