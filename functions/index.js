const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Load service account from env
const serviceAccount = JSON.parse(functions.config().service.account);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://buraq-ai-2670c-default-rtdb.firebaseio.com",
});

// Example function to get all charities
exports.getCharities = functions.https.onRequest(async (req, res) => {
  try {
    const snapshot = await admin.firestore().collection("charities").get();
    const data = snapshot.docs.map((doc) => ({id: doc.id, ...doc.data()}));
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching data");
  }
});
