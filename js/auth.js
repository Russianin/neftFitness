const Auth = (() => {
  const SESSION = 'neft_current_user';

  const getCurrent = () => {
    const raw = localStorage.getItem(SESSION);
    return raw ? JSON.parse(raw) : null;
  };
  const setCurrent = (user) => {
    if (user) localStorage.setItem(SESSION, JSON.stringify(user));
    else localStorage.removeItem(SESSION);
  };

  const login = (phone, password) => {
    const user = DB.findUserByPhone(phone);
    if (!user) return { error: 'Пользователь не найден' };
    if (user.password !== password) return { error: 'Неверный пароль' };
    setCurrent(user);
    return { user };
  };

  const register = (data) => {
    const res = DB.createUser(data);
    if (res.error) return res;
    setCurrent(res.user);
    return res;
  };

  const logout = () => setCurrent(null);

  return { getCurrent, login, register, logout };
})();

function renderHeaderActions() {
  const wrap = document.getElementById('headerActions');
  if (!wrap) return;
  const user = Auth.getCurrent();

  if (!user) {
    wrap.innerHTML = `
      <button class="btn btn--ghost" data-open="login">Войти</button>
      <button class="btn btn--cta" data-open="register">Пробная</button>
    `;
  } else {
    const initials = user.name.trim().charAt(0).toUpperCase();
    wrap.innerHTML = `
      <div class="user-chip">
        <span class="avatar">${initials}</span>
        <span>${user.name.split(' ')[0]}</span>
      </div>
      <a href="account.html" class="btn btn--ghost">Кабинет</a>
      <button class="btn btn--cta" id="logoutBtn">Выйти</button>
    `;
    document.getElementById('logoutBtn').addEventListener('click', () => {
      Auth.logout();
      location.href = 'index.html';
    });
  }
}

function initAuthModal() {
  const modal = document.getElementById('authModal');
  if (!modal) return;

  const open = (tab = 'login') => {
    modal.hidden = false;
    switchTab(tab);
    const msg = document.getElementById('authMsg');
    msg.className = 'form-msg';
    msg.textContent = '';
  };
  const close = () => { modal.hidden = true; };

  const switchTab = (name) => {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('tab--active', t.dataset.tab === name));
    document.querySelectorAll('.auth-form').forEach(f => f.hidden = f.dataset.panel !== name);
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open]');
    if (trigger) {
      const val = trigger.dataset.open;
      if (val === 'login' || val === 'register') { open(val); e.preventDefault(); return; }
    }
    if (e.target.matches('[data-close]')) close();
  });

  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => switchTab(t.dataset.tab));
  });

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = Auth.login(fd.get('phone'), fd.get('password'));
      const msg = document.getElementById('authMsg');
      if (res.error) {
        msg.className = 'form-msg show form-msg--err';
        msg.textContent = res.error;
      } else {
        msg.className = 'form-msg show form-msg--ok';
        msg.textContent = 'Успешный вход. Перенаправляем...';
        setTimeout(() => location.href = 'account.html', 600);
      }
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const res = Auth.register({
        name: fd.get('name').trim(),
        phone: fd.get('phone').trim(),
        email: fd.get('email').trim(),
        password: fd.get('password'),
        category: fd.get('category')
      });
      const msg = document.getElementById('authMsg');
      if (res.error) {
        msg.className = 'form-msg show form-msg--err';
        msg.textContent = res.error;
      } else {
        msg.className = 'form-msg show form-msg--ok';
        msg.textContent = 'Аккаунт создан! Переходим в кабинет...';
        setTimeout(() => location.href = 'account.html', 700);
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderHeaderActions();
  initAuthModal();
});