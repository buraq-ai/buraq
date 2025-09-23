/* main.js (module)
   - Hero text gate-in
   - Sticky nav frosting past hero (robust across zoom)
   - Overview carousel (now under the section)
   - OPS 3-up arrows
   - Panels (search/menu)
   - Minor form niceties
*/

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ===== Hero text in ===== */
function gateHero() {
  const hero = $('#hero');
  const video = $('#introVid');
  if (!hero || !video) return;

  // Wait for the video to finish playing once
  video.addEventListener('ended', () => {
    hero.classList.add('hero--text-in');
  });

  // Fallback: if the video doesn't play or takes too long, show text after ~5s
  setTimeout(() => {
    if (!hero.classList.contains('hero--text-in')) {
      hero.classList.add('hero--text-in');
    }
  }, 4600);
}


/* ===== Frost nav after hero ===== */
function setupFrostNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 1000) {
      nav.classList.add('nav--frost');
    } else {
      nav.classList.remove('nav--frost');
    }
  });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});


/* ===== Simple carousel (Overview) ===== */
function setupCarousel() {
  const carousels = $$('.carousel');
  carousels.forEach(carousel => {
    const track = $('.car-track', carousel);
    if (!track) return;

    const slides = $$('.car-slide', track);
    const prev = $('.car-prev', carousel);
    const next = $('.car-next', carousel);
    const dotsWrap = $('.car-dots', carousel);
    const autoplay = carousel.dataset.autoplay === 'true';
    let i = slides.findIndex(s => s.classList.contains('is-active'));
    if (i < 0) i = 0;

    // Build dots
    const dots = slides.map((_, idx) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', `Go to slide ${idx+1}`);
      if (idx === i) b.setAttribute('aria-current', 'true');
      b.addEventListener('click', () => go(idx));
      dotsWrap.appendChild(b);
      return b;
    });

    function go(n) {
      slides[i].classList.remove('is-active');
      dots[i].removeAttribute('aria-current');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      dots[i].setAttribute('aria-current', 'true');
    }
    function nextSlide(){ go(i+1) }
    function prevSlide(){ go(i-1) }

    next?.addEventListener('click', nextSlide);
    prev?.addEventListener('click', prevSlide);

    let t;
    function start(){
      if (!autoplay) return;
      stop();
      t = setInterval(nextSlide, 5000);
    }
    function stop(){
      if (t) clearInterval(t);
    }

    // Pause on hover for desktop
    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);

    // Start
    start();
  });
}

/* ===== OPS true infinite carousel (endless + pause on hover/arrows) ===== */
function setupOpsCarousel() {
  const wrap = document.getElementById('opsCarousel');
  if (!wrap) return;

  const viewport = wrap.querySelector('.ops-viewport');
  const track = wrap.querySelector('.ops-track');
  const prev = wrap.querySelector('.ops-arrow--prev');
  const next = wrap.querySelector('.ops-arrow--next');

  const gap = parseFloat(getComputedStyle(track).gap) || 16;
  const cards = Array.from(track.children);
  const cardCount = cards.length;

  // Clone all cards twice (before and after)
  cards.forEach(card => track.appendChild(card.cloneNode(true)));
  cards.forEach(card => track.insertBefore(card.cloneNode(true), track.firstChild));

  const allCards = Array.from(track.children);
  let cardW = allCards[0].getBoundingClientRect().width + gap;

  // Start centered on the original set
  let index = cardCount;
  track.style.transform = `translateX(${-index * cardW}px)`;

  function go(dir) {
    index += dir;
    track.style.transition = 'transform 0.6s ease';
    track.style.transform = `translateX(${-index * cardW}px)`;

    track.addEventListener('transitionend', () => {
      track.style.transition = 'none';
      if (index >= cardCount * 2) {
        index -= cardCount;
        track.style.transform = `translateX(${-index * cardW}px)`;
      }
      if (index < cardCount) {
        index += cardCount;
        track.style.transform = `translateX(${-index * cardW}px)`;
      }
    }, { once: true });
  }

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  // Autoplay setup
  const speed = parseInt(wrap.dataset.speed, 10) || 2800;
  let timer;

  function start() {
    stop();
    timer = setInterval(() => go(1), speed);
  }
  function stop() {
    if (timer) clearInterval(timer);
  }

  // Pause on hover over viewport OR arrow buttons
  [viewport, prev, next].forEach(el => {
    el.addEventListener('mouseenter', stop);
    el.addEventListener('mouseleave', start);
  });

  window.addEventListener('resize', () => {
    cardW = allCards[0].getBoundingClientRect().width + gap;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-index * cardW}px)`;
  });

  start(); // begin autoplay
}

/* ===== Panels (search/menu) ===== */
function setupPanels() {
  const searchPanel = $('#searchPanel');
  const menuPanel = $('#menuPanel');

  $('#btnSearch')?.addEventListener('click', () => {
    searchPanel?.setAttribute('aria-hidden', 'false');
    $('#siteSearch')?.focus();
  });
  $('#btnMenu')?.addEventListener('click', () => {
    menuPanel?.setAttribute('aria-hidden', 'false');
  });

  $$('[data-close="search"]').forEach(el =>
    el.addEventListener('click', () => searchPanel?.setAttribute('aria-hidden', 'true'))
  );
  $$('[data-close="menu"]').forEach(el =>
    el.addEventListener('click', () => menuPanel?.setAttribute('aria-hidden', 'true'))
  );
}

/* ===== Form basics ===== */
function setupForm() {
  const yr = $('#yr');
  if (yr) yr.textContent = new Date().getFullYear();

  const form = $('#inqForm');
  const msg = $('#formMsg');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    msg.textContent = 'Thanks — we’ll get back to you shortly.';
  }, false);
}

/* ===== Init ===== */
window.addEventListener('DOMContentLoaded', () => {
  gateHero();
  setupFrostNav();      // keeps nav visible + frosts after hero
  setupCarousel();      // overview slideshow (now under the section)
  setupOpsCarousel();   // 3-up scroller arrows
  setupPanels();        // search/menu
  setupForm();
});
