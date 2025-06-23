import { useEffect, useState } from 'react';
import { MonitoringService } from '../services/monitoringService';
import type { MonitoringState } from '../types/ferry';

// Separate component for countdown timer to follow Rules of Hooks
function CountdownTimer({ lastCheckTime, checkInterval }: { lastCheckTime: number; checkInterval: number }) {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const timeSinceLastCheck = now - lastCheckTime;
      const remaining = Math.max(0, checkInterval - timeSinceLastCheck);
      setTimeRemaining(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastCheckTime, checkInterval]);

  const formatTimeRemaining = (milliseconds: number): string => {
    if (milliseconds <= 0) return 'Checking now...';

    const seconds = Math.ceil(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  return (
    <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
      ⏱️ Next check: {formatTimeRemaining(timeRemaining)}
    </span>
  );
}

export function MonitoringStatus() {
  const [monitoringSessions, setMonitoringSessions] = useState<MonitoringState[]>([]);

  useEffect(() => {
    const updateStatus = () => {
      setMonitoringSessions(MonitoringService.getActiveMonitoringSessions());
    };

    // Initial check
    updateStatus();

    // Update every 2 seconds for more responsive timer display
    const interval = setInterval(updateStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleStopMonitoring = (id: string) => {
    MonitoringService.stopMonitoring(id);
    setMonitoringSessions(MonitoringService.getActiveMonitoringSessions());
  };

  const handleStopAllMonitoring = () => {
    MonitoringService.stopAllMonitoring();
    setMonitoringSessions([]);
  };

  if (monitoringSessions.length === 0) {
    return null;
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-green-900">
          Active Monitoring ({monitoringSessions.length})
        </h2>
        {monitoringSessions.length > 1 && (
          <button
            onClick={handleStopAllMonitoring}
            className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1 rounded-md text-sm font-medium transition-colors"
          >
            Stop All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {monitoringSessions.map((monitoring) => {
          return (
            <div
              key={monitoring.id}
              className="bg-white border border-green-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-6 h-6 bg-green-100 rounded-full">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {monitoring.route}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        monitoring.notificationType === 'browser'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {monitoring.notificationType === 'browser' ? '🔔 Browser' : '📱 Telegram'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span><strong>Departure:</strong> {monitoring.departureTime}</span>
                        <span><strong>Threshold:</strong> {monitoring.threshold} small vehicles</span>
                        {monitoring.lastCheckedCapacity > 0 && (
                          <span><strong>Last capacity:</strong> {monitoring.lastCheckedCapacity} small vehicles</span>
                        )}
                      </div>
                      <div className="mt-1">
                        <CountdownTimer
                          lastCheckTime={monitoring.lastCapacityCheck}
                          checkInterval={60000}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleStopMonitoring(monitoring.id)}
                  className="ml-2 bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                >
                  Stop
                </button>
              </div>
              <div className="mt-2 text-xs text-green-600">
                📱 You'll receive {monitoring.notificationType} notifications immediately when small vehicle capacity drops below {monitoring.threshold} (checked every minute)
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-green-600">
        💡 Monitoring checks capacity every minute. Notifications are sent immediately when thresholds are reached.
      </div>
    </div>
  );
}
