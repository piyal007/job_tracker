import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDg-fib0DEHCah5BViAyOYEeY0ckUhk3qE",
    authDomain: "piyal-job-tracker.firebaseapp.com",
    projectId: "piyal-job-tracker",
    storageBucket: "piyal-job-tracker.firebasestorage.app",
    messagingSenderId: "896644149484",
    appId: "1:896644149484:web:302eab3dadab5911d3b5c9"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
