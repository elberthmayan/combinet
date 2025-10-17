import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// A configuração do Firebase será injetada aqui em um ambiente de produção.
// Para desenvolvimento local, você pode descomentar e preencher o objeto abaixo.
const firebaseConfig = {
  apiKey: "AIzaSyDzk329IVbhS7sWCVNS1HSSwcy5doIzw3U",
  authDomain: "combinet-8b89c.firebaseapp.com",
  projectId: "combinet-8b89c",
  storageBucket: "combinet-8b89c.appspot.com",
  messagingSenderId: "64648776441",
  appId: "1:64648776441:web:58d3514d74122e2032f028",
  measurementId: "G-5565N3V8K8"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços do Firebase para serem usados em outros módulos
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
