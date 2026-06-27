const WEDDING_DATE = '2026-08-07T14:20:00+07:00';
const RSVP_ENDPOINT = 'https://formsubmit.co/ajax/ekenotova@yandex.ru';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const body = document.body;
const openScreen = $('#openScreen');
const openButton = $('#openInvitation');
const music = $('#weddingMusic');
const musicToggle = $('#musicToggle');
const floatingButton = $('.floating-rsvp');
const form = $('#rsvpForm');

function smoothScrollTo(selector) {
  const target = $(selector);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$$('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => smoothScrollTo(button.dataset.scroll));
});

function showToast(message, timeout = 4400) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), timeout);
}

function audioReady() {
  return Boolean(music && music.getAttribute('src'));
}

async function startMusic() {
  if (!audioReady()) {
    if (musicToggle) musicToggle.hidden = true;
    return false;
  }
  try {
    music.volume = 0.72;
    await music.play();
    musicToggle?.classList.remove('paused');
    return true;
  } catch (error) {
    musicToggle?.classList.add('paused');
    showToast('Нажмите на кнопку внизу, чтобы включить музыку.');
    return false;
  }
}

function openInvitation() {
  body.classList.add('opening');
  setTimeout(() => {
    body.classList.add('invitation-opened');
    body.classList.remove('locked');
    openScreen?.classList.add('hidden');
    if (musicToggle && audioReady()) musicToggle.hidden = false;
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

function formDataToObject(currentForm) {
  const data = new FormData(currentForm);
  const object = {};
  data.forEach((value, key) => {
    if (key === '_honey' && value) return;
    object[key] = value;
  });
  object['Сайт'] = 'Свадебное приглашение Дениса и Лидии';
  object['Дата отправки'] = new Date().toLocaleString('ru-RU');
  return object;
}

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const submitButton = form.querySelector('button[type="submit"]');
  const originalText = submitButton?.textContent || '';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем...';
  }

  try {
    const response = await fetch(RSVP_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(formDataToObject(form))
    });

    if (!response.ok) throw new Error('Не удалось отправить форму');

    form.reset();
    showToast('Спасибо! Ваш ответ отправлен.', 5200);
  } catch (error) {
    showToast('Не получилось отправить автоматически. Сейчас откроется резервная отправка формы.', 5200);
    setTimeout(() => {
      HTMLFormElement.prototype.submit.call(form);
    }, 900);
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});
