import { useState, useEffect } from 'react';
import { getDirections, getEvents, formatTime } from './services/ferryApi';
import { MonitoringService } from './services/monitoringService';
import type { Direction, FerryEvent } from './types/ferry';
import { NotificationModal } from './components/NotificationModal';
import { MonitoringStatus } from './components/MonitoringStatus';

function App() {
  const [directions, setDirections] = useState<Direction[]>([]);
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [events, setEvents] = useState<FerryEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [directionsLoading, setDirectionsLoading] = useState<boolean>(true);

  // Notification modal state
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<FerryEvent | null>(null);

  // Load directions on component mount
  useEffect(() => {
    const loadDirections = async () => {
      try {
        setDirectionsLoading(true);
        const response = await getDirections();
        setDirections(response.items);
        if (response.items.length > 0) {
          setSelectedDirection(response.items[0].code);
        }
      } catch (err) {
        setError('Failed to load ferry directions');
        console.error(err);
      } finally {
        setDirectionsLoading(false);
      }
    };

    loadDirections();
  }, []);

  // Load any existing monitoring state on app start
  useEffect(() => {
    MonitoringService.loadMonitoringState();
  }, []);

  const handleSearch = async () => {
    if (!selectedDirection || !selectedDate) {
      setError('Please select both direction and date');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await getEvents(selectedDirection, selectedDate);
      setEvents(response.items);
    } catch (err) {
      setError('Failed to load ferry departures');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMonitorDeparture = (event: FerryEvent) => {
    setSelectedEvent(event);
    setShowNotificationModal(true);
  };

  const getSelectedDirectionInfo = () => {
    return directions.find(d => d.code === selectedDirection);
  };

  const getRouteString = () => {
    const direction = getSelectedDirectionInfo();
    return direction ? `${direction.fromPort.name} → ${direction.toPort.name}` : '';
  };

  const isEventBeingMonitored = (eventUid: string) => {
    return MonitoringService.isMonitoring(eventUid);
  };

  if (directionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading ferry directions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Ferry Timetable
        </h1>

        <MonitoringStatus />

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label
                htmlFor="direction"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Ferry Route
              </label>
              <select
                id="direction"
                value={selectedDirection}
                onChange={(e) => setSelectedDirection(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {directions.map((direction) => (
                  <option key={direction.code} value={direction.code}>
                    {direction.fromPort.name} → {direction.toPort.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="date"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Date
              </label>
              <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Searching...' : 'Search Departures'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
          </div>
        )}

        {events.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Ferry Departures
            </h2>
            <div className="space-y-4">
              {events.map((event) => {
                const isMonitored = isEventBeingMonitored(event.uid);
                return (
                  <div
                    key={event.uid}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-3 lg:mb-0">
                        <div className="text-lg font-semibold text-blue-600 mb-2 md:mb-0">
                          {formatTime(event.dtstart)}
                        </div>
                        <div className="text-sm text-gray-500 mb-2 md:mb-0">
                          → {formatTime(event.dtend)}
                        </div>
                        <div className="text-sm text-gray-600 mb-2 md:mb-0">
                          Duration: {Math.round(
                            (new Date(event.dtend).getTime() -
                              new Date(event.dtstart).getTime()) /
                              (1000 * 60)
                          )}{' '}
                          min
                        </div>
                      </div>
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            Passengers: {event.capacities.pcs}
                          </span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            Small Vehicles: {event.capacities.sv}
                          </span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                            Big Vehicles: {event.capacities.bv}
                          </span>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                            Motorcycles: {event.capacities.mc}
                          </span>
                          <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                            Bicycles: {event.capacities.bc}
                          </span>
                        </div>
                        <button
                          onClick={() => handleMonitorDeparture(event)}
                          disabled={isMonitored}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            isMonitored
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-orange-600 text-white hover:bg-orange-700'
                          }`}
                        >
                          {isMonitored ? '✓ Monitored' : '🔔 Monitor'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 text-sm text-gray-600">
              💡 Click "Monitor" on any departure to receive notifications when small vehicle capacity drops below your threshold.
              Capacity is checked every minute. You can monitor multiple departures simultaneously with different notification methods.
            </div>
          </div>
        )}

        {!loading && events.length === 0 && selectedDirection && selectedDate && !error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="text-yellow-800">
              No ferry departures found for the selected route and date.
            </div>
          </div>
        )}

        {showNotificationModal && selectedEvent && (
          <NotificationModal
            isOpen={showNotificationModal}
            onClose={() => {
              setShowNotificationModal(false);
              setSelectedEvent(null);
            }}
            selectedEvent={selectedEvent}
            direction={selectedDirection}
            date={selectedDate}
            route={getRouteString()}
          />
        )}
      </div>
    </div>
  );
}

export default App;
