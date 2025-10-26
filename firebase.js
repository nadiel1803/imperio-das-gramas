// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsEofaOS7Qxk0rFOVRMg-Ll7PGsownD0A",
  authDomain: "gerenciador-de-pedidos-imperio.firebaseapp.com",
  projectId: "gerenciador-de-pedidos-imperio",
  storageBucket: "gerenciador-de-pedidos-imperio.firebasestorage.app",
  messagingSenderId: "387272455329",
  appId: "1:387272455329:web:82a402b8b69572ddbb6ce0",
  measurementId: "G-NTTMJSHS91"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);