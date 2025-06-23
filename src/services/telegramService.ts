import type { TelegramMessage, MonitoringState } from '../types/ferry';

export class TelegramService {
  static async sendMessage(botToken: string, message: TelegramMessage): Promise<boolean> {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.status}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  static async testConnection(botToken: string, chatId: string): Promise<boolean> {
    try {
      const testMessage: TelegramMessage = {
        chat_id: chatId,
        text: '🚢 Ferry capacity monitoring test - connection successful!',
      };

      await this.sendMessage(botToken, testMessage);
      return true;
    } catch (error) {
      console.error('Telegram connection test failed:', error);
      return false;
    }
  }

  static formatCapacityAlert(
    route: string,
    departureTime: string,
    currentCapacity: number,
    threshold: number
  ): string {
    return `🚗 Ferry Capacity Alert!

Route: ${route}
Departure: ${departureTime}
Available small vehicle spaces: ${currentCapacity}
Your threshold: ${threshold}

⚠️ Small vehicle capacity has dropped below your threshold!`;
  }

  static formatMonitoringStarted(
    route: string,
    departureTime: string,
    threshold: number
  ): string {
    return `🔔 Monitoring Started

Route: ${route}
Departure: ${departureTime}
Alert threshold: ${threshold} small vehicle spaces

You'll be notified when small vehicle capacity drops below ${threshold}.`;
  }

  static formatMonitoringStopped(route: string, departureTime: string): string {
    return `🔕 Monitoring Stopped

Route: ${route}
Departure: ${departureTime}

Capacity monitoring has been disabled.`;
  }
}
