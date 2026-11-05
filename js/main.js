document.addEventListener('DOMContentLoaded', async () => {
  await renderServices();
  await renderMemberships();
  await renderDiscounts();
  await renderReviews();
  initBuyModal();
  initReviewForm();
});

function renderServices() {
  const grid = document.getElementById('servicesGrid');
  if (!grid) return;
  const services = [
    { title: 'Тренажёрный зал', desc: 'Силовые и кардио-тренажёры.', image: 'https://www.worldclass.ru/upload/resize_cache/iblock/f6a/1300_760_0/dsc_3.jpg' },
    { title: 'Бассейн 25м', desc: 'Дорожки 25 метров.', image: 'https://www.gorabelaya.ru/upload/iblock/a7e/5h82okjy2p11z7fgvrmisujy0wp00x07.JPG' },
    { title: 'Групповые программы', desc: 'Йога, пилатес, кроссфит.', image: 'https://special.worldclass-kgd.ru/upload/iblock/ec8/kd35k05au7eu81bl9x1aldrwd8cimh7y.webp' },
    { title: 'Хаммам и сауна', desc: 'Восстановление.', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWGJbc0UJTuToqCPFittPcqgjOyXHYAK7uwSI3ct-_CCja47XNhepnkryH&s=10' },
    { title: 'Тренер', desc: 'Индивидуально.', image: 'https://profi.ru/static/img/preg-landing/sprt.jpg' }
  ];
  grid.innerHTML = services.map(s => `
      <article class="card card--service">
        <div class="card--service__img"><img src="${s.image}" alt="${s.title}" loading="lazy" onerror="this.parentElement.classList.add('fallback-bg'); this.parentElement.innerHTML='<span>${s.title[0]}</span>';"></div>
        <div class="card__content"><h3>${s.title}</h3><p>${s.desc}</p></div>
      </article>
  `).join('');
}

async function renderMemberships() {
  const grid = document.getElementById('membershipsGrid');
  if (!grid) return;
  const user = await Auth.getCurrent();
  
  let memberships = [];
  try {
    const res = await fetch('/api/memberships');
    if (!res.ok) throw new Error();
    memberships = await res.json();
    localStorage.setItem('neft_cached_memberships', JSON.stringify(memberships));
  } catch (e) {
    const cached = localStorage.getItem('neft_cached_memberships');
    if (cached) memberships = JSON.parse(cached);
  }

  grid.innerHTML = memberships.map(m => {
    const canBuy = !user || m.allowed_categories.includes(user.category);
    return `
      <article class="card card--membership">
        <h3 style="font-family:'Bebas Neue';font-size:26px;text-transform:uppercase;margin-bottom:8px;">${m.title}</h3>
        <div class="price">${m.price.toLocaleString('ru-RU')} ₽<small>/${m.period}</small></div>
        <ul class="features">${m.features.map(f => `<li>${f}</li>`).join('')}</ul>
        <button class="btn ${canBuy ? 'btn--cta' : 'btn--ghost'}" data-buy="${m.id}" data-price="${m.price}" ${canBuy ? '' : 'disabled'}>
          ${canBuy ? 'Выбрать' : 'Недоступно'}
        </button>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!await Auth.getCurrent()) { document.querySelector('[data-open="login"]')?.click(); return; }
      openBuyModal(Number(btn.dataset.buy), Number(btn.dataset.price));
    });
  });
}

async function renderDiscounts() {
  const grid = document.getElementById('discountsGrid');
  if (!grid) return;
  let discounts = [];
  try {
    const res = await fetch('/api/discounts');
    discounts = await res.json();
    localStorage.setItem('neft_cached_discounts', JSON.stringify(discounts));
  } catch (e) {
    const cached = localStorage.getItem('neft_cached_discounts');
    if (cached) discounts = JSON.parse(cached);
  }
  grid.innerHTML = discounts.map(d => `
    <article class="card" style="text-align:center;align-items:center;">
      <div style="font-family:'Bebas Neue';font-size:48px;color:var(--burgundy);">${d.percent}%</div>
      <h3>${d.title}</h3><p>${d.description}</p>
    </article>
  `).join('');
}

async function renderReviews() {
  const grid = document.getElementById('reviewsGrid');
  if (!grid) return;
  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();
    grid.innerHTML = reviews.map(r => `
      <article class="review">
        <div class="review__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        <p class="review__text">${r.text}</p>
        <div class="review__author">${r.author}</div>
      </article>
    `).join('');
  } catch (e) {
    grid.innerHTML = '<p class="empty">Не удалось загрузить отзывы</p>';
  }
}

async function initReviewForm() {
  const wrap = document.getElementById('reviewFormWrap');
  const form = document.getElementById('reviewForm');
  if (!wrap || !form) return;
  if (await Auth.getCurrent()) wrap.hidden = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: document.getElementById('reviewText').value, rating: document.getElementById('reviewRating').value }),
      credentials: 'include'
    });
    if (res.ok) { form.reset(); renderReviews(); alert('Спасибо!'); }
    else alert('Ошибка! Войдите в аккаунт.');
  });
}

let pendingBuyId = null, pendingPrice = null;
function openBuyModal(id, price) {
  pendingBuyId = id; pendingPrice = price;
  document.getElementById('buyTitle').textContent = 'Оформление';
  document.getElementById('buyInfo').innerHTML = `<p>Итого: <strong>${price.toLocaleString('ru-RU')} ₽</strong></p>`;
  document.getElementById('buyModal').hidden = false;
}

function initBuyModal() {
  const modal = document.getElementById('buyModal');
  if (!modal) return;
  document.getElementById('buyConfirm').addEventListener('click', async () => {
    const res = await fetch('/api/purchases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ membershipId: pendingBuyId, price: pendingPrice }),
      credentials: 'include'
    });
    const msg = document.getElementById('buyMsg');
    if (res.ok) {
      msg.className = 'form-msg show form-msg--ok'; msg.textContent = 'Успешно!';
      setTimeout(() => location.href = 'account.html', 1000);
    } else {
      msg.className = 'form-msg show form-msg--err'; msg.textContent = 'Ошибка (нужна авторизация)';
    }
  });
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => modal.hidden = true));
}