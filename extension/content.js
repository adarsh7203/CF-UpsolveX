// Main UI rendering logic
const MAIN_APP_URL = "https://cfupsolvex.netlify.app"; // Update to production URL later

let cfHandle = null;
let extensionData = null;

// Initialize
function init() {
  detectHandle();
  
  chrome.storage.local.get(["cfHandle", "cachedData", "lastSync"], (result) => {
    if (result.cfHandle) {
      cfHandle = result.cfHandle;
      
      if (result.cachedData) {
        extensionData = result.cachedData;
        renderSidebar();
        injectPageWidgets();
      }
      
      // Request fresh data if needed
      chrome.runtime.sendMessage({ action: "fetchQueue", handle: cfHandle }, (response) => {
        if (response && response.success) {
          extensionData = response.data;
          renderSidebar(); // Re-render with fresh data
          injectPageWidgets();
        }
      });
    } else {
      // Prompt logic? Or just show a message in the sidebar
      renderSidebar(false);
    }
  });
}

// Auto-detect Codeforces handle from the top-right nav
function detectHandle() {
  const userLinks = document.querySelectorAll('.lang-chooser a[href^="/profile/"]');
  if (userLinks.length > 0) {
    const handle = userLinks[0].getAttribute('href').split('/profile/')[1];
    chrome.storage.local.set({ cfHandle: handle });
  }
}

// Sidebar Injection
function renderSidebar(hasHandle = true) {
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
          <div class="ux-subtitle">Not Configured</div>
        </div>
      </div>
      <div style="padding: 20px; color: #aaa; font-size: 14px; text-align: center;">
        Please set your handle in the extension popup.
      </div>
    `;
    return;
  }

  if (!extensionData) {
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

  const { queue, queue_size, stats } = extensionData;

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
  const footerHtml = `
    <div class="ux-footer">
      <div class="ux-footer-text">Showing ${queue.length} of ${queue_size} Pending Problems</div>
      <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn">View Full Queue &rarr;</a>
    </div>
  `;

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

// Widget injections on specific pages
function injectPageWidgets() {
  if (!extensionData) return;
  const url = window.location.href;

  // 1. Problem Page
  if (url.includes("/problemset/problem/") || url.match(/\/contest\/\d+\/problem\//)) {
    injectProblemWidget();
  }
  
  // 2. Contest Page
  if (url.match(/\/contest\/\d+$/)) {
    // Only base contest page, not specific problems or standings
    injectContestWidget();
  }
  
  // 3. Profile Page
  if (url.includes("/profile/")) {
    injectProfileWidget();
  }
}

function injectProblemWidget() {
  const match = window.location.href.match(/(?:problemset\/problem|contest)\/(\d+)\/(?:problem\/)?([A-Z0-9]+)/i);
  if (!match) return;
  
  const cId = parseInt(match[1]);
  const pIdx = match[2];
  
  // Check if problem is in queue
  const problem = extensionData.queue.find(p => p.contest_id === cId && p.problem_index === pIdx);
  
  const sidebarContent = document.querySelector("#sidebar");
  if (!sidebarContent || document.getElementById("ux-problem-widget")) return;
  
  const widget = document.createElement("div");
  widget.id = "ux-problem-widget";
  widget.className = "ux-widget roundbox sidebox";
  
  if (problem) {
    widget.innerHTML = `
      <h3>CF UpsolveX</h3>
      <div class="ux-widget-row">
        <span class="ux-widget-label">Priority Score</span>
        <span class="ux-widget-val" style="color: #ff5252;">${problem.priority_score}/10</span>
      </div>
      <div class="ux-widget-row">
        <span class="ux-widget-label">Status</span>
        <span class="ux-widget-val">Pending</span>
      </div>
      <div style="margin-top: 15px;">
        <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn" style="padding: 6px; font-size: 12px;">Open UpsolveX Queue</a>
      </div>
    `;
  } else {
    widget.innerHTML = `
      <h3>CF UpsolveX</h3>
      <div class="ux-widget-row" style="justify-content: center; color: #4caf50;">
        Not in top 10 queue!
      </div>
    `;
  }
  
  sidebarContent.insertBefore(widget, sidebarContent.firstChild);
}

function injectContestWidget() {
  const sidebarContent = document.querySelector("#sidebar");
  if (!sidebarContent || document.getElementById("ux-contest-widget")) return;
  
  const widget = document.createElement("div");
  widget.id = "ux-contest-widget";
  widget.className = "ux-widget roundbox sidebox";
  
  widget.innerHTML = `
    <h3>CF UpsolveX</h3>
    <div class="ux-widget-row">
      <span class="ux-widget-label">Overall Completion</span>
      <span class="ux-widget-val">${extensionData.stats.completion_rate}%</span>
    </div>
    <div style="margin-top: 15px;">
      <a href="${MAIN_APP_URL}/contests" target="_blank" class="ux-btn" style="padding: 6px; font-size: 12px;">Open Contest Dashboard</a>
    </div>
  `;
  
  sidebarContent.insertBefore(widget, sidebarContent.firstChild);
}

function injectProfileWidget() {
  const profileMatch = window.location.href.match(/\/profile\/([^\/]+)/);
  if (!profileMatch || profileMatch[1].toLowerCase() !== cfHandle.toLowerCase()) return;
  
  const infoSection = document.querySelector(".info");
  if (!infoSection || document.getElementById("ux-profile-widget")) return;
  
  const widget = document.createElement("div");
  widget.id = "ux-profile-widget";
  widget.className = "ux-widget";
  widget.style.marginTop = "20px";
  
  widget.innerHTML = `
    <h3>CF UpsolveX Snapshot</h3>
    <div style="display: flex; gap: 20px;">
      <div>
        <div class="ux-widget-label">Pending Queue</div>
        <div class="ux-widget-val" style="font-size: 18px; color: #ff5252;">${extensionData.stats.pending_upsolves}</div>
      </div>
      <div>
        <div class="ux-widget-label">Completion</div>
        <div class="ux-widget-val" style="font-size: 18px; color: #4a90e2;">${extensionData.stats.completion_rate}%</div>
      </div>
      <div>
        <div class="ux-widget-label">Current Streak</div>
        <div class="ux-widget-val" style="font-size: 18px; color: #ff9800;">${extensionData.stats.current_streak} Days</div>
      </div>
    </div>
    <div style="margin-top: 15px;">
      <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn" style="width: auto; display: inline-block; padding: 6px 15px;">Open Full Dashboard</a>
    </div>
  `;
  
  infoSection.appendChild(widget);
}

// Run!
init();
