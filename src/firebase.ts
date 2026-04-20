import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, orderBy, onSnapshot, serverTimestamp, Timestamp } from 'firebase/firestore';

// This will be provided by the set_up_firebase tool
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export interface SinteseDoc {
  id?: string;
  date: string;
  category: string;
  title: string;
  leed: string;
  body: string;
  link: string;
  source: string;
  createdAt: Timestamp;
}

export const saveSintese = async (sintese: any, date: string) => {
  return addDoc(collection(db, 'sinteses'), {
    ...sintese,
    date,
    createdAt: serverTimestamp()
  });
};
