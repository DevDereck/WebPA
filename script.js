// Debounce para eventos de resize
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Observador de intersección para elementos lazy (si existen)
if ('IntersectionObserver' in window && document.querySelectorAll('img[data-src]').length) {
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        imageObserver.unobserve(img);
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => imageObserver.observe(img));
}

// Cache para el servicio calculado con timestamp para invalidar cada minuto
let cachedNextService = null;
let cacheTime = 0;

// Función para calcular el próximo servicio
function calculateNextService() {
  const now = new Date();
  const nowTime = now.getTime();
  
  // Invalidar cache cada minuto
  if (cachedNextService && (nowTime - cacheTime) < 60000) {
    return cachedNextService;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysOfWeek = today.getDay();
  const currentHour = now.getHours() + now.getMinutes() / 60;
  
  const SUNDAY_TIME = 9.5; // 9:30 AM
  const TUESDAY_TIME = 19; // 7:00 PM
  let nextService = new Date(today);
  
  // Si hoy es domingo
  if (daysOfWeek === 0) {
    // Entre las 8:30 AM y las 9:30 AM: mostrar minutos que faltan
    if (currentHour >= 8.5 && currentHour < SUNDAY_TIME) {
      const minutesUntilService = Math.ceil((SUNDAY_TIME - currentHour) * 60);
      const plural = minutesUntilService === 1 ? 'minuto' : 'minutos';
      cachedNextService = `Hoy · Faltan ${minutesUntilService} ${plural}`;
      cacheTime = nowTime;
      return cachedNextService;
    }
    
    // Antes de las 8:30 AM: mostrar hora del servicio
    if (currentHour < SUNDAY_TIME) {
      nextService.setHours(9, 30, 0, 0);
      cachedNextService = formatServiceDate(nextService);
      cacheTime = nowTime;
      return cachedNextService;
    }
  }
  
  // Si hoy es martes
  if (daysOfWeek === 2) {
    // Entre las 6:00 PM y las 7:00 PM: mostrar minutos que faltan
    if (currentHour >= 18 && currentHour < TUESDAY_TIME) {
      const minutesUntilService = Math.ceil((TUESDAY_TIME - currentHour) * 60);
      const plural = minutesUntilService === 1 ? 'minuto' : 'minutos';
      cachedNextService = `Hoy · Faltan ${minutesUntilService} ${plural}`;
      cacheTime = nowTime;
      return cachedNextService;
    }
    
    // Antes de las 6:00 PM: mostrar hora del servicio
    if (currentHour < TUESDAY_TIME) {
      nextService.setHours(19, 0, 0, 0);
      cachedNextService = formatServiceDate(nextService);
      cacheTime = nowTime;
      return cachedNextService;
    }
  }
  
  // Calcular próximo servicio
  if (daysOfWeek < 2) {
    // Antes del martes: próximo es el martes
    nextService.setDate(today.getDate() + (2 - daysOfWeek));
    nextService.setHours(19, 0, 0, 0);
  } else if (daysOfWeek === 2) {
    // Ya pasó el martes: próximo es el domingo
    nextService.setDate(today.getDate() + (7 - daysOfWeek));
    nextService.setHours(9, 30, 0, 0);
  } else if (daysOfWeek < 7) {
    // Después del martes: próximo es el domingo
    nextService.setDate(today.getDate() + (7 - daysOfWeek));
    nextService.setHours(9, 30, 0, 0);
  }
  
  cachedNextService = formatServiceDate(nextService);
  cacheTime = nowTime;
  return cachedNextService;
}

function formatServiceDate(date) {
  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  const dateStr = new Intl.DateTimeFormat('es-ES', options).format(date);
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const hours12 = hours % 12 || 12;
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  const time = `${hours12}:${minutes} ${ampm}`;
  return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)} · ${time}`;
}

const menuToggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('mainNav');
const detailPanel = document.getElementById('detalleMinisterio');
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const galleryInfo = document.getElementById('galleryInfo');

// Actualizar el servicio cuando carga la página
document.addEventListener('DOMContentLoaded', () => {
  const nextServiceEl = document.getElementById('nextService');
  if (nextServiceEl) {
    nextServiceEl.textContent = calculateNextService();
  }

  // Inicializar menú hamburguesa
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      nav.classList.toggle('is-open');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => nav.classList.remove('is-open'));
    });
  }

  // Actualizar año en copyright automáticamente
  const copyrightEl = document.getElementById('copyright');
  if (copyrightEl) {
    const currentYear = new Date().getFullYear();
    copyrightEl.textContent = `© ${currentYear} Iglesia Cristiana Piedra Angular. Todos los derechos reservados.`;
  }
    // Reemplazar icono de Instagram por uno más simple (si aparece como SVG problemático)
    const instaSvg = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm5 6.5a4 4 0 1 0 0 8.001A4 4 0 0 0 12 8.5zm4.75-2.25a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5z"/></svg>';
    document.querySelectorAll('a.social-icon[aria-label="Instagram"]').forEach(a => {
      try { a.innerHTML = instaSvg; } catch (e) { /* ignore */ }
    });
  // Inicializar sliders en elementos marcados
  try { initSliders(); } catch (e) { /* fail silently */ }
});

function setDetail({ nombre, horario, contacto, descripcion }) {
  detailPanel.innerHTML = `
    <h4>${nombre}</h4>
    <p class="muted">Reuniones: ${horario}</p>
    <p class="muted">Contacto: ${contacto}</p>
    <p class="muted">${descripcion}</p>
  `;
  
  // Scroll suave hacia el panel de detalles
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Usar event delegation para ministerios
document.querySelector('.grid.grid--3')?.addEventListener('click', (e) => {
  const card = e.target.closest('.ministry');
  if (card) {
    const nombre = card.dataset.ministry;
    setDetail({
      nombre,
      horario: card.dataset.horario,
      contacto: card.dataset.contacto,
      descripcion: card.querySelector('p')?.textContent || 'Conoce más con nuestro equipo.'
    });
  }
});

// Mapeo de ministerios a URLs
const ministryURLs = {
  'Alabanza': 'alabanza.html',
  'PETRA': 'petra.html',
  'Niños': 'rockids.html',
  'Discipulado': 'discipulado.html',
  'Misiones': 'misiones.html',
  'Piedras Preciosas': 'piedras-preciosas.html'
};

const galleryDetails = {
  Alabanza: 'Encuentros de adoración en vivo, audiciones y entrenamientos del equipo.',
  Juventud: 'Noches juveniles, campamentos y talleres creativos para líderes en formación.',
  Niños: 'Ambientes seguros con juegos, manualidades y enseñanza bíblica.',
  Familias: 'Charlas, consejería y eventos para fortalecer el hogar.',
  Misiones: 'Proyectos locales y salidas de servicio a comunidades cercanas.',
  Creatividad: 'Producción, diseño y media para compartir el mensaje con excelencia.'
};

// Usar event delegation para galería
document.querySelector('.gallery')?.addEventListener('click', (e) => {
  const item = e.target.closest('.gallery__item');
  if (item) {
    const ministry = item.dataset.ministry;
    const url = ministryURLs[ministry];
    if (url) {
      window.location.href = url;
    }
  }
});

/* Slider initializer for elements marked with data-slider="true" */
function initSliders() {
  const galleries = document.querySelectorAll('[data-slider="true"]');
  if (!galleries.length) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  galleries.forEach((gallery) => {
    if (gallery.dataset._inited) return;
    gallery.dataset._inited = '1';

    // prefer explicit gallery__item, otherwise use direct children as slides
    let items = Array.from(gallery.querySelectorAll('.gallery__item'));
    if (!items.length) {
      // collect direct children that look like slides (exclude controls/dots/track)
      items = Array.from(gallery.querySelectorAll(':scope > *')).filter((el) => {
        return !el.classList.contains('slider-controls') && !el.classList.contains('slider-dots') && !el.classList.contains('gallery__track');
      });
    }
    if (!items.length) return;

    // make items focusable and inject responsive <img> from inline --photo when present
    items.forEach((item) => {
      item.tabIndex = 0;
      if (!item.querySelector('img')) {
        const inlineStyle = item.getAttribute('style') || '';
        const m = inlineStyle.match(/--photo:\s*url\(['"]?(.*?)['"]?\)/i);
        if (m && m[1]) {
          try {
            const img = document.createElement('img');
            img.className = 'gallery__img';
            img.src = m[1];
            img.loading = 'lazy';
            img.alt = item.dataset.ministry || '';
            item.insertBefore(img, item.firstChild);
            // remove the inline custom property so background doesn't duplicate
            item.style.removeProperty('--photo');
          } catch (e) {
            // ignore failures creating images
          }
        }
      }
    });

    // wrap items in track (avoid double-wrap)
    let track = gallery.querySelector('.gallery__track');
    if (!track) {
      track = document.createElement('div');
      track.className = 'gallery__track';
      items.forEach((it) => track.appendChild(it));
      gallery.appendChild(track);
    }

    // controls (create once)
    if (!gallery.querySelector('.slider-controls')) {
      const controls = document.createElement('div');
      controls.className = 'slider-controls';
      const prevBtn = document.createElement('button');
      prevBtn.type = 'button';
      prevBtn.className = 'slider-prev';
      prevBtn.setAttribute('aria-label', 'Anterior');
      prevBtn.innerHTML = '‹';
      const nextBtn = document.createElement('button');
      nextBtn.type = 'button';
      nextBtn.className = 'slider-next';
      nextBtn.setAttribute('aria-label', 'Siguiente');
      nextBtn.innerHTML = '›';
      controls.appendChild(prevBtn);
      controls.appendChild(nextBtn);
      gallery.appendChild(controls);
    }

    // dots
    if (!gallery.querySelector('.slider-dots')) {
      const dotsWrap = document.createElement('div');
      dotsWrap.className = 'slider-dots';
      gallery.appendChild(dotsWrap);
    }

    const dotsWrap = gallery.querySelector('.slider-dots');

    let index = 0;
    let visible = 1;
    let maxIndex = Math.max(0, items.length - visible);
    let autoTimer = null;
    let isHover = false;
    const GAP = 14; // gap in CSS
    const centerMode = gallery.dataset.sliderMode === 'center';

    function recalc() {
      const itemRect = items[0].getBoundingClientRect();
      const galleryWidth = gallery.clientWidth;
      if (centerMode) {
        visible = 1;
        maxIndex = Math.max(0, items.length - 1);
      } else {
        visible = Math.max(1, Math.floor(galleryWidth / (itemRect.width + 0.5)));
        maxIndex = Math.max(0, items.length - visible);
      }
      if (index > maxIndex) index = maxIndex;
      buildDots();
      update();
    }

    function buildDots() {
      dotsWrap.innerHTML = '';
      const pages = centerMode ? (items.length) : (maxIndex + 1);
      for (let i = 0; i < pages; i++) {
        const b = document.createElement('button');
        b.type = 'button';
        if (i === index) b.classList.add('is-active');
        b.addEventListener('click', () => { index = i; update(); resetAutoplay(); });
        dotsWrap.appendChild(b);
      }
    }

    function update() {
      const itemRect = items[0].getBoundingClientRect();
      const itemW = itemRect.width + GAP;
      let translate = 0;
      if (centerMode) {
        const galleryW = gallery.clientWidth;
        const centerOffset = (galleryW - itemRect.width) / 2;
        translate = -index * itemW + centerOffset;
      } else {
        translate = -index * itemW;
      }
      // add animating class to enable blur effect during transition
      gallery.classList.add('is-animating');
      // apply transform (this will trigger CSS transition)
      track.style.transform = `translateX(${translate}px)`;
      // update dots active
      Array.from(dotsWrap.children).forEach((b, i) => b.classList.toggle('is-active', i === index));
      // mark active slide for styling and ensure focused slide is in view
      items.forEach((el, i) => el.classList.toggle('is-active', i === index));

      // remove animating class when transition ends (or fallback timeout)
      const onEnd = () => {
        gallery.classList.remove('is-animating');
        track.removeEventListener('transitionend', onEnd);
        if (gallery._animTimeout) { clearTimeout(gallery._animTimeout); gallery._animTimeout = null; }
      };
      track.addEventListener('transitionend', onEnd);
      if (gallery._animTimeout) clearTimeout(gallery._animTimeout);
      gallery._animTimeout = setTimeout(() => { gallery.classList.remove('is-animating'); }, 900);
    }

    function prev() {
      index = Math.max(0, index - 1);
      update();
      resetAutoplay();
    }

    function next() {
      index = Math.min(maxIndex, index + 1);
      if (index >= maxIndex) index = (index === maxIndex ? 0 : index);
      update();
      resetAutoplay();
    }

    const prevBtn = gallery.querySelector('.slider-prev');
    const nextBtn = gallery.querySelector('.slider-next');
    prevBtn && prevBtn.addEventListener('click', prev);
    nextBtn && nextBtn.addEventListener('click', next);

    // autoplay
    function startAutoplay() {
      if (prefersReduced) return;
      stopAutoplay();
      autoTimer = setInterval(() => {
        if (!isHover) {
          index = index >= maxIndex ? 0 : index + 1;
          update();
        }
      }, 4500);
    }

    function stopAutoplay() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    function resetAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    // pause on hover/focus
    gallery.addEventListener('mouseenter', () => { isHover = true; stopAutoplay(); });
    gallery.addEventListener('mouseleave', () => { isHover = false; startAutoplay(); });
    gallery.addEventListener('focusin', () => { isHover = true; stopAutoplay(); });
    gallery.addEventListener('focusout', () => { isHover = false; startAutoplay(); });

    // keyboard navigation: left/right when gallery focused
    gallery.tabIndex = 0;
    gallery.setAttribute('role', 'region');
    gallery.setAttribute('aria-label', gallery.getAttribute('aria-label') || 'Galería deslizante');
    gallery.addEventListener('keydown', (ev) => {
      if (ev.key === 'ArrowLeft') { ev.preventDefault(); prev(); }
      if (ev.key === 'ArrowRight') { ev.preventDefault(); next(); }
    });

    // focus on individual slides sets index
    items.forEach((it, ii) => {
      it.addEventListener('focus', () => { index = ii; update(); });
    });

    // touch / swipe support
    let startX = 0;
    let deltaX = 0;
    gallery.addEventListener('touchstart', (ev) => {
      startX = ev.touches[0].clientX;
      deltaX = 0;
      stopAutoplay();
    }, { passive: true });
    gallery.addEventListener('touchmove', (ev) => {
      deltaX = ev.touches[0].clientX - startX;
    }, { passive: true });
    gallery.addEventListener('touchend', () => {
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) next(); else prev();
      }
      deltaX = 0;
      startAutoplay();
    });

    // resize handling
    const onResize = debounce(() => recalc(), 120);
    window.addEventListener('resize', onResize);

    // initial setup
    // ensure track has will-change for smooth animation
    track.style.transition = prefersReduced ? 'none' : 'transform 0.48s cubic-bezier(.22,.94,.35,1)';
    track.style.willChange = 'transform';
    // small timeout to allow layout
    setTimeout(() => {
      recalc();
      startAutoplay();
    }, 50);
  });
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  
  const nombre = form.nombre.value.trim();
  const correo = form.email.value.trim();
  const telefono = form.phone.value.trim();
  const ministerio = form.ministerio.value;
  const mensaje = form.message.value.trim();

  if (!nombre || !correo || !ministerio || !mensaje) {
    showStatus('Por favor completa todos los campos obligatorios.', false);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    showStatus('Ingresa un correo electrónico válido.', false);
    return;
  }

  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Enviando...';

  try {
    const response = await fetch('https://formsubmit.co/ajax/dereckvargas500@gmail.com', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        nombre: nombre,
        email: correo,
        phone: telefono,
        ministerio: ministerio,
        message: mensaje
      })
    });

    if (response.ok) {
      showStatus(`¡Gracias, ${nombre}! Hemos recibido tu mensaje.`, true);
      form.reset();
      document.getElementById('formStatus').style.display = 'block';
      setTimeout(() => {
        document.getElementById('formStatus').style.display = 'none';
      }, 5000);
    } else {
      showStatus('Error al enviar. Intenta nuevamente.', false);
    }
  } catch (error) {
    console.error('Error:', error);
    showStatus('Error de conexión. Intenta nuevamente.', false);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

function showStatus(text, success) {
  formStatus.textContent = text;
  formStatus.className = 'form__status is-visible ' + (success ? 'form__status--success' : 'form__status--error');
}

// Cerrar nav en mobile cuando se da resize
const mobileMedia = window.matchMedia('(max-width: 768px)');
mobileMedia.addEventListener('change', (e) => {
  if (e.matches && nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
  }
});

// ===== CALENDARIO DE EVENTOS =====
const eventsData = {
  '2026-01-19': { title: 'Culto Dominical', time: '9:30 AM', description: 'Alabanza, enseñanza y comunión' },
  '2026-01-21': { title: 'Estudio Bíblico', time: '7:00 PM', description: 'Crecimiento en la fe' },
  '2026-01-23': { title: 'Alabanza - Ensayo', time: '7:00 PM', description: 'Ministerio de adoración' },
  '2026-01-25': { title: 'PETRA - Jóvenes', time: '4:30 PM', description: 'Encuentro para jóvenes' },
  '2026-01-26': { title: 'Culto Dominical', time: '9:30 AM', description: 'Alabanza, enseñanza y comunión' },
  '2026-01-28': { title: 'Estudio Bíblico', time: '7:00 PM', description: 'Crecimiento en la fe' },
};

let currentCalendarDate = new Date();

const modal = document.getElementById('eventoModal');
const modalOverlay = document.querySelector('.modal__overlay');
const modalClose = document.querySelector('.modal__close');

function openModal(dateStr, eventData) {
  const date = new Date(dateStr);
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  document.getElementById('modalTitle').textContent = eventData.title;
  document.getElementById('modalDate').textContent = `${dayOfWeek[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
  document.getElementById('modalTime').textContent = `⏰ ${eventData.time}`;
  document.getElementById('modalDescription').textContent = eventData.description;
  
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Cerrar con tecla Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modal.classList.contains('is-open')) {
    closeModal();
  }
});

