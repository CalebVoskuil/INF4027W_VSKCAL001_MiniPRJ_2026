import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "./config";

export async function uploadProductImage(
  productId: string,
  file: File,
  fileName: string
): Promise<string> {
  const storageRef = ref(storage, `products/${productId}/${fileName}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}

export async function deleteProductImages(productId: string): Promise<void> {
  const folderRef = ref(storage, `products/${productId}`);
  try {
    const list = await listAll(folderRef);
    await Promise.all(list.items.map((item) => deleteObject(item)));
  } catch {
    // Folder might not exist
  }
}

export async function uploadUserAvatar(
  userId: string,
  file: File
): Promise<string> {
  const storageRef = ref(storage, `users/${userId}/avatar.jpg`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
}
