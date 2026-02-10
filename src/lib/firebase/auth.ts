import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updatePassword,
  User,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./config";
import { AppUser } from "@/types";
import { generateSalt, hashPassword, verifyPassword } from "@/lib/crypto/password";

export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AppUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Generate a unique salt and hash the password before storing
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);

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
    passwordHash: hashedPassword,
    salt: salt,
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

  const userData = userDoc.data() as AppUser;

  // Verify password against the stored hash for additional security
  if (userData.passwordHash && userData.salt) {
    const isValid = verifyPassword(password, userData.passwordHash);
    if (!isValid) {
      throw new Error("Password verification failed");
    }
  }

  // Update last login
  await setDoc(
    doc(db, "users", user.uid),
    { lastLoginAt: Timestamp.now() },
    { merge: true }
  );

  return userData;
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

  // Update the password in Firebase Auth
  await updatePassword(user, newPassword);

  // Generate a new salt and re-hash the new password, then update Firestore
  const newSalt = generateSalt();
  const newHash = hashPassword(newPassword, newSalt);
  await setDoc(
    doc(db, "users", user.uid),
    { passwordHash: newHash, salt: newSalt },
    { merge: true }
  );
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function signInWithGoogle(): Promise<AppUser> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;

  // Check if user already exists in Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  
  if (userDoc.exists()) {
    // User already exists, update last login and return
    const userData = userDoc.data() as AppUser;
    await setDoc(
      doc(db, "users", user.uid),
      { lastLoginAt: Timestamp.now() },
      { merge: true }
    );
    return userData;
  }

  // New user - create user document
  // Split display name into first and last name
  const nameParts = user.displayName?.split(" ") || ["", ""];
  const firstName = nameParts[0] || "User";
  const lastName = nameParts.slice(1).join(" ") || "";

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
    passwordHash: "", // No password for OAuth users
    salt: "", // No salt for OAuth users
    createdAt: Timestamp.now(),
    lastLoginAt: Timestamp.now(),
  };

  await setDoc(doc(db, "users", user.uid), appUser);
  return appUser;
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
