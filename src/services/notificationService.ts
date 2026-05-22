// Firebase Notification Service
import messaging from '@react-native-firebase/messaging';
import firestore from '@react-native-firebase/firestore';
import type { AppNotification } from '../types';

class NotificationService {
  // Request notification permissions
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Get FCM token
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Save FCM token to user profile
  async saveFCMToken(userId: string, token: string): Promise<void> {
    try {
      await firestore().collection('users').doc(userId).update({
        fcmToken: token,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error('Error saving FCM token:', error);
    }
  }

  // Listen to foreground notifications
  onForegroundMessage(
    callback: (message: any) => void,
  ): () => void {
    return messaging().onMessage(async (remoteMessage) => {
      callback(remoteMessage);
    });
  }

  // Handle background messages
  setBackgroundMessageHandler(handler: (message: any) => Promise<void>): void {
    messaging().setBackgroundMessageHandler(handler);
  }

  // Listen to notification opens (when app opened from notification)
  onNotificationOpened(callback: (message: any) => void): () => void {
    return messaging().onNotificationOpenedApp((remoteMessage) => {
      callback(remoteMessage);
    });
  }

  // Check for initial notification (app opened from quit state via notification)
  async getInitialNotification(): Promise<any | null> {
    return messaging().getInitialNotification();
  }

  // Get user notifications from Firestore
  async getNotifications(userId: string): Promise<AppNotification[]> {
    try {
      const snapshot = await firestore()
        .collection('notifications')
        .doc(userId)
        .collection('items')
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AppNotification[];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark notification as read
  async markAsRead(userId: string, notificationId: string): Promise<void> {
    try {
      await firestore()
        .collection('notifications')
        .doc(userId)
        .collection('items')
        .doc(notificationId)
        .update({ isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Listen to notifications real-time
  onNotificationsSnapshot(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): () => void {
    return firestore()
      .collection('notifications')
      .doc(userId)
      .collection('items')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .onSnapshot((snapshot) => {
        const notifications = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as AppNotification),
        );
        callback(notifications);
      });
  }
}

export const notificationService = new NotificationService();
