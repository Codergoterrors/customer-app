/**
 * Delete duplicate Kittiya restaurants from Firestore, keeping only one.
 * Run: node scripts/fix-duplicate-kittiya.js
 */
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, deleteDoc, doc, query, where } = require('firebase/firestore');

const app = initializeApp({ apiKey: 'AIzaSyDZvgEg5Xg6WFOpbv0dDuwLpDkDmQS89wI', projectId: 'eats-apps' });
const db = getFirestore(app);

async function fixDuplicates() {
  const snapshot = await getDocs(collection(db, 'restaurants'));
  const kittiyaDocs = snapshot.docs.filter(d => d.data().name === 'Kittiya');
  
  console.log(`Found ${kittiyaDocs.length} Kittiya restaurant(s)`);
  
  if (kittiyaDocs.length > 1) {
    // Keep the first one, delete the rest
    for (let i = 1; i < kittiyaDocs.length; i++) {
      const docToDelete = kittiyaDocs[i];
      // Delete menu subcollection first
      const menuSnapshot = await getDocs(collection(db, 'restaurants', docToDelete.id, 'menu'));
      for (const menuDoc of menuSnapshot.docs) {
        await deleteDoc(doc(db, 'restaurants', docToDelete.id, 'menu', menuDoc.id));
        console.log(`  🗑️  Deleted menu item: ${menuDoc.data().name}`);
      }
      await deleteDoc(doc(db, 'restaurants', docToDelete.id));
      console.log(`🗑️  Deleted duplicate Kittiya (ID: ${docToDelete.id})`);
    }
    console.log(`✅ Kept Kittiya (ID: ${kittiyaDocs[0].id})`);
  } else {
    console.log('✅ No duplicates found');
  }
}

fixDuplicates().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
