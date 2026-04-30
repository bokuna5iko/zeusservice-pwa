import { db } from './firebase-config.js';
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

export async function checkUser(phone) {
    const userRef = doc(db, "users", phone);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
        return { exists: true, data: userSnap.data() };
    } else {
        return { exists: false };
    }
}

export async function registerUser(phone, name) {
    await setDoc(doc(db, "users", phone), {
        phone: phone,
        name: name,
        role: 'user',
        createdAt: new Date().toISOString()
    });
    return { phone, name };
}