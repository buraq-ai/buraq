/* main.js (module)
   - Hero text gate-in
   - Sticky nav frosting past hero
   - Overview carousel
   - OPS 3-up arrows
   - Panels (search/menu)
   - Form niceties
   - 3D Drone Viewer
*/

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

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

  cards.forEach(card => track.appendChild(card.cloneNode(true)));
  cards.forEach(card => track.insertBefore(card.cloneNode(true), track.firstChild));

  const allCards = Array.from(track.children);
  let cardW = allCards[0].getBoundingClientRect().width + gap;

  let index = cardCount;
  track.style.transform = `translateX(${-index * cardW}px)`;

  function go(dir) {
    index += dir;
    track.style.transition = 'transform 0.6s ease';
    track.style.transform = `translateX(${-index * cardW}px)`;
    track.addEventListener('transitionend', () => {
      track.style.transition = 'none';
      if (index >= cardCount * 2) index -= cardCount;
      if (index < cardCount) index += cardCount;
      track.style.transform = `translateX(${-index * cardW}px)`;
    }, { once: true });
  }

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));

  const speed = parseInt(wrap.dataset.speed, 10) || 2800;
  let timer;
  const start = () => { clearInterval(timer); timer = setInterval(() => go(1), speed); };
  const stop  = () => clearInterval(timer);
  [viewport, prev, next].forEach(el => { el.addEventListener('mouseenter', stop); el.addEventListener('mouseleave', start); });

  window.addEventListener('resize', () => {
    cardW = allCards[0].getBoundingClientRect().width + gap;
    track.style.transition = 'none';
    track.style.transform = `translateX(${-index * cardW}px)`;
  });

  start();
}

/* ===== Panels & Form (unchanged) ===== */
function setupPanels(){ /* … your existing code … */ }
function setupForm(){ /* … your existing code … */ }

/* ===== 3D Drone Viewer ===== */
function initDrone() {
  const canvas = document.getElementById('droneCanvas');
  if (!canvas) return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.enablePan = true;

  const loader = new GLTFLoader();
  loader.load(
    'assets/drone1.glb',
    (gltf) => {
      const model = gltf.scene;
      scene.add(model);

      // Frame the model
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);

      camera.near = size / 100;
      camera.far = size * 100;
      camera.updateProjectionMatrix();
      camera.position.set(size / 3, size / 3, size / 3);
      controls.target.set(0, 0, 0);
      controls.update();

      console.log('✅ Drone model loaded');
    },
    (xhr) => console.log(`Loading: ${((xhr.loaded / (xhr.total || 1)) * 100).toFixed(0)}%`),
    (err) => console.error('❌ Error loading model', err)
  );

  window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
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
  setupCarousel();
  setupOpsCarousel();
  setupPanels();
  setupForm();
  initDrone(); // <-- start 3D viewer
});
