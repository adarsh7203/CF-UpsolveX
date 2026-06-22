// Main UI rendering logic
const MAIN_APP_URL = "https://cfupsolvex.netlify.app"; // Update to production URL later

let cfHandle = null;
let extensionData = null;
let currentMaxIndex = 'Z';

function showToast(message, type="success") {
  const toast = document.createElement("div");
  toast.style.position = "fixed";
  toast.style.bottom = "24px";
  toast.style.right = "24px";
  toast.style.backgroundColor = type === "success" ? "#10b981" : "#ef4444";
  toast.style.color = "#ffffff";
  toast.style.padding = "12px 24px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.2)";
  toast.style.fontFamily = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "600";
  toast.style.zIndex = "10001";
  toast.style.opacity = "0";
  toast.style.transform = "translateY(20px)";
  toast.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";
  
  const icon = type === "success" ? '✓' : '✕';
  toast.innerHTML = `<span style="margin-right: 8px; font-weight: bold;">${icon}</span>${message}`;
  
  document.body.appendChild(toast);
  
  // Trigger animation after a tiny delay to ensure CSS transition works
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.transform = "translateY(0)";
  }, 10);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(20px)";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Initialize
function init() {
  const detectedHandle = detectHandleFromDOM();
  
  if (detectedHandle) {
    cfHandle = detectedHandle;
    chrome.storage.local.set({ cfHandle: cfHandle });
    
    chrome.storage.local.get(["cachedData", "lastSync", "uxMaxIndex"], (result) => {
      if (result.uxMaxIndex) {
        currentMaxIndex = result.uxMaxIndex;
      }
      
      if (result.cachedData && result.cachedData.handle === cfHandle) {
        extensionData = result.cachedData;
        renderSidebar();
      } else {
        renderSidebar(true, true); // Loading state
      }
      
      // Request fresh data
      chrome.runtime.sendMessage({ action: "fetchQueue", handle: cfHandle, maxIndex: currentMaxIndex }, (response) => {
        if (response && response.success) {
          extensionData = response.data;
          renderSidebar(); 
        } else {
          console.error("Fetch Error:", response ? response.error : "Unknown");
        }
      });
    });
  } else {
    // User is logged out
    cfHandle = null;
    chrome.storage.local.remove(["cfHandle", "cachedData", "lastSync"]);
    renderSidebar(false); // Show Not Logged In state
  }
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
  if (!sidebar) {
    sidebar = document.createElement("div");
    sidebar.id = "cf-upsolvex-sidebar";
    document.body.appendChild(sidebar);

    // Inject Navbar Button
    injectNavbarButton(() => {
      sidebar.classList.toggle("open");
    });

    // Close on click outside
    document.addEventListener("click", (e) => {
      const isClickInsideSidebar = sidebar.contains(e.target);
      const navBtn = document.getElementById("ux-nav-btn");
      const isClickOnNavBtn = navBtn ? navBtn.contains(e.target) : false;
      
      if (!isClickInsideSidebar && !isClickOnNavBtn && sidebar.classList.contains("open")) {
        sidebar.classList.remove("open");
      }
    });
  }

  if (!hasHandle) {
    sidebar.innerHTML = `
      <div class="ux-header">
        <div>
          <h2>CF UpsolveX</h2>
          <div class="ux-subtitle">Not Logged In</div>
        </div>
        <div class="ux-close-btn" id="ux-close">&times;</div>
      </div>
      <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 30px; text-align: center; color: var(--ux-text-muted);">
        <svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px; opacity: 0.5;">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <div style="font-size: 16px; font-weight: 600; color: #fff; margin-bottom: 8px;">Authentication Required</div>
        <div style="font-size: 13px; line-height: 1.5; margin-bottom: 20px;">Please login to your Codeforces account to see your Upsolve Queue.</div>
        <div style="width: 100%; height: 1px; background: rgba(255,255,255,0.05); margin-bottom: 20px;"></div>
        <div style="font-size: 12px; color: #8b949e; margin-bottom: 12px;">Don't have a CF UpsolveX account?</div>
        <a href="${MAIN_APP_URL}" target="_blank" class="ux-btn" style="background: #3b82f6; color: #fff; text-decoration: none; display: inline-block; width: 100%;">Register on CF UpsolveX</a>
      </div>
    `;
    document.getElementById("ux-close").onclick = () => {
      sidebar.classList.remove("open");
    };
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
      
      let contestName = "";
      if (p.contests && p.contests.name) contestName = p.contests.name;
      else if (p.contest_name) contestName = p.contest_name;

      let divBadgeText = "";
      if (contestName) {
        const lowerName = contestName.toLowerCase();
        if (lowerName.includes("div. 1 + div. 2") || lowerName.includes("div. 1 + 2") || lowerName.includes("div 1 + div 2")) divBadgeText = "Div. 1+2";
        else if (lowerName.includes("div. 1") || lowerName.includes("div 1")) divBadgeText = "Div. 1";
        else if (lowerName.includes("div. 2") || lowerName.includes("div 2")) divBadgeText = "Div. 2";
        else if (lowerName.includes("div. 3") || lowerName.includes("div 3")) divBadgeText = "Div. 3";
        else if (lowerName.includes("div. 4") || lowerName.includes("div 4")) divBadgeText = "Div. 4";
        else if (lowerName.includes("educational")) divBadgeText = "Edu";
        else if (lowerName.includes("global")) divBadgeText = "Global";
      }

      const divBadgeHtml = divBadgeText ? `<span style="background: rgba(255,255,255,0.08); padding: 2px 6px; border-radius: 4px; margin-left: 8px; font-size: 10px; font-weight: 600; color: #8b949e; border: 1px solid rgba(255,255,255,0.1);">${divBadgeText}</span>` : "";

      queueHtml += `
        <a href="/problemset/problem/${p.contest_id}/${p.problem_index}" class="ux-queue-item">
          <div class="ux-item-details">
            <div class="ux-item-title">${p.contest_id}${p.problem_index} - ${p.problem_name || 'Problem'}</div>
            <div class="ux-item-meta">Rating: ${rating}${divBadgeHtml}</div>
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



  sidebar.innerHTML = `
    <div class="ux-header">
      <div style="margin-top: 8px;">
        <h2>CF UpsolveX</h2>
        <div class="ux-subtitle" style="white-space: nowrap; font-size: 10px; letter-spacing: 0.5px;">TRACK • UPSOLVE • IMPROVE</div>
      </div>
      <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div id="ux-refresh-btn" style="cursor: pointer; color: #8b949e; font-size: 14px;" title="Sync with Codeforces">&#x21BB;</div>
          <div class="ux-close-btn" id="ux-close">&times;</div>
        </div>
        <select id="ux-max-index-select" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255,255,255,0.15); color: #f8fafc; border-radius: 6px; padding: 4px 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; letter-spacing: 0.3px; outline: none; cursor: pointer; transition: all 0.2s ease; backdrop-filter: blur(4px); box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
          <option value="A" ${currentMaxIndex === 'A' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to A</option>
          <option value="B" ${currentMaxIndex === 'B' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to B</option>
          <option value="C" ${currentMaxIndex === 'C' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to C</option>
          <option value="D" ${currentMaxIndex === 'D' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to D</option>
          <option value="E" ${currentMaxIndex === 'E' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to E</option>
          <option value="F" ${currentMaxIndex === 'F' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to F</option>
          <option value="G" ${currentMaxIndex === 'G' ? 'selected' : ''} style="background: #0f172a; color: #fff;">Up to G</option>
          <option value="Z" ${currentMaxIndex === 'Z' ? 'selected' : ''} style="background: #0f172a; color: #fff;">All Problems</option>
        </select>
      </div>
    </div>
    ${statsHtml}
    ${queueHtml}
    ${footerHtml}
  `;

  document.getElementById("ux-close").onclick = () => {
    sidebar.classList.remove("open");
  };

  const refreshBtn = document.getElementById("ux-refresh-btn");
  if (refreshBtn) {
    refreshBtn.onclick = () => {
      refreshBtn.classList.add("ux-spin");
      chrome.runtime.sendMessage({ action: "refreshCodeforces", handle: cfHandle }, (refreshRes) => {
        if (refreshRes && refreshRes.success) {
          chrome.runtime.sendMessage({ action: "fetchQueue", handle: cfHandle, maxIndex: currentMaxIndex }, (response) => {
            if (response && response.success) {
              const oldDataStr = JSON.stringify(extensionData);
              const newDataStr = JSON.stringify(response.data);
              extensionData = response.data;
              renderSidebar();
              
              if (oldDataStr === newDataStr) {
                showToast("Queue is already up-to-date!");
              } else {
                showToast("Queue Refreshed Successfully!");
              }
            } else {
              refreshBtn.classList.remove("ux-spin");
              showToast("Failed to fetch new queue.", "error");
            }
          });
        } else {
          refreshBtn.classList.remove("ux-spin");
          showToast("Failed to refresh. Try again later.", "error");
        }
      });
    };
  }

  const maxIndexSelect = document.getElementById("ux-max-index-select");
  if (maxIndexSelect) {
    maxIndexSelect.addEventListener('change', (e) => {
      currentMaxIndex = e.target.value;
      chrome.storage.local.set({ uxMaxIndex: currentMaxIndex });
      renderSidebar(true, true); // Show loading state
      chrome.runtime.sendMessage({ action: "fetchQueue", handle: cfHandle, maxIndex: currentMaxIndex }, (response) => {
        if (response && response.success) {
          extensionData = response.data;
          renderSidebar(); 
        } else {
          console.error("Fetch Error after index change:", response ? response.error : "Unknown");
        }
      });
    });
  }
}

// Inject button into Codeforces top navbar
function injectNavbarButton(toggleFn) {
  const menuList = document.querySelector(".menu-list-container ul, .menu-list");
  if (!menuList) return;
  
  if (document.getElementById("ux-nav-btn")) return;

  const li = document.createElement("li");
  li.id = "ux-nav-btn";
  
  const a = document.createElement("a");
  a.href = "#";
  a.textContent = "CF UpsolveX";
  
  // Compact button styling directly on 'a' to avoid span clipping
  a.style.color = "#58a6ff"; 
  a.style.fontWeight = "bold";
  a.style.border = "1px solid rgba(30, 98, 201, 0.8)"; // Darker border
  a.style.borderRadius = "4px";
  a.style.backgroundColor = "rgba(88, 166, 255, 0.1)";
  a.style.boxShadow = "0 0 6px rgba(88, 166, 255, 0.4)"; // Little shining glow
  
  // Flexbox for perfect text centering inside the border
  a.style.display = "inline-flex";
  a.style.alignItems = "center";
  a.style.justifyContent = "center";
  a.style.height = "26px";
  a.style.padding = "0 10px";
  a.style.margin = "0 0 0 4px";
  
  // Overrides to prevent pushing down the navbar
  a.style.lineHeight = "normal";
  a.style.boxSizing = "border-box";
  
  // Nudge it up visually to make it equidistant from top and bottom navbar borders
  a.style.position = "relative";
  a.style.top = "-3px"; 
  
  a.style.transition = "all 0.2s ease";
  
  a.onmouseover = () => {
    a.style.backgroundColor = "rgba(88, 166, 255, 0.2)";
    a.style.border = "1px solid rgba(30, 98, 201, 1)";
    a.style.boxShadow = "0 0 10px rgba(88, 166, 255, 0.8)"; // Brighter shine on hover
  };
  a.onmouseout = () => {
    a.style.backgroundColor = "rgba(88, 166, 255, 0.1)";
    a.style.border = "1px solid rgba(30, 98, 201, 0.8)";
    a.style.boxShadow = "0 0 6px rgba(88, 166, 255, 0.4)";
  };
  
  a.onclick = (e) => {
    e.preventDefault();
    toggleFn();
  };
  
  li.appendChild(a);
  menuList.appendChild(li);
}

// Run!
init();
