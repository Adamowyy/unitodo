// public/app.js — Frontend JavaScript

// Banner detection — desktop vs web
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'app') {
    localStorage.setItem('unitodo_from', 'desktop');
    // Clean URL without reload
    const url = new URL(window.location);
    url.searchParams.delete('from');
    window.history.replaceState({}, '', url);
  }
  
  const source = localStorage.getItem('unitodo_from');
  if (source === 'desktop') {
    const banner = document.getElementById('banner-desktop');
    if (banner) banner.style.display = 'block';
  } else {
    const banner = document.getElementById('banner-web');
    if (banner) banner.style.display = 'block';
  }
})();

// Obsługa _method dla PUT/DELETE
document.addEventListener('DOMContentLoaded', function() {
  // Method override przez formularze z _method
  document.addEventListener('submit', function(e) {
    const form = e.target;
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
        if (resp.redirected) {
          window.location.href = resp.url;
        } else {
          window.location.reload();
        }
      }).catch(() => window.location.reload());
    }
  });

  // Zamknij modale po kliknięciu poza nimi
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', function(e) {
      if (e.target === this) {
        this.classList.remove('active');
      }
    });
  });

  // Live sync — polling dla stron grupy
  initLiveSync();
});

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// --- Live Sync ---
let pollTimer = null;
let pageLoadTime = new Date().toISOString();

function initLiveSync() {
  // Only on group pages: /groups/:id/notes or /groups/:id/tasks
  const m = window.location.pathname.match(/^\/groups\/(\d+)\/(notes|tasks)/);
  if (!m) return;

  const groupId = m[1];

  pollTimer = setInterval(async () => {
    try {
      const resp = await fetch(`/groups/${groupId}/poll?since=${encodeURIComponent(pageLoadTime)}`);
      const data = await resp.json();
      if (data.hasChanges) {
        showSyncBanner();
      }
    } catch (e) { /* ignore network errors */ }
  }, 5000);
}

function showSyncBanner() {
  // Auto-reload if user is not editing
  const active = document.activeElement;
  const isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
  const isModalOpen = document.querySelector('.modal-overlay.active');
  
  if (!isEditing && !isModalOpen) {
    window.location.reload();
    return;
  }

  // User is editing — show banner instead
  if (document.getElementById('syncBanner')) return;
  const banner = document.createElement('div');
  banner.id = 'syncBanner';
  banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide cursor-pointer';
  banner.innerHTML = '🔄 Są nowe zmiany — <span class="underline font-medium">odśwież</span>';
  banner.onclick = () => window.location.reload();
  document.body.appendChild(banner);
  setTimeout(() => { if (banner.parentNode) banner.remove(); }, 30000);
}
