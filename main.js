/* Year */
document.getElementById('yr').textContent = new Date().getFullYear();

/* Panels */
const searchPanel = document.getElementById('searchPanel');
const menuPanel = document.getElementById('menuPanel');
const btnSearch = document.getElementById('btnSearch');
const btnMenu = document.getElementById('btnMenu');
const open = p => p.setAttribute('aria-hidden','false');
const close = p => p.setAttribute('aria-hidden','true');
btnSearch.addEventListener('click',()=>open(searchPanel));
btnMenu.addEventListener('click',()=>open(menuPanel));
document.querySelectorAll('[data-close="search"]').forEach(b=>b.addEventListener('click',()=>close(searchPanel)));
document.querySelectorAll('[data-close="menu"]').forEach(b=>b.addEventListener('click',()=>close(menuPanel)));

/* Smooth section links */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    if(id && id.length>1){
      const t = document.querySelector(id);
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth'}); close(menuPanel); }
    }
  });
});

/* HERO: play video and reveal text after ~4.5s */
(function heroGate(){
  const hero = document.getElementById('hero');
  if (!hero) return;
  const vid = hero.querySelector('.hero__video');
  if (vid) {
    vid.muted = true; vid.setAttribute('muted','');
    const p = vid.play(); if (p && typeof p.catch === 'function') p.catch(()=>{});
  }
  hero.classList.remove('hero--text-in');
  setTimeout(()=> hero.classList.add('hero--text-in'), 4500);
})();
// Reveal platform cards on scroll
const platformCards = document.querySelectorAll('.feature-card');

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target); // animate once
    }
  });
}, { threshold: 0.2 });

platformCards.forEach(card => observer.observe(card));

/* ---------- Overview Carousel (kept) ---------- */
(function carousel(){
  const wrap = document.querySelector('#overview .carousel');
  if(!wrap) return;
  const track = wrap.querySelector('.car-track');
  const slides = Array.from(track.querySelectorAll('.car-slide'));
  const prev = wrap.querySelector('.car-prev');
  const next = wrap.querySelector('.car-next');
  const dots = wrap.querySelector('.car-dots');
  const toggle = wrap.querySelector('.car-toggle');
  let i = 0, timer = null, playing = true;

  function setDot(n){
    Array.from(dots.children).forEach((d,idx)=>d.setAttribute('aria-current', idx===n ? 'true':'false'));
  }
  function go(n){
    slides[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    setDot(i);
  }
  function play(){
    if (timer) clearInterval(timer);
    playing = true;
    timer = setInterval(()=>go(i+1), 4500);
    if (toggle) toggle.setAttribute('aria-pressed','true');
  }
  function pause(){
    playing = false;
    clearInterval(timer);
    if (toggle) toggle.setAttribute('aria-pressed','false');
  }

  slides.forEach((_, idx)=>{
    const b = document.createElement('button');
    b.setAttribute('aria-label', `Go to slide ${idx+1}`);
    if(idx===0) b.setAttribute('aria-current','true');
    b.addEventListener('click', ()=>{ pause(); go(idx); });
    dots.appendChild(b);
  });

  prev.addEventListener('click', ()=>{ pause(); go(i-1); });
  next.addEventListener('click', ()=>{ pause(); go(i+1); });
  if (toggle) toggle.addEventListener('click', ()=> playing ? pause() : play());

  play();
})();

/* ---------- OPS: 3-up infinite carousel (right→left) ---------- */
(function opsCarousel(){
  const root = document.getElementById('opsCarousel');
  if(!root) return;

  const track   = root.querySelector('.ops-track');
  const prevBtn = root.querySelector('.ops-arrow--prev');
  const nextBtn = root.querySelector('.ops-arrow--next');

  const speed = Number(root.dataset.speed || 2800);
  let animating = false;
  let paused = false;

  function gapPx(){
    const g = getComputedStyle(track).gap || '0px';
    return parseFloat(g) || 0;
  }
  function cardWidth(){
    const first = track.children[0];
    return first.getBoundingClientRect().width;
  }
  function stepSize(){ return cardWidth() + gapPx(); }

  function moveNext(){
    if(animating) return;
    animating = true;
    const dx = -stepSize();
    track.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
    track.style.transform = `translateX(${dx}px)`;
    const onEnd = () => {
      track.removeEventListener('transitionend', onEnd);
      track.style.transition = 'none';
      track.appendChild(track.firstElementChild);
      track.style.transform = 'translateX(0)';
      void track.offsetHeight; // reflow
      track.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
      animating = false;
    };
    track.addEventListener('transitionend', onEnd);
  }

  function movePrev(){
    if(animating) return;
    animating = true;
    const dx = -stepSize();
    track.style.transition = 'none';
    track.insertBefore(track.lastElementChild, track.firstElementChild);
    track.style.transform = `translateX(${dx}px)`;
    requestAnimationFrame(()=>{
      track.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
      track.style.transform = 'translateX(0)';
      track.addEventListener('transitionend', ()=>{ animating = false; }, {once:true});
    });
  }

  let timer = setInterval(()=>{ if(!paused) moveNext(); }, speed);

  root.addEventListener('mouseenter', ()=> paused = true);
  root.addEventListener('mouseleave', ()=> paused = false);
  nextBtn.addEventListener('click', ()=>{ paused = true; moveNext(); });
  prevBtn.addEventListener('click', ()=>{ paused = true; movePrev(); });

  window.addEventListener('resize', ()=>{
    track.style.transition = 'none';
    track.style.transform = 'translateX(0)';
    void track.offsetHeight;
    track.style.transition = 'transform .6s cubic-bezier(.2,.7,.2,1)';
  });
})();

/* ---------- Form feedback ---------- */
const form = document.getElementById('inqForm');
if(form){
  const msg = document.getElementById('formMsg');
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    if(!form.checkValidity()){
      msg.textContent='Please complete required fields.'; msg.style.color='#d22';
      form.reportValidity(); return;
    }
    msg.textContent='Thanks — your inquiry has been submitted.'; msg.style.color='#0a8043';
    form.reset();
    // grecaptcha.reset(); // uncomment if needed
  });
}
