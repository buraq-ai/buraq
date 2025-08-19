/***** CONFIG *****/
const LOADER_MIN_MS = 7000;         // keep GIF visible for 7s minimum
const SAVE_TIMEOUT_MS = 20000;      // safety timeout so it never hangs

/***** UTILITIES *****/
let loaderStartMs = null;
const $ = (sel, root=document) => root.querySelector(sel);

function startLoaderTimer(){ if (loaderStartMs === null) loaderStartMs = performance.now(); }
function scheduleHideAfterMin(){
  const elapsed = loaderStartMs === null ? 0 : (performance.now() - loaderStartMs);
  const wait = Math.max(LOADER_MIN_MS - elapsed, 0);
  setTimeout(hideLoader, wait);
}
function hideLoader(){
  const overlay = $('#loader');
  if(!overlay) return;
  overlay.classList.add('loader--hide');
  setTimeout(()=>overlay.remove(), 400);
}
async function exists(url){
  try{ const res = await fetch(url, { method:'GET', cache:'no-store' }); return res.ok; }
  catch{ return false; }
}
function setFormMsg(type, text){
  const msg = $('#formMsg');
  if(!msg) return;
  msg.textContent = text || '';
  msg.classList.remove('is-error','is-success');
  if (type) msg.classList.add(type === 'error' ? 'is-error' : 'is-success');
}
function withTimeout(promise, ms){
  return Promise.race([
    promise,
    new Promise((_, reject)=> setTimeout(()=>reject(new Error('Request timed out. Please try again.')), ms))
  ]);
}

/***** LOADER INIT *****/
document.addEventListener('DOMContentLoaded', () => {
  initLoader().catch(() => {
    startLoaderTimer();
    scheduleHideAfterMin();
  });
});

window.addEventListener('load', () => {
  if (loaderStartMs === null) startLoaderTimer();
  scheduleHideAfterMin();
});

async function initLoader(){
  const slot = $('#loaderSlot');
  if(!slot) return;

  const gifUrl = 'assets/buraq.gif';
  if (await exists(gifUrl)){
    const img = document.createElement('img');
    img.src = gifUrl;
    img.alt = 'Buraq AI loading';
    img.addEventListener('load', () => { startLoaderTimer(); scheduleHideAfterMin(); }, { once:true });
    img.addEventListener('error', () => { startLoaderTimer(); scheduleHideAfterMin(); }, { once:true });
    slot.appendChild(img);
    queueMicrotask(() => { if (loaderStartMs === null) { startLoaderTimer(); scheduleHideAfterMin(); }});
    return;
  }
  startLoaderTimer();
  scheduleHideAfterMin();
}

/***** ACCORDIONS *****/
document.querySelectorAll('.acc').forEach(acc => {
  const btn = acc.querySelector('.acc__head');
  const body = acc.querySelector('.acc__body');
  btn.addEventListener('click', () => {
    const open = acc.classList.toggle('open');
    btn.setAttribute('aria-expanded', open);
    body.style.maxHeight = open ? (body.scrollHeight + 24) + 'px' : '0px';
    const icon = btn.querySelector('.acc__icon');
    if (icon) icon.textContent = open ? '–' : '+';
  });
});

/***** FOOTER YEAR *****/
const yr = $('#yr');
if (yr) yr.textContent = new Date().getFullYear();

/***** INQUIRIES FORM → Firestore *****/
const inqForm = $('#inqForm');
if (inqForm) {
  inqForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear prior message
    setFormMsg('', '');

    // Block if opened as file:// (module imports fail there)
    if (location.protocol === 'file:'){
      setFormMsg('error', 'Please run the site over http(s). For example, use VS Code Live Server.');
      return;
    }

    const data = Object.fromEntries(new FormData(inqForm).entries());
    const btn = inqForm.querySelector('button[type="submit"]');
    const oldTxt = btn ? btn.textContent : '';

    // Required fields (generic message only)
    const requiredMissing =
      !data.firstName || !data.lastName || !data.email || !data.org || !data.country || !data.notes;

    if (requiredMissing){
      setFormMsg('error', 'Please fill all required sections.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      setFormMsg('error', 'Please fill all required sections.');
      return;
    }
    if (!navigator.onLine){
      setFormMsg('error', 'Please check your connection and try again.');
      return;
    }
    if (typeof window.saveInquiry !== 'function') {
      setFormMsg('error', 'Storage not initialized. Ensure firebase-init.js loads before main.js and has your config.');
      return;
    }

    const payload = {
      firstName: data.firstName.trim(),
      lastName:  data.lastName.trim(),
      email:     data.email.trim(),
      org:       data.org.trim(),
      title:     (data.title || '').trim(),
      country:   data.country.trim(),
      notes:     data.notes.trim()
    };

    try{
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      const res = await withTimeout(window.saveInquiry(payload), SAVE_TIMEOUT_MS);

      if (res && res.ok){
        setFormMsg('success', 'Thanks! Your inquiry has been recorded. We will reach out shortly.');
        inqForm.reset();
      } else {
        setFormMsg('error', 'Submission failed. Please try again.');
        console.error('[Form] Save failed:', res);
      }
    }catch(err){
      setFormMsg('error', 'Submission failed. Please try again.');
      console.error('[Form] Exception:', err);
    }finally{
      if (btn) { btn.disabled = false; btn.textContent = oldTxt || 'Submit inquiry'; }
    }
  });
}

/***** SMOOTH SCROLL *****/
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if(!el) return;
    e.preventDefault();
    window.scrollTo({top: el.offsetTop - 14, behavior: 'smooth'});
  });
});
