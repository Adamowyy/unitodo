// public/app.js — front-end behaviour shared by every page

// Desktop wrapper detection
(function() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('from') === 'app') {
    localStorage.setItem('unitodo_from', 'desktop');
    const url = new URL(window.location);
    url.searchParams.delete('from');
    window.history.replaceState({}, '', url);
  }
})();

function t(key, params) {
  const strings = window.I18N || {};
  let text = strings[key] || key;
  if (params) {
    Object.keys(params).forEach(function(name) {
      text = text.replace(new RegExp('\\{' + name + '\\}', 'g'), String(params[name]));
    });
  }
  return text;
}

document.addEventListener('DOMContentLoaded', function() {
  // Drag and drop is disabled on touch devices, scrolling takes priority
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.querySelectorAll('.task-card[draggable]').forEach(function(card) {
      card.removeAttribute('draggable');
      card.style.cursor = '';
      card.classList.remove('cursor-grab', 'active:cursor-grabbing');
    });
  }

  // Method override for _method forms, with an optional confirmation
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

  // Make URLs clickable in task and note content
  document.querySelectorAll('.task-card .line-clamp-2, .notes-content, .comment-text').forEach(function(el) {
    linkifyElement(el);
  });
});

// --- Linkify ---
function linkifyElement(el) {
  var html = el.innerHTML;
  var urlRegex = /(https?:\/\/[^\s<]+)/g;
  if (urlRegex.test(html)) {
    el.innerHTML = html.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener" class="text-blue-500 hover:text-blue-400 underline" onclick="event.stopPropagation()">$1</a>');
  }
}

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

// --- Move task (the buttons shown on small screens) ---
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

function toggleEmojiPicker(e, taskId) {
  e.stopPropagation();
  var picker = document.getElementById('emojiPicker' + taskId);
  if (picker) picker.classList.toggle('hidden');

  document.querySelectorAll('[id^="emojiPicker"]').forEach(function(p) {
    if (p.id !== 'emojiPicker' + taskId) p.classList.add('hidden');
  });
}

// Close the pickers on an outside click
document.addEventListener('click', function() {
  document.querySelectorAll('[id^="emojiPicker"]').forEach(function(p) {
    p.classList.add('hidden');
  });
});

// --- Live sync ---
var pollTimer = null;
var pageLoadTime = new Date().toISOString();
var POLL_INTERVAL_MS = 5000;
var BANNER_TIMEOUT_MS = 30000;

function initLiveSync() {
  var m = window.location.pathname.match(/^\/groups\/(\d+)\/(notes|tasks)/);
  if (!m) return;
  var groupId = m[1];
  pollTimer = setInterval(function() {
    fetch('/groups/' + groupId + '/poll?since=' + encodeURIComponent(pageLoadTime))
      .then(function(r) { return r.json(); })
      .then(function(data) { if (data.hasChanges) showSyncBanner(); })
      .catch(function() {});
  }, POLL_INTERVAL_MS);
}

// Reload straight away when nothing is being edited, otherwise offer a banner
function showSyncBanner() {
  var active = document.activeElement;
  var isEditing = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
  var isModalOpen = document.querySelector('.modal-overlay.active');
  if (!isEditing && !isModalOpen) { location.reload(); return; }
  if (document.getElementById('syncBanner')) return;
  var banner = document.createElement('div');
  banner.id = 'syncBanner';
  banner.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-lg z-50 flex items-center gap-3 animate-slide cursor-pointer';
  banner.innerHTML = '🔄 ' + t('sync_new_changes');
  banner.onclick = function() { location.reload(); };
  document.body.appendChild(banner);
  setTimeout(function() { if (banner.parentNode) banner.remove(); }, BANNER_TIMEOUT_MS);
}
