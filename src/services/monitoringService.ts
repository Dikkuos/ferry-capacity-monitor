import type { MonitoringState, TelegramMessage } from '../types/ferry';
import { getEvents } from './ferryApi';
import { TelegramService } from './telegramService';
import { BrowserNotificationService } from './browserNotificationService';

export class MonitoringService {
  private static activeMonitoringSessions: Map<string, MonitoringState> = new Map();
  private static readonly CHECK_INTERVAL = 1 * 60 * 1000; // 1 minute

  static startMonitoring(config: MonitoringState): void {
    // Generate unique ID if not provided
    if (!config.id) {
      config.id = `${config.departureUid}-${Date.now()}`;
    }

    // Stop existing monitoring for this ID if it exists
    this.stopMonitoring(config.id);

    const monitoringState = {
      ...config,
      createdAt: new Date().toISOString(),
      isActive: true,
      lastCapacityCheck: Date.now() // Initialize with current time
    };

    // Start periodic checking
    const intervalId = window.setInterval(
      () => this.checkCapacity(monitoringState.id),
      this.CHECK_INTERVAL
    );

    monitoringState.intervalId = intervalId;
    this.activeMonitoringSessions.set(monitoringState.id, monitoringState);

    // Save to localStorage
    this.saveMonitoringState();

    // Send initial notification
    this.sendStartNotification(monitoringState.id);

    // Do initial check
    this.checkCapacity(monitoringState.id);
  }

  static stopMonitoring(id: string): void {
    const monitoring = this.activeMonitoringSessions.get(id);

    if (monitoring?.intervalId) {
      window.clearInterval(monitoring.intervalId);
    }

    if (monitoring?.isActive) {
      this.sendStopNotification(id);
    }

    this.activeMonitoringSessions.delete(id);
    this.saveMonitoringState();
  }

  static stopAllMonitoring(): void {
    for (const [id] of this.activeMonitoringSessions) {
      this.stopMonitoring(id);
    }
  }

  static getActiveMonitoringSessions(): MonitoringState[] {
    return Array.from(this.activeMonitoringSessions.values());
  }

  static getMonitoringById(id: string): MonitoringState | undefined {
    return this.activeMonitoringSessions.get(id);
  }

  static isMonitoring(departureUid?: string): boolean {
    if (departureUid) {
      return Array.from(this.activeMonitoringSessions.values())
        .some(session => session.departureUid === departureUid);
    }
    return this.activeMonitoringSessions.size > 0;
  }

  private static async checkCapacity(monitoringId: string): Promise<void> {
    const monitoring = this.activeMonitoringSessions.get(monitoringId);
    if (!monitoring) return;

    try {
      // Update last check time
      monitoring.lastCapacityCheck = Date.now();
      this.activeMonitoringSessions.set(monitoringId, monitoring);

      const events = await getEvents(
        monitoring.direction,
        monitoring.departureDate
      );

      const targetEvent = events.items.find(
        event => event.uid === monitoring.departureUid
      );

      if (!targetEvent) {
        console.log(`Target departure not found for ${monitoringId}, stopping monitoring`);
        this.stopMonitoring(monitoringId);
        return;
      }

      const currentCapacity = targetEvent.capacities.sv; // sv = small vehicles (cars)
      const threshold = monitoring.threshold;

      // Update last checked capacity
      monitoring.lastCheckedCapacity = currentCapacity;
      this.activeMonitoringSessions.set(monitoringId, monitoring);
      this.saveMonitoringState();

      // Send notification immediately when capacity drops below threshold (no spam protection)
      if (currentCapacity < threshold) {
        await this.sendCapacityAlert(monitoringId, currentCapacity);
        monitoring.lastNotificationSent = Date.now();
        this.activeMonitoringSessions.set(monitoringId, monitoring);
        this.saveMonitoringState();
      }
    } catch (error) {
      console.error(`Error checking capacity for ${monitoringId}:`, error);
    }
  }

