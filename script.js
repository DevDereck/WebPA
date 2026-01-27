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
// API base: si se sirve estático (file:// o live-server sin PHP), apunta a producción para que funcione localmente.
// En producción usamos solo el origin para evitar rutas base que rompan los endpoints.
const _isStaticDev = window.location.protocol === 'file:' || /:(5500|5501|3000|5173)/.test(window.location.host);
const PROD_API = 'https://www.piedraangularcr.org';
const API_URL = _isStaticDev ? PROD_API : window.location.origin;

function getAuthToken() {
  return localStorage.getItem(ADMIN_SESSION_KEY) || '';
}

async function safeResponseJSON(res) {
  if (!res.ok) throw new Error('Request failed: ' + res.status);
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch (e) {
    try {
      const firstBrace = txt.indexOf('{');
      const firstBracket = txt.indexOf('[');
      let start = -1;
      if (firstBrace !== -1 && firstBracket !== -1) start = Math.min(firstBrace, firstBracket);
      else if (firstBrace !== -1) start = firstBrace;
      else start = firstBracket;
      
      if (start >= 0) return JSON.parse(txt.substring(start));
    } catch (e2) {
      console.error('Parse failed:', e2, 'Raw:', txt);
    }
    throw new Error('Invalid JSON response');
  }
}

async function fetchRemoteCheckins() {
  const token = getAuthToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  // Forzar nunca usar caché (cache-bust con timestamp)
  const url = `${API_URL}/api/checkins.php?_=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store', headers });
  return safeResponseJSON(res);
}

async function saveRemoteCheckin(record) {
  const res = await fetch(`${API_URL}/api/checkins.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  return safeResponseJSON(res);
}

