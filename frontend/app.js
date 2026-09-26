/* Frontend que consume la API REST de usuarios. Sin dependencias, solo fetch. */

// URL base de la API. Se puede cambiar en la UI y se guarda en localStorage.
const DEFAULT_API_BASE = 'http://localhost:3000';
let API_BASE = localStorage.getItem('apiBase') || DEFAULT_API_BASE;

// --- Referencias al DOM ---
const $ = (id) => document.getElementById(id);
const apiBaseInput = $('apiBase');
const healthBadge = $('health');
const usersBody = $('usersBody');
const userForm = $('userForm');
const formTitle = $('formTitle');
const submitBtn = $('submitBtn');
const cancelBtn = $('cancelBtn');
const formMsg = $('formMsg');

// --- Helpers ---
async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }
  return data;
}

function showMsg(text, type = 'ok') {
  formMsg.textContent = text;
  formMsg.className = `msg msg--${type}`;
  if (text) setTimeout(() => (formMsg.textContent = ''), 3500);
}

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString();
}

// --- Health check ---
async function checkHealth() {
  try {
    const data = await api('/health');
    if (data.status === 'ok') {
      healthBadge.textContent = 'API online';
      healthBadge.className = 'badge badge--ok';
      return;
    }
    throw new Error('degraded');
  } catch {
    healthBadge.textContent = 'API offline';
    healthBadge.className = 'badge badge--down';
  }
}

// --- Listado ---
async function loadUsers() {
  usersBody.innerHTML = '<tr><td colspan="5" class="empty">Cargando…</td></tr>';
  try {
    const users = await api('/api/users');
    if (!users.length) {
      usersBody.innerHTML = '<tr><td colspan="5" class="empty">Sin usuarios todavía</td></tr>';
      return;
    }
    usersBody.innerHTML = users
      .map(
        (u) => `
        <tr>
          <td>${u.id}</td>
          <td>${escapeHtml(u.name)}</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${formatDate(u.created_at)}</td>
          <td>
            <div class="actions">
              <button class="btn btn--ghost btn--sm" data-edit="${u.id}">Editar</button>
              <button class="btn btn--danger btn--sm" data-del="${u.id}">Eliminar</button>
            </div>
          </td>
        </tr>`
      )
      .join('');
  } catch (err) {
    usersBody.innerHTML = `<tr><td colspan="5" class="empty">⚠️ ${escapeHtml(err.message)}</td></tr>`;
  }
}

// --- Crear / actualizar ---
function resetForm() {
  userForm.reset();
  $('userId').value = '';
  formTitle.textContent = 'Nuevo usuario';
  submitBtn.textContent = 'Crear';
  cancelBtn.hidden = true;
}

userForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = $('userId').value;
  const payload = { name: $('name').value.trim(), email: $('email').value.trim() };
  try {
    if (id) {
      await api(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showMsg('Usuario actualizado ✅');
    } else {
      await api('/api/users', { method: 'POST', body: JSON.stringify(payload) });
      showMsg('Usuario creado ✅');
    }
    resetForm();
    loadUsers();
  } catch (err) {
    showMsg(err.message, 'error');
  }
});

cancelBtn.addEventListener('click', resetForm);

// Delegación de eventos para editar / eliminar
usersBody.addEventListener('click', async (e) => {
  const editId = e.target.getAttribute('data-edit');
  const delId = e.target.getAttribute('data-del');

  if (editId) {
    try {
      const u = await api(`/api/users/${editId}`);
      $('userId').value = u.id;
      $('name').value = u.name;
      $('email').value = u.email;
      formTitle.textContent = `Editando usuario #${u.id}`;
      submitBtn.textContent = 'Guardar cambios';
      cancelBtn.hidden = false;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }

  if (delId) {
    if (!confirm(`¿Eliminar el usuario #${delId}?`)) return;
    try {
      await api(`/api/users/${delId}`, { method: 'DELETE' });
      showMsg('Usuario eliminado ✅');
      loadUsers();
    } catch (err) {
      showMsg(err.message, 'error');
    }
  }
});

// --- Configuración de la URL de la API ---
$('saveApiBase').addEventListener('click', () => {
  const value = apiBaseInput.value.trim().replace(/\/$/, '');
  API_BASE = value || DEFAULT_API_BASE;
  localStorage.setItem('apiBase', API_BASE);
  apiBaseInput.value = API_BASE;
  init();
});

$('reloadBtn').addEventListener('click', loadUsers);

// --- Arranque ---
function init() {
  apiBaseInput.value = API_BASE;
  checkHealth();
  loadUsers();
}

init();
