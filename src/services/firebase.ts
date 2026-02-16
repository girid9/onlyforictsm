import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  push,
  onDisconnect,
  serverTimestamp,
  type DatabaseReference,
} from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyCgC4TBGaZ3hs1gvjG6ELcWUKj0gD2V4os",
  authDomain: "quest-ace-battle.firebaseapp.com",
  databaseURL: "https://quest-ace-battle-default-rtdb.firebaseio.com",
  projectId: "quest-ace-battle",
  storageBucket: "quest-ace-battle.firebasestorage.app",
  messagingSenderId: "347225952611",
  appId: "1:347225952611:web:16e5ce488bfd2caa9b4356",
  measurementId: "G-44STLPP3RS",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, set, get, update, remove, onValue, push, onDisconnect, serverTimestamp };
export type { DatabaseReference };
