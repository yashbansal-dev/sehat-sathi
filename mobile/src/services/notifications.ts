import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Safe notification service that works seamlessly on both Web and Native Android/iOS
let Notifications: any = null;

try {
  Notifications = require('expo-notifications');
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (e) {
  console.log('expo-notifications notice: Native notifications unavailable in current runtime');
}

export interface PillReminder {
  id: string;
  name: string;
  dosage: string;
  timing: string;
  mealContext: string;
  purpose: string;
  taken: boolean;
}

export const INITIAL_PILLS: PillReminder[] = [
  {
    id: 'pill-1',
    name: 'Metformin Hydrochloride',
    dosage: '500 mg',
    timing: 'Morning',
    mealContext: 'Take with or after breakfast',
    purpose: 'Type 2 Diabetes glycemic control',
    taken: false,
  },
  {
    id: 'pill-2',
    name: 'Telmisartan',
    dosage: '40 mg',
    timing: 'Morning',
    mealContext: 'Take once daily in the morning',
    purpose: 'Hypertension (Blood Pressure)',
    taken: false,
  },
  {
    id: 'pill-3',
    name: 'Atorvastatin',
    dosage: '10 mg',
    timing: 'Night',
    mealContext: 'Take after dinner at bedtime',
    purpose: 'Lipid/Cholesterol stabilization',
    taken: false,
  },
];

class NotificationService {
  private hasPermission: boolean = false;

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web' || !Notifications) {
      this.hasPermission = true;
      return true;
    }
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      this.hasPermission = finalStatus === 'granted';
      return this.hasPermission;
    } catch (e) {
      console.warn('Notification permission request error:', e);
      return false;
    }
  }

  async sendInstantAlert(title: string, body: string, data: any = {}) {
    await this.requestPermissions();
    if (Notifications && Platform.OS !== 'web') {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title,
            body,
            data,
            sound: true,
          },
          trigger: null, // Send immediately
        });
        return true;
      } catch (e) {
        console.warn('Failed to schedule native notification:', e);
      }
    }
    // Web or fallback
    console.log(`[ALERT] ${title} - ${body}`);
    return true;
  }

  async sendDoctorAccessNotification(doctorName: string, tokenTitle: string) {
    return this.sendInstantAlert(
      '🔒 Doctor Access Alert',
      `${doctorName} is viewing your clinical records via: "${tokenTitle}". Access is logged with patient-controlled revocation enabled.`,
      { type: 'doctor_access', tokenTitle }
    );
  }

  async sendPrescriptionSentNotification(doctorName: string, docName: string) {
    return this.sendInstantAlert(
      '📤 Prescription Sent to Doctor!',
      `Your prescription "${docName}" was instantly shared with ${doctorName}. A secure 48-hour clinical portal link was generated.`,
      { type: 'prescription_sent', doctorName, docName }
    );
  }

  async sendPillReminderNotification(pill: PillReminder) {
    return this.sendInstantAlert(
      `💊 Medicine Reminder: ${pill.name} ${pill.dosage}`,
      `Time for your ${pill.timing} dose! ${pill.mealContext}.`,
      { type: 'pill_reminder', pillId: pill.id }
    );
  }

  async getPills(): Promise<PillReminder[]> {
    try {
      const saved = await AsyncStorage.getItem('sehat_today_pills');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return INITIAL_PILLS;
  }

  async togglePillStatus(pillId: string): Promise<PillReminder[]> {
    const current = await this.getPills();
    const updated = current.map((p) =>
      p.id === pillId ? { ...p, taken: !p.taken } : p
    );
    await AsyncStorage.setItem('sehat_today_pills', JSON.stringify(updated));
    return updated;
  }
}

export const notificationService = new NotificationService();
