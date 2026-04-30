import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBIXMdzcGwt2Ix-rdtbr9pCnJxxrbAa5n0",
    authDomain: "projectzeus-b6f70.firebaseapp.com",
    projectId: "projectzeus-b6f70",
    storageBucket: "projectzeus-b6f70.firebasestorage.app",
    messagingSenderId: "464711304519",
    appId: "1:464711304519:web:c7c0f22f91d963250e7862",
    measurementId: "G-YQ9YQ3T5KB"
};

// Инициализируем модульно
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);