document.addEventListener('DOMContentLoaded', () => {
  renderServices();
  renderMemberships();
  renderDiscounts();
  renderReviews();
  initBuyModal();
  initReviewForm();
});

/* ---------- Услуги ---------- */
function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;

  grid.innerHTML = DB.getServices().map(s => {
    return `
      <article class="card card--service">
        <div class="card--service__img">
          <img src="${s.image}" alt="${s.title}" loading="lazy">
        </div>
        <div class="card__content">
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>
      </article>`;
  }).join('');
}

/* ---------- Абонементы ---------- */
function renderMemberships() {
  const grid = document.getElementById('membershipsGrid');
  if (!grid) return;
  const user = Auth.getCurrent();
  const discounts = DB.getDiscounts();

  grid.innerHTML = DB.getMemberships().map(m => {
    const disc = user ? discounts.find(d => d.category === user.category) : null;
    const finalPrice = disc ? Math.round(m.price * (1 - disc.percent/100)) : m.price;
    const canBuy = !user || m.allowedCategories.includes(user.category);
    const pricePrefix = m.priceFrom ? 'от ' : '';

    return `
      <article class="card card--membership">
        <h3 style="font-family:'Bebas Neue';font-size:26px;text-transform:uppercase;margin-bottom:8px;">${m.title}</h3>
        <div class="price">
          ${pricePrefix}${finalPrice.toLocaleString('ru-RU')} ₽
          <small>/${m.period}</small>
          ${disc ? `<div style="font-size:16px;color:var(--text-dim);text-decoration:line-through;margin-top:4px;">${m.price.toLocaleString('ru-RU')} ₽</div>` : ''}
        </div>
        
        ${disc ? `<p style="color:var(--burgundy);font-size:13px;font-weight:600;margin-bottom:16px;">Скидка ${disc.percent}% (${disc.title})</p>` : ''}
        
        <ul class="features">
          ${m.features.map(f => `<li>${f.text}</li>`).join('')}
        </ul>
        
        <button class="btn ${canBuy ? 'btn--cta' : 'btn--ghost'}"
                data-buy="${m.id}" ${canBuy ? '' : 'disabled'}>
          ${canBuy ? 'Выбрать' : 'Недоступно'}
        </button>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', () => {
      const user = Auth.getCurrent();
      if (!user) {
        document.querySelector('[data-open="login"]')?.click();
        return;
      }
      openBuyModal(Number(btn.dataset.buy));
    });
  });
}

/* ---------- Скидки ---------- */
function renderDiscounts() {
  const grid = document.getElementById('discountsGrid');
  if (!grid) return;
  grid.innerHTML = DB.getDiscounts().map(d => `
    <article class="card" style="text-align:center;align-items:center;">
      <div style="font-family:'Bebas Neue';font-size:48px;color:var(--burgundy);line-height:1;margin-bottom:12px;">${d.percent}%</div>
      <h3>${d.title}</h3>
      <p style="margin-top:12px;">${d.desc}</p>
    </article>
  `).join('');
}

/* ---------- Отзывы ---------- */
function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  const reviews = DB.getReviews();
  grid.innerHTML = reviews.length ? reviews.map(r => `
    <article class="review">
      <div class="review__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <p class="review__text">${r.text}</p>
      <div class="review__author">${r.author}</div>
      <div class="review__date">${r.date}</div>
    </article>
  `).join('') : '<p class="empty">Пока нет отзывов.</p>';
}

/* ---------- Форма отзыва ---------- */
function initReviewForm() {
  const wrap = document.getElementById('reviewFormWrap');
  const form = document.getElementById('reviewForm');
  if (!wrap || !form) return;

  const user = Auth.getCurrent();
  if (user) wrap.hidden = false;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = Auth.getCurrent();
    if (!user) return;
    const text = document.getElementById('reviewText').value.trim();
    const rating = document.getElementById('reviewRating').value;
    if (text.length < 10) return alert('Отзыв слишком короткий');
    DB.addReview(user.id, user.name, rating, text);
    form.reset();
    renderReviews();
    alert('Спасибо за отзыв!');
  });
}

/* ---------- Покупка абонемента ---------- */
let pendingBuyId = null;

function openBuyModal(id) {
  const user = Auth.getCurrent();
  const m = DB.getMemberships().find(x => x.id === id);
  if (!m || !user) return;

  const disc = DB.getDiscounts().find(d => d.category === user.category);
  const finalPrice = disc ? Math.round(m.price * (1 - disc.percent/100)) : m.price;

  pendingBuyId = id;
  document.getElementById('buyTitle').textContent = 'Оформление: ' + m.title;
  document.getElementById('buyInfo').innerHTML = `
    <p>Клиент: <strong>${user.name}</strong></p>
    <p>Категория: <strong>${user.category}</strong></p>
    <p>Цена: <strong>${m.price.toLocaleString('ru-RU')} ₽</strong></p>
    ${disc ? `<p>Скидка «${disc.title}»: <strong>−${disc.percent}%</strong></p>` : ''}
    <p style="margin-top:8px;font-size:18px">Итого: <strong>${finalPrice.toLocaleString('ru-RU')} ₽</strong></p>
  `;
  const msg = document.getElementById('buyMsg');
  msg.className = 'form-msg';
  msg.textContent = '';
  document.getElementById('buyModal').hidden = false;
}

function initBuyModal() {
  const modal = document.getElementById('buyModal');
  if (!modal) return;

  document.getElementById('buyConfirm').addEventListener('click', () => {
    const user = Auth.getCurrent();
    if (!user || !pendingBuyId) return;
    const res = DB.addPurchase(user.id, pendingBuyId);
    const msg = document.getElementById('buyMsg');
    if (res.error) {
      msg.className = 'form-msg show form-msg--err';
      msg.textContent = res.error;
    } else {
      msg.className = 'form-msg show form-msg--ok';
      msg.textContent = `Абонемент оформлен! Сумма: ${res.purchase.price.toLocaleString('ru-RU')} ₽. Переходим в кабинет...`;
      setTimeout(() => location.href = 'account.html', 1200);
    }
  });

  modal.querySelectorAll('[data-close]').forEach(el =>
    el.addEventListener('click', () => modal.hidden = true)
  );
}