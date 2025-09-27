/* main.js (module)
   - Hero text gate-in
   - Sticky nav frosting past hero
   - Overview carousel
   - OPS 3-up arrows
   - Panels (search/menu)
   - Form niceties
   - 3D Drone Viewer (Three.js with zoom limits)
*/

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.module.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.155.0/examples/jsm/loaders/GLTFLoader.js';

const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ===== Hero text in ===== */
function gateHero() {
  const hero = $('#hero');
  const video = $('#introVid');
  if (!hero || !video) return;

  video.addEventListener('ended', () => hero.classList.add('hero--text-in'));
  // Fallback after ~4.6s in case autoplay is blocked
  setTimeout(() => hero.classList.add('hero--text-in'), 4600);
}

/* ===== Frost nav after hero ===== */
function setupFrostNav() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 1000) nav.classList.add('nav--frost');
    else nav.classList.remove('nav--frost');
  });
}

/* Smooth anchor scrolling */
function setupSmoothAnchors(){
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const id = anchor.getAttribute('href');
      const target = id && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ===== Simple carousel (Overview) ===== */
function setupCarousel() {
  const carousels = $$('.carousel');
  carousels.forEach(carousel => {
    const track = $('.car-track', carousel);
    if (!track) return;

    const slides   = $$('.car-slide', track);
    const prev     = $('.car-prev', carousel);
    const next     = $('.car-next', carousel);
    const dotsWrap = $('.car-dots', carousel);
    const autoplay = carousel.dataset.autoplay === 'true';

    let i = slides.findIndex(s => s.classList.contains('is-active'));
    if (i < 0) i = 0;

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
    function nextSlide(){ go(i+1); }
    function prevSlide(){ go(i-1); }

    next?.addEventListener('click', nextSlide);
    prev?.addEventListener('click', prevSlide);

    let t;
    function start(){ if (autoplay){ stop(); t = setInterval(nextSlide, 5000); } }
    function stop(){ if (t) clearInterval(t); }

    track.addEventListener('mouseenter', stop);
    track.addEventListener('mouseleave', start);
    start();
  });
}

/* ===== OPS infinite carousel (trimmed) ===== */
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

  // Clone before & after
  cards.forEach(card => track.appendChild(card.cloneNode(true)));
  cards.forEach(card => track.insertBefore(card.cloneNode(true), track.firstChild));

  const allCards = Array.from(track.children);
  let cardW = allCards[0].getBoundingClientRect().width + gap;

  let index = cardCount; // start centered on originals
  track.style.transform = `translateX(${-index * cardW}px)`;

  function go(dir) {
    index += dir;
    track.style.transition = 'transform 0.6s ease';
    track.style.transform = `translateX(${-index * cardW}px)`;
    track.addEventListener('transitionend', () => {
      track.style.transition = 'none';
      if (index >= cardCount * 2) index -= cardCount;
      if (index < cardCount)      index += cardCount;
      track.style.transform = `translateX(${-index * cardW}px)`;
    }, { once: true });
  }

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  const speed = parseInt(wrap.dataset.speed, 10) || 2800;
  let timer;
  const start = () => { clearInterval(timer); timer = setInterval(() => go(1), speed); };
  const stop  = () => clearInterval(timer);

  [viewport, prev, next].forEach(el => {
    el.addEventListener('mouseenter', stop);
    el.addEventListener('mouseleave', start);
  });

  window.addEventListener('resize', () => {
    cardW = allCards[0].getBoundingClientRect().width + gap;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-index * cardW}px)`;
  });

  start();
}

/* ===== Panels (search/menu) ===== */
function setupPanels() {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const searchPanel = $('#searchPanel'); // optional
  const menuPanel   = $('#menuPanel');
  const btnSearch   = $('#btnSearch');
  const btnMenu     = $('#btnMenu');
  const siteSearch  = $('#siteSearch');

  const isOpen = el => el && el.getAttribute('aria-hidden') === 'false';
  const open   = el => el && el.setAttribute('aria-hidden', 'false');
  const close  = el => el && el.setAttribute('aria-hidden', 'true');

  let rafOpen = null;
  const openAfterClose = (el) => {
    if (rafOpen) cancelAnimationFrame(rafOpen), (rafOpen = null);
    rafOpen = requestAnimationFrame(() => {
      rafOpen = requestAnimationFrame(() => {
        open(el);
        if (el === searchPanel && siteSearch) siteSearch.focus();
        rafOpen = null;
      });
    });
  };

  $('.panel__content--search')?.addEventListener('click', e => e.stopPropagation());
  $('.panel__content--menu')?.addEventListener('click',   e => e.stopPropagation());

  btnSearch?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOpen(searchPanel)) { close(searchPanel); return; }
    if (isOpen(menuPanel))   { close(menuPanel); openAfterClose(searchPanel); }
    else { open(searchPanel); siteSearch?.focus(); }
  });

  btnMenu?.addEventListener('click', (e) => {
    e.preventDefault(); e.stopPropagation();
    if (isOpen(menuPanel))   { close(menuPanel); return; }
    if (isOpen(searchPanel)) { close(searchPanel); openAfterClose(menuPanel); }
    else { open(menuPanel); }
  });

  $$('[data-close="search"]').forEach(el =>
    el.addEventListener('click', () => close(searchPanel))
  );
  $$('[data-close="menu"]').forEach(el =>
    el.addEventListener('click', () => close(menuPanel))
  );

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { close(searchPanel); close(menuPanel); }
  });

  // Inline nav search slot (optional)
  const navSlot = document.querySelector('.nav-inline-search');
  const inlineInput = document.getElementById('navSearch');
  btnSearch?.addEventListener('click', (e) => {
    if (!navSlot || !inlineInput) return;
    e.preventDefault();
    const open = navSlot.classList.toggle('is-open');
    btnSearch.setAttribute('aria-expanded', String(open));
    if (open) setTimeout(() => inlineInput.focus(), 150);
  });
  document.addEventListener('click', (e) => {
    if (!navSlot?.classList.contains('is-open')) return;
    if (!navSlot.contains(e.target) && e.target !== btnSearch) {
      navSlot.classList.remove('is-open');
      btnSearch.setAttribute('aria-expanded','false');
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navSlot?.classList.contains('is-open')) {
      navSlot.classList.remove('is-open');
      btnSearch?.setAttribute('aria-expanded','false');
      inlineInput?.blur();
    }
  });
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

/* ===== 3D Drone Viewer ===== */
function initDrone() {
  const canvas = document.getElementById('droneCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Lights
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // Controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI - 0.1;

  const loader = new GLTFLoader();
  let currentModelGroup = null;

  function loadDrone(file) {
    // remove previous model
    if (currentModelGroup) {
      scene.remove(currentModelGroup);
      currentModelGroup.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    loader.load(
      `assets/${file}`,
      (gltf) => {
        const model = gltf.scene;
        const group = new THREE.Group();
        group.add(model);
        scene.add(group);
        currentModelGroup = group;

        // Center + fit
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const fitRadius = sphere.radius;
        const fov = camera.fov * (Math.PI / 180);
        const fitDist = (fitRadius / Math.sin(fov / 2)) * 1.2;

        camera.near = fitDist / 100;
        camera.far  = fitDist * 100;
        camera.updateProjectionMatrix();
        camera.position.set(fitDist * 0.6, fitDist * 0.1234, fitDist * 1);

        controls.target.set(0, 0, 0);
        controls.minDistance = size / 3.7;
        controls.maxDistance = size * 0.5;
        controls.update();

        console.log(`✅ Loaded ${file}`);
      },
      (xhr) => console.log(`Loading ${file}: ${((xhr.loaded / (xhr.total || 1)) * 100).toFixed(0)}%`),
      (err) => console.error(`❌ Error loading ${file}`, err)
    );
  }

  // Load default model
  const select = document.getElementById('droneSelect');
  if (select) {
    loadDrone(select.value);
    select.addEventListener('change', () => loadDrone(select.value));
  }

  window.addEventListener('resize', () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  (function animate(){
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  })();
}


/* ===== Init ===== */
window.addEventListener('DOMContentLoaded', () => {
  gateHero();
  setupFrostNav();
  setupSmoothAnchors();
  setupCarousel();
  setupOpsCarousel();
  setupPanels();
  setupForm();
  initDrone(); // start 3D viewer
});
