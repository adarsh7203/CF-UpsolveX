// Main UI rendering logic
const MAIN_APP_URL = "https://cfupsolvex.netlify.app"; // Update to production URL later

let cfHandle = null;
let extensionData = null;

// Initialize
function init() {
  const detectedHandle = detectHandleFromDOM();
  
  if (detectedHandle) {
    cfHandle = detectedHandle;
    chrome.storage.local.set({ cfHandle: cfHandle });
  }

  chrome.storage.local.get(["cfHandle", "cachedData", "lastSync"], (result) => {
    cfHandle = detectedHandle || result.cfHandle;
    
    if (cfHandle) {
      if (result.cachedData && result.cachedData.handle === cfHandle) {
        extensionData = result.cachedData;
        renderSidebar();
      } else {
        renderSidebar(true, true); // Loading state
      }
      
      // Request fresh data
      chrome.runtime.sendMessage({ action: "fetchQueue", handle: cfHandle }, (response) => {
        if (response && response.success) {
          extensionData = response.data;
          renderSidebar(); 
        } else {
          console.error("Fetch Error:", response ? response.error : "Unknown");
        }
      });
    } else {
      renderSidebar(false);
    }
  });
}

function detectHandleFromDOM() {
  const userLinks = document.querySelectorAll('.lang-chooser a[href^="/profile/"]');
  if (userLinks.length > 0) {
    return userLinks[0].getAttribute('href').split('/profile/')[1];
  }
  return null;
}

// Sidebar Injection
function renderSidebar(hasHandle = true, isLoading = false) {
  let sidebar = document.getElementById("cf-upsolvex-sidebar");
  let toggle = document.getElementById("cf-upsolvex-toggle");
  
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "cf-upsolvex-sidebar";
    
    toggle = document.createElement("div");
    toggle.id = "cf-upsolvex-toggle";
    toggle.textContent = "UpsolveX";
    toggle.onclick = () => {
      sidebar.classList.toggle("open");
      toggle.classList.toggle("open");
    };
    
    document.body.appendChild(sidebar);
    document.body.appendChild(toggle);
  }

  if (!hasHandle) {
    sidebar.innerHTML = `
      <div class="ux-header">
        <div>
          <h2>CF UpsolveX</h2>
          <div class="ux-subtitle">Not Logged In</div>
        </div>
      </div>
      <div style="padding: 20px; color: #aaa; font-size: 14px; text-align: center;">
        Please login to Codeforces to see your Upsolve Queue.
      </div>
    `;
    return;
  }

  if (isLoading || !extensionData) {
    sidebar.innerHTML = `
      <div class="ux-header">
        <div>
          <h2>CF UpsolveX</h2>
          <div class="ux-subtitle">Loading...</div>
        </div>
      </div>
    `;
    return;
  }

  const { queue, queue_size, stats, is_registered } = extensionData;

  // Build Stats
  const statsHtml = `
    <div class="ux-stats">
      <div class="ux-stat-box">
        <div class="ux-stat-value">${stats.pending_upsolves}</div>
        <div class="ux-stat-label">Pending</div>
      </div>
      <div class="ux-stat-box">
        <div class="ux-stat-value">${stats.completion_rate}%</div>
        <div class="ux-stat-label">Completion</div>
      </div>
      <div class="ux-stat-box">
        <div class="ux-stat-value">${stats.completed_upsolves}</div>
        <div class="ux-stat-label">Upsolved</div>
      </div>
      <div class="ux-stat-box">
        <div class="ux-stat-value">${stats.current_streak} d</div>
        <div class="ux-stat-label">Streak</div>
      </div>
    </div>
  `;

  // Build Queue
  let queueHtml = '<div class="ux-queue-container">';
  if (queue && queue.length > 0) {
    queue.forEach(p => {
      let badgeClass = "ux-badge-low";
      if (p.priority_score > 7) badgeClass = "ux-badge-high";
      else if (p.priority_score > 4) badgeClass = "ux-badge-med";
      
      const badgeIcon = p.priority_score > 7 ? '🔥' : '⭐';
      const rating = p.problem_rating ? p.problem_rating : 'N/A';
      
      queueHtml += `
        <a href="/problemset/problem/${p.contest_id}/${p.problem_index}" class="ux-queue-item">
          <div class="ux-item-details">
            <div class="ux-item-title">${p.contest_id}${p.problem_index} - ${p.problem_name || 'Problem'}</div>
            <div class="ux-item-meta">Rating: ${rating}</div>
          </div>
          <div class="ux-badge ${badgeClass}">${badgeIcon} ${p.priority_score}</div>
        </a>
      `;
    });
  } else {
    queueHtml += `<div style="padding: 20px; text-align:center; color: #aaa;">Queue is empty! 🎉</div>`;
  }
  queueHtml += '</div>';

  // Build Footer
  let footerHtml = `
    <div class="ux-footer">
      <div class="ux-footer-text">Showing ${queue.length} of ${queue_size} Pending Problems</div>
      <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn">View Full Queue &rarr;</a>
    </div>
  `;

  if (is_registered === false) {
    footerHtml += `
      <div style="background: rgba(255, 152, 0, 0.1); padding: 15px; margin: 10px; border-radius: 8px; text-align: center; border: 1px solid rgba(255, 152, 0, 0.3);">
        <div style="color: #ffb74d; font-size: 13px; margin-bottom: 10px; font-weight: 600;">🔥 This is a teaser queue!</div>
        <div style="color: #bbb; font-size: 12px; margin-bottom: 12px; line-height: 1.4;">Get advanced analytics, streak tracking, and personalized nudges.</div>
        <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn" style="background: #ff9800; color: #fff; width: 100%; border: none;">Register on CF UpsolveX</a>
      </div>
    `;
  }

  sidebar.innerHTML = `
    <div class="ux-header">
      <div>
        <h2>CF UpsolveX</h2>
        <div class="ux-subtitle">Your Next Problems</div>
      </div>
      <div class="ux-close-btn" id="ux-close">&times;</div>
    </div>
    ${statsHtml}
    ${queueHtml}
    ${footerHtml}
  `;

  document.getElementById("ux-close").onclick = () => {
    sidebar.classList.remove("open");
    toggle.classList.remove("open");
  };
}

// Run!
init();
