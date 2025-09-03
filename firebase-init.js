// firebase-init.js — load as: <script type="module" src="firebase-init.js"></script>
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAnalytics, isSupported as analyticsIsSupported } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics.js';

// 🔧 Your Firebase config (from the Firebase console)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBT1yoRjsG-mj0PVzIuyLnrbRvILe4S4rs",
  authDomain: "buraq-ai-2670c.firebaseapp.com",
  databaseURL: "https://buraq-ai-2670c-default-rtdb.firebaseio.com",
  projectId: "buraq-ai-2670c",
  storageBucket: "buraq-ai-2670c.appspot.com", // typical default
  messagingSenderId: "910712236530",
  appId: "1:910712236530:web:aec76191b384b6e90fe36b",
  measurementId: "G-KTTLH4B6HG"
};

let app, db;

// Initialize Firebase App
try {
  app = initializeApp(FIREBASE_CONFIG);
  console.log('[Firebase] App initialized:', app.options.projectId);
} catch (e) {
  console.error('[Firebase] Initialization error:', e);
}

// Analytics (optional; only on HTTPS + supported)
try {
  analyticsIsSupported().then(ok => {
    if (ok && location.protocol === 'https:' && FIREBASE_CONFIG.measurementId) {
      getAnalytics(app);
      console.log('[Firebase] Analytics initialized');
    }
  });
} catch { /* ignore analytics issues */ }

// Firestore
try {
  db = getFirestore(app);
  console.log('[Firebase] Firestore ready');
} catch (e) {
  console.error('[Firebase] Firestore init error:', e);
}

/**
 * Save an inquiry into Firestore (collection: "inquiries")
 * Exposed globally for main.js and console testing.
 */
async function saveInquiry(payload) {
  if (!db) return { ok: false, error: 'Firebase not initialized.' };
  try {
    const docRef = await addDoc(collection(db, 'inquiries'), {
      ...payload,
      createdAt: serverTimestamp(),
      ua: navigator.userAgent
    });
    return { ok: true, id: docRef.id };
  } catch (err) {
    return { ok: false, error: String(err?.message || err) };
  }
}

// Make available to the rest of the site
window.saveInquiry = saveInquiry;
