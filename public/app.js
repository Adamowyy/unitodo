// public/app.js - Frontend JavaScript

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
});

// Globalne funkcje dla modal
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}
