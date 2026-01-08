const menuToggle = document.querySelector('.menu-toggle');
const nav = document.getElementById('mainNav');
const detailPanel = document.getElementById('detalleMinisterio');
const form = document.getElementById('contactForm');
const formStatus = document.getElementById('formStatus');
const galleryInfo = document.getElementById('galleryInfo');

menuToggle.addEventListener('click', () => {
  nav.classList.toggle('is-open');
});

nav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => nav.classList.remove('is-open'));
});

function setDetail({ nombre, horario, contacto, descripcion }) {
  detailPanel.innerHTML = `
    <h4>${nombre}</h4>
    <p class="muted">Reuniones: ${horario}</p>
    <p class="muted">Contacto: ${contacto}</p>
    <p class="muted">${descripcion}</p>
  `;
}

document.querySelectorAll('.ministry').forEach((card) => {
  card.addEventListener('click', () => {
    const nombre = card.dataset.ministry;
    setDetail({
      nombre,
      horario: card.dataset.horario,
      contacto: card.dataset.contacto,
      descripcion: card.querySelector('p')?.textContent || 'Conoce más con nuestro equipo.'
    });
  });
});

const galleryDetails = {
  Alabanza: 'Encuentros de adoración en vivo, audiciones y entrenamientos del equipo.',
  Juventud: 'Noches juveniles, campamentos y talleres creativos para líderes en formación.',
  Niños: 'Ambientes seguros con juegos, manualidades y enseñanza bíblica.',
  Familias: 'Charlas, consejería y eventos para fortalecer el hogar.',
  Misiones: 'Proyectos locales y salidas de servicio a comunidades cercanas.',
  Creatividad: 'Producción, diseño y media para compartir el mensaje con excelencia.'
};

document.querySelectorAll('.gallery__item').forEach((item) => {
  item.addEventListener('click', () => {
    const ministry = item.dataset.ministry;
    galleryInfo.innerHTML = `
      <h3>${ministry}</h3>
      <p class="muted">${galleryDetails[ministry] || 'Descubre cómo servir junto al equipo.'}</p>
    `;
    galleryInfo.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
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