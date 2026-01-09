// Lazy load para iframes de maps
window.addEventListener('load', () => {
  const iframes = document.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    iframe.setAttribute('loading', 'lazy');
  });
});

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

// Observador de intersección para elementos lazy
if ('IntersectionObserver' in window) {
  const lazyImages = document.querySelectorAll('img[data-src]');
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
  lazyImages.forEach((img) => imageObserver.observe(img));
}

// Cache para el servicio calculado
let cachedNextService = null;

// Función para calcular el próximo servicio
function calculateNextService() {
  // Retornar cache si existe
  if (cachedNextService) {
    return cachedNextService;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysOfWeek = today.getDay();
  let nextService = new Date(today);
  
  // 0 = Domingo, 2 = Martes
  const sundayTime = 9.5; // 9:30 AM
  const tuesdayTime = 19; // 7:00 PM
  
  // Si hoy es domingo antes de las 9:30 AM
  if (daysOfWeek === 0) {
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
    if (currentHour < sundayTime) {
      nextService = new Date(today);
      nextService.setHours(9, 30, 0, 0);
      cachedNextService = formatServiceDate(nextService);
      return cachedNextService;
    }
  }
  
  // Si hoy es martes antes de las 7:00 PM
  if (daysOfWeek === 2) {
    const currentHour = new Date().getHours() + new Date().getMinutes() / 60;
    if (currentHour < tuesdayTime) {
      nextService = new Date(today);
      nextService.setHours(19, 0, 0, 0);
      cachedNextService = formatServiceDate(nextService);
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
    galleryInfo.innerHTML = `
      <h3>${ministry}</h3>
      <p class="muted">${galleryDetails[ministry] || 'Descubre cómo servir junto al equipo.'}</p>
    `;
    galleryInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const nombre = form.nombre.value.trim();
  const correo = form.correo.value.trim();
  const ministerio = form.ministerio.value;
  const mensaje = form.mensaje.value.trim();

  if (!nombre || !correo || !ministerio || !mensaje) {
    showStatus('Por favor completa todos los campos obligatorios.', false);
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(correo)) {
    showStatus('Ingresa un correo electrónico válido.', false);
    return;
  }

  showStatus(`Gracias, ${nombre}. Hemos recibido tu mensaje sobre ${ministerio}.`, true);
  form.reset();
});

function showStatus(text, success) {
  formStatus.textContent = text;
  formStatus.className = 'form__status is-visible ' + (success ? 'form__status--success' : 'form__status--error');
}

// Optimización: Limpiar listeners después de un tiempo si no se usan
let isScrolling = false;
window.addEventListener('scroll', debounce(() => {
  isScrolling = true;
}, 150), { passive: true });

// Media Query listener para comportamiento responsive
const mobileMedia = window.matchMedia('(max-width: 768px)');
mobileMedia.addListener((e) => {
  if (e.matches && nav.classList.contains('is-open')) {
    nav.classList.remove('is-open');
  }
});