function generateCalendar(date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  
  // Actualizar título
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
  
  // Obtener primer día del mes y cantidad de días
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();
  
  const calendarDays = document.getElementById('calendarDays');
  calendarDays.innerHTML = '';
  
  // Días del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = document.createElement('div');
    day.className = 'calendario__day other-month';
    day.textContent = daysInPrevMonth - i;
    calendarDays.appendChild(day);
  }
  
  // Días del mes actual
  const today = new Date();
  for (let i = 1; i <= daysInMonth; i++) {
    const day = document.createElement('div');
    day.className = 'calendario__day';
    day.textContent = i;
    
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
    
    if (eventsData[dateStr]) {
      day.classList.add('has-event');
      day.style.cursor = 'pointer';
      day.addEventListener('click', () => {
        openModal(dateStr, eventsData[dateStr]);
      });
    }
    
    if (today.getFullYear() === year && today.getMonth() === month && today.getDate() === i) {
      day.classList.add('today');
    }
    
    calendarDays.appendChild(day);
  }
  
  // Días del próximo mes
  const totalCells = calendarDays.children.length;
  const remainingCells = 42 - totalCells;
  for (let i = 1; i <= remainingCells; i++) {
    const day = document.createElement('div');
    day.className = 'calendario__day other-month';
    day.textContent = i;
    calendarDays.appendChild(day);
  }
}

