/*
 * CF UpsolveX Extension
 * Author: Adarsh Gupta
 * Description: Codeforces productivity companion service worker
 */
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

// Listener for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchQueue") {
    fetchData(request.handle, request.maxIndex)
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
  if (request.action === "refreshCodeforces") {
    fetch(`${API_BASE}/extension/refresh/${request.handle}`, { method: 'POST' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.json();
      })
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

async function syncQueueData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(["cfHandle", "uxMaxIndex"], async (result) => {
      const handle = result.cfHandle;
      if (!handle) {
        reject(new Error("No handle set"));
        return;
      }
      try {
        const data = await fetchData(handle, result.uxMaxIndex);
        resolve(data);
      } catch (err) {
        reject(err);
      }
    });
  });
}

async function fetchData(handle, maxIndex) {
  try {
    let url = `${API_BASE}/extension/queue/${handle}`;
    if (maxIndex) {
      url += `?max_index=${maxIndex}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        console.log("User not found in CF UpsolveX. Falling back to on-the-fly Codeforces API computation.");
        return await fetchCodeforcesFallback(handle, maxIndex);
      }
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    data.is_registered = true;

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

async function fetchCodeforcesFallback(handle, maxIndex) {
  // Fetch user info
  const userResp = await fetch(`https://codeforces.com/api/user.info?handles=${handle}`);
  const userData = await userResp.json();
  const userRating = userData.result[0].rating || 1500;

  // Fetch user status
  const statusResp = await fetch(`https://codeforces.com/api/user.status?handle=${handle}`);
  const statusData = await statusResp.json();

  const solved = new Set();
  const failedMap = new Map();

  if (statusData.status === "OK") {
    for (let sub of statusData.result) {
      if (!sub.problem || !sub.problem.contestId || !sub.problem.index) continue;
      
      const cId = sub.problem.contestId;
      const pIdx = sub.problem.index;
      
      // Filter by maxIndex if provided
      if (maxIndex && maxIndex !== 'Z') {
        // Strip digits from index (e.g. "A1" -> "A")
        const charIdx = pIdx.replace(/[0-9]/g, '');
        if (charIdx > maxIndex) {
          continue;
        }
      }

      const key = `${cId}-${pIdx}`;

      if (sub.verdict === "OK") {
        solved.add(key);
      } else {
        if (!failedMap.has(key)) {
          failedMap.set(key, {
            problem_name: sub.problem.name,
            contest_id: cId,
            problem_index: pIdx,
            problem_rating: sub.problem.rating || 0,
            failed_attempts: 0
          });
        }
        failedMap.get(key).failed_attempts += 1;
      }
    }
  }
  
  const pending = Array.from(failedMap.values());
  
  pending.forEach(p => {
    p.priority_score = calculatePriorityScore(null, p.problem_rating, p.failed_attempts, userRating);
  });

  pending.sort((a, b) => b.priority_score - a.priority_score);
  
  const top10 = pending.slice(0, 10);
  if (top10.length > 0) {
    const maxScore = top10[0].priority_score;
    if (maxScore > 0) {
      top10.forEach(p => {
        p.priority_score = parseFloat(((p.priority_score / maxScore) * 10).toFixed(2));
      });
    }
  }

  const data = {
    handle: handle,
    queue: top10,
    queue_size: pending.length,
    is_registered: false,
    stats: {
      pending_upsolves: pending.length,
      completion_rate: "N/A",
      completed_upsolves: solved.size,
      current_streak: "N/A"
    }
  };

  await chrome.storage.local.set({
    cachedData: data,
    lastSync: Date.now()
  });

  return data;
}

function calculatePriorityScore(contestStartTimeMs, problemRating, failedAttempts, userRating) {
  let recencyScore = 20; // Default to mid-recency since we don't fetch contest times to save API calls
  
  let ratingScore = 0;
  if (problemRating && userRating) {
      const diff = problemRating - userRating;
      if (diff >= -200 && diff <= 300) {
          const optimalDiff = 100;
          const dist = Math.abs(diff - optimalDiff);
          ratingScore = 40 * (1 - (dist / 300));
      } else if (diff > 300) {
          ratingScore = 10;
      } else {
          ratingScore = 5;
      }
  } else {
      ratingScore = 20;
  }

  let attemptScore = 0;
  if (failedAttempts > 0) {
      if (failedAttempts <= 3) attemptScore = 20;
      else if (failedAttempts <= 6) attemptScore = 15;
      else attemptScore = 5;
  }

  return Math.max(0, recencyScore + ratingScore + attemptScore);
}