async function updateRemoteCheckin(id, updates) {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/api/checkins.php`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ id, ...updates }),
  });
  return safeResponseJSON(res);
}

async function deleteRemoteCheckin(id) {
  const token = getAuthToken();
  const url = `${API_URL}/api/checkins.php?id=${encodeURIComponent(id)}&_=${Date.now()}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  return safeResponseJSON(res);
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
        const res = await fetch(`${API_URL}/api/login.php`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: pwd }),
        });
        const data = await safeResponseJSON(res);
        setLoggedIn(data.token);
        if (loginStatus) {
          loginStatus.textContent = 'Acceso concedido.';
          loginStatus.className = 'form__status form__status--success is-visible';
        }
        showAdmin();
      } catch (err) {
        console.error(err);
        if (loginStatus) {
          loginStatus.textContent = 'Error: ' + err.message;
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
    tbody.innerHTML = '<tr><td colspan="7" class="muted">No se pudo cargar desde el servidor.</td></tr>';
    if (totalEl) totalEl.textContent = 'Total personas: 0';
    if (newEl) newEl.textContent = 'Nuevos: 0';
    return;
  }

  rows = rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  if (!rows.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">Sin registros todavía.</td></tr>';
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
      return `
        <tr data-id="${row.id}">
          <td>${idx + 1}</td>
          <td>${row.name || ''}</td>
          <td>${row.contact || ''}</td>
          <td>${isNew}</td>
          <td>${guests}</td>
          <td>${formatTime(row.timestamp)}</td>
          <td>
            <button class="btn btn--sm btn--outline" data-action="edit">Editar</button>
            <button class="btn btn--sm btn--ghost" data-action="delete">Borrar</button>
          </td>
        </tr>`;
    })
    .join('');

  tbody.onclick = async (ev) => {
    const btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    const tr = btn.closest('tr');
    const id = tr?.dataset?.id;
    if (!id) return;

    if (btn.dataset.action === 'delete') {
      const sure = confirm('¿Borrar este registro?');
      if (!sure) return;
      try {
        await deleteRemoteCheckin(id);
        await renderControlTable();
      } catch (e) {
        alert('No se pudo borrar.');
      }
      return;
    }

    if (btn.dataset.action === 'edit') {
      const tds = tr.querySelectorAll('td');
      const current = {
        name: tds[1]?.textContent?.trim() || '',
        contact: tds[2]?.textContent?.trim() || '',
        isNew: (tds[3]?.textContent?.trim() || '').toLowerCase().startsWith('s'),
        guests: Number(tds[4]?.textContent?.trim() || 0) || 0,
      };

      const name = prompt('Nombre', current.name) || current.name;
      const contact = prompt('Teléfono', current.contact) || current.contact;
      const guests = Number(prompt('Acompañantes', current.guests) || current.guests) || 0;
      const isNew = confirm('¿Marcar como nuevo? Aceptar = Sí, Cancelar = No') ? true : false;

      try {
        await updateRemoteCheckin(id, { name, contact, guests, isNew });
        await renderControlTable();
      } catch (e) {
        alert('No se pudo actualizar.');
      }
    }
  };
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
      const res = await fetch(`${API_URL}/api/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pwd }),
      });
      const data = await safeResponseJSON(res);
      setLoggedIn(data.token);
      if (statusEl) {
        statusEl.textContent = 'Acceso concedido. Redirigiendo...';
        statusEl.className = 'form__status form__status--success is-visible';
      }
      setTimeout(() => { window.location.href = 'control.html'; }, 350);
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'Error: ' + err.message;
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

  const clearBtn = document.getElementById('clearAllBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      if (!confirm('¿Seguro que deseas borrar TODOS los registros de asistencia? Esta acción no se puede deshacer.')) return;

      // Desactivar botón y mostrar estado, pero NO limpiar la tabla hasta recibir confirmación
      clearBtn.disabled = true;
      const previousText = clearBtn.textContent;
      clearBtn.textContent = 'Limpiando...';
      let statusMsg = document.getElementById('clearStatusMsg');
      if (!statusMsg) {
        statusMsg = document.createElement('span');
        statusMsg.id = 'clearStatusMsg';
        statusMsg.style.marginLeft = '12px';
        statusMsg.style.fontWeight = 'bold';
        clearBtn.parentNode.appendChild(statusMsg);
      }
      try {
        const token = getAuthToken();
        const url = `${API_URL}/api/checkins.php?all=1&_=${Date.now()}`;
        const res = await fetch(url, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          cache: 'no-store',
        });
        await safeResponseJSON(res);
        // Forzar recarga de la tabla desde el servidor y actualizar vista
        await renderControlTable();
        statusMsg.textContent = '✔ Lista borrada con éxito';
        statusMsg.style.color = '#1a7f37';
        setTimeout(() => { statusMsg.textContent = ''; }, 3500);
      } catch (e) {
        statusMsg.textContent = 'No se pudo limpiar la lista: ' + (e.message || e);
        statusMsg.style.color = '#b91c1c';
        setTimeout(() => { statusMsg.textContent = ''; }, 5000);
      } finally {
        clearBtn.disabled = false;
        clearBtn.textContent = previousText || 'Limpiar lista';
      }
    });
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
  // Enero
  '2026-01-07': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-01-08': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-01-10': { title: 'PETRA', time: '4:30PM', description: 'Reunión de jóvenes PETRA' },
  '2026-01-12': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-01-14': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-01-15': { title: 'Música y Visitación', time: '7:00PM', description: 'Ensayo de música y salida de visitación' },
  '2026-01-21': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-01-22': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-01-23': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-01-24': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-01-25': { title: 'Ensayo Coro y Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-01-28': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-01-29': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-01-31': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  
  // Febrero
  '2026-02-04': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-02-05': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-02-07': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-02-09': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-02-11': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-02-12': { title: 'Música y Visitación', time: '7:00PM', description: 'Ensayo de música y salida de visitación' },
  '2026-02-13': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-02-15': { title: 'Evangelismo', time: '5:00PM', description: 'Salida de evangelismo' },
  '2026-02-18': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-02-19': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-02-20': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-02-21': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-02-22': { title: 'Ensayo Coro y Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-02-25': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-02-26': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-02-28': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },

  // Marzo
  '2026-03-04': { title: 'Discipulado', time: '7:00PM', description:'Reunión de discipulado' },
  '2026-03-05': { title: 'Oración', time: '7:00PM', description:'Reunión de Oración' },
  '2026-03-07': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-03-09': { title: 'Oración', time: '7:00PM', description:'Reunión de Oración' },
  '2026-03-11': { title: 'Discipulado', time: '7:00PM', description:'Reunión de discipulado' },
  '2026-03-12': { title: 'Música y Visitación', time: '7:00PM', description: 'Ensayo de música y salida de visitación' },
  '2026-03-18': { title: 'Discipulado', time: '7:00PM', description:'Reunión de discipulado' },
  '2026-03-19': { title: 'Oración', time: '7:00PM', description:'Reunión de Oración' },
  '2026-03-20': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-03-21': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-03-22': { title: 'Ensayo Coro y Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-03-25': { title: 'Discipulado', time: '7:00PM', description:'Reunión de discipulado' },
  '2026-03-26': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-03-28': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de jóvenes hombres' },
  '2026-03-29': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },

  // Abril
  '2026-04-01': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-04-02': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-04-05': { title: 'Culto de resurrección', time: '9:30AM', description: 'Servicio especial de resurrección' },
  '2026-04-08': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-04-09': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-04-11': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-04-13': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-04-15': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-04-16': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-04-17': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-04-18': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-04-19': { title: 'Ensayo Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-04-22': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-04-23': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-04-24': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-04-25': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
  '2026-04-26': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },

  // Mayo
  '2026-05-06': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-05-07': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-05-09': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  '2026-05-11': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-05-13': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-05-14': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-05-15': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-05-16': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-05-18': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-05-20': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-05-21': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-05-23': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-05-24': { title: 'Ensayo Coro y Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-05-27': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-05-28': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-05-31': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },

  // Junio
  '2026-06-03': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-06-04': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-06-06': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
  '2026-06-08': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-06-10': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-06-11': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-06-13': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-06-14': { title: 'Ensayo Coro y Teatro Negro', time: '12:00PM', description: 'Ensayo de coro y teatro negro' },
  '2026-06-17': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-06-19': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-06-18': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-06-20': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-06-21': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },
  '2026-06-24': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-06-25': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-06-26': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-06-28': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },

  // Julio
  '2026-07-01': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-07-02': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-07-03': { title: 'Culto de Aniversario', time: '7:00PM', description: 'Culto de aniversario' },
  '2026-07-04': { title: 'Culto de Aniversario', time: '7:00PM', description: 'Culto de aniversario' },
  '2026-07-05': { title: 'Culto de Aniversario', time: '9:30AM', description: 'Culto de aniversario' },
  '2026-07-08': { title: 'Escuelita de Vacaciones y Discipulado', time: 'EBV: 1:30PM - Disicpulado: 7:00PM', description: 'EBV y Reunión de discipulado' },
  '2026-07-09': { title: 'Escuelita de Vacaciones y Oración', time: 'EBV: 1:30PM - Oración: 7:00PM', description: 'EBV y Reunión de oración' },
  '2026-07-10': { title: 'Escuelita de Vacaciones', time: '1:30PM', description: 'Escuelita de vacaciones' },
  '2026-07-11': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  '2026-07-13': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-07-15': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-07-16': { title: 'Música y Visitación', time: '7:00PM', description: 'Ensayo de música y salida de visitación' },
  '2026-07-17': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-07-18': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-07-22': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-07-23': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-07-25': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-07-26': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },
  '2026-07-29': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-07-30': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },

  // Agosto
  '2026-08-05': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-08-06': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-08-08': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
  '2026-08-10': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-08-12': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-08-13': { title: 'Música y Visitación', time: '7:00PM', description: 'Ensayo de música y salida de visitación' },
  '2026-08-18': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-08-19': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-08-20': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-08-21': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-08-23': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },
  '2026-08-26': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-08-27': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-08-28': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-08-29': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-08-30': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },


  // Setiembre
  '2026-09-02': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-09-03': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-09-05': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  '2026-09-09': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-09-10': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-09-16': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-09-17': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-09-18': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-09-19': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-09-20': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },
  '2026-09-23': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-09-24': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-09-24-extra': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-09-26': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-09-27': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },
  '2026-09-30': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },

  // Octubre
  '2026-10-01': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-10-02': { title: 'Campaña de la Familia', time: '7:00PM', description: 'Campaña de la familia' },
  '2026-10-03': { title: 'Paseo Familiar', time: '8:00AM', description: 'Paseo familiar' },
  '2026-10-04': { title: 'Campaña de la Familia', time: '9:30AM', description: 'Campaña de la familia' },
  '2026-10-07': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-10-08': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-10-10': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
  '2026-10-12': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-10-14': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-10-15': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-10-16': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-10-17': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-10-18': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },
  '2026-10-21': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-10-22': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-10-23': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-10-24': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-10-25': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },
  '2026-10-28': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-10-29': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },

  // Noviembre
  '2026-11-04': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-11-05': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-11-07': { title: 'Núcleo', time: 'Por definir', description: 'Reunión de núcleo' },
  '2026-11-09': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-11-11': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-11-12': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-11-14': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-11-15': { title: 'Culto de Acción de Gracias', time: '5:00PM', description: 'Culto de acción de gracias' },
  '2026-11-18': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-11-19': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-11-20': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-11-21': { title: 'Instituto', time: '8:00AM', description: 'Clases del instituto' },
  '2026-11-22': { title: 'Evangelismo', time: '5:00PM', description:'Evangelismo' },
  '2026-11-25': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-11-26': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-11-29': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },

  // Diciembre
  '2026-12-02': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-12-03': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-12-05': { title: 'Florece', time: 'Por definir', description: 'Evento especial Florece' },
  '2026-12-09': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-12-10': { title: 'Oración y Visitación', time: '7:00PM', description: 'Oración y salida de visitación' },
  '2026-12-11': { title: 'Matrimonios', time: 'Por definir', description: 'Reunión del ministerio de matrimonios' },
  '2026-12-12': { title: 'PETRA y Danza', time: 'PETRA: 4:30PM - Danza: 1:30PM', description: 'Reunión de jóvenes PETRA y ensayo de danza' },
  '2026-12-13': { title: 'Ensayo Coro', time: '12:00PM', description: 'Ensayo de coro' },
  '2026-12-14': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },
  '2026-12-15': { title: 'Tarde Navideña', time: 'Por definir', description: 'Tarde navideña' },
  '2026-12-16': { title: 'Discipulado', time: '7:00PM', description: 'Reunión de discipulado' },
  '2026-12-17': { title: 'Música', time: '7:00PM', description: 'Ensayo de música' },
  '2026-12-18': { title: 'Piedras Preciosas', time: '7:00PM', description: 'Reunión del ministerio Piedras Preciosas' },
  '2026-12-20': { title: 'Culto Navideño y Posadas', time: 'Culto Navideño: 9:30AM - Posadas: 5:00PM', description: 'Culto navideño y Posadas' },
  '2026-12-24': { title: 'Oración', time: '7:00PM', description: 'Reunión de oración' },

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
 * Obtiene el último video del canal de YouTube automáticamente con caché y reintentos.
 */
const YT_CHANNEL_ID = 'UC_8F7KKQ47MDJYko_CvRq2w';
const YT_LIVE_EMBED = `https://www.youtube.com/embed/live_stream?channel=${YT_CHANNEL_ID}&rel=0`;
let lastVideoCache = { id: null, ts: 0 };

async function updateLatestVideo() {
  const iframe = document.querySelector('.video-player iframe');
  if (!iframe) return;

  const setVideo = (videoIdOrUrl) => {
    if (!videoIdOrUrl) return false;
    const newSrc = videoIdOrUrl.startsWith('http')
      ? videoIdOrUrl
      : `https://www.youtube.com/embed/${videoIdOrUrl}`;
    if (iframe.src && iframe.src === newSrc) return false;
    iframe.src = newSrc;
    lastVideoCache = { id: videoIdOrUrl, ts: Date.now() };
    return true;
  };

  const fallbackToLive = () => setVideo(YT_LIVE_EMBED);

  // Usa el último video válido mientras intenta actualizar
  if (lastVideoCache.id && Date.now() - lastVideoCache.ts < 10 * 60 * 1000) {
    setVideo(lastVideoCache.id);
  }

  const fetchWithTimeout = async (url, ms = 4000) => {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
      return await fetch(url, { signal: controller.signal, cache: 'no-store' });
    } finally {
      clearTimeout(t);
    }
  };

  const tryApi = async (base) => {
    const res = await fetchWithTimeout(`${base}/api/youtube-latest.php`, 5000);
    if (!res.ok) throw new Error('api failed');
    const payload = await res.json();
    if (payload?.videoId) {
      setVideo(payload.videoId);
      return true;
    }
    throw new Error('api empty');
  };

  const tryRss = async () => {
    // Jina ai entrega texto plano con CORS permitido
    const rssViaJina = `https://r.jina.ai/http://www.youtube.com/feeds/videos.xml?channel_id=${YT_CHANNEL_ID}`;
    const res = await fetchWithTimeout(rssViaJina, 6000);
    if (!res.ok) throw new Error('rss failed');
    const text = await res.text();
    const match = text.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    if (match?.[1]) {
      setVideo(match[1]);
      return true;
    }
    throw new Error('rss empty');
  };

  const bases = [API_URL, window.location.origin].filter(Boolean);
  for (const base of bases) {
    try {
      if (await tryApi(base)) return;
    } catch (e) {
      // Intenta siguiente estrategia
    }
  }

  try {
    if (await tryRss()) return;
  } catch (e) {
    // Si todo falla, queda el caché previo si existía
  }

  // Fallback garantizado al stream del canal si nada funcionó
  fallbackToLive();
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

// Dispara el fetch del video lo antes posible, incluso antes de DOMContentLoaded
function primeVideoEarly(attempts = 5, delay = 300) {
  let tries = 0;
  const tick = () => {
    tries += 1;
    updateLatestVideo();
    if (tries < attempts) {
      setTimeout(tick, delay);
    }
  };
  tick();
}

// Cargar automáticamente al abrir la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', onDomReady);
} else {
  onDomReady();
}

// Arranca la obtención de video inmediatamente, por si el DOM ya tiene el iframe
primeVideoEarly();

// Reintentos frecuentes: cada 5 minutos refresca el video
setInterval(updateLatestVideo, 300000);