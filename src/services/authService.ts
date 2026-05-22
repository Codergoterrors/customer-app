// Firebase Authentication Service
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import type { User } from '../types';

class AuthService {
  // Sign in with email and password
  async signInWithEmail(
    email: string,
    password: string,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const credential = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Create account with email and password
  async signUpWithEmail(
    email: string,
    password: string,
    name: string,
    phone: string,
  ): Promise<FirebaseAuthTypes.UserCredential> {
    try {
      const credential = await auth().createUserWithEmailAndPassword(
        email,
        password,
      );

      // Update display name
      await credential.user.updateProfile({ displayName: name });

      // Create user profile in Firestore
      await this.createUserProfile(credential.user.uid, {
        uid: credential.user.uid,
        name,
        email,
        phone,
        profilePhotoUrl: '',
        fcmToken: '',
        savedAddresses: [],
        savedPaymentMethods: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      return credential;
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Create user profile in Firestore
  async createUserProfile(userId: string, userData: User): Promise<void> {
    await firestore().collection('users').doc(userId).set(userData);
  }

  // Get user profile from Firestore
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const doc = await firestore().collection('users').doc(userId).get();
      if (doc.exists()) {
        return doc.data() as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  // Update user profile
  async updateUserProfile(
    userId: string,
    updates: Partial<User>,
  ): Promise<void> {
    await firestore()
      .collection('users')
      .doc(userId)
      .update({ ...updates, updatedAt: Date.now() });
  }

  // Sign out
  async signOut(): Promise<void> {
    await auth().signOut();
  }

  // Send password reset email
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Get current user
  getCurrentUser(): FirebaseAuthTypes.User | null {
    return auth().currentUser;
  }

  // Listen to auth state changes
  onAuthStateChanged(
    callback: (user: FirebaseAuthTypes.User | null) => void,
  ): () => void {
    return auth().onAuthStateChanged(callback);
  }

  // Handle Firebase auth errors with user-friendly messages
  private handleAuthError(error: any): Error {
    let message = 'An unexpected error occurred. Please try again.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'This email is already registered. Try signing in instead.';
        break;
      case 'auth/invalid-email':
        message = 'Please enter a valid email address.';
        break;
      case 'auth/weak-password':
        message = 'Password must be at least 6 characters.';
        break;
      case 'auth/user-not-found':
        message = 'No account found with this email.';
        break;
      case 'auth/wrong-password':
        message = 'Incorrect password. Please try again.';
        break;
      case 'auth/too-many-requests':
        message = 'Too many attempts. Please try again later.';
        break;
      case 'auth/network-request-failed':
        message = 'Network error. Please check your connection.';
        break;
      case 'auth/user-disabled':
        message = 'This account has been disabled.';
        break;
      default:
        message = error.message || message;
    }

    return new Error(message);
  }
}

export const authService = new AuthService();
