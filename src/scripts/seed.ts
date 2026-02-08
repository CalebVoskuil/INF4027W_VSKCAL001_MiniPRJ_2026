// Run: npx tsx src/scripts/seed.ts
// Loads .env.local automatically via dotenv

import { config } from "dotenv";
config({ path: ".env.local" });

import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, Timestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("Firebase Project:", firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Helper to generate a placeholder image URL for a phone
function phoneImg(name: string, color: string = "e8e8e8"): string[] {
  const encoded = encodeURIComponent(name);
  return [
    `https://placehold.co/400x500/${color}/333?text=${encoded}`,
    `https://placehold.co/400x500/${color}/555?text=${encoded}+Back`,
  ];
}

const products = [
  // ===== FLAGSHIP (8 phones) =====
  {
    name: "Samsung Galaxy S24 Ultra",
    brand: "Samsung",
    model: "S24 Ultra",
    price: 28999,
    costPrice: 21000,
    category: "flagship",
    specs: { ram: "12GB", storage: "512GB", battery: "5000mAh", camera: "200MP + 50MP + 12MP + 10MP", display: '6.8" Dynamic AMOLED 2X', processor: "Snapdragon 8 Gen 3", os: "Android 14" },
    tags: ["5G", "S Pen", "water-resistant", "wireless-charging", "AI-camera"],
    images: phoneImg("Galaxy S24 Ultra", "1a1a2e"),
    stock: 15,
    views: 245,
    salesCount: 42,
  },
  {
    name: "iPhone 15 Pro Max",
    brand: "Apple",
    model: "15 Pro Max",
    price: 32999,
    costPrice: 24000,
    category: "flagship",
    specs: { ram: "8GB", storage: "256GB", battery: "4422mAh", camera: "48MP + 12MP + 12MP", display: '6.7" Super Retina XDR', processor: "A17 Pro", os: "iOS 17" },
    tags: ["5G", "titanium", "action-button", "MagSafe"],
    images: phoneImg("iPhone 15 Pro Max", "2d2d3f"),
    stock: 20,
    views: 312,
    salesCount: 56,
  },
  {
    name: "Xiaomi 14 Pro",
    brand: "Xiaomi",
    model: "14 Pro",
    price: 18999,
    costPrice: 13000,
    category: "flagship",
    specs: { ram: "12GB", storage: "512GB", battery: "4880mAh", camera: "50MP + 50MP + 50MP", display: '6.73" AMOLED', processor: "Snapdragon 8 Gen 3", os: "Android 14" },
    tags: ["5G", "Leica-camera", "fast-charging-120W"],
    images: phoneImg("Xiaomi 14 Pro", "ff6600"),
    stock: 12,
    views: 156,
    salesCount: 28,
  },
  {
    name: "Google Pixel 8 Pro",
    brand: "Google",
    model: "Pixel 8 Pro",
    price: 24999,
    costPrice: 18000,
    category: "flagship",
    specs: { ram: "12GB", storage: "256GB", battery: "5050mAh", camera: "50MP + 48MP + 48MP", display: '6.7" LTPO OLED', processor: "Google Tensor G3", os: "Android 14" },
    tags: ["5G", "AI-features", "stock-android", "wireless-charging"],
    images: phoneImg("Pixel 8 Pro", "4285f4"),
    stock: 10,
    views: 198,
    salesCount: 35,
  },
  {
    name: "OnePlus 12",
    brand: "OnePlus",
    model: "12",
    price: 17999,
    costPrice: 12500,
    category: "flagship",
    specs: { ram: "16GB", storage: "512GB", battery: "5400mAh", camera: "50MP + 64MP + 48MP", display: '6.82" AMOLED', processor: "Snapdragon 8 Gen 3", os: "Android 14" },
    tags: ["5G", "fast-charging-100W", "Hasselblad"],
    images: phoneImg("OnePlus 12", "e30b20"),
    stock: 8,
    views: 134,
    salesCount: 22,
  },
  {
    name: "Samsung Galaxy S24+",
    brand: "Samsung",
    model: "S24+",
    price: 23999,
    costPrice: 17000,
    category: "flagship",
    specs: { ram: "12GB", storage: "256GB", battery: "4900mAh", camera: "50MP + 12MP + 10MP", display: '6.7" Dynamic AMOLED 2X', processor: "Snapdragon 8 Gen 3", os: "Android 14" },
    tags: ["5G", "AI-features", "water-resistant", "wireless-charging"],
    images: phoneImg("Galaxy S24+", "1a1a2e"),
    stock: 14,
    views: 189,
    salesCount: 38,
  },
  {
    name: "iPhone 15 Pro",
    brand: "Apple",
    model: "15 Pro",
    price: 27999,
    costPrice: 20000,
    category: "flagship",
    specs: { ram: "8GB", storage: "256GB", battery: "3274mAh", camera: "48MP + 12MP + 12MP", display: '6.1" Super Retina XDR', processor: "A17 Pro", os: "iOS 17" },
    tags: ["5G", "titanium", "action-button", "MagSafe"],
    images: phoneImg("iPhone 15 Pro", "2d2d3f"),
    stock: 18,
    views: 267,
    salesCount: 45,
  },
  {
    name: "Google Pixel 9 Pro",
    brand: "Google",
    model: "Pixel 9 Pro",
    price: 26999,
    costPrice: 19500,
    category: "flagship",
    specs: { ram: "16GB", storage: "256GB", battery: "5060mAh", camera: "50MP + 48MP + 48MP", display: '6.3" LTPO OLED', processor: "Google Tensor G4", os: "Android 15" },
    tags: ["5G", "AI-features", "Gemini", "wireless-charging"],
    images: phoneImg("Pixel 9 Pro", "4285f4"),
    stock: 11,
    views: 210,
    salesCount: 30,
  },
  // ===== MID-RANGE (9 phones) =====
  {
    name: "Samsung Galaxy A54",
    brand: "Samsung",
    model: "A54",
    price: 8999,
    costPrice: 6000,
    category: "midrange",
    specs: { ram: "8GB", storage: "256GB", battery: "5000mAh", camera: "50MP + 12MP + 5MP", display: '6.4" Super AMOLED', processor: "Exynos 1380", os: "Android 14" },
    tags: ["5G", "water-resistant", "stereo-speakers"],
    images: phoneImg("Galaxy A54", "9b59b6"),
    stock: 25,
    views: 178,
    salesCount: 52,
  },
  {
    name: "iPhone 15",
    brand: "Apple",
    model: "15",
    price: 21999,
    costPrice: 16000,
    category: "midrange",
    specs: { ram: "6GB", storage: "128GB", battery: "3349mAh", camera: "48MP + 12MP", display: '6.1" Super Retina XDR', processor: "A16 Bionic", os: "iOS 17" },
    tags: ["5G", "ceramic-shield", "MagSafe"],
    images: phoneImg("iPhone 15", "5a5a72"),
    stock: 18,
    views: 234,
    salesCount: 48,
  },
  {
    name: "Xiaomi Redmi Note 13 Pro",
    brand: "Xiaomi",
    model: "Redmi Note 13 Pro",
    price: 7499,
    costPrice: 5000,
    category: "midrange",
    specs: { ram: "8GB", storage: "256GB", battery: "5100mAh", camera: "200MP + 8MP + 2MP", display: '6.67" AMOLED', processor: "Snapdragon 7s Gen 2", os: "Android 13" },
    tags: ["5G", "fast-charging-67W", "high-res-camera"],
    images: phoneImg("Redmi Note 13 Pro", "ff8c00"),
    stock: 30,
    views: 145,
    salesCount: 40,
  },
  {
    name: "Motorola Edge 40",
    brand: "Motorola",
    model: "Edge 40",
    price: 9999,
    costPrice: 7000,
    category: "midrange",
    specs: { ram: "8GB", storage: "256GB", battery: "4400mAh", camera: "50MP + 13MP", display: '6.55" pOLED', processor: "MediaTek Dimensity 8020", os: "Android 13" },
    tags: ["5G", "wireless-charging", "water-resistant"],
    images: phoneImg("Motorola Edge 40", "0077b6"),
    stock: 15,
    views: 89,
    salesCount: 18,
  },
  {
    name: "Nothing Phone 2",
    brand: "Nothing",
    model: "Phone 2",
    price: 12999,
    costPrice: 9000,
    category: "midrange",
    specs: { ram: "12GB", storage: "256GB", battery: "4700mAh", camera: "50MP + 50MP", display: '6.7" LTPO AMOLED', processor: "Snapdragon 8+ Gen 1", os: "Android 13" },
    tags: ["5G", "Glyph-interface", "wireless-charging"],
    images: phoneImg("Nothing Phone 2", "2d2d2d"),
    stock: 10,
    views: 167,
    salesCount: 25,
  },
  {
    name: "Samsung Galaxy A34",
    brand: "Samsung",
    model: "A34",
    price: 7499,
    costPrice: 5200,
    category: "midrange",
    specs: { ram: "6GB", storage: "128GB", battery: "5000mAh", camera: "48MP + 8MP + 5MP", display: '6.6" Super AMOLED', processor: "MediaTek Dimensity 1080", os: "Android 13" },
    tags: ["5G", "water-resistant", "long-battery"],
    images: phoneImg("Galaxy A34", "8e44ad"),
    stock: 22,
    views: 112,
    salesCount: 33,
  },
  {
    name: "OnePlus Nord 3",
    brand: "OnePlus",
    model: "Nord 3",
    price: 9499,
    costPrice: 6500,
    category: "midrange",
    specs: { ram: "8GB", storage: "256GB", battery: "5000mAh", camera: "50MP + 8MP + 2MP", display: '6.74" AMOLED', processor: "MediaTek Dimensity 9000", os: "Android 13" },
    tags: ["5G", "fast-charging-80W", "OxygenOS"],
    images: phoneImg("OnePlus Nord 3", "c0392b"),
    stock: 16,
    views: 98,
    salesCount: 20,
  },
  {
    name: "Google Pixel 7a",
    brand: "Google",
    model: "Pixel 7a",
    price: 10999,
    costPrice: 7500,
    category: "midrange",
    specs: { ram: "8GB", storage: "128GB", battery: "4385mAh", camera: "64MP + 13MP", display: '6.1" OLED', processor: "Google Tensor G2", os: "Android 14" },
    tags: ["5G", "stock-android", "wireless-charging"],
    images: phoneImg("Pixel 7a", "34a853"),
    stock: 13,
    views: 143,
    salesCount: 27,
  },
  {
    name: "Xiaomi 13 Lite",
    brand: "Xiaomi",
    model: "13 Lite",
    price: 8499,
    costPrice: 5800,
    category: "midrange",
    specs: { ram: "8GB", storage: "256GB", battery: "4500mAh", camera: "50MP + 8MP + 2MP", display: '6.55" AMOLED', processor: "Snapdragon 7 Gen 1", os: "Android 13" },
    tags: ["5G", "fast-charging-67W", "slim-design"],
    images: phoneImg("Xiaomi 13 Lite", "ff6f00"),
    stock: 19,
    views: 76,
    salesCount: 15,
  },
  // ===== BUDGET (8 phones) =====
  {
    name: "Samsung Galaxy A14",
    brand: "Samsung",
    model: "A14",
    price: 3999,
    costPrice: 2500,
    category: "budget",
    specs: { ram: "4GB", storage: "128GB", battery: "5000mAh", camera: "50MP + 2MP + 2MP", display: '6.6" PLS LCD', processor: "MediaTek Helio G80", os: "Android 13" },
    tags: ["expandable-storage", "long-battery"],
    images: phoneImg("Galaxy A14", "27ae60"),
    stock: 40,
    views: 201,
    salesCount: 65,
  },
  {
    name: "Xiaomi Redmi 12",
    brand: "Xiaomi",
    model: "Redmi 12",
    price: 3499,
    costPrice: 2200,
    category: "budget",
    specs: { ram: "4GB", storage: "128GB", battery: "5000mAh", camera: "50MP + 8MP + 2MP", display: '6.79" IPS LCD', processor: "MediaTek Helio G88", os: "Android 13" },
    tags: ["fast-charging-18W", "large-display"],
    images: phoneImg("Redmi 12", "f39c12"),
    stock: 35,
    views: 178,
    salesCount: 58,
  },
  {
    name: "Oppo A78",
    brand: "Oppo",
    model: "A78",
    price: 5999,
    costPrice: 4000,
    category: "budget",
    specs: { ram: "8GB", storage: "256GB", battery: "5000mAh", camera: "50MP + 2MP", display: '6.43" AMOLED', processor: "Snapdragon 680", os: "Android 13" },
    tags: ["fast-charging-67W", "AMOLED"],
    images: phoneImg("Oppo A78", "16a085"),
    stock: 22,
    views: 134,
    salesCount: 36,
  },
  {
    name: "Realme C55",
    brand: "Realme",
    model: "C55",
    price: 4499,
    costPrice: 3000,
    category: "budget",
    specs: { ram: "6GB", storage: "128GB", battery: "5000mAh", camera: "64MP + 2MP", display: '6.72" IPS LCD', processor: "MediaTek Helio G88", os: "Android 13" },
    tags: ["fast-charging-33W", "high-res-camera"],
    images: phoneImg("Realme C55", "f1c40f"),
    stock: 28,
    views: 98,
    salesCount: 30,
  },
  {
    name: "Tecno Spark 10 Pro",
    brand: "Tecno",
    model: "Spark 10 Pro",
    price: 3299,
    costPrice: 2000,
    category: "budget",
    specs: { ram: "8GB", storage: "256GB", battery: "5000mAh", camera: "50MP + AI lens", display: '6.8" IPS LCD', processor: "MediaTek Helio G88", os: "Android 13" },
    tags: ["large-storage", "affordable"],
    images: phoneImg("Tecno Spark 10 Pro", "2980b9"),
    stock: 45,
    views: 156,
    salesCount: 48,
  },
  {
    name: "Samsung Galaxy A05s",
    brand: "Samsung",
    model: "A05s",
    price: 2999,
    costPrice: 1800,
    category: "budget",
    specs: { ram: "4GB", storage: "128GB", battery: "5000mAh", camera: "50MP + 2MP + 2MP", display: '6.7" PLS LCD', processor: "Snapdragon 680", os: "Android 13" },
    tags: ["affordable", "long-battery", "expandable-storage"],
    images: phoneImg("Galaxy A05s", "1abc9c"),
    stock: 50,
    views: 223,
    salesCount: 72,
  },
  {
    name: "Xiaomi Redmi 13C",
    brand: "Xiaomi",
    model: "Redmi 13C",
    price: 2799,
    costPrice: 1700,
    category: "budget",
    specs: { ram: "4GB", storage: "128GB", battery: "5000mAh", camera: "50MP + 0.08MP", display: '6.74" IPS LCD', processor: "MediaTek Helio G85", os: "Android 13" },
    tags: ["affordable", "large-display"],
    images: phoneImg("Redmi 13C", "e67e22"),
    stock: 38,
    views: 167,
    salesCount: 55,
  },
  {
    name: "Realme Narzo 60x",
    brand: "Realme",
    model: "Narzo 60x",
    price: 3799,
    costPrice: 2400,
    category: "budget",
    specs: { ram: "6GB", storage: "128GB", battery: "5000mAh", camera: "64MP + 2MP", display: '6.72" IPS LCD', processor: "MediaTek Dimensity 6100+", os: "Android 13" },
    tags: ["5G", "fast-charging-33W", "affordable-5G"],
    images: phoneImg("Realme Narzo 60x", "d35400"),
    stock: 25,
    views: 87,
    salesCount: 19,
  },
];

const categories = [
  { name: "Budget Phones", description: "Affordable smartphones under R6,000 with essential features", productsCount: 8 },
  { name: "Mid-Range Phones", description: "Best value phones between R6,000 - R15,000 with great specs", productsCount: 9 },
  { name: "Flagship Phones", description: "Premium smartphones above R15,000 with cutting-edge technology", productsCount: 8 },
];

async function seed() {
  console.log("🌱 Seeding products...");
  for (const product of products) {
    const docRef = doc(collection(db, "products"));
    await setDoc(docRef, {
      ...product,
      id: docRef.id,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    console.log(`  ✅ ${product.name} (${product.images.length} images)`);
  }

  console.log("\n📁 Seeding categories...");
  for (const category of categories) {
    const docRef = doc(collection(db, "categories"));
    await setDoc(docRef, {
      ...category,
      id: docRef.id,
      createdAt: Timestamp.now(),
    });
    console.log(`  ✅ ${category.name}`);
  }

  console.log("\n🎉 Seeding complete!");
  console.log(`   ${products.length} products added`);
  console.log(`   ${categories.length} categories added`);
  console.log("\nYou can now browse the store and see all phones with images!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
