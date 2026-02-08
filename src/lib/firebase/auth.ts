import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { AppUser } from "@/types";

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AppUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const appUser: AppUser = {
    uid: user.uid,
    email: user.email!,
    firstName,
    lastName,
    role: "customer",
    demographics: {
      age: null,
      location: null,
    },
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
  };

  await setDoc(doc(db, "users", user.uid), appUser);
  return appUser;
}

export async function signIn(email: string, password: string): Promise<AppUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User data not found");
  }

  // Update last login
  await setDoc(
    doc(db, "users", user.uid),
    { lastLoginAt: Timestamp.now() },
    { merge: true }
  );

  return userDoc.data() as AppUser;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function getUserData(uid: string): Promise<AppUser | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return userDoc.data() as AppUser;
}

export async function updateUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error("No authenticated user");
  await updatePassword(user, newPassword);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