  private static async sendCapacityAlert(monitoringId: string, currentCapacity: number): Promise<void> {
    const monitoring = this.activeMonitoringSessions.get(monitoringId);
    if (!monitoring) return;

    try {
      if (monitoring.notificationType === 'telegram') {
        if (!monitoring.telegramBotToken || !monitoring.telegramChatId) {
          console.error('Telegram credentials missing for monitoring:', monitoringId);
          return;
        }

        const message: TelegramMessage = {
          chat_id: monitoring.telegramChatId,
          text: TelegramService.formatCapacityAlert(
            monitoring.route,
            monitoring.departureTime,
            currentCapacity,
            monitoring.threshold
          ),
        };

        await TelegramService.sendMessage(monitoring.telegramBotToken, message);
      } else if (monitoring.notificationType === 'browser') {
        const notification = BrowserNotificationService.formatCapacityAlert(
          monitoring.route,
          monitoring.departureTime,
          currentCapacity,
          monitoring.threshold
        );

        await BrowserNotificationService.sendNotification(notification);
      }
    } catch (error) {
      console.error(`Failed to send capacity alert for ${monitoringId}:`, error);
    }
  }

  private static async sendStartNotification(monitoringId: string): Promise<void> {
    const monitoring = this.activeMonitoringSessions.get(monitoringId);
    if (!monitoring) return;

    try {
      if (monitoring.notificationType === 'telegram') {
        if (!monitoring.telegramBotToken || !monitoring.telegramChatId) return;

        const message: TelegramMessage = {
          chat_id: monitoring.telegramChatId,
          text: TelegramService.formatMonitoringStarted(
            monitoring.route,
            monitoring.departureTime,
            monitoring.threshold
          ),
        };

        await TelegramService.sendMessage(monitoring.telegramBotToken, message);
      } else if (monitoring.notificationType === 'browser') {
        const notification = BrowserNotificationService.formatMonitoringStarted(
          monitoring.route,
          monitoring.departureTime,
          monitoring.threshold
        );

        await BrowserNotificationService.sendNotification(notification);
      }
    } catch (error) {
      console.error(`Failed to send start notification for ${monitoringId}:`, error);
    }
  }

  private static async sendStopNotification(monitoringId: string): Promise<void> {
    const monitoring = this.activeMonitoringSessions.get(monitoringId);
    if (!monitoring) return;

    try {
      if (monitoring.notificationType === 'telegram') {
        if (!monitoring.telegramBotToken || !monitoring.telegramChatId) return;

        const message: TelegramMessage = {
          chat_id: monitoring.telegramChatId,
          text: TelegramService.formatMonitoringStopped(
            monitoring.route,
            monitoring.departureTime
          ),
        };

        await TelegramService.sendMessage(monitoring.telegramBotToken, message);
      } else if (monitoring.notificationType === 'browser') {
        const notification = BrowserNotificationService.formatMonitoringStopped(
          monitoring.route,
          monitoring.departureTime
        );

        await BrowserNotificationService.sendNotification(notification);
      }
    } catch (error) {
      console.error(`Failed to send stop notification for ${monitoringId}:`, error);
    }
  }

  private static saveMonitoringState(): void {
    const sessions = Array.from(this.activeMonitoringSessions.values()).map(session => {
      const { intervalId, ...sessionToSave } = session;
      return sessionToSave;
    });
    localStorage.setItem('ferry-monitoring-sessions', JSON.stringify(sessions));
  }

  private static clearMonitoringState(): void {
    localStorage.removeItem('ferry-monitoring-sessions');
  }

  static loadMonitoringState(): void {
    try {
      const saved = localStorage.getItem('ferry-monitoring-sessions');
      if (saved) {
        const sessions: MonitoringState[] = JSON.parse(saved);

        for (const session of sessions) {
          // Check if the departure is still in the future
          const departureTime = new Date(`${session.departureDate}T${session.departureTime}`);
          const now = new Date();

          if (departureTime > now) {
            // Restart monitoring
            this.startMonitoring(session);
          }
        }

        // If no valid sessions remain, clear storage
        if (this.activeMonitoringSessions.size === 0) {
          this.clearMonitoringState();
        }
      }
    } catch (error) {
      console.error('Error loading monitoring state:', error);
      this.clearMonitoringState();
    }
  }
}
