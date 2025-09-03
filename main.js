/* main.js
   - Global background fade: black → blue as you scroll.
   - One-shot directional reveals (staggered, 3D, blur → sharp).
   - Accordions.
   - Smooth anchor scrolling.
   - Contact form validation with Google reCAPTCHA v2 check.
*/

/* Helpers */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

/* Footer year */
const yr = $('#yr');
if (yr) yr.textContent = new Date().getFullYear();

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
    const p = Math.min(1, Math.max(0, y / maxScrollable)); // 0..1
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
    const c = el.closest('.pillars, .form__grid, .chips, .accordions, section, main');
    return c ? c : document.body;
  }
  const groups = new Map();
  els.forEach(el=>{
    const key = groupKey(el);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(el);
  });

  groups.forEach(list=>{
    list.forEach((el, i)=> el.__revealIndex = i);
  });

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
      const idx = el.__revealIndex || 0;
      const baseDelay = parseInt(el.getAttribute('data-delay') || '0', 10) || 0;

      const distance = 36;     // px
      const blurStart = 8;     // px
      const rot = 6;           // deg for left/right yaw
      let keyframes;

      switch (dir){
        case 'left':
          keyframes = [
            { opacity:0, transform:`translateX(${-distance}px) rotateY(${rot}deg) translateZ(0)`, filter:`blur(${blurStart}px) saturate(.9)` },
            { opacity:1, transform:`translateX(0) rotateY(0deg) translateZ(0)`,                   filter:'blur(0) saturate(1)' }
          ];
          break;
        case 'right':
          keyframes = [
            { opacity:0, transform:`translateX(${distance}px) rotateY(${-rot}deg) translateZ(0)`, filter:`blur(${blurStart}px) saturate(.9)` },
            { opacity:1, transform:`translateX(0) rotateY(0deg) translateZ(0)`,                   filter:'blur(0) saturate(1)' }
          ];
          break;
        case 'down':
          keyframes = [
            { opacity:0, transform:`translateY(${-distance}px) translateZ(0)`, filter:`blur(${blurStart}px) saturate(.9)` },
            { opacity:1, transform:`translateY(0) translateZ(0)`,              filter:'blur(0) saturate(1)' }
          ];
          break;
        case 'scale':
          keyframes = [
            { opacity:0, transform:'scale(.92) translateZ(0)', filter:`blur(${blurStart}px) saturate(.9)` },
            { opacity:1, transform:'scale(1) translateZ(0)',   filter:'blur(0) saturate(1)' }
          ];
          break;
        case 'up':
        default:
          keyframes = [
            { opacity:0, transform:`translateY(${distance}px) translateZ(0)`, filter:`blur(${blurStart}px) saturate(.9)` },
            { opacity:1, transform:`translateY(0) translateZ(0)`,             filter:'blur(0) saturate(1)' }
          ];
      }

      const group = groups.get(groupKey(el)) || [el];
      const stagger = 80; // ms
      const delay = baseDelay + (group.indexOf(el) * stagger);

      const anim = el.animate(keyframes, {
        duration: 820,
        easing: 'cubic-bezier(.18,.7,.13,1)',
        delay,
        fill: 'forwards'
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

/* ================== Contact form (with Google reCAPTCHA) ================== */
(function formHandler(){
  const form = $('#inqForm');
  if (!form) return;
  const msgEl = $('#formMsg');
  const setMsg = (type, text) => {
    if (!msgEl) return;
    msgEl.textContent = text || '';
    msgEl.classList.remove('is-error','is-success');
    if (type) msgEl.classList.add(type === 'error' ? 'is-error' : 'is-success');
  };

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    setMsg('', '');

    const data = Object.fromEntries(new FormData(form).entries());
    const missing = !data.firstName || !data.lastName || !data.email || !data.org || !data.country || !data.notes;
    const badEmail = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email||'');

    if (missing || badEmail){
      setMsg('error', 'Please fill all required sections.');
      return;
    }

    // reCAPTCHA presence & response
    if (typeof grecaptcha === 'undefined') {
      setMsg('error', 'reCAPTCHA failed to load. Please refresh and try again.');
      return;
    }
    const captchaResponse = grecaptcha.getResponse();
    if (!captchaResponse) {
      setMsg('error', 'Please confirm the reCAPTCHA.');
      return;
    }

    // TODO: send `data` + `captchaResponse` to your backend for verification
    // Example:
    // fetch('/submit', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ ...data, captchaResponse })
    // }).then(...)

    // Front-end demo success
    setMsg('success', 'Thanks! Your inquiry has been recorded.');
    form.reset();
    grecaptcha.reset(); // reset captcha for next submit
  });
})();
