// default dev api
const API_BASE = "https://cf-upsolvex.onrender.com/api";

chrome.runtime.onInstalled.addListener(() => {
  console.log("CF UpsolveX Extension installed.");
  // Setup alarm for periodic sync every 6 hours
  chrome.alarms.create("syncData", { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "syncData") {
    syncQueueData();
  }
});

// Listener for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchQueue") {
    fetchData(request.handle)
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "forceSync") {
    syncQueueData()
      .then((data) => sendResponse({ success: true, data }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function syncQueueData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["cfHandle"], async (result) => {
      const handle = result.cfHandle;
      if (!handle) {
        reject(new Error("No handle set"));
        return;
      }
      try {
        const data = await fetchData(handle);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function fetchData(handle) {
  try {
    const response = await fetch(`${API_BASE}/extension/queue/${handle}`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    
    // Save to storage
    await chrome.storage.local.set({ 
      cachedData: data,
      lastSync: Date.now()
    });
    
    return data;
  } catch (error) {
    console.error("Failed to fetch CF UpsolveX data:", error);
    throw error;
  }
}
