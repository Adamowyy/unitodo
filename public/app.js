// public/app.js — Frontend JavaScript

// Desktop app detection
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'app') {
    localStorage.setItem('unitodo_from', 'desktop');
    const url = new URL(window.location);
    url.searchParams.delete('from');
    window.history.replaceState({}, '', url);
  }
})();

document.addEventListener('DOMContentLoaded', function() {
  // Method override for _method forms
  document.addEventListener('submit', function(e) {
    const form = e.target;
    
    const confirmMsg = form.getAttribute('data-confirm');
    if (confirmMsg && !confirm(confirmMsg)) {
      e.preventDefault();
      return;
    }
    
    const methodInput = form.querySelector('input[name="_method"]');
    if (methodInput && methodInput.value !== 'POST') {
      e.preventDefault();
      const method = methodInput.value;
      const action = form.action;
      const formData = new FormData(form);
      
      fetch(action, {
        method: method,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData)
      }).then(resp => {
        if (resp.redirected) window.location.href = resp.url;
        else window.location.reload();
      }).catch(() => window.location.reload());
    }
  });

  // Close modals on backdrop click
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function(e) {
      if (e.target === this) this.classList.remove('active');
    });
  });

  initLiveSync();
});

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// --- Invite code ---
async function generateInviteCode(groupId) {
  try {
    const resp = await fetch('/groups/' + groupId + '/invite', { method: 'POST' });
    const data = await resp.json();
    const el = document.getElementById('inviteCode');
    if (el && data.invite_code) el.textContent = data.invite_code;
  } catch (e) {}
}

function copyInviteCode() {
  const el = document.getElementById('inviteCode');
  if (el) navigator.clipboard.writeText(el.textContent);
}

// --- Move task (mobile) ---
function moveTask(taskId, newStatus) {
  fetch('/tasks/' + taskId + '/move', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus })
  }).then(r => r.json())
    .then(data => { if (data.success) location.reload(); })
    .catch(() => location.reload());
}

// --- Emoji reactions ---
function reactToTask(taskId, emoji) {
  fetch('/tasks/' + taskId + '/react', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'emoji=' + encodeURIComponent(emoji)
  }).then(r => r.json())
    .then(data => { if (data.success) location.reload(); })
    .catch(() => location.reload());
}

// --- Live Sync ---
var pollTimer = null;
var pageLoadTime = new Date().toISOString();

function initLiveSync() {
  var m = window.location.pathname.match(/^\/groups\/(\d+)\/(notes|tasks)/);
  if (!m) return;
  var groupId = m[1];
  pollTimer = setInterval(function() {
    fetch('/groups/' + groupId + '/poll?since=' + encodeURIComponent(pageLoadTime))
      .then(function(r) { return r.json(); })
      .then(function(data) { if (data.hasChanges) showSyncBanner(); })
      .catch(function() {});
  }, 5000);
}

function showSyncBanner() {
  var active = document.activeElement;
  var isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
  var isModalOpen = document.querySelector('.modal-overlay.active');
  if (!isEditing && !isModalOpen) { location.reload(); return; }
  if (document.getElementById('syncBanner')) return;
  var banner = document.createElement('div');
  banner.id = 'syncBanner';
  banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide cursor-pointer';
  banner.innerHTML = '🔄 Są nowe zmiany — <span class="underline font-medium">odśwież</span>';
  banner.onclick = function() { location.reload(); };
  document.body.appendChild(banner);
  setTimeout(function() { if (banner.parentNode) banner.remove(); }, 30000);
}
