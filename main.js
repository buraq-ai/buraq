/* main.js (module)
   - Hero text gate-in
   - Sticky nav frosting past hero
   - Overview carousel (single timeline, silky progress)
   - OPS auto-scrolling carousel (no arrows)
   - Panels (search/menu)
   - Form niceties
   - 3D Drone Viewer + Module Viewer (Three.js)
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

/* ===== Overview carousel — single timeline progress ===== */
function setupCarousel() {
  const carousels = $$('.carousel');
  carousels.forEach(carousel => {
    const track = $('.car-track', carousel);
    const dotsWrap = $('.car-dots', carousel);
    if (!track || !dotsWrap) return;

    const slides = $$('.car-slide', track);
    const interval = parseInt(carousel.dataset.interval, 10) || 5200;

    // Create dots with inner .bar for WAAPI animation
    const dots = slides.map((_, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'car-dot';
      btn.setAttribute('role','tab');
      btn.setAttribute('aria-label', `Go to slide ${idx+1}`);
      const bar = document.createElement('span');
      bar.className = 'bar';
      btn.appendChild(bar);
      dotsWrap.appendChild(btn);
      btn.addEventListener('click', () => go(idx, true));
      return { btn, bar };
    });

    let i = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
    let anim = null;
    let token = 0;

    function setActive(n){
      slides.forEach(s => s.classList.remove('is-active'));
      dots.forEach(({btn, bar}) => {
        btn.classList.remove('is-active');
        // reset without anim
        bar.style.transform = 'scaleX(0)';
      });
      slides[n].classList.add('is-active');
      dots[n].btn.classList.add('is-active');
    }

    function playBar(n){
      if (anim) { anim.cancel(); anim = null; }
      const thisToken = ++token;

      const bar = dots[n].bar;
      bar.style.transformOrigin = 'left center';
      bar.style.willChange = 'transform';
      bar.style.backfaceVisibility = 'hidden';

      anim = bar.animate(
        [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        {
          duration: interval,
          easing: 'linear',      // keep it Apple-like; change to cubic if you want
          fill: 'forwards',
          composite: 'replace'
        }
      );

      anim.finished.then(() => {
        if (thisToken !== token) return; // ignore stale finish
        next();
      }).catch(()=>{ /* animation cancelled */ });
    }

    function go(n, manual=false){
      i = (n + slides.length) % slides.length;
      setActive(i);
      playBar(i);
    }

    function next(){ go(i + 1); }

    // init
    if (i < 0) i = 0;
    setActive(i);
    playBar(i);

    // If tab visibility changes, restart the current bar to avoid "stuck" visuals
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) go(i);
      else if (anim) anim.pause();
    });
  });
}

/* ===== OPS continuous auto-scroll (no arrows) ===== */
function setupOpsCarousel() {
  const wrap = document.getElementById('opsCarousel');
  if (!wrap) return;

  const viewport = wrap.querySelector('.ops-viewport');
  const track = wrap.querySelector('.ops-track');

  const originals = Array.from(track.children);
  originals.forEach(card => track.appendChild(card.cloneNode(true)));
  originals.forEach(card => track.insertBefore(card.cloneNode(true), track.firstChild));

  const allCards = Array.from(track.children);
  const gap = parseFloat(getComputedStyle(track).gap) || 16;
  const msPerCard = parseInt(wrap.dataset.speed, 10) || 2800;

  let cardW = allCards[0].getBoundingClientRect().width + gap;
  let index = originals.length;
  let posX  = -index * cardW;
  let running = true;

  const velocity = () => cardW / (msPerCard / 600);
  const setX = (x) => { track.style.transition = 'none'; track.style.transform = `translateX(${x}px)`; };
  setX(posX);

  viewport.addEventListener('mouseenter', () => running = false);
  viewport.addEventListener('mouseleave', () => running = true);

  let last = performance.now();
  function loop(now){
    const dt = now - last; last = now;
    if (running){
      posX -= velocity() * (dt / 1000);
      const cardsAdvanced = Math.floor((-posX / cardW) - index);
      if (cardsAdvanced > 0) index += cardsAdvanced;

      if (index >= originals.length * 2) {
        index -= originals.length;
        posX += originals.length * cardW;
      } else if (index < originals.length) {
        index += originals.length;
        posX -= originals.length * cardW;
      }
      setX(posX);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  window.addEventListener('resize', () => {
    const oldCardW = cardW;
    cardW = allCards[0].getBoundingClientRect().width + gap;
    const frac = -posX / oldCardW;
    posX = -frac * cardW;
    setX(posX);
  });
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

  // Inline nav search slot
  const navSlot = document.querySelector('.nav-inline-search');
  const inlineInput = document.getElementById('navSearch');
  btnSearch?.addEventListener('click', (e) => {
    if (!navSlot || !inlineInput) return;
    e.preventDefault();
    const opened = navSlot.classList.toggle('is-open');
    btnSearch.setAttribute('aria-expanded', String(opened));
    if (opened) setTimeout(() => inlineInput.focus(), 150);
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
  const dirLight = new THREE.DirectionalLight(0xffffff, 4);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI - 0.1;

  const loader = new GLTFLoader();
  let currentModelGroup = null;

  function loadDrone(file) {
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
      },
      (xhr) => console.log(`Loading ${file}: ${((xhr.loaded / (xhr.total || 1)) * 100).toFixed(0)}%`),
      (err) => console.error(`❌ Error loading ${file}`, err)
    );
  }

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

/* ===== Second 3D GLTF Viewer (under Ethics) ===== */
function initModule() {
  const canvas = document.getElementById('moduleCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 5000);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);

  // Lights (same as drone, slightly softer)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 2);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = true;
  controls.minPolarAngle = 0.1;
  controls.maxPolarAngle = Math.PI - 0.1;

  const loader = new GLTFLoader();
  let currentModelGroup = null;

  function disposeGroup(g) {
    g.traverse(obj => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose && m.dispose());
        else obj.material.dispose && obj.material.dispose();
      }
      if (obj.texture) obj.texture.dispose && obj.texture.dispose();
    });
  }

  function loadModule(file) {
    if (currentModelGroup) {
      scene.remove(currentModelGroup);
      disposeGroup(currentModelGroup);
      currentModelGroup = null;
    }

    loader.load(
      `assets/${file}`,
      (gltf) => {
        const model = gltf.scene;
        const group = new THREE.Group();
        group.add(model);
        scene.add(group);
        currentModelGroup = group;

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
        controls.maxDistance = size * 0.8;
        controls.update();
      },
      (xhr) => console.log(`Loading ${file}: ${((xhr.loaded / (xhr.total || 1)) * 100).toFixed(0)}%`),
      (err) => console.error(`❌ Error loading ${file}`, err)
    );
  }

  const select = document.getElementById('moduleSelect');
  if (select) {
    if (!select.value) select.value = 'modulerepresentation.glb';
    loadModule(select.value);
    select.addEventListener('change', () => loadModule(select.value));
  } else {
    loadModule('modulerepresentation.glb');
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
  setupCarousel();      // ✨ rebuilt
  setupOpsCarousel();   // continuous, arrow-free
  setupPanels();
  setupForm();
  initDrone();
  initModule();
});
