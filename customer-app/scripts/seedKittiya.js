// Seed script to add "Kittiya" restaurant to Firestore
// Uses Firebase JS SDK (web) for Node.js seeding
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'eats-apps',
  apiKey: 'AIzaSyC0NzNgXx_k3M50q2fm8NDkNSgidVTW-eQ',
  storageBucket: 'eats-apps.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const restaurantId = 'kittiya_pune';

  // Coordinates: 18°33'08.0"N 73°55'14.5"E → Decimal: 18.552222, 73.920694
  const restaurantData = {
    name: 'Kittiya',
    cuisineType: ['Indian', 'Street Food', 'Maharashtrian'],
    tags: ['vadapav', 'misal', 'street food', 'snacks', 'pune'],
    rating: 4.5,
    reviewCount: 128,
    deliveryTime: '15-25',
    deliveryFee: 20,
    minimumOrder: 50,
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
    isOpen: true,
    address: {
      fullAddress: 'Kittiya, Pune, Maharashtra',
      lat: 18.552222,
      lng: 73.920694,
    },
    latitude: 18.552222,
    longitude: 73.920694,
    openingHours: '8:00 AM - 10:00 PM',
    phone: '+91 9876543210',
    description: 'Authentic Maharashtrian street food — Vadapav, Misal Pav, Medu Vada & more',
    featured: true,
    promoted: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const menuItems = [
    {
      name: 'Vada Pav',
      description: 'Classic Mumbai-style vada pav with spicy potato filling and chutneys',
      price: 20, category: 'Snacks', categoryOrder: 1, itemOrder: 1,
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400',
      isAvailable: true, isVeg: true, portionInfo: 'Per piece',
    },
    {
      name: 'Medu Vada',
      description: 'Crispy South Indian medu vada served with sambar and coconut chutney',
      price: 40, category: 'Snacks', categoryOrder: 1, itemOrder: 2,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
      isAvailable: true, isVeg: true, portionInfo: '1 plate (2 medu vada)',
    },
    {
      name: 'Misal Pav',
      description: 'Spicy Maharashtrian misal topped with farsan, onion, lemon, and served with pav',
      price: 30, category: 'Main Course', categoryOrder: 2, itemOrder: 1,
      image: 'https://images.unsplash.com/photo-1626132647523-66f5bf380027?w=400',
      isAvailable: true, isVeg: true, portionInfo: '1 plate (2 pav)',
    },
    {
      name: 'Vada',
      description: 'Deep-fried spiced potato vada, crispy outside and soft inside',
      price: 14, category: 'Snacks', categoryOrder: 1, itemOrder: 3,
      image: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400',
      isAvailable: true, isVeg: true, portionInfo: 'Per piece',
    },
    {
      name: 'Bhajji',
      description: 'Assorted crispy pakoras/bhajji — onion, chili, potato mix',
      price: 20, category: 'Snacks', categoryOrder: 1, itemOrder: 4,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
      isAvailable: true, isVeg: true, portionInfo: '1 plate (7 pieces)',
    },
  ];

  try {
    // Create restaurant
    await setDoc(doc(db, 'restaurants', restaurantId), restaurantData);
    console.log('✅ Restaurant "Kittiya" created');

    // Add menu items
    for (const item of menuItems) {
      await addDoc(collection(db, 'restaurants', restaurantId, 'menu'), {
        ...item, createdAt: Date.now(), updatedAt: Date.now(),
      });
      console.log(`  ✅ Added: ${item.name} - ₹${item.price}`);
    }

    console.log('\n🎉 Kittiya restaurant seeded successfully!');
    console.log("   Location: 18°33'08.0\"N 73°55'14.5\"E");
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding:', err);
    process.exit(1);
  }
}

seed();
