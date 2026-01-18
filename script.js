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

// Datos base para eventos de check-in (se puede ampliar luego)
const checkinEvents = {
  principal: {
    id: 'principal',
    title: 'Servicio dominical',
    when: 'Domingo · 9:30 AM',
    where: 'Primer Piso Ferretería Rugama, Mercedes Norte, Heredia, CR',
    mapUrl: 'https://maps.app.goo.gl/cAupyhfBca9pfhcK6',
    note: 'Llega 10 minutos antes para acomodarte con calma.'
  },
  martes: {
    id: 'martes',
    title: 'Estudio bíblico',
    when: 'Martes · 7:00 PM',
    where: 'Primer Piso Ferretería Rugama, Mercedes Norte, Heredia, CR',
    mapUrl: 'https://maps.app.goo.gl/cAupyhfBca9pfhcK6',
    note: 'Trae tu Biblia y cuaderno de notas.'
  }
};

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
  if (!detailPanel) return;
  detailPanel.innerHTML = `
    <h4>${nombre}</h4>
    <p class="muted">Reuniones: ${horario}</p>
    <p class="muted">Contacto: ${contacto}</p>
    <p class="muted">${descripcion}</p>
  `;
  
  // Scroll suave hacia el panel de detalles
  detailPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Conectar botones "Ver detalles" de ministerios con el panel "Ministerio Destacado"
