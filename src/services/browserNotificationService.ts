import type { BrowserNotificationOptions } from '../types/ferry';

export class BrowserNotificationService {
  static async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('This browser does not support notifications');
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      throw new Error('Notifications are blocked. Please enable them in your browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission;
  }

  static isSupported(): boolean {
    return 'Notification' in window;
  }

  static getPermissionStatus(): NotificationPermission {
    if (!this.isSupported()) {
      return 'denied';
    }
    return Notification.permission;
  }

  static async sendNotification(options: BrowserNotificationOptions): Promise<void> {
    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
    });

    // Auto-close after 10 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => {
        notification.close();
      }, 10000);
    }

    return new Promise((resolve, reject) => {
      notification.onshow = () => resolve();
      notification.onerror = (error) => reject(error);
    });
  }

  static async testNotification(): Promise<boolean> {
    try {
      await this.sendNotification({
        title: '🚢 Ferry Monitoring Test',
        body: 'Browser notifications are working! You\'ll receive alerts when ferry capacity drops.',
        tag: 'ferry-test',
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }

  static formatCapacityAlert(
    route: string,
    departureTime: string,
    currentCapacity: number,
    threshold: number
  ): BrowserNotificationOptions {
    return {
      title: '🚗 Ferry Capacity Alert!',
      body: `${route} at ${departureTime}: Only ${currentCapacity} small vehicle spaces left (threshold: ${threshold})`,
      tag: 'ferry-capacity-alert',
      requireInteraction: true,
    };
  }

  static formatMonitoringStarted(
    route: string,
    departureTime: string,
    threshold: number
  ): BrowserNotificationOptions {
    return {
      title: '🔔 Ferry Monitoring Started',
      body: `Monitoring ${route} at ${departureTime}. Alert threshold: ${threshold} small vehicles`,
      tag: 'ferry-monitoring-start',
    };
  }

  static formatMonitoringStopped(
    route: string,
    departureTime: string
  ): BrowserNotificationOptions {
    return {
      title: '🔕 Ferry Monitoring Stopped',
      body: `Stopped monitoring ${route} at ${departureTime}`,
      tag: 'ferry-monitoring-stop',
    };
  }
}
