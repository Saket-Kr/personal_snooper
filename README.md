# 🕵️ Desktop Activity Tracker

> *"Big Brother is watching... but in a totally cool, open-source way!"* 👀

A sophisticated desktop application that monitors your computer activity with the precision of a caffeinated detective and the discretion of a ninja. Built with Electron, React, and enough TypeScript to make your IDE weep tears of joy.

## 🎯 What This Thing Actually Does

Ever wondered how much time you spend switching between apps? Or which files you're constantly editing? Or maybe you're just nosy about your own digital habits? This app tracks:

- **Active Applications**: Know exactly when you switch between apps (because apparently, you can't focus on one thing for more than 2 minutes)
- **Browser Tab Activity**: See which websites are stealing your productivity (looking at you, YouTube rabbit holes)
- **File System Changes**: Monitor file creation, modifications, and deletions (because sometimes you need to know who deleted your important document)
- **Real-time Streaming**: Push all this juicy data to Kafka for real-time processing (because batch processing is so 2010)

## ✨ Features That'll Make You Go "Ooh!"

### 🎮 **Real-time Monitoring**
- Active window detection every 2 seconds (configurable, because you might be faster than that)
- Cross-platform compatibility (Windows, macOS, Linux - we don't discriminate)
- System tray integration (because minimizing windows is so mainstream)

### 📊 **Data Visualization**
- Live dashboard with real-time statistics
- Database viewer for historical analysis
- Kafka UI for stream monitoring
- Event analytics and filtering

### 🔧 **Smart Configuration**
- Customizable watch paths and ignore patterns
- Auto-start capability (because who has time to click buttons?)
- Kafka broker configuration
- Granular monitoring controls

### 💾 **Data Storage & Streaming**
- Local SQLite database for persistence
- Apache Kafka integration for real-time streaming
- Event buffering and batch processing
- Graceful error handling and recovery

### 🧪 **Developer Experience**
- Hot reload during development
- Comprehensive testing suite (Vitest + Playwright)
- TypeScript everywhere (because `any` is a four-letter word)
- ESLint + Prettier for code quality

## 🛠️ Tech Stack (The Cool Kids' Table)

### **Frontend**
- **React 18** - Because functional components are the future
- **TypeScript** - Because type safety is not optional
- **Vite** - Because waiting for builds is so 2020
- **CSS Modules** - Because global CSS is chaos

### **Backend**
- **Electron** - Because web apps need to feel native
- **Node.js 20+** - Because we're not savages using old LTS versions
- **Express** - Because sometimes you just need a simple HTTP server

### **Data & Streaming**
- **SQLite3** - Local persistence that doesn't require a database admin
- **Apache Kafka** - Real-time streaming (because batch processing is for cowards)
- **Chokidar** - File system watching that actually works

### **Development Tools**
- **Vitest** - Testing framework that's not Jest (because variety is the spice of life)
- **Playwright** - E2E testing that works across all browsers
- **ESLint + Prettier** - Code quality tools that argue with each other

## 🚀 Getting Started (The Fun Part)

### Prerequisites
- **Node.js**: v20.x LTS or higher (because we're not animals)
- **npm**: v10.x or **pnpm**: v8.x (pnpm is faster, fight me)
- **Docker**: For running Kafka locally (optional, but recommended)

### Installation

1. **Clone the repository** (obviously)
   ```bash
   git clone <your-repo-url>
   cd desktop-activity-tracker
   ```

2. **Install dependencies** (this might take a while, go grab coffee)
   ```bash
   npm install
   # or if you're cool
   pnpm install
   ```

3. **Set up Kafka** (optional, but highly recommended)
   ```bash
   # Using Docker (the easy way)
   docker run -d --name kafka \
     -p 9092:9092 \
     -e KAFKA_CFG_ZOOKEEPER_CONNECT=localhost:2181 \
     -e KAFKA_CFG_LISTENERS=PLAINTEXT://:9092 \
     -e KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092 \
     apache/kafka:3.6.1
   ```

### Development Mode

1. **Start the development environment**
   ```bash
   npm run dev
   ```
   This will start:
   - Main process (Electron)
   - Preload process
   - Renderer process (React dev server)
   - TypeScript compilation in watch mode

2. **Open the app**
   - The Electron app should open automatically
   - If not, check the terminal for any error messages

### Building for Production

```bash
# Build everything
npm run build

# Build specific platform
npm run dist:mac      # macOS
npm run dist:win      # Windows
npm run dist:linux    # Linux (because penguins are cool)
```

## 🎮 How to Use (Without Breaking Things)

### Basic Operation

1. **Launch the app** - It should appear in your system tray
2. **Configure settings** - Set your watch paths and Kafka broker
3. **Start monitoring** - Click the big green button
4. **Watch the magic happen** - Events will start flowing

### Configuration Options

- **Watch Paths**: Directories to monitor for file changes
- **Ignore Paths**: Patterns to exclude (like `node_modules`, `.git`, etc.)
- **Kafka Broker**: Your Kafka server address (default: `localhost:9092`)
- **Auto-start**: Automatically start monitoring when the app launches

### Monitoring Modes

- **App Monitoring**: Tracks active applications and browser tabs
- **File Monitoring**: Watches specified directories for changes
- **Browser Monitoring**: Detects tab switches and URL changes

## 🧪 Testing (Because Bugs Are Not Features)

### Unit Tests
```bash
npm test                    # Run tests in watch mode
npm run test:coverage      # Run with coverage report
```

### E2E Tests
```bash
npm run test:e2e          # Run Playwright tests
```

### SQL Testing
```bash
npm run test:sql          # Test SQL logging functionality
```

## 📁 Project Structure (The Organized Chaos)

```
src/
├── agent/                 # Monitoring agent (separate process)
│   ├── monitors/         # App and file system monitors
│   ├── services/         # Kafka and SQL services
│   └── formatters/       # Event formatting
├── main/                 # Electron main process
├── renderer/             # React frontend
│   ├── components/       # UI components
│   ├── contexts/         # React contexts
│   └── hooks/            # Custom React hooks
├── shared/               # Shared utilities and types
└── preload/              # Electron preload scripts
```

## 🔧 Troubleshooting (When Things Go Wrong)

### Common Issues

1. **Permission Denied**: The app needs accessibility permissions on macOS
2. **Kafka Connection Failed**: Make sure Kafka is running and accessible
3. **Database Errors**: Check if the app has write permissions to the data directory

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev

# Check logs in the app's data directory
# macOS: ~/Library/Application Support/desktop-activity-tracker/
# Windows: %APPDATA%/desktop-activity-tracker/
# Linux: ~/.config/desktop-activity-tracker/
```

## 🤝 Contributing (Join the Fun!)

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write tests for new features
- Follow the existing code style
- Update documentation when needed
- Be nice to each other (we're all friends here)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Creator

**SaketKr** - The brilliant mind behind this digital surveillance masterpiece.

- **GitHub**: [@SaketKr](https://github.com/Saket-Kr)
- **LinkedIn**: [SaketKr](https://linkedin.com/in/saketkr186)

*"Built with ❤️, ☕, and probably too much time on my hands"*

## 🙏 Acknowledgments

- **Electron team** - For making desktop apps less painful
- **React team** - For the component-based revolution
- **Apache Kafka** - For real-time streaming awesomeness
- **Coffee** - For keeping developers awake during late-night coding sessions

---

**Disclaimer**: This app is for legitimate monitoring purposes only. Please respect privacy laws and don't use it to spy on people without their consent. We're not responsible for any awkward conversations that might result from its use. 😅 