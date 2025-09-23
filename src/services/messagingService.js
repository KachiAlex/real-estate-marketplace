import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import app from '../config/firebase';

export const initFcm = async () => {
  try {
    const supported = await isSupported();
    if (!supported) return { supported: false };
    const messaging = getMessaging(app);
    return { supported: true, messaging };
  } catch (e) {
    return { supported: false, error: e };
  }
};

export const registerFcmToken = async (vapidKey) => {
  try {
    const { supported, messaging } = await initFcm();
    if (!supported) return null;
    const token = await getToken(messaging, { vapidKey });
    return token || null;
  } catch (e) {
    return null;
  }
};

export const subscribeOnMessage = async (callback) => {
  try {
    const { supported, messaging } = await initFcm();
    if (!supported) return () => {};
    return onMessage(messaging, callback);
  } catch (e) {
    return () => {};
  }
};