// Inicializar calendario (solo si existe en la página)
const calendarDaysElement = document.getElementById('calendarDays');
if (calendarDaysElement) {
  generateCalendar(currentCalendarDate);

  // Botones de navegación
  const prevMonth = document.getElementById('prevMonth');
  const nextMonth = document.getElementById('nextMonth');
  
  if (prevMonth) {
    prevMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
      generateCalendar(currentCalendarDate);
    });
  }

  if (nextMonth) {
    nextMonth.addEventListener('click', () => {
      currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
      generateCalendar(currentCalendarDate);
    });
  }
}

// ==========================================
// Animaciones de scroll (scroll reveal)
// ==========================================

function initScrollReveal() {
  const candidates = document.querySelectorAll(
    'section, .hero, .card, .gallery__item, .evento-card, .visit, .footer__col'
  );

  if (!candidates.length) return;

  if (!('IntersectionObserver' in window)) {
    candidates.forEach((el) => el.classList.add('reveal-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal-visible');
          obs.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -10% 0px',
    }
  );

  candidates.forEach((el, index) => {
    el.classList.add('reveal');
    // Pequeño retraso escalonado para que la animación se sienta más fluida
    el.style.setProperty('--reveal-delay', `${index * 40}ms`);
    observer.observe(el);
  });
}

