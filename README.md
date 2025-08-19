# Desktop Activity Tracker

A desktop application designed to monitor and record user activity, focusing on application usage, browser activity, and filesystem changes.

## Features

- **Active Application Tracking**: Detect and record the currently active application
- **Browser Tab Tracking**: Monitor active browser tabs and URLs (Chrome support)
- **Filesystem Activity Tracking**: Watch for file creation, deletion, and modification
- **Real-time Data Streaming**: Stream events to Apache Kafka for analysis
- **Local SQL Logging**: Store events locally in SQLite database for backup and analysis
- **Cross-platform Support**: Works on Windows, macOS, and Linux

## Prerequisites

- **Node.js**: v20.x LTS or higher
- **npm**: v10.x or **pnpm**: v8.x (recommended)
- **Docker**: For running Kafka locally

## Quick Start

### 1. Install Dependencies

```bash
# Using npm
npm install

# Using pnpm (recommended)
pnpm install
```

### 2. Start Kafka (Optional)

If you want to test the full data streaming functionality:

```bash
# Start Kafka using Docker
docker-compose up -d
```

### 3. Development Mode

```bash
# Start the development server
npm run dev
```

This will:
- Start the Electron main process in watch mode
- Start the React renderer on http://localhost:3000
- Open the Electron app with DevTools

### 4. Build for Production

```bash
# Build all components
npm run build

# Create distributable packages
npm run dist
```

## Project Structure

```
src/
├── main/           # Electron main process
├── renderer/       # React UI
├── agent/          # Monitoring agent (separate process)
├── preload/        # Preload scripts for security
└── shared/         # Shared types and utilities
```

## Development

### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build all components
- `npm run test` - Run unit tests
- `npm run test:coverage` - Run tests with coverage
- `npm run test:sql` - Test SQL logging functionality
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Architecture

The application consists of three main processes:

1. **Main Process** (`src/main/`): Electron main process handling window management and IPC
2. **Renderer Process** (`src/renderer/`): React UI for user interaction
3. **Agent Process** (`src/agent/`): Separate Node.js process for activity monitoring

### Data Flow

1. User starts monitoring via React UI
2. Main process spawns agent process
3. Agent monitors system activity (apps, files, browser)
4. Events are formatted and sent to Kafka
5. Events are also logged locally to SQLite database
6. UI displays real-time status and statistics

## Configuration

The application uses local storage for settings. Key configuration options:

- **Watch Paths**: Directories to monitor for file changes
- **Ignore Paths**: Patterns to exclude from monitoring
- **Kafka Broker**: Kafka server address (default: localhost:9092)
- **Auto Start**: Whether to start monitoring on app launch

## SQL Logging

The application automatically logs all events to a local SQLite database for backup and analysis. The database is stored in the user's application data directory:

- **macOS**: `~/Library/Application Support/desktop-activity-tracker/events.db`
- **Windows**: `%APPDATA%/desktop-activity-tracker/events.db`
- **Linux**: `~/.config/desktop-activity-tracker/events.db`

### Features

- **Automatic Logging**: All events are automatically logged alongside Kafka streaming
- **Batch Processing**: Events are buffered and inserted in batches for performance
- **Data Integrity**: Uses transactions to ensure data consistency
- **Query Support**: Built-in utilities for querying and analyzing event data

### Testing SQL Logging

```bash
# Test SQL logging functionality
npm run test:sql
```

### Querying Events

The application includes `DatabaseUtils` for querying events:

```typescript
import { DatabaseUtils } from './src/agent/services/db-utils';

const dbUtils = new DatabaseUtils();

// Get total event count
const count = await dbUtils.getEventCount();

// Get recent events
const recentEvents = await dbUtils.getRecentEvents(50);

// Get events by type
const appEvents = await dbUtils.getEventsByType('APP_ACTIVE');

// Get database statistics
const stats = await dbUtils.getDatabaseStats();
```

For more details, see [SQL Logging Documentation](docs/SQL_LOGGING.md).

## Testing

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Building

### For macOS

```bash
npm run dist:mac
```

### For Windows

```bash
npm run dist:win
```

### For Linux

```bash
npm run dist:linux
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions, please check the documentation or create an issue in the repository. 