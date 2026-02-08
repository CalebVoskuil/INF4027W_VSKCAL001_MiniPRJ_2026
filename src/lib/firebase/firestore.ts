import {
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint,
  setDoc,
  increment,
  DocumentData,
} from "firebase/firestore";
import { db } from "./config";
import { Product, Category, Order, AppUser, Wishlist } from "@/types";

// ========== PRODUCTS ==========

export async function getProducts(constraints: QueryConstraint[] = []): Promise<Product[]> {
  const q = query(collection(db, "products"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Product));
}

export async function getProductById(id: string): Promise<Product | null> {
  const docRef = doc(db, "products", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Product;
}

export async function createProduct(product: Omit<Product, "id">): Promise<string> {
  const docRef = doc(collection(db, "products"));
  await setDoc(docRef, {
    ...product,
    id: docRef.id,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() });
}

export async function deleteProduct(id: string): Promise<void> {
  await deleteDoc(doc(db, "products", id));
}

export async function incrementProductViews(id: string): Promise<void> {
  const docRef = doc(db, "products", id);
  await updateDoc(docRef, { views: increment(1) });
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  // Firestore 'in' queries limited to 30 items
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 30) {
    chunks.push(ids.slice(i, i + 30));
  }
  const products: Product[] = [];
  for (const chunk of chunks) {
    const q = query(collection(db, "products"), where("id", "in", chunk));
    const snapshot = await getDocs(q);
    products.push(...snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  }
  return products;
}

// ========== CATEGORIES ==========

export async function getCategories(): Promise<Category[]> {
  const snapshot = await getDocs(collection(db, "categories"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category));
}

export async function createCategory(category: Omit<Category, "id">): Promise<string> {
  const docRef = doc(collection(db, "categories"));
  await setDoc(docRef, {
    ...category,
    id: docRef.id,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await updateDoc(doc(db, "categories", id), data);
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, "categories", id));
}

// ========== ORDERS ==========

export async function getOrders(constraints: QueryConstraint[] = []): Promise<Order[]> {
  const q = query(collection(db, "orders"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Order));
}

export async function getOrdersByUser(userId: string): Promise<Order[]> {
  return getOrders([where("userId", "==", userId), orderBy("createdAt", "desc")]);
}

export async function createOrder(order: Omit<Order, "id">): Promise<string> {
  // Use setDoc with a pre-generated ID so we can include the id in the document
  // without needing a separate updateDoc call (which would require admin permissions)
  const docRef = doc(collection(db, "orders"));
  await setDoc(docRef, {
    ...order,
    id: docRef.id,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}

export async function updateOrderStatus(
  id: string,
  status: "pending" | "completed"
): Promise<void> {
  const data: DocumentData = { status };
  if (status === "completed") {
    data.completedAt = Timestamp.now();
  }
  await updateDoc(doc(db, "orders", id), data);
}

// ========== USERS ==========

export async function getAllUsers(): Promise<AppUser[]> {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() } as AppUser));
}

export async function updateUserProfile(
  uid: string,
  data: Partial<AppUser>
): Promise<void> {
  await updateDoc(doc(db, "users", uid), data);
}

// ========== WISHLISTS ==========

export async function getWishlist(userId: string): Promise<Wishlist | null> {
  const docSnap = await getDoc(doc(db, "wishlists", userId));
  if (!docSnap.exists()) return null;
  return docSnap.data() as Wishlist;
}

export async function updateWishlist(userId: string, productIds: string[]): Promise<void> {
  await setDoc(doc(db, "wishlists", userId), {
    userId,
    productIds,
    updatedAt: Timestamp.now(),
  });
}