// ==========================================
// Cargar automáticamente el último video de YouTube
// ==========================================

/**
 * Obtiene el último video del canal de YouTube automáticamente
 */
async function updateLatestVideo() {
  try {
    const iframe = document.querySelector('.video-player iframe');
    if (!iframe) return;

    // Canal ID de la iglesia
    const channelId = 'UCpjzBxiJlWM92w4RUn3qQRw';
    
    // Intenta con Invidious primero
    try {
      const response = await fetch(
        `https://inv.nadeko.net/api/v1/channels/${channelId}?fields=latestVideos`,
        { signal: AbortSignal.timeout(5000) }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.latestVideos && data.latestVideos.length > 0) {
          const videoId = data.latestVideos[0].videoId;
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
          console.log('✓ Video actualizado:', videoId);
          return;
        }
      }
    } catch (e) {
      console.log('Invidious no disponible, intentando RSS...');
    }

    // Fallback: Intenta con RSS feed
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const corsProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
    
    const response = await fetch(corsProxy, { signal: AbortSignal.timeout(5000) });
    if (response.ok) {
      const data = await response.json();
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, 'text/xml');
      const entry = xml.querySelector('entry');
      
      if (entry) {
        const videoId = entry.querySelector('yt\\:videoId')?.textContent || 
                       entry.querySelector('videoId')?.textContent;
        if (videoId) {
          iframe.src = `https://www.youtube.com/embed/${videoId}`;
          console.log('✓ Video actualizado (RSS):', videoId);
          return;
        }
      }
    }

  } catch (error) {
    console.log('No se pudo obtener el último video. Usando video por defecto.');
  }
}

function onDomReady() {
  updateLatestVideo();
  initScrollReveal();
  const yearSpans = document.querySelectorAll('[data-year]');
  if (yearSpans.length) {
    const year = new Date().getFullYear();
    yearSpans.forEach((el) => {
      el.textContent = year;
    });
  }
}

// Cargar automáticamente al abrir la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDomReady);
} else {
  onDomReady();
}

// Actualizar cada 30 minutos solo el video
setInterval(updateLatestVideo, 1800000);