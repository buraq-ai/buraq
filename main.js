/* main.js
   - Background fade on scroll
   - One-shot directional reveals
   - Accordions
   - Smooth anchor scrolling
   - Contact form validation + Google reCAPTCHA + Firestore save
   - Video intro → text fades in after ~3s (with fallbacks)
   - NEW: Showcase slider (autoplay, swipe, dots, keyboard)
   - NEW: Sticky story gallery (scroll-driven image fades)
*/

/* Helpers */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

/* Footer year */
const yr = $('#yr');
if (yr) yr.textContent = new Date().getFullYear();

/* ================== HERO video → text ================== */
(function heroGate(){
  const hero = $('#hero');
  if (!hero) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) { hero.classList.add('hero--text-in'); return; }

  const vid = hero.querySelector('.hero__video');
  const DELAY_MS = 3000; // show text after 3s
  let shown = false, timerStarted = false, timerId = null;

  const showText = () => {
    if (shown) return;
    shown = true;
    clearTimeout(timerId);
    hero.classList.add('hero--text-in');
  };
  const startTimer = () => {
    if (timerStarted) return;
    timerStarted = true;
    timerId = setTimeout(showText, DELAY_MS);
  };

  if (!vid) { startTimer(); return; }

  const tryPlay = () => {
    startTimer();
    const p = vid.play();
    if (p && typeof p.then === 'function') {
      p.catch(() => { /* if blocked, fallback timer still runs */ });
    }
  };

  if (vid.readyState >= 2) {
    tryPlay();
  } else {
    vid.addEventListener('loadeddata', tryPlay, { once:true });
    setTimeout(tryPlay, 800);
  }

  setTimeout(showText, 7000);
})();

/* ================== BACKGROUND FADE (black → blue) ================== */
(function bgFade(){
  const root = document.documentElement;
  function update() {
    const docH = Math.max(
      document.body.scrollHeight, document.documentElement.scrollHeight,
      document.body.offsetHeight,  document.documentElement.offsetHeight,
      document.body.clientHeight,  document.documentElement.clientHeight
    );
    const vh = window.innerHeight || 1;
    const maxScrollable = Math.max(1, docH - vh);
    const y = window.scrollY || 0;
    const p = Math.min(1, Math.max(0, y / maxScrollable));
    root.style.setProperty('--bgp', p.toFixed(4));
  }
  let ticking = false;
  function onScrollOrResize(){
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(()=>{ ticking = false; update(); });
    }
  }
  update();
  window.addEventListener('scroll', onScrollOrResize, { passive:true });
  window.addEventListener('resize', onScrollOrResize);
})();

/* ================== Directional, one-shot reveals ================== */
(function reveals(){
  const els = $$('[data-reveal]');
  if (!els.length) return;

  function groupKey(el){
    const c = el.closest('.pillars, .form__grid, .chips, .accordions, .gallery__steps, section, main');
    return c ? c : document.body;
  }
  const groups = new Map();
  els.forEach(el=>{
    const key = groupKey(el);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });
  groups.forEach(list=> list.forEach((el, i)=> el.__revealIndex = i));

  function inferDir(el){
    const attr = (el.getAttribute('data-dir')||'').toLowerCase();
    if (attr) return attr;
    if (el.closest('.chips')) return 'scale';
    if (el.closest('.accordions') || el.closest('.acc')) return 'right';
    const isHeading = el.matches('.title, .eyebrow, .lead, h1, h2, h3, h4, p.sub');
    if (isHeading) return 'up';
    const pillars = el.closest('.pillars, .pillars--two');
    if (pillars){
      const idx = (el.__revealIndex || 0);
      return (idx % 2 === 0) ? 'left' : 'right';
    }
    return 'up';
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries)=>{
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const el = e.target;
      io.unobserve(el);

      if (prefersReduced){
        el.classList.add('revealed');
        continue;
      }

      const dir = inferDir(el);
      const baseDelay = parseInt(el.getAttribute('data-delay') || '0', 10) || 0;
      const distance = 28, blurStart = 6; // slightly subtler than before
      let keyframes;

      switch (dir){
        case 'left':
          keyframes = [
            { opacity:0, transform:`translateX(-${distance}px)`, filter:`blur(${blurStart}px) saturate(.98)` },
            { opacity:1, transform:`translateX(0)`,              filter:'blur(0) saturate(1)' }
          ]; break;
        case 'right':
          keyframes = [
            { opacity:0, transform:`translateX(${distance}px)`, filter:`blur(${blurStart}px) saturate(.98)` },
            { opacity:1, transform:`translateX(0)`,             filter:'blur(0) saturate(1)' }
          ]; break;
        case 'down':
          keyframes = [
            { opacity:0, transform:`translateY(-${distance}px)`, filter:`blur(${blurStart}px) saturate(.98)` },
            { opacity:1, transform:`translateY(0)`,              filter:'blur(0) saturate(1)' }
          ]; break;
        case 'scale':
          keyframes = [
            { opacity:0, transform:'scale(.97)', filter:`blur(${blurStart}px) saturate(.98)` },
            { opacity:1, transform:'scale(1)',   filter:'blur(0) saturate(1)' }
          ]; break;
        case 'up':
        default:
          keyframes = [
            { opacity:0, transform:`translateY(${distance}px)`, filter:`blur(${blurStart}px) saturate(.98)` },
            { opacity:1, transform:'translateY(0)',             filter:'blur(0) saturate(1)' }
          ];
      }

      const group = groups.get(groupKey(el)) || [el];
      const stagger = 70;
      const delay = baseDelay + (group.indexOf(el) * stagger);

      const anim = el.animate(keyframes, {
        duration: 720, easing: 'cubic-bezier(.18,.7,.13,1)', delay, fill: 'forwards'
      });
      anim.addEventListener('finish', ()=> el.classList.add('revealed'));
    }
  }, { threshold: 0.22 });

  els.forEach(el=> io.observe(el));
})();

/* ================== Accordions ================== */
$$('.acc').forEach(acc=>{
  const btn  = acc.querySelector('.acc__head');
  const body = acc.querySelector('.acc__body');
  if (!btn || !body) return;
  btn.addEventListener('click', ()=>{
    const open = acc.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    body.style.maxHeight = open ? (body.scrollHeight + 24) + 'px' : '0px';
    const icon = btn.querySelector('.acc__icon');
    if (icon) icon.textContent = open ? '–' : '+';
  });
});

/* ================== Smooth anchors ================== */
$$('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if(!el) return;
    e.preventDefault();
    const top = el.getBoundingClientRect().top + window.scrollY - 6;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});

/* ================== Contact form (Firebase + reCAPTCHA) ================== */
(function formHandler(){
  const form = $('#inqForm');
  if (!form) return;
  const msgEl = $('#formMsg');
  const submitBtn = form.querySelector('button[type="submit"]');

  const setMsg = (type, text) => {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.classList.remove('is-error','is-success');
    if (type) msgEl.classList.add(type === 'error' ? 'is-error' : 'is-success');
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    setMsg('', '');

    const data = Object.fromEntries(new FormData(form).entries());
    const missing = !data.firstName || !data.lastName || !data.email || !data.org || !data.country || !data.notes;
    const badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email||'');

    if (missing || badEmail){
      setMsg('error', 'Please fill all required sections.');
      return;
    }

    if (typeof grecaptcha === 'undefined') {
      setMsg('error', 'reCAPTCHA failed to load. Please refresh and try again.');
      return;
    }
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
      setMsg('error', 'Please confirm the reCAPTCHA.');
      return;
    }

    submitBtn?.setAttribute('disabled', 'disabled');
    setMsg('', 'Sending…');

    try {
      if (typeof window.saveInquiry !== 'function') {
        throw new Error('Firebase not loaded (saveInquiry missing). Check script order.');
      }

      const payload = {
        firstName: data.firstName,
        lastName:  data.lastName,
        email:     data.email,
        org:       data.org,
        title:     data.title || '',
        country:   data.country,
        notes:     data.notes,
        recaptcha: captchaResponse
      };

      const res = await window.saveInquiry(payload);
      if (!res?.ok) throw new Error(res?.error || 'Unknown error');

      setMsg('success', 'Thanks! Your inquiry has been recorded.');
      form.reset();
      grecaptcha.reset();
    } catch (err) {
      setMsg('error', `Submission failed: ${err.message || err}`);
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
})();

/* ================== NEW: Showcase slider ================== */
(function showcaseSlider(){
  const root = $('.slider');
  if (!root) return;

  const track   = $('.slider__track', root);
  const slides  = $$('.slide', track);
  const prevBtn = $('.slider__btn--prev', root);
  const nextBtn = $('.slider__btn--next', root);
  const dotsWrap= $('.slider__dots', root);

  let idx = 0;
  let timerId = null;
  let inview = true;
  const AUTO_MS = 10000; // <-- autoplay every 10s

  function setActive(i){
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, j)=>{
      s.classList.toggle('is-active', j === idx);
      s.setAttribute('aria-hidden', j === idx ? 'false' : 'true');
      if (dotsWrap?.children[j]) dotsWrap.children[j].classList.toggle('is-on', j === idx);
    });
  }

  function next(){ setActive(idx + 1); }
  function prev(){ setActive(idx - 1); }

  function start(){
    stop();
    if (!inview) return;
    timerId = setInterval(next, AUTO_MS);
  }
  function stop(){ if (timerId) { clearInterval(timerId); timerId = null; } }

  // Dots
  if (dotsWrap) {
    dotsWrap.innerHTML = slides.map((_, i)=> `<button class="dot${i===0?' is-on':''}" role="tab" aria-label="Go to slide ${i+1}"></button>`).join('');
    [...dotsWrap.children].forEach((b, i)=> b.addEventListener('click', ()=>{ setActive(i); start(); }));
  }

  // Buttons (ensure clicks aren't swallowed by swipe handling)
  prevBtn?.addEventListener('click', ()=>{ prev(); start(); });
  nextBtn?.addEventListener('click', ()=>{ next(); start(); });

  // Keyboard
  root.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft'){ prev(); start(); }
    if (e.key === 'ArrowRight'){ next(); start(); }
  });
  root.setAttribute('tabindex', '0');

  // Hover pause
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);

  // Visibility / in-view pause
  document.addEventListener('visibilitychange', ()=>{ if (document.hidden) stop(); else start(); });
  const io = new IntersectionObserver(([e])=>{ inview = e?.isIntersecting; inview ? start() : stop(); }, { threshold: .25 });
  io.observe(root);

  // Touch swipe — ignore when starting on buttons/dots so clicks work
  let startX = 0, swiping = false;
  root.addEventListener('pointerdown', e=>{
    if (e.target.closest('.slider__btn') || e.target.closest('.slider__dots')) return; // <-- key fix
    swiping = true; startX = e.clientX; stop();
    try { root.setPointerCapture(e.pointerId); } catch(_){}
  });
  root.addEventListener('pointerup', e=>{
    if (!swiping) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 50) (dx > 0 ? prev() : next());
    swiping = false; start();
  });

  setActive(0);
  start();
})();

/* ================== NEW: Sticky story gallery ================== */
(function stickyGallery(){
  const vis   = $('.gallery__vis');
  const imgs  = $$('.gallery__img', vis);
  const steps = $$('.gallery .step');
  if (!vis || !imgs.length || !steps.length) return;

  // If there's only one image, keep it on—no fading or switching while scrolling
  if (imgs.length === 1){
    imgs[0].classList.add('is-on');
    return;
  }

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function show(i){
    imgs.forEach((im, j)=> im.classList.toggle('is-on', i === j));
  }

  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      if (e.isIntersecting) {
        const i = parseInt(e.target.getAttribute('data-index'), 10) || 0;
        show(i);
      }
    });
  }, { threshold: 0.55, rootMargin: '-10% 0px -10% 0px' });

  steps.forEach(s=> io.observe(s));

  if (prefersReduced) {
    imgs.forEach((im, j)=> im.classList.toggle('is-on', j === 0));
  }
})();
