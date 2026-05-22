// Script to add three new restaurants to Firestore:
// 1. Lucky Ji Chole Khulche
// 2. Sai Vadewale
// 3. Anna Idli Wada Center - Anand Park

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, collection, addDoc } = require('firebase/firestore');

const firebaseConfig = {
  projectId: 'eats-apps',
  apiKey: 'AIzaSyC0NzNgXx_k3M50q2fm8NDkNSgidVTW-eQ',
  storageBucket: 'eats-apps.firebasestorage.app',
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const restaurantsData = [
  {
    id: 'lucky_ji_chole_khulche',
    restaurant: {
      name: 'Lucky Ji Chole Khulche',
      cuisineType: ['North Indian', 'Punjabi', 'Street Food'],
      tags: ['chole', 'kulcha', 'street food', 'punjabi', 'lunch', 'vimannagar'],
      rating: 3.5,
      reviewCount: 34,
      deliveryTime: '20-30',
      deliveryFee: 25,
      minimumOrder: 50,
      image: 'file:///C:/Users/omkar/.gemini/antigravity/brain/f60b527a-5861-42a3-8041-140db930db7c/media__1779469973276.jpg', // Main image
      isOpen: true,
      address: {
        fullAddress: 'House No 4, Clover Corner Row, Konark Nagar Rd, opp. Udaan Biodiversity Park, Konark Nagar, Clover Park, Viman Nagar, Pune, Maharashtra 411014',
        lat: 18.565495551837472,
        lng: 73.9108232234891,
      },
      latitude: 18.565495551837472,
      longitude: 73.9108232234891,
      openingHours: '10:00 AM - 11:00 PM',
      phone: '+91 9898989898',
      description: 'Mouthwatering butter & masala chole kulche with chilling buttermilk',
      featured: true,
      promoted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    menu: [
      {
        name: 'Butter Chole Kulche',
        description: 'Delectable butter-tossed chole served with two soft, fluffy kulchas',
        price: 100, category: 'Main Course', categoryOrder: 1, itemOrder: 1,
        image: 'file:///C:/Users/omkar/.gemini/antigravity/brain/f60b527a-5861-42a3-8041-140db930db7c/media__1779469973276.jpg',
        isAvailable: true, isVeg: true, portionInfo: '1 plate (2 kulchas + chole)',
      },
      {
        name: 'Masala Chole Kulche',
        description: 'Spicy masala-cooked chole served with two flavorful masala kulchas',
        price: 120, category: 'Main Course', categoryOrder: 1, itemOrder: 2,
        image: 'file:///C:/Users/omkar/.gemini/antigravity/brain/f60b527a-5861-42a3-8041-140db930db7c/media__1779469976236.jpg',
        isAvailable: true, isVeg: true, portionInfo: '1 plate (2 masala kulchas + chole)',
      },
      {
        name: 'Butter Milk',
        description: 'Refreshing spiced buttermilk to beat the heat',
        price: 20, category: 'Beverages', categoryOrder: 2, itemOrder: 1,
        image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 glass',
      },
      {
        name: 'Butter Kulcha',
        description: 'Single extra soft butter-topped kulcha',
        price: 30, category: 'Extras', categoryOrder: 3, itemOrder: 1,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 piece',
      },
      {
        name: 'Masala Kulcha',
        description: 'Single extra masala-stuffed fluffy kulcha',
        price: 40, category: 'Extras', categoryOrder: 3, itemOrder: 2,
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 piece',
      },
    ],
  },
  {
    id: 'sai_vadewale',
    restaurant: {
      name: 'Sai Vadewale',
      cuisineType: ['Maharashtrian', 'Street Food', 'Snacks'],
      tags: ['vadapav', 'sai vadewale', 'street food', 'snacks', 'wadgaonsheri'],
      rating: 4.0,
      reviewCount: 42,
      deliveryTime: '10-20',
      deliveryFee: 15,
      minimumOrder: 20,
      image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400',
      isOpen: true,
      address: {
        fullAddress: 'Next to Sugana Chicken shop, Near Foot Wear, Digamber Nagar, Anand Park, Wadgaon Sheri, Pune, Maharashtra 411014',
        lat: 18.551448,
        lng: 73.924946,
      },
      latitude: 18.551448,
      longitude: 73.924946,
      openingHours: '5:00 PM - 9:00 PM',
      phone: '+91 9797979797',
      description: 'Super hot, fresh and crispy Vadapav served with green chillies and sweet-sour chutneys',
      featured: false,
      promoted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    menu: [
      {
        name: 'Vadapav',
        description: 'Classic Maharashtrian batata vada inside a soft pav with garlic chutney',
        price: 20, category: 'Snacks', categoryOrder: 1, itemOrder: 1,
        image: 'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 piece',
      },
    ],
  },
  {
    id: 'anna_idli_wada_center',
    restaurant: {
      name: 'Anna Idli Wada Center - Anand Park',
      cuisineType: ['South Indian', 'Breakfast'],
      tags: ['idli', 'wada', 'south indian', 'breakfast', 'anna', 'wadgaonsheri'],
      rating: 4.5,
      reviewCount: 88,
      deliveryTime: '15-25',
      deliveryFee: 20,
      minimumOrder: 40,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
      isOpen: true,
      address: {
        fullAddress: 'Next to Shree Balaji Chinese Food, Near Palms Spa- Vadgaonsheri, Anand Park, Behind Ayangar Bekari, Front Of Devkhile Dental Clinic & Implant Center, Sr No.49/1, Chowk, near Anand Park, Bharati Colony, Wadgaon Sheri, Pune, Maharashtra 411014',
        lat: 18.552732,
        lng: 73.925142,
      },
      latitude: 18.552732,
      longitude: 73.925142,
      openingHours: '9:00 AM - 11:00 AM',
      phone: '+91 9696969696',
      description: 'Authentic and clean South Indian breakfast — steaming hot idlis and crispy medu wadas',
      featured: true,
      promoted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
    menu: [
      {
        name: 'Medu Vada (1 Plate)',
        description: '4 pieces of crispy, hot medu vadas served with piping hot sambar and fresh coconut chutney',
        price: 40, category: 'Breakfast', categoryOrder: 1, itemOrder: 1,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 plate (4 pieces)',
      },
      {
        name: 'Medu Vada (1 Piece)',
        description: 'Single crispy medu vada served with sambar and coconut chutney',
        price: 10, category: 'Breakfast', categoryOrder: 1, itemOrder: 2,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 piece',
      },
      {
        name: 'Idli (1 Plate)',
        description: '4 pieces of steaming soft rice idlis served with hot sambar and coconut chutney',
        price: 40, category: 'Breakfast', categoryOrder: 1, itemOrder: 3,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400', // Sambar idli or similar
        isAvailable: true, isVeg: true, portionInfo: '1 plate (4 pieces)',
      },
      {
        name: 'Idli (1 Piece)',
        description: 'Single steaming soft rice idli served with sambar and coconut chutney',
        price: 10, category: 'Breakfast', categoryOrder: 1, itemOrder: 4,
        image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
        isAvailable: true, isVeg: true, portionInfo: '1 piece',
      },
    ],
  },
];

async function seed() {
  try {
    for (const data of restaurantsData) {
      console.log(`\nStarting seeding for "${data.restaurant.name}"...`);
      
      // Create/Overwrite restaurant document
      await setDoc(doc(db, 'restaurants', data.id), data.restaurant);
      console.log(`✅ Restaurant document created: ${data.id}`);

      // Add menu sub-collection items
      for (const item of data.menu) {
        await addDoc(collection(db, 'restaurants', data.id, 'menu'), {
          ...item,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log(`  ✅ Added menu item: ${item.name} - ₹${item.price}`);
      }
    }

    console.log('\n🎉 All three restaurants seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
}

seed();
