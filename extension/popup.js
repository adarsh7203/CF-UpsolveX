document.addEventListener('DOMContentLoaded', () => {
  const handleInput = document.getElementById('handle');
  const saveBtn = document.getElementById('saveBtn');
  const syncBtn = document.getElementById('syncBtn');
  const statusEl = document.getElementById('statusMessage');

  // Load existing handle
  chrome.storage.local.get(['cfHandle'], (result) => {
    if (result.cfHandle) {
      handleInput.value = result.cfHandle;
    }
  });

  function showStatus(message, isError = false) {
    statusEl.textContent = message;
    statusEl.className = `status ${isError ? 'error' : ''}`;
    statusEl.style.display = 'block';
    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 3000);
  }

  saveBtn.addEventListener('click', () => {
    const handle = handleInput.value.trim();
    if (!handle) {
      showStatus('Please enter a handle', true);
      return;
    }

    chrome.storage.local.set({ cfHandle: handle }, () => {
      showStatus('Handle saved!');
      
      // Trigger a sync
      syncBtn.disabled = true;
      syncBtn.textContent = 'Syncing...';
      
      chrome.runtime.sendMessage({ action: 'fetchQueue', handle }, (response) => {
        syncBtn.disabled = false;
        syncBtn.textContent = 'Force Sync Data';
        
        if (response && response.success) {
          showStatus('Data synced successfully!');
        } else {
          showStatus('Failed to sync data.', true);
        }
      });
    });
  });

  syncBtn.addEventListener('click', () => {
    const handle = handleInput.value.trim();
    if (!handle) {
      showStatus('Please save a handle first', true);
      return;
    }

    syncBtn.disabled = true;
    syncBtn.textContent = 'Syncing...';
    
    chrome.runtime.sendMessage({ action: 'fetchQueue', handle }, (response) => {
      syncBtn.disabled = false;
      syncBtn.textContent = 'Force Sync Data';
      
      if (response && response.success) {
        showStatus('Data synced successfully!');
      } else {
        showStatus('Failed to sync data.', true);
      }
    });
  });
});
