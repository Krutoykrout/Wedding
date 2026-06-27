const WEDDING_DATE = '2026-08-07T14:20:00+07:00';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const body = document.body;
const openScreen = $('#openScreen');
const openButton = $('#openInvitation');
const music = $('#weddingMusic');
const musicToggle = $('#musicToggle');
const floatingButton = $('.floating-rsvp');

body.classList.add('locked');

function smoothScrollTo(selector) {
  const target = $(selector);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$$('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => smoothScrollTo(button.dataset.scroll));
});

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200);
}

async function startMusic() {
  if (!music) return false;
  try {
    music.volume = 0.72;
    await music.play();
    musicToggle?.classList.remove('paused');
    return true;
  } catch (error) {
    musicToggle?.classList.add('paused');
    showToast('Музыка готова. Нажмите на кнопку внизу, чтобы включить её.');
    return false;
  }
}

function openInvitation() {
  body.classList.add('opening');
  setTimeout(() => {
    body.classList.add('invitation-opened');
    body.classList.remove('locked');
    openScreen?.classList.add('hidden');
    musicToggle.hidden = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
    startMusic();
  }, 880);
}

openButton?.addEventListener('click', openInvitation);

musicToggle?.addEventListener('click', async () => {
  if (!music) return;
  if (music.paused) {
    await startMusic();
  } else {
    music.pause();
    musicToggle.classList.add('paused');
  }
});

function toggleFloatingButton() {
  floatingButton?.classList.toggle('show', body.classList.contains('invitation-opened') && window.scrollY > 680);
}
window.addEventListener('scroll', toggleFloatingButton, { passive: true });
toggleFloatingButton();

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.16, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach((element) => {
  if (!element.classList.contains('visible')) revealObserver.observe(element);
});

function pad(value) {
  return String(value).padStart(2, '0');
}

function setCounter(selector, value) {
  const element = $(selector);
  if (!element) return;
  if (element.textContent !== value) {
    element.textContent = value;
    element.animate([
      { transform: 'translateY(-4px)', opacity: 0.7 },
      { transform: 'translateY(0)', opacity: 1 }
    ], { duration: 240, easing: 'cubic-bezier(.17,.84,.25,1)' });
  }
}

function updateCountdown() {
  const end = new Date(WEDDING_DATE).getTime();
  const diff = Math.max(0, end - Date.now());
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000) % 24;
  const minutes = Math.floor(diff / 60000) % 60;
  const seconds = Math.floor(diff / 1000) % 60;
  setCounter('[data-count="days"]', String(days).padStart(3, '0'));
  setCounter('[data-count="hours"]', pad(hours));
  setCounter('[data-count="minutes"]', pad(minutes));
  setCounter('[data-count="seconds"]', pad(seconds));
}
updateCountdown();
setInterval(updateCountdown, 1000);

function buildRsvpText(form) {
  const data = new FormData(form);
  const drinks = data.getAll('drink');
  return [
    'RSVP на свадьбу Лидии и Дениса',
    `Имя: ${data.get('name') || '-'}`,
    `Присутствие: ${data.get('attendance') || '-'}`,
    `Напитки: ${drinks.length ? drinks.join(', ') : '-'}`,
    `Комментарий: ${data.get('comment') || '-'}`
  ].join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

$('#rsvpForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const text = buildRsvpText(form);
  const copied = await copyText(text);
  showToast(copied ? 'Анкета скопирована. Теперь её можно отправить молодожёнам.' : 'Анкета готова. Скопируйте данные вручную.');
});
