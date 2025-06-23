import { useState, useEffect } from 'react';
import type { FerryEvent, NotificationSettings, MonitoringState, NotificationType } from '../types/ferry';
import { TelegramService } from '../services/telegramService';
import { BrowserNotificationService } from '../services/browserNotificationService';
import { MonitoringService } from '../services/monitoringService';
import { formatTime } from '../services/ferryApi';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: FerryEvent;
  direction: string;
  date: string;
  route: string;
}

export function NotificationModal({
  isOpen,
  onClose,
  selectedEvent,
  direction,
  date,
  route,
}: NotificationModalProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    telegramBotToken: '',
    telegramChatId: '',
    carCapacityThreshold: 10,
    notificationType: 'browser' as NotificationType,
  });
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isStarting, setIsStarting] = useState(false);
  const [browserNotificationSupported, setBrowserNotificationSupported] = useState(false);

  useEffect(() => {
    // Check browser notification support
    setBrowserNotificationSupported(BrowserNotificationService.isSupported());

    // Load saved settings from localStorage
    const savedToken = localStorage.getItem('telegram-bot-token');
    const savedChatId = localStorage.getItem('telegram-chat-id');
    const savedNotificationType = localStorage.getItem('notification-type') as NotificationType;

    if (savedToken) setSettings(prev => ({ ...prev, telegramBotToken: savedToken }));
    if (savedChatId) setSettings(prev => ({ ...prev, telegramChatId: savedChatId }));
    if (savedNotificationType) setSettings(prev => ({ ...prev, notificationType: savedNotificationType }));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setConnectionStatus('idle');
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    if (settings.notificationType === 'telegram') {
      if (!settings.telegramBotToken || !settings.telegramChatId) {
        setConnectionStatus('error');
        return;
      }

      setIsTestingConnection(true);
      try {
        const success = await TelegramService.testConnection(
          settings.telegramBotToken,
          settings.telegramChatId
        );
        setConnectionStatus(success ? 'success' : 'error');
      } catch (error) {
        setConnectionStatus('error');
      } finally {
        setIsTestingConnection(false);
      }
    } else {
      // Test browser notifications
      setIsTestingConnection(true);
      try {
        const success = await BrowserNotificationService.testNotification();
        setConnectionStatus(success ? 'success' : 'error');
      } catch (error) {
        setConnectionStatus('error');
      } finally {
        setIsTestingConnection(false);
      }
    }
  };

  const handleStartMonitoring = async () => {
    if (connectionStatus !== 'success') {
      alert('Please test your notification method first');
      return;
    }

    setIsStarting(true);
    try {
      // Save settings to localStorage
      if (settings.notificationType === 'telegram') {
        localStorage.setItem('telegram-bot-token', settings.telegramBotToken);
        localStorage.setItem('telegram-chat-id', settings.telegramChatId);
      }
      localStorage.setItem('notification-type', settings.notificationType);

      const monitoringState: MonitoringState = {
        id: `${selectedEvent.uid}-${Date.now()}`,
        isActive: false,
        departureUid: selectedEvent.uid,
        direction,
        departureDate: date,
        departureTime: formatTime(selectedEvent.dtstart),
        route,
        threshold: settings.carCapacityThreshold,
        notificationType: settings.notificationType,
        telegramBotToken: settings.notificationType === 'telegram' ? settings.telegramBotToken : undefined,
        telegramChatId: settings.notificationType === 'telegram' ? settings.telegramChatId : undefined,
        lastCheckedCapacity: selectedEvent.capacities.sv,
        lastNotificationSent: 0,
        lastCapacityCheck: 0, // Will be set when monitoring starts
        createdAt: new Date().toISOString(),
      };

      MonitoringService.startMonitoring(monitoringState);
      onClose();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
      alert('Failed to start monitoring. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const isAlreadyMonitored = MonitoringService.isMonitoring(selectedEvent.uid);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Set up Capacity Monitoring
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Selected Departure</h3>
            <p className="text-sm text-blue-800">
              <strong>Route:</strong> {route}<br />
              <strong>Time:</strong> {formatTime(selectedEvent.dtstart)}<br />
              <strong>Current small vehicle capacity:</strong> {selectedEvent.capacities.sv}
            </p>
          </div>

          {isAlreadyMonitored && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-orange-800 text-sm">
                ⚠️ This departure is already being monitored. Starting a new monitor will replace the existing one.
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Method
              </label>
              <div className="space-y-2">
                {browserNotificationSupported && (
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="notificationType"
                      value="browser"
                      checked={settings.notificationType === 'browser'}
                      onChange={(e) => setSettings(prev => ({ ...prev, notificationType: e.target.value as NotificationType }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Browser Notifications (Recommended)</span>
                  </label>
                )}
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="notificationType"
                    value="telegram"
                    checked={settings.notificationType === 'telegram'}
                    onChange={(e) => setSettings(prev => ({ ...prev, notificationType: e.target.value as NotificationType }))}
                    className="mr-2"
                  />
                  <span className="text-sm">Telegram Bot</span>
                </label>
              </div>
            </div>

            {settings.notificationType === 'telegram' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telegram Bot Token
                  </label>
                  <input
                    type="text"
                    value={settings.telegramBotToken}
                    onChange={(e) => setSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                    placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from @BotFather on Telegram
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chat ID
                  </label>
                  <input
                    type="text"
                    value={settings.telegramChatId}
                    onChange={(e) => setSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                    placeholder="123456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get this from @userinfobot on Telegram
                  </p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert when small vehicle capacity drops below (not at) this number
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={settings.carCapacityThreshold}
                onChange={(e) => setSettings(prev => ({ ...prev, carCapacityThreshold: Number.parseInt(e.target.value) || 1 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={isTestingConnection || (settings.notificationType === 'telegram' && (!settings.telegramBotToken || !settings.telegramChatId))}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTestingConnection ? 'Testing...' : `Test ${settings.notificationType === 'telegram' ? 'Telegram' : 'Browser'} Notifications`}
              </button>

              {connectionStatus === 'success' && (
                <div className="flex items-center text-green-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}

              {connectionStatus === 'error' && (
                <div className="flex items-center text-red-600">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 p-3 rounded-md">
              <p className="text-xs text-yellow-800">
                <strong>{settings.notificationType === 'browser' ? 'Browser Notifications:' : 'Telegram Setup:'}</strong><br />
                {settings.notificationType === 'browser' ? (
                  <>Browser notifications work even when the tab is closed, as long as your browser is running. Click "Test Browser Notifications" to grant permission and verify they work.</>
                ) : (
                  <>1. Create a bot with @BotFather on Telegram<br />
                  2. Get your Chat ID from @userinfobot<br />
                  3. Test the connection above</>
                )}
                <br />4. Start monitoring - capacity is checked every minute and you'll receive notifications immediately when small vehicle capacity drops below (not at) your threshold
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleStartMonitoring}
              disabled={connectionStatus !== 'success' || isStarting}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isStarting ? 'Starting...' : 'Start Monitoring'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
