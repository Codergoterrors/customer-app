// Address Service — Manages saved addresses in Firestore
import firestore from '@react-native-firebase/firestore';
import type { SavedAddress } from '../types';

class AddressService {
  // Get all saved addresses for a user
  async getAddresses(userId: string): Promise<SavedAddress[]> {
    try {
      const doc = await firestore().collection('users').doc(userId).get();
      if (doc.exists()) {
        const data = doc.data();
        return (data?.savedAddresses as SavedAddress[]) || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching addresses:', error);
      return [];
    }
  }

  // Save a new address
  async saveAddress(userId: string, address: SavedAddress): Promise<void> {
    try {
      // If this is the default address, unset other defaults first
      if (address.isDefault) {
        const existing = await this.getAddresses(userId);
        const updated = existing.map((a) => ({ ...a, isDefault: false }));
        updated.push(address);
        await firestore().collection('users').doc(userId).update({
          savedAddresses: updated,
          updatedAt: Date.now(),
        });
      } else {
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            savedAddresses: firestore.FieldValue.arrayUnion(address),
            updatedAt: Date.now(),
          });
      }
    } catch (error) {
      console.error('Error saving address:', error);
      throw new Error('Failed to save address.');
    }
  }

  // Delete a saved address
  async deleteAddress(userId: string, addressId: string): Promise<void> {
    try {
      const existing = await this.getAddresses(userId);
      const filtered = existing.filter((a) => a.id !== addressId);
      await firestore().collection('users').doc(userId).update({
        savedAddresses: filtered,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('Failed to delete address.');
    }
  }

  // Set an address as default
  async setDefaultAddress(
    userId: string,
    addressId: string,
  ): Promise<void> {
    try {
      const existing = await this.getAddresses(userId);
      const updated = existing.map((a) => ({
        ...a,
        isDefault: a.id === addressId,
      }));
      await firestore().collection('users').doc(userId).update({
        savedAddresses: updated,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error setting default address:', error);
      throw new Error('Failed to update address.');
    }
  }
}

export const addressService = new AddressService();
