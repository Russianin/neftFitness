const DB = (() => {
  const KEY = 'neft_db';

  const seed = () => ({
    users: [
      {
        id: 1, name: 'Администратор', phone: '+7 999 000-00-00',
        email: 'admin@neft.fit', password: 'admin123',
        role: 'admin', category: 'regular', createdAt: '2026-01-01'
      },
      {
        id: 2, name: 'Иван Петров', phone: '+7 999 111-11-11',
        email: 'ivan@mail.ru', password: 'user123',
        role: 'user', category: 'regular', createdAt: '2026-02-10'
      }
    ],

    // Услуги (направления). Теперь с реальными фото!
    services: [
      { 
        id: 1, 
        title: 'Тренажёрный зал', 
        desc: 'Силовые и кардио-тренажёры, зона свободных весов.', 
        image: 'https://www.worldclass.ru/upload/resize_cache/iblock/f6a/1300_760_0/dsc_3.jpg', 
        membershipIds: [1,3,4,5,6] 
      },
      { 
        id: 2, 
        title: 'Бассейн 25м', 
        desc: 'Дорожки 25 метров, аквааэробика, свободное плавание. В подарок к абонементам.', 
        image: 'https://www.gorabelaya.ru/upload/iblock/a7e/5h82okjy2p11z7fgvrmisujy0wp00x07.JPG', 
        membershipIds: [3,4,5,6] 
      },
      { 
        id: 3, 
        title: 'Групповые программы', 
        desc: 'Йога, пилатес, кроссфит, джампинг — 25+ направлений.', 
        image: 'https://special.worldclass-kgd.ru/upload/iblock/ec8/kd35k05au7eu81bl9x1aldrwd8cimh7y.webp', 
        membershipIds: [1,3,4,5,6] 
      },
      { 
        id: 4, 
        title: 'Хаммам и сауна', 
        desc: 'Восстановление после тренировок.', 
        image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRWGJbc0UJTuToqCPFittPcqgjOyXHYAK7uwSI3ct-_CCja47XNhepnkryH&s=10', 
        membershipIds: [1,6] 
      },
      { 
        id: 5, 
        title: 'Персональный тренер', 
        desc: 'Индивидуальная программа с тренером.', 
        image: 'https://profi.ru/static/img/preg-landing/sprt.jpg', 
        membershipIds: [1,2,4,5,6] 
      }
    ],

    // 6 тарифов с ваших скриншотов
    memberships: [
      {
        id: 1, title: 'Гостевой / Разовый', price: 1000, period: 'раз',
        tag: '', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'С тренером', on: true },
          { text: 'Групповой зал', on: true },
          { text: 'Тренажёрный зал', on: true },
          { text: 'Хаммам', on: true }
        ]
      },
      {
        id: 2, title: 'Тренер', price: 1000, period: 'от', priceFrom: true,
        tag: '', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'Одно персональное занятие', on: true },
          { text: 'С тренером', on: true }
        ]
      },
      {
        id: 3, title: '1 месяц', price: 1500, period: 'мес',
        tag: '', hit: true, hitColor: 'orange', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'Безлимит подписка', on: true },
          { text: 'Групповой зал', on: true },
          { text: 'Тренажёрный зал', on: true },
          { text: '+ В ПОДАРОК — БАССЕЙН', on: true, accent: true }
        ]
      },
      {
        id: 4, title: '1 месяц + 5 ПТ', price: 5000, period: 'мес',
        tag: '', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'Безлимит подписка', on: true },
          { text: '+5 занятий с тренером', on: true },
          { text: 'Групповой зал', on: true },
          { text: 'Тренажёрный зал', on: true },
          { text: '+ В ПОДАРОК — БАССЕЙН', on: true, accent: true }
        ]
      },
      {
        id: 5, title: '1 месяц + 10 ПТ', price: 8000, period: 'мес',
        tag: '', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'Безлимит подписка', on: true },
          { text: '+10 занятий с тренером', on: true },
          { text: 'Групповой зал', on: true },
          { text: 'Тренажёрный зал', on: true },
          { text: '+ В ПОДАРОК — БАССЕЙН', on: true, accent: true }
        ]
      },
      {
        id: 6, title: '12 месяцев', price: 11500, period: 'год',
        tag: '', allowedCategories: ['regular','student','pensioner','child'],
        features: [
          { text: 'Безлимитный', on: true },
          { text: '+1 занятие с тренером', on: true },
          { text: 'Групповой зал', on: true },
          { text: 'Тренажёрный зал', on: true },
          { text: '+ В ПОДАРОК — БАССЕЙН', on: true, accent: true }
        ]
      }
    ],

    discounts: [
      { id: 1, title: 'Пенсионерам', percent: 20, category: 'pensioner', desc: 'Скидка 20% на любой абонемент при предъявлении пенсионного удостоверения.' },
      { id: 2, title: 'Студентам', percent: 15, category: 'student', desc: 'Скидка 15% при предъявлении студенческого билета.' },
      { id: 3, title: 'Детям до 14 лет', percent: 25, category: 'child', desc: 'Скидка 25% на детские абонементы и секции.' },
      { id: 4, title: 'Приведи друга', percent: 10, category: 'regular', desc: 'Скидка 10% обоим при покупке абонемента другом.' }
    ],

    reviews: [
      { id: 1, userId: 2, author: 'Иван П.', rating: 5, text: 'Отличный зал, хожу в бассейн — вода чистая, дорожки свободные. Тренеры внимательные.', date: '2026-09-12' },
      { id: 2, userId: null, author: 'Мария', rating: 5, text: 'Купила абонемент на месяц — идеально для меня, успеваю до работы. Персонал приветливый.', date: '2026-09-20' },
      { id: 3, userId: null, author: 'Сергей', rating: 4, text: 'Хороший клуб, но вечером в тренажёрном бывает тесновато. В целом рекомендую.', date: '2026-10-01' }
    ],

    purchases: [
      { id: 1, userId: 2, membershipId: 3, price: 1500, status: 'active', purchasedAt: '2026-10-01', expiresAt: '2026-11-01' }
    ],

    nextIds: { user: 3, purchase: 2, review: 4 }
  });

  const load = () => {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const data = seed();
      localStorage.setItem(KEY, JSON.stringify(data));
      return data;
    }
    const data = JSON.parse(raw);
    const fresh = seed();
    let changed = false;
    
    // Принудительное обновление услуг, если старые данные без картинок
    if (!data.services || data.services[0].image === undefined || data.services[0].image.includes('unsplash')) {
      data.services = fresh.services;
      changed = true;
    }
    if (changed) localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  };
  const save = (data) => localStorage.setItem(KEY, JSON.stringify(data));

  return {
    get: load,
    save,

    findUserByPhone(phone) {
      return load().users.find(u => u.phone.replace(/\s/g,'') === phone.replace(/\s/g,''));
    },
    createUser({ name, phone, email, password, category }) {
      const data = load();
      if (this.findUserByPhone(phone)) return { error: 'Пользователь с таким телефоном уже есть' };
      const user = {
        id: data.nextIds.user++, name, phone, email, password,
        role: 'user', category: category || 'regular',
        createdAt: new Date().toISOString().slice(0,10)
      };
      data.users.push(user);
      save(data);
      return { user };
    },

    addPurchase(userId, membershipId) {
      const data = load();
      const m = data.memberships.find(x => x.id === membershipId);
      if (!m) return { error: 'Абонемент не найден' };
      const user = data.users.find(u => u.id === userId);
      if (!user) return { error: 'Пользователь не найден' };
      if (!m.allowedCategories.includes(user.category)) {
        return { error: 'Этот абонемент недоступен для вашей категории' };
      }
      const discount = data.discounts.find(d => d.category === user.category);
      const price = discount ? Math.round(m.price * (1 - discount.percent/100)) : m.price;

      const now = new Date();
      const expires = new Date(now);
      if (m.id === 6) expires.setFullYear(expires.getFullYear() + 1);
      else expires.setMonth(expires.getMonth() + 1);

      const purchase = {
        id: data.nextIds.purchase++, userId, membershipId, price,
        status: 'active',
        purchasedAt: now.toISOString().slice(0,10),
        expiresAt: expires.toISOString().slice(0,10)
      };
      data.purchases.push(purchase);
      save(data);
      return { purchase };
    },
    getPurchases(userId) {
      const data = load();
      return data.purchases.filter(p => p.userId === userId)
        .map(p => ({ ...p, membership: data.memberships.find(m => m.id === p.membershipId) }));
    },

    addReview(userId, author, rating, text) {
      const data = load();
      const review = {
        id: data.nextIds.review++, userId, author,
        rating: Number(rating), text, date: new Date().toISOString().slice(0,10)
      };
      data.reviews.unshift(review);
      save(data);
      return review;
    },

    getServices: () => load().services,
    getMemberships: () => load().memberships,
    getDiscounts: () => load().discounts,
    getReviews: () => load().reviews,
    getAllUsers: () => load().users,
    getAllPurchases: () => load().purchases,

    setUserRole(userId, role) {
      const data = load();
      const u = data.users.find(x => x.id === userId);
      if (u) { u.role = role; save(data); }
    },
    deleteReview(reviewId) {
      const data = load();
      data.reviews = data.reviews.filter(r => r.id !== reviewId);
      save(data);
    }
  };
})();