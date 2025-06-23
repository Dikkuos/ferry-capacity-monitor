# Ferry Capacity Monitor

A modern web application for monitoring ferry timetables and receiving real-time notifications when vehicle capacity drops below your specified thresholds. Built with React, TypeScript, and Vite.

## 🚢 Features

### Core Functionality
- **Ferry Timetable Search**: Browse ferry departures by route and date
- **Real-time Capacity Monitoring**: Track available spaces for different vehicle types
- **Smart Notifications**: Get alerted when capacity drops below your threshold
- **Multiple Monitoring Sessions**: Monitor several departures simultaneously
- **Persistent Settings**: Your monitoring sessions survive browser restarts

### Notification Options
- **Browser Push Notifications**: Native browser notifications (recommended)
- **Telegram Bot Integration**: Send alerts to your Telegram account
- **Immediate Alerts**: No spam protection - get notified instantly when capacity drops

### Vehicle Types Monitored
- 🚗 Small Vehicles (cars)
- 🚚 Big Vehicles (trucks/RVs)
- 🏍️ Motorcycles
- 🚲 Bicycles
- 👥 Passengers

## 🛠️ Technical Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Package Manager**: Bun
- **Linting**: Biome + ESLint
- **Deployment**: Netlify (static hosting)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ or Bun
- Modern web browser with notification support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/soend/ferry-capacity-monitor.git
   cd ferry-capacity-monitor
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Start development server**
   ```bash
   bun dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

### Production Build

```bash
bun run build
bun run preview
```

## 📱 How to Use

### Basic Ferry Search
1. Select your ferry route from the dropdown
2. Choose your travel date
3. Click "Search Departures" to view available ferries
4. View capacity information for each departure

### Setting Up Monitoring
1. Click the "🔔 Monitor" button on any departure
2. Choose your notification method:
   - **Browser Notifications**: Click "Test Browser Notifications" to grant permission
   - **Telegram**: Set up a bot with @BotFather and get your Chat ID from @userinfobot
3. Set your capacity threshold (alert when spaces drop below this number)
4. Test your notifications to ensure they work
5. Click "Start Monitoring"

### Telegram Bot Setup
1. Message @BotFather on Telegram
2. Create a new bot with `/newbot`
3. Copy the bot token
4. Message @userinfobot to get your Chat ID
5. Enter both values in the notification setup

## ⚙️ Configuration

### Environment Variables
The application works out of the box with public ferry APIs. No environment variables required for basic functionality.

### Monitoring Settings
- **Check Interval**: 1 minute (configurable in source)
- **Notification Timing**: Immediate when threshold is reached
- **Storage**: Browser localStorage for persistence

## 🔧 Development

### Project Structure
```
src/
├── components/          # React components
│   ├── MonitoringStatus.tsx    # Active monitoring display
│   └── NotificationModal.tsx   # Notification setup modal
├── services/           # Business logic
│   ├── ferryApi.ts            # Ferry data fetching
│   ├── monitoringService.ts   # Capacity monitoring
│   ├── telegramService.ts     # Telegram integration
│   └── browserNotificationService.ts
├── types/              # TypeScript definitions
└── App.tsx            # Main application component
```

### Key Services

**Ferry API Service** (`ferryApi.ts`)
- Fetches ferry directions and departure data
- Handles CORS proxy fallback for API access
- Formats time and capacity data

**Monitoring Service** (`monitoringService.ts`)
- Manages multiple concurrent monitoring sessions
- Periodic capacity checking (1-minute intervals)
- Handles notification triggers and localStorage persistence

**Notification Services**
- Browser notifications with permission handling
- Telegram bot integration with message formatting
- Test functionality for both notification types

## 🚀 Deployment

### Netlify (Recommended)
The project includes a `netlify.toml` configuration file for easy deployment:

1. Connect your GitHub repository to Netlify
2. Netlify will automatically detect the build settings
3. Your app will be deployed at `https://your-app-name.netlify.app`

### Manual Deployment
```bash
bun run build
# Upload the 'dist' folder to your static hosting provider
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Use TypeScript for type safety
- Follow React hooks best practices
- Run `bun run lint` before committing
- Use Tailwind CSS for styling

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [GitHub Issues](https://github.com/soend/ferry-capacity-monitor/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Browser and operating system information
   - Screenshots if applicable

## 🔮 Future Enhancements

- [ ] Email notification support
- [ ] Historical capacity data and analytics
- [ ] Mobile app with push notifications
- [ ] Multi-language support
- [ ] Advanced filtering and search options
- [ ] Integration with calendar applications
- [ ] Weather information integration

---

**Built with ❤️ using React, TypeScript, and modern web technologies**
