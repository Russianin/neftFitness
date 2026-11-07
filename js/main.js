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
    { title: 'Тренажёрный зал', desc: 'Силовые и кардио-тренажёры, зона свободных весов.', image: 'img/gym.jpg' },
    { title: 'Бассейн 25м', desc: 'Дорожки 25 метров, аквааэробика, свободное плавание.', image: 'img/pool.webp' },
    { title: 'Групповые программы', desc: 'Йога, пилатес, кроссфит, джампинг — 25+ направлений.', image: 'img/group.jpg' },
    { title: 'Хаммам и сауна', desc: 'Восстановление после тренировок.', image: 'img/sauna.jpg' },
    { title: 'Тренер', desc: 'Индивидуальная программа с тренером.', image: 'img/trener.jpg' }
  ];
  grid.innerHTML = services.map(s => `
      <article class="card card--service">
        <div class="card--service__img">
          <img src="${s.image}" alt="${s.title}" loading="lazy" onerror="this.style.display='none'; this.parentElement.classList.add('fallback-bg'); this.parentElement.innerHTML='<span>${s.title.charAt(0)}</span>';">
        </div>
        <div class="card__content">
          <h3>${s.title}</h3>
          <p>${s.desc}</p>
        </div>
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

  const discountMap = {
    'student': 15,
    'pensioner': 20,
    'child': 25,
    'regular': 10
  };

  grid.innerHTML = memberships.map(m => {
    const canBuy = !user || m.allowed_categories.includes(user.category);
    
    let finalPrice = m.price;
    let hasDiscount = false;
    
    if (user && discountMap[user.category]) {
      const discountPercent = discountMap[user.category];
      finalPrice = Math.round(m.price * (1 - discountPercent / 100));
      hasDiscount = true;
    }

    const priceHTML = hasDiscount 
      ? `<span style="text-decoration:line-through; color:var(--text-dim); font-size:24px; margin-right:8px;">${m.price.toLocaleString('ru-RU')} ₽</span><span style="color:var(--burgundy); font-weight:bold;">${finalPrice.toLocaleString('ru-RU')} ₽</span>`
      : `${m.price.toLocaleString('ru-RU')} ₽`;

    return `
      <article class="card card--membership">
        <h3 style="font-family:'Bebas Neue';font-size:26px;text-transform:uppercase;margin-bottom:8px;">${m.title}</h3>
        <div class="price">${priceHTML}<small>/${m.period}</small></div>
        
        ${hasDiscount ? `<p style="color:var(--burgundy); font-size:12px; margin-bottom:12px; font-weight:bold;">Скидка ${discountMap[user.category]}%</p>` : ''}
        
        <ul class="features">${m.features.map(f => `<li>${f}</li>`).join('')}</ul>
        
        <button class="btn ${canBuy ? 'btn--cta' : 'btn--ghost'}" 
                data-buy="${m.id}" 
                data-price="${finalPrice}" 
                ${canBuy ? '' : 'disabled'}>
          ${canBuy ? 'Выбрать' : 'Недоступно'}
        </button>
      </article>`;
  }).join('');

  grid.querySelectorAll('[data-buy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!await Auth.getCurrent()) { 
        document.querySelector('[data-open="login"]')?.click(); 
        return; 
      }
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
    grid.innerHTML = reviews.length ? reviews.map(r => `
      <article class="review">
        <div class="review__stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
        <p class="review__text">${r.text}</p>
        <div class="review__author">${r.author}</div>
      </article>
    `).join('') : '<p class="empty">Пока нет отзывов.</p>';
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
    const text = document.getElementById('reviewText').value.trim();
    const rating = document.getElementById('reviewRating').value;
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, rating }),
      credentials: 'include'
    });
    if (res.ok) { 
      form.reset(); 
      renderReviews(); 
      alert('Спасибо за отзыв!'); 
    } else {
      alert('Ошибка! Войдите в аккаунт.');
    }
  });
}

let pendingBuyId = null, pendingPrice = null;

function openBuyModal(id, price) {
  pendingBuyId = id; 
  pendingPrice = price;
  document.getElementById('buyTitle').textContent = 'Оформление';
  document.getElementById('buyInfo').innerHTML = `
    <p>Вы выбрали абонемент.</p>
    <p style="margin-top:8px;font-size:18px">Итого к оплате: <strong>${price.toLocaleString('ru-RU')} ₽</strong></p>
  `;
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
      msg.className = 'form-msg show form-msg--ok'; 
      msg.textContent = 'Абонемент оформлен! Переходим в кабинет...';
      setTimeout(() => location.href = 'account.html', 1200);
    } else {
      msg.className = 'form-msg show form-msg--err'; 
      msg.textContent = 'Ошибка покупки (возможно, нет авторизации)';
    }
  });
  modal.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', () => modal.hidden = true));
}