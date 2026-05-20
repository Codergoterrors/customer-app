/**
 * Seed script to add "Kittiya" restaurant and its menu to Firestore.
 * Run: node scripts/seed-kittiya.js
 * Uses Firebase JS client SDK with the project's web API key.
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, writeBatch } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: 'AIzaSyDZvgEg5Xg6WFOpbv0dDuwLpDkDmQS89wI',
  projectId: 'eats-apps',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seedKittiya() {
  const now = Date.now();

  // ===== Restaurant Document =====
  const restaurantRef = doc(collection(db, 'restaurants'));
  const restaurantData = {
    name: 'Kittiya',
    description: 'Authentic Maharashtrian street food — fresh vadapav, crispy bhajji, and spicy misal pav made with love.',
    cuisineType: ['Street Food', 'Maharashtrian', 'Indian'],
    headerImageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=800',
    logoUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=200',
    rating: 4.5,
    totalReviews: 120,
    deliveryTimeMinutes: 25,
    deliveryFee: 20,
    minimumOrder: 50,
    isOpen: true,
    openingHours: {
      monday: { open: '08:00', close: '22:00' },
      tuesday: { open: '08:00', close: '22:00' },
      wednesday: { open: '08:00', close: '22:00' },
      thursday: { open: '08:00', close: '22:00' },
      friday: { open: '08:00', close: '22:00' },
      saturday: { open: '08:00', close: '23:00' },
      sunday: { open: '09:00', close: '22:00' },
    },
    address: {
      fullAddress: 'Kittiya, Near Sinhagad Road, Pune, Maharashtra 411041',
      lat: 18.552222,  // 18°33'08.0"N
      lng: 73.920694,  // 73°55'14.5"E
      city: 'Pune',
    },
    phone: '+919876543210',
    tags: ['vadapav', 'street food', 'bhajji', 'misal', 'maharashtrian', 'snacks', 'budget friendly'],
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(restaurantRef, restaurantData);
  console.log(`✅ Restaurant "Kittiya" created with ID: ${restaurantRef.id}`);

  // ===== Menu Items (subcollection: restaurants/{id}/menu) =====
  const menuItems = [
    {
      name: 'Vadapav',
      description: 'Classic Pune-style vadapav with spicy batata vada, garlic chutney, and fresh pav.',
      price: 20,
      imageUrl: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400',
      category: 'Snacks',
      categoryOrder: 1,
      itemOrder: 1,
      isAvailable: true,
      isVeg: true,
      isPopular: true,
      isSpicy: true,
      preparationTimeMinutes: 5,
      customizationGroups: [],
    },
    {
      name: 'Medu Vada',
      description: '1 plate — 2 crispy medu vadas served with sambar and coconut chutney.',
      price: 40,
      imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
      category: 'Snacks',
      categoryOrder: 1,
      itemOrder: 2,
      isAvailable: true,
      isVeg: true,
      isPopular: true,
      isSpicy: false,
      preparationTimeMinutes: 10,
      customizationGroups: [],
    },
    {
      name: 'Misal Pav',
      description: '1 plate — Spicy sprouted moth bean curry topped with farsan, served with 2 pav.',
      price: 30,
      imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400',
      category: 'Main Course',
      categoryOrder: 2,
      itemOrder: 1,
      isAvailable: true,
      isVeg: true,
      isPopular: true,
      isSpicy: true,
      preparationTimeMinutes: 10,
      customizationGroups: [],
    },
    {
      name: 'Vada',
      description: 'Single crispy batata vada — deep fried spiced potato dumpling.',
      price: 14,
      imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400',
      category: 'Snacks',
      categoryOrder: 1,
      itemOrder: 3,
      isAvailable: true,
      isVeg: true,
      isPopular: false,
      isSpicy: true,
      preparationTimeMinutes: 5,
      customizationGroups: [],
    },
    {
      name: 'Bhajji',
      description: '1 plate — 7 pieces of crispy assorted bhajji (onion, potato, chilli) served with chutney.',
      price: 20,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      category: 'Snacks',
      categoryOrder: 1,
      itemOrder: 4,
      isAvailable: true,
      isVeg: true,
      isPopular: true,
      isSpicy: false,
      preparationTimeMinutes: 8,
      customizationGroups: [],
    },
  ];

  const batch = writeBatch(db);
  for (const item of menuItems) {
    const menuRef = doc(collection(db, 'restaurants', restaurantRef.id, 'menu'));
    batch.set(menuRef, {
      ...item,
      restaurantId: restaurantRef.id,
    });
    console.log(`  📝 Menu item "${item.name}" — ₹${item.price}`);
  }

  await batch.commit();
  console.log(`✅ ${menuItems.length} menu items added to Kittiya`);
  console.log('\n🎉 Done! Kittiya restaurant is now live in Firestore.');
}

seedKittiya().catch((err) => {
  console.error('❌ Error seeding Kittiya:', err.message || err);
  process.exit(1);
});
