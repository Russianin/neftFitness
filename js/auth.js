const Auth = (() => {
  const getCurrent = async () => {
    const cached = localStorage.getItem('neft_cached_user');
    if (cached) {
      fetch('/api/me', { credentials: 'include' }).then(res => {
        if (!res.ok) { localStorage.removeItem('neft_cached_user'); renderHeaderActions(); }
      });
      return JSON.parse(cached);
    }
    try {
      const res = await fetch('/api/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        localStorage.setItem('neft_cached_user', JSON.stringify(user));
        return user;
      }
      return null;
    } catch (e) { return null; }
  };

  const login = async (phone, password) => {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      credentials: 'include'
    });
    if (res.ok) {
      const user = await res.json();
      localStorage.setItem('neft_cached_user', JSON.stringify(user));
      return user;
    }
    return await res.json();
  };

  const register = async (data) => {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok ? { success: true } : await res.json();
  };

  const logout = async () => {
    await fetch('/api/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('neft_cached_user');
    location.reload();
  };

  return { getCurrent, login, register, logout };
})();

async function renderHeaderActions() {
  const wrap = document.getElementById('headerActions');
  if (!wrap) return;
  const user = await Auth.getCurrent();

  if (!user) {
    wrap.innerHTML = `
      <button class="btn btn--ghost" data-open="login">Войти</button>
      <button class="btn btn--cta" data-open="register">Пробная</button>
    `;
  } else {
    wrap.innerHTML = `
      <div class="user-chip"><span class="avatar">${user.name[0]}</span><span>${user.name.split(' ')[0]}</span></div>
      <a href="account.html" class="btn btn--ghost">Кабинет</a>
      <button class="btn btn--cta" id="logoutBtn">Выйти</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', Auth.logout);
  }
}

function initAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;
  const open = (tab = 'login') => { modal.hidden = false; switchTab(tab); };
  const close = () => { modal.hidden = true; };
  const switchTab = (name) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('tab--active', t.dataset.tab === name));
    document.querySelectorAll('.auth-form').forEach(f => f.hidden = f.dataset.panel !== name);
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open]');
    if (trigger) {
      const val = trigger.dataset.open;
      if (val === 'login' || val === 'register') { open(val); e.preventDefault(); }
    }
    if (e.target.matches('[data-close]')) close();
  });

  document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => switchTab(t.dataset.tab)));

  document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await Auth.login(fd.get('phone'), fd.get('password'));
    const msg = document.getElementById('authMsg');
    if (res.error) { msg.className = 'form-msg show form-msg--err'; msg.textContent = res.error; }
    else { msg.className = 'form-msg show form-msg--ok'; msg.textContent = 'Успех!'; setTimeout(() => location.href = 'account.html', 500); }
  });

  document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const res = await Auth.register({
      name: fd.get('name'), phone: fd.get('phone'), email: fd.get('email'), password: fd.get('password'), category: fd.get('category')
    });
    const msg = document.getElementById('authMsg');
    if (res.error) { msg.className = 'form-msg show form-msg--err'; msg.textContent = res.error; }
    else { msg.className = 'form-msg show form-msg--ok'; msg.textContent = 'Аккаунт создан!'; setTimeout(() => location.href = 'index.html', 700); }
  });
}

document.addEventListener('DOMContentLoaded', () => { renderHeaderActions(); initAuthModal(); });