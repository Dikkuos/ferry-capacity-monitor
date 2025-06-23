export interface Port {
  code: string;
  name: string;
  names: {
    en: string;
    et: string;
    default: string;
  };
}

export interface Direction {
  code: string;
  name: string;
  names: {
    en: string;
    et: string;
    default: string;
  };
  fromPort: Port;
  toPort: Port;
  reverseDirection: {
    code: string;
  };
}

export interface DirectionsResponse {
  totalCount: number;
  items: Direction[];
}

export interface Capacities {
  pcs: number;
  bc: number;
  sv: number;
  bv: number;
  mc: number;
  dc: number;
}

export interface FerryEvent {
  uid: string;
  dtstart: string;
  dtend: string;
  status: string;
  capacities: Capacities;
  pricelist: {
    code: string;
  };
  transportationType: {
    code: string;
  };
  ship: {
    code: string;
  };
}

export interface EventsResponse {
  totalCount: number;
  items: FerryEvent[];
}

export type NotificationType = 'telegram' | 'browser';

export interface NotificationSettings {
  telegramBotToken: string;
  telegramChatId: string;
  carCapacityThreshold: number;
  notificationType: NotificationType;
}

export interface MonitoringState {
  id: string;
  isActive: boolean;
  departureUid: string;
  direction: string;
  departureDate: string;
  departureTime: string;
  route: string;
  threshold: number;
  notificationType: NotificationType;
  telegramBotToken?: string;
  telegramChatId?: string;
  lastCheckedCapacity: number;
  lastNotificationSent: number;
  lastCapacityCheck: number; // New field for tracking when we last checked
  intervalId?: number;
  createdAt: string;
}

export interface TelegramMessage {
  chat_id: string;
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
}

export interface BrowserNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}
