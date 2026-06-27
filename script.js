const WEDDING_DATE = '2026-08-07T14:20:00+07:00';
const FORM_ENDPOINT = 'https://formsubmit.co/ajax/ekenotova@yandex.ru';

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const music = $('#weddingMusic');
const musicToggle = $('#musicToggle');
const introGate = $('#introGate');
const openInvitation = $('#openInvitation');

async function playMusic() {
  if (!music) return false;
  try {
    music.volume = 0.82;
    await music.play();
    musicToggle?.classList.add('show');
    musicToggle?.classList.remove('is-paused');
    return true;
  } catch {
    musicToggle?.classList.add('show', 'is-paused');
    return false;
  }
}

openInvitation?.addEventListener('click', async () => {
  document.body.classList.remove('gate-active');
  await playMusic();
  setTimeout(() => introGate?.remove(), 950);
});

musicToggle?.addEventListener('click', async () => {
  if (!music) return;
  if (music.paused) {
    await playMusic();
  } else {
    music.pause();
    musicToggle.classList.add('is-paused');
  }
});

function smoothScrollTo(selector) {
  const target = $(selector);
  if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

$$('[data-scroll]').forEach((button) => {
  button.addEventListener('click', () => smoothScrollTo(button.dataset.scroll));
});

const floatingButton = $('.floating-rsvp');
function toggleFloatingButton() {
  floatingButton?.classList.toggle('show', window.scrollY > 620 && !document.body.classList.contains('gate-active'));
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
}, { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach((element) => {
  if (!element.classList.contains('visible')) revealObserver.observe(element);
});

function createPearlGradient(svg) {
  if ($('defs #sitePearlGradient', svg)) return 'sitePearlGradient';
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `
    <radialGradient id="sitePearlGradient" cx="34%" cy="27%" r="70%">
      <stop offset="0" stop-color="#ffffff"/>
      <stop offset="0.28" stop-color="#fffff5"/>
      <stop offset="0.63" stop-color="#d6d0c1"/>
      <stop offset="1" stop-color="#9f998e"/>
    </radialGradient>`;
  svg.prepend(defs);
  return 'sitePearlGradient';
}

function buildPearlString(svg) {
  const gradientId = createPearlGradient(svg);
  $$('path[data-pearls]', svg).forEach((path) => {
    const length = path.getTotalLength();
    const count = Number(path.dataset.pearls || 42);
    const delayBase = Number(path.dataset.delay || 0);
    path.style.setProperty('--len', length);
    path.classList.add('pearl-line');

    for (let i = 0; i < count; i += 1) {
      const position = path.getPointAtLength((length * i) / Math.max(1, count - 1));
      const pearl = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const radius = 4.2 + Math.sin(i * 0.63) * 0.9;
      pearl.setAttribute('cx', position.x);
      pearl.setAttribute('cy', position.y);
      pearl.setAttribute('r', radius.toFixed(2));
      pearl.setAttribute('fill', `url(#${gradientId})`);
      pearl.classList.add('pearl');
      pearl.style.animationDelay = `${delayBase + i * 0.018}s, ${1.1 + i * 0.03}s`;
      svg.appendChild(pearl);
    }
  });
}

$$('.pearl-svg').forEach(buildPearlString);

function pad(value) {
  return String(value).padStart(2, '0');
}

function setCounter(selector, value) {
  const element = $(selector);
  if (!element) return;
  const next = String(value);
  if (element.textContent !== next) {
    element.textContent = next;
    element.animate([
      { transform: 'translateY(-4px)', opacity: 0.65 },
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

function applyParallax() {
  const center = window.scrollY + window.innerHeight / 2;
  $$('.parallax').forEach((element) => {
    const depth = Number(element.dataset.depth || 0.08);
    const box = element.getBoundingClientRect();
    const elementCenter = window.scrollY + box.top + box.height / 2;
    const y = (center - elementCenter) * depth;
    element.style.setProperty('--parallax-y', `${y.toFixed(1)}px`);
    element.style.translate = `0 var(--parallax-y)`;
  });
}
window.addEventListener('scroll', applyParallax, { passive: true });
window.addEventListener('resize', applyParallax);
applyParallax();

function showToast(message) {
  const toast = $('#toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 4200);
}

$('#rsvpForm')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const submitButton = $('.submit-button', form);
  const originalText = submitButton?.textContent || 'Отправить ответ';
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = 'Отправляем...';
  }

  try {
    const response = await fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
      body: new FormData(form)
    });

    if (!response.ok) throw new Error('FormSubmit error');
    form.reset();
    showToast('Спасибо! Ответ отправлен.');
  } catch {
    showToast('Не удалось отправить автоматически. Попробуйте ещё раз после публикации сайта.');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
    }
  }
});