document.querySelectorAll('.ministry').forEach((card) => {
  const btn = card.querySelector('.btn--text');
  if (!btn) return;

  btn.addEventListener('click', () => {
    const nombre = card.dataset.ministry;
    setDetail({
      nombre,
      horario: card.dataset.horario,
      contacto: card.dataset.contacto,
      descripcion: card.querySelector('p')?.textContent || 'Conoce más con nuestro equipo.'
    });
  });
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

// --- Check-in / Backend ---
const ADMIN_SESSION_KEY = 'icpa-admin-session';
const API_URL = '';

function getAuthToken() {
  return localStorage.getItem(ADMIN_SESSION_KEY) || '';
}

async function fetchRemoteCheckins() {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}/api/checkins`, { cache: 'no-store', headers });
  if (!res.ok) throw new Error('remote fetch failed');
  return res.json();
}

async function saveRemoteCheckin(record) {
  const res = await fetch(`${API_URL}/api/checkins`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('remote save failed');
  return res.json();
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return '';
  }
}

async function renderCheckinTable(eventId) {
  const tbody = document.getElementById('checkinTableBody');
  const totalEl = document.getElementById('checkinTotals');
  const statsEl = document.getElementById('checkinStats');
  if (!tbody) return;

  let rows = [];
  try {
    rows = (await fetchRemoteCheckins()).filter((c) => c.eventId === eventId);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">No se pudo cargar desde el servidor.</td></tr>';
    if (totalEl) totalEl.textContent = 'Total personas: 0';
    if (statsEl) statsEl.textContent = 'Personas registradas: 0';
    return;
  }

  rows = rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted">Sin registros todavía.</td></tr>';
    if (totalEl) totalEl.textContent = 'Total personas: 0';
    if (statsEl) statsEl.textContent = 'Personas registradas: 0';
    return;
  }

  const totalPeople = rows.reduce((acc, curr) => acc + 1 + (Number(curr.guests) || 0), 0);
  if (totalEl) totalEl.textContent = `Total personas: ${totalPeople}`;
  if (statsEl) statsEl.textContent = `Personas registradas: ${totalPeople}`;

  tbody.innerHTML = rows
    .map((row) => {
      const guests = Number(row.guests) || 0;
      return `<tr><td>${row.name || ''}</td><td>${row.contact || ''}</td><td>${guests}</td><td>${formatTime(row.timestamp)}</td></tr>`;
    })
    .join('');
}

function renderMemberList() {
  const container = document.getElementById('memberList');
  if (!container) return;

  const members = {};

  const fragment = Object.entries(members)
    .map(([team, list]) => {
      const names = list.map((name) => `<span class="tag" style="margin:4px 6px 4px 0; display:inline-block;">${name}</span>`).join('');
      return `<div style="margin-bottom:12px;"><strong>${team}</strong><div style="margin-top:6px;">${names}</div></div>`;
    })
    .join('');

  container.innerHTML = fragment || '<p class="muted">Agrega miembros para verlos aquí.</p>';
}

function renderCheckinStats(eventId) {
  renderCheckinTable(eventId);
}

function isLoggedIn() {
  return Boolean(localStorage.getItem(ADMIN_SESSION_KEY));
}

function setLoggedIn(token) {
  if (token) {
    localStorage.setItem(ADMIN_SESSION_KEY, token);
  } else {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
}

function openExportDoc(html, filename = 'reporte.html') {
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (!win) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    alert('Popup bloqueado: se descargó el reporte.');
  } else {
    win.onload = () => {
      try { win.print(); } catch (e) { /* ignore */ }
    };
  }
}

async function exportCheckinsAsPdf(eventId) {
  let checkins = [];
  try {
    checkins = (await fetchRemoteCheckins()).filter((c) => c.eventId === eventId);
  } catch (e) {
    alert('No se pudo exportar: servidor no disponible.');
    return;
  }

  const total = checkins.reduce((acc, c) => acc + 1 + (Number(c.guests) || 0), 0);

  const rows = checkins
    .map((c, idx) => {
      const guests = Number(c.guests) || 0;
      return `<tr><td>${idx + 1}</td><td>${c.name || ''}</td><td>${c.contact || ''}</td><td>${guests}</td><td>${formatTime(c.timestamp)}</td></tr>`;
    })
    .join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>Reporte de check-in</title>
    <style>
      body { font-family: "Inter", Arial, sans-serif; padding: 20px; }
      h1 { margin-bottom: 6px; }
      p { margin: 4px 0 14px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d0d7de; padding: 8px 10px; text-align: left; }
      th { background: #f6f8fa; }
    </style>
  </head><body>
    <h1>Reporte de check-in</h1>
    <p>Evento: ${eventId}</p>
    <p>Total personas: ${total}</p>
    <table>
      <thead><tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>Acompañantes</th><th>Hora</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="5">Sin registros.</td></tr>'}</tbody>
    </table>
    <script>window.print(); setTimeout(() => window.close(), 500);</script>
  </body></html>`;

  openExportDoc(html, 'reporte-checkin.html');
}

function initCheckin() {
  const loginForm = document.getElementById('loginForm');
  const loginStatus = document.getElementById('loginStatus');
  const loginView = document.getElementById('loginView');
  const adminView = document.getElementById('adminView');
  const formEl = document.getElementById('checkinForm');

  if (!loginForm && !formEl) return;

  const params = new URLSearchParams(window.location.search);
  const eventId = params.get('event') || 'principal';
  const eventData = checkinEvents[eventId] || checkinEvents.principal;

  const titleEl = document.getElementById('checkinTitle');
  const subtitleEl = document.getElementById('checkinSubtitle');
  const whenEl = document.getElementById('checkinWhen');
  const whereEl = document.getElementById('checkinWhere');
  const noteEl = document.getElementById('checkinNote');
  const qrImg = document.getElementById('checkinQr');
  const eventIdField = document.getElementById('eventId');

  if (titleEl) titleEl.textContent = eventData.title;
  if (subtitleEl) subtitleEl.textContent = `Confirma tu asistencia para ${eventData.when}`;
  if (whenEl) whenEl.textContent = eventData.when;
  if (whereEl) whereEl.textContent = eventData.where;
  if (noteEl) noteEl.textContent = eventData.note;
  if (eventIdField) eventIdField.value = eventData.id;

  if (qrImg) {
    const baseUrl = window.location.origin === 'file://'
      ? window.location.href.split('?')[0]
      : `${window.location.origin}${window.location.pathname}`;
    const shareUrl = `${baseUrl}?event=${eventData.id}`;
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(shareUrl)}`;
    qrImg.alt = `QR de check-in para ${eventData.title}`;
  }

  function showAdmin() {
    if (loginView) loginView.classList.add('is-hidden');
    if (adminView) {
      adminView.classList.remove('is-hidden');
      adminView.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    renderMemberList();
    renderCheckinStats(eventData.id);
  }

  if (isLoggedIn()) {
    showAdmin();
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginForm.loginEmail?.value.trim().toLowerCase();
      const pwd = loginForm.loginPassword?.value.trim();

      if (!email || !pwd) {
        if (loginStatus) {
          loginStatus.textContent = 'Completa correo y contraseña.';
          loginStatus.className = 'form__status form__status--error is-visible';
        }
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pwd }),
        });
        if (!res.ok) throw new Error('bad credentials');
        const data = await res.json();
        setLoggedIn(data.token);
        if (loginStatus) {
          loginStatus.textContent = 'Acceso concedido.';
          loginStatus.className = 'form__status form__status--success is-visible';
        }
        showAdmin();
      } catch (err) {
        if (loginStatus) {
          loginStatus.textContent = 'Credenciales inválidas o servidor no disponible.';
          loginStatus.className = 'form__status form__status--error is-visible';
        }
      }
    });
  }

  if (!formEl) return;

  const statusEl = document.getElementById('checkinStatus');
  const exportBtn = document.getElementById('exportPdfBtn');

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = formEl.elements['name']?.value.trim();
    const contact = formEl.elements['contact']?.value.trim();
    const guestsRaw = formEl.elements['guests']?.value;
    const guests = guestsRaw ? Math.max(0, Number(guestsRaw)) : 0;

    if (!name || !contact) {
      if (statusEl) {
        statusEl.textContent = 'Nombre y teléfono son obligatorios.';
        statusEl.classList.add('form__status--error', 'is-visible');
        statusEl.classList.remove('form__status--success');
      }
      return;
    }

    const record = {
      id: `chk-${Date.now()}`,
      eventId: eventData.id,
      name,
      contact,
      guests,
      timestamp: new Date().toISOString(),
    };

    try {
      await saveRemoteCheckin(record);
      if (statusEl) {
        statusEl.textContent = '¡Listo! Registro guardado en el servidor.';
        statusEl.classList.remove('form__status--error');
        statusEl.classList.add('form__status--success', 'is-visible');
      }
      formEl.reset();
      renderCheckinStats(eventData.id);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'No se pudo guardar en el servidor. Intenta de nuevo.';
        statusEl.classList.add('form__status--error', 'is-visible');
        statusEl.classList.remove('form__status--success');
      }
    }
  });

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      exportCheckinsAsPdf(eventData.id);
    });
  }

  renderCheckinStats(eventData.id);
}
async function renderControlTable() {
  const tbody = document.getElementById('controlTableBody');
  const totalEl = document.getElementById('controlTotal');
  const newEl = document.getElementById('controlNew');

  if (!tbody) return;

  let rows = [];
  try {
    rows = await fetchRemoteCheckins();
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">No se pudo cargar desde el servidor.</td></tr>';
    if (totalEl) totalEl.textContent = 'Total personas: 0';
    if (newEl) newEl.textContent = 'Nuevos: 0';
    return;
  }

  rows = rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">Sin registros todavía.</td></tr>';
    if (totalEl) totalEl.textContent = 'Total personas: 0';
    if (newEl) newEl.textContent = 'Nuevos: 0';
    return;
  }

  const totalPeople = rows.reduce((acc, curr) => acc + 1 + (Number(curr.guests) || 0), 0);
  const totalNew = rows.reduce((acc, curr) => acc + (curr.isNew ? 1 : 0), 0);

  if (totalEl) totalEl.textContent = `Total personas: ${totalPeople}`;
  if (newEl) newEl.textContent = `Nuevos: ${totalNew}`;

  tbody.innerHTML = rows
    .map((row, idx) => {
      const guests = Number(row.guests) || 0;
      const isNew = row.isNew ? 'Sí' : 'No';
      return `<tr><td>${idx + 1}</td><td>${row.name || ''}</td><td>${row.contact || ''}</td><td>${isNew}</td><td>${guests}</td><td>${formatTime(row.timestamp)}</td></tr>`;
    })
    .join('');
}

async function exportControlPdf() {
  let checkins = [];
  try {
    checkins = await fetchRemoteCheckins();
  } catch (e) {
    alert('No se pudo exportar: servidor no disponible.');
    return;
  }
  const total = checkins.reduce((acc, c) => acc + 1 + (Number(c.guests) || 0), 0);
  const totalNew = checkins.reduce((acc, c) => acc + (c.isNew ? 1 : 0), 0);

  const rows = checkins
    .map((c, idx) => {
      const guests = Number(c.guests) || 0;
      const isNew = c.isNew ? 'Sí' : 'No';
      return `<tr><td>${idx + 1}</td><td>${c.name || ''}</td><td>${c.contact || ''}</td><td>${isNew}</td><td>${guests}</td><td>${formatTime(c.timestamp)}</td></tr>`;
    })
    .join('');

  const html = `<!doctype html><html><head><meta charset="UTF-8"><title>Reporte de asistencia</title>
    <style>
      body { font-family: "Inter", Arial, sans-serif; padding: 20px; }
      h1 { margin-bottom: 6px; }
      p { margin: 4px 0 14px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d0d7de; padding: 8px 10px; text-align: left; }
      th { background: #f6f8fa; }
    </style>
  </head><body>
    <h1>Reporte de asistencia</h1>
    <p>Total personas: ${total}</p>
    <p>Nuevos: ${totalNew}</p>
    <table>
      <thead><tr><th>#</th><th>Nombre</th><th>Teléfono</th><th>¿Nuevo?</th><th>Acompañantes</th><th>Hora</th></tr></thead>
      <tbody>${rows || '<tr><td colspan="6">Sin registros.</td></tr>'}</tbody>
    </table>
    <script>window.print(); setTimeout(() => window.close(), 500);</script>
  </body></html>`;

  openExportDoc(html, 'reporte-asistencia.html');
}

function initAsistencia() {
  const formEl = document.getElementById('asistenciaForm');
  if (!formEl) return;

  const statusEl = document.getElementById('asistenciaStatus');

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = formEl.elements['name']?.value.trim();
    const contact = formEl.elements['contact']?.value.trim();
    const isNewValue = formEl.elements['isNew']?.value || 'no';
    const isNew = isNewValue === 'si';
    const guestsRaw = formEl.elements['guests']?.value;
    const guests = guestsRaw ? Math.max(0, Number(guestsRaw)) : 0;

    if (!name || !contact) {
      if (statusEl) {
        statusEl.textContent = 'Nombre y teléfono son obligatorios.';
        statusEl.className = 'form__status form__status--error is-visible';
      }
      return;
    }

    const record = {
      id: `chk-${Date.now()}`,
      eventId: 'asistencia',
      name,
      contact,
      isNew,
      guests,
      timestamp: new Date().toISOString()
    };

    try {
      await saveRemoteCheckin(record);
      if (statusEl) {
        statusEl.textContent = 'Registro recibido. ¡Gracias por asistir!';
        statusEl.className = 'form__status form__status--success is-visible';
      }
      formEl.reset();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'No se pudo guardar en el servidor. Intenta de nuevo.';
        statusEl.className = 'form__status form__status--error is-visible';
      }
    }
  });
}

function initAdminLogin() {
  const formEl = document.getElementById('adminLoginForm');
  const statusEl = document.getElementById('adminLoginStatus');
  if (!formEl) return;

  // Siempre pedir credenciales al entrar a admin
  setLoggedIn(null);

  formEl.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = formEl.adminEmail?.value.trim().toLowerCase();
    const pwd = formEl.adminPassword?.value.trim();

    if (!email || !pwd) {
      if (statusEl) {
        statusEl.textContent = 'Completa correo y contraseña.';
        statusEl.className = 'form__status form__status--error is-visible';
      }
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });
      if (!res.ok) {
        throw new Error('bad credentials');
      }
      const data = await res.json();
      setLoggedIn(data.token);
      if (statusEl) {
        statusEl.textContent = 'Acceso concedido. Redirigiendo...';
        statusEl.className = 'form__status form__status--success is-visible';
      }
      setTimeout(() => { window.location.href = 'control.html'; }, 350);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Credenciales inválidas o servidor no disponible.';
        statusEl.className = 'form__status form__status--error is-visible';
      }
    }
  });
}

async function initControl() {
  const table = document.getElementById('controlTableBody');
  if (!table) return;

  if (!isLoggedIn()) {
    window.location.href = 'admin.html';
    return;
  }

  await renderControlTable();

  const exportBtn = document.getElementById('controlExportBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportControlPdf());
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      setLoggedIn(null);
      window.location.href = 'admin.html';
    });
  }
}

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
      }, 3500);
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

// Manejo del formulario de contacto: validación + envío AJAX sin redirección
if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const nombre = form.nombre.value.trim();
    const correo = form.email.value.trim();
    const telefono = form.phone.value.trim();
    const ministerio = form.ministerio.value;
    const mensaje = form.message.value.trim();

    // Validaciones básicas antes de enviar
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
    const originalText = submitBtn ? submitBtn.textContent : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Enviando...';
    }

    try {
      const response = await fetch('https://formsubmit.co/ajax/dereckvargas500@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          nombre: nombre,
          email: correo,
          phone: telefono,
          ministerio: ministerio,
          message: mensaje,
        }),
      });

      if (response.ok) {
        showStatus(`¡Gracias, ${nombre}! Hemos recibido tu mensaje.`, true);
        form.reset();
      } else {
        showStatus('Error al enviar. Intenta nuevamente.', false);
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error);
      showStatus('Error de conexión. Intenta nuevamente.', false);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }
  });
}

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
  '2026-01-07': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-01-08': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-01-10': { title: 'PETRA', time: 'Por definir', description: 'Reunión de jóvenes PETRA' },
  '2026-01-12': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-01-14': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-01-15': { title: 'Música y Visitación', time: 'Por definir', description: 'Ensayo de música y salida de visitación' },
  '2026-01-21': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-01-22': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-01-23': { title: 'Piedras Preciosas', time: 'Por definir', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-01-24': { title: 'Instituto', time: 'Por definir', description: 'Clases del instituto' },
  '2026-01-25': { title: 'Ensayo Coro y Teatro Negro', time: 'Por definir', description: 'Ensayo de coro y teatro negro' },
  '2026-01-28': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-01-29': { title: 'Música', time: 'Por definir', description: 'Ensayo de música' },
  '2026-01-31': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  '2026-02-04': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-02-05': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-02-07': { title: 'PETRA y Danza', time: 'Por definir', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-02-09': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-02-11': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-02-12': { title: 'Música y Visitación', time: 'Por definir', description: 'Ensayo de música y salida de visitación' },
  '2026-02-13': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-02-15': { title: 'Evangelismo', time: 'Por definir', description: 'Salida de evangelismo' },
  '2026-02-18': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-02-19': { title: 'Oración', time: 'Por definir', description: 'Reunión de oración' },
  '2026-02-20': { title: 'Piedras Preciosas', time: 'Por definir', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-02-21': { title: 'Instituto', time: 'Por definir', description: 'Clases del instituto' },
  '2026-02-22': { title: 'Ensayo Coro y Teatro Negro', time: 'Por definir', description: 'Ensayo de coro y teatro negro' },
  '2026-02-25': { title: 'Discipulado', time: 'Por definir', description: 'Reunión de discipulado' },
  '2026-02-26': { title: 'Música', time: 'Por definir', description: 'Ensayo de música' },
  '2026-02-28': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
};

// Devuelve el evento para una fecha concreta
// Solo usa los eventos definidos manualmente en eventsData
function getEventForDate(year, monthZeroBased, day) {
  const dateStr = `${year}-${String(monthZeroBased + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  if (eventsData[dateStr]) {
    return { dateStr, ...eventsData[dateStr] };
  }

  return null;
}

let currentCalendarDate = new Date();
let showingAllSidebarEvents = false;

const modal = document.getElementById('eventoModal');
const modalOverlay = document.querySelector('.modal__overlay');
const modalClose = document.querySelector('.modal__close');

function openModal(dateStr, eventData) {
  if (!modal) return;
  const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
  const date = new Date(y, m - 1, d);
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const dayOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  const modalTitle = document.getElementById('modalTitle');
  const modalDate = document.getElementById('modalDate');
  const modalDesc = document.getElementById('modalDescription');
  if (modalTitle) modalTitle.textContent = eventData.title;
  if (modalDate) modalDate.textContent = `${dayOfWeek[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
  const modalTimeEl = document.getElementById('modalTime');
  if (modalTimeEl) {
    modalTimeEl.innerHTML = `
      <span class="modal-time__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="1.8" />
          <path d="M12 7.5V12l2.4 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </span>
      <span class="modal-time__text">${eventData.time}</span>
    `;
  }
  if (modalDesc) modalDesc.textContent = eventData.description;
  
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
}

if (modal && modalClose && modalOverlay) {
  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', closeModal);

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });
}

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
    
    const eventInfo = getEventForDate(year, month, i);
    if (eventInfo) {
      day.classList.add('has-event');
      day.style.cursor = 'pointer';
      day.addEventListener('click', () => {
        openModal(eventInfo.dateStr, eventInfo);
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

  // Actualizar lista de "Eventos Próximos" basada en la fecha de hoy
  buildUpcomingEventsSidebar(3);
  showingAllSidebarEvents = false;
  const toggleBtn = document.getElementById('toggleEventosSidebar');
  if (toggleBtn) {
    toggleBtn.textContent = 'Ver todos los eventos';
  }
}
// Helpers para construir listas de eventos próximos
const monthShort = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getAllEventsArray() {
  return Object.entries(eventsData)
    .map(([dateStr, data]) => {
      const [y, m, d] = dateStr.split('-').map((n) => parseInt(n, 10));
      const date = new Date(y, m - 1, d);
      date.setHours(0, 0, 0, 0);
      return {
        dateStr,
        year: y,
        month: m - 1,
        day: d,
        title: data.title,
        time: data.time,
        description: data.description,
        date,
      };
    })
    .sort((a, b) => a.date - b.date);
}

function createEventCard(ev) {
  const article = document.createElement('article');
  article.className = 'evento-card';

  const dateDiv = document.createElement('div');
  dateDiv.className = 'evento-card__date';

  const daySpan = document.createElement('span');
  daySpan.className = 'evento-card__day';
  daySpan.textContent = String(ev.date.getDate());

  const monthSpan = document.createElement('span');
  monthSpan.className = 'evento-card__month';
  monthSpan.textContent = monthShort[ev.date.getMonth()];

  dateDiv.appendChild(daySpan);
  dateDiv.appendChild(monthSpan);

  const contentDiv = document.createElement('div');
  contentDiv.className = 'evento-card__content';

  const title = document.createElement('h4');
  title.textContent = ev.title;

  const timeP = document.createElement('p');
  timeP.className = 'muted';
  timeP.textContent = ev.time;

  const descP = document.createElement('p');
  descP.className = 'small';
  descP.textContent = ev.description;

  contentDiv.appendChild(title);
  contentDiv.appendChild(timeP);
  contentDiv.appendChild(descP);

  article.appendChild(dateDiv);
  article.appendChild(contentDiv);

  return article;
}
// Lista lateral: eventos próximos solo del mes actual (según la fecha de hoy)
function buildUpcomingEventsSidebar(limit = 3) {
  const listContainer = document.getElementById('eventosList');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  const upcoming = getAllEventsArray().filter((ev) => {
    return (
      ev.date >= today &&
      ev.date.getFullYear() === currentYear &&
      ev.date.getMonth() === currentMonth
    );
  });

  if (!upcoming.length) {
    const empty = document.createElement('p');
    empty.className = 'muted small';
    empty.textContent = 'Por ahora no hay eventos próximos programados para este mes.';
    listContainer.appendChild(empty);
    return;
  }

  const eventsToShow =
    limit === Number.POSITIVE_INFINITY ? upcoming : upcoming.slice(0, limit);

  eventsToShow.forEach((ev) => {
    listContainer.appendChild(createEventCard(ev));
  });
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

  const toggleBtn = document.getElementById('toggleEventosSidebar');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const limit = showingAllSidebarEvents ? 3 : Number.POSITIVE_INFINITY;
      buildUpcomingEventsSidebar(limit);
      showingAllSidebarEvents = !showingAllSidebarEvents;
      toggleBtn.textContent = showingAllSidebarEvents
        ? 'Ver menos eventos'
        : 'Ver todos los eventos';
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
  // Guard clause: si no hay iframe, no hacemos nada
  const iframe = document.querySelector('.video-player iframe');
  if (!iframe) return;

  const channelId = 'UCpjzBxiJlWM92w4RUn3qQRw';

  const fetchWithTimeout = async (url, ms = 5000) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(t);
    }
  };

  try {
    // Invidious
    const inv = await fetchWithTimeout(`https://inv.nadeko.net/api/v1/channels/${channelId}?fields=latestVideos`);
    if (inv.ok) {
      const data = await inv.json();
      if (data.latestVideos && data.latestVideos.length) {
        const videoId = data.latestVideos[0].videoId;
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        return;
      }
    }
  } catch (e) {
    // ignore
  }

  try {
    // RSS fallback
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const corsProxy = `https://api.allorigins.win/get?url=${encodeURIComponent(rssUrl)}`;
    const res = await fetchWithTimeout(corsProxy);
    if (res.ok) {
      const data = await res.json();
      const parser = new DOMParser();
      const xml = parser.parseFromString(data.contents, 'text/xml');
      const entry = xml.querySelector('entry');
      const videoId = entry?.querySelector('yt\\:videoId')?.textContent || entry?.querySelector('videoId')?.textContent;
      if (videoId) {
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        return;
      }
    }
  } catch (e) {
    // ignore
  }
}

function onDomReady() {
  updateLatestVideo();
  initScrollReveal();
  initCheckin();
  initAsistencia();
  initAdminLogin();
  initControl();
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