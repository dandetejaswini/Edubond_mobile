# EduBond Mobile - React Native App

## Overview

This is the React Native mobile application for EduBond - a peer mentorship platform. This app connects with the existing Express.js backend server.

## Features

- ✅ User Authentication (Login/Register)
- ✅ Mentor Discovery with Search & Filters
- ✅ Real-time Chat Messaging
- ✅ Session Management
- ✅ AI Academic Assistant
- ✅ Profile Management
- ✅ Notifications
- ✅ Alumni Groups
- ✅ Admin Dashboard

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Stack, Bottom Tabs, Drawer)
- **State Management**: React Context API
- **API Client**: Axios
- **Local Storage**: AsyncStorage
- **UI**: Custom components matching web app design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- iOS Simulator (Mac) or Android Emulator
- Expo Go app on physical device (optional)
- Backend server running (see backend folder)

### Installation

1. Navigate to the mobile app directory:
```bash
cd edubond-mobile
```

2. Install dependencies (already done during setup):
```bash
npm install
```

3. Configure the API URL:
   - Open `.env` file
   - Update `API_URL` with your computer's local IP address
   - Find your IP:
     - Mac: `ipconfig getifaddr en0`
     - Windows: `ipconfig` (look for IPv4 Address)
   - Example: `API_URL=http://192.168.1.5:8000`

4. Make sure the backend server is running:
```bash
cd ../backend
npm run dev
```

### Running the App

Start the Expo development server:
```bash
npm start
```

Then choose how to run:
- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on physical device

## Project Structure

```
edubond-mobile/
├── App.tsx                          # Root component
├── src/
│   ├── navigation/                  # Navigation setup
│   │   ├── AppNavigator.tsx        # Main navigator
│   │   ├── AuthNavigator.tsx       # Auth screens
│   │   └── MainNavigator.tsx       # Main app (tabs + drawer)
│   ├── screens/                     # All screens
│   │   ├── auth/                   # Login & Register
│   │   ├── dashboard/              # Dashboard
│   │   ├── mentors/                # Mentor list & details
│   │   ├── chat/                   # Chat screens
│   │   ├── sessions/               # Sessions
│   │   ├── ai/                     # AI assistant
│   │   ├── profile/                # Profile
│   │   ├── notifications/          # Notifications
│   │   ├── alumni/                 # Alumni groups
│   │   └── admin/                  # Admin dashboard
│   ├── components/                 # Reusable components
│   │   ├── ui/                     # UI components
│   │   └── LoadingSpinner.tsx
│   ├── services/                   # API integration
│   │   └── api.ts
│   ├── context/                    # React Context
│   │   └── AuthContext.tsx
│   ├── utils/                      # Utilities
│   │   └── storage.ts
│   ├── types/                      # TypeScript types
│   │   └── index.ts
│   └── constants/                  # App constants
│       └── colors.ts
└── .env                            # Environment variables
```

## Navigation Structure

### Bottom Tabs (Primary Navigation)
- **Home**: Dashboard with quick actions
- **Mentors**: Search and discover mentors
- **Chats**: View all conversations
- **Sessions**: Manage sessions
- **Profile**: User profile and settings

### Drawer (Secondary Navigation)
- **AI Assistant**: Chat with AI
- **Notifications**: View notifications
- **Alumni Groups**: Join batch groups
- **Admin Dashboard**: Platform stats (admin only)

## API Integration

All API calls are made through `src/services/api.ts` which:
- Uses Axios for HTTP requests
- Automatically adds auth token to requests
- Handles errors gracefully
- Supports all backend endpoints

## Authentication

- Login and registration screens
- JWT token stored in AsyncStorage
- Auto-login on app restart
- Protected routes via AuthContext

## Design System

### Colors
- **Primary**: Blue (#3B82F6)
- **Accent**: Teal (#14B8A6)
- **Background**: Dark (#1E293B)
- **Foreground**: Light text (#F1F5F9)

All colors match the web application design.

## Testing the App

1. **Start Backend**:
   ```bash
   cd backend && npm run dev
   ```

2. **Update .env**: Set your local IP address

3. **Run Mobile App**:
   ```bash
   npm start
   ```

4. **Test Features**:
   - Register a new account
   - Login with credentials
   - Browse mentors
   - Send connection requests
   - Start a chat
   - Book a session
   - Use AI assistant
   - Edit profile

## Troubleshooting

### Cannot connect to backend
- Ensure backend is running on port 8000
- Check `.env` file has correct IP address
- Ensure phone/emulator is on same network
- Try using actual IP instead of localhost

### App crashes on startup
- Clear metro bundler cache: `npm start -- --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`

### Navigation errors
- Ensure all navigation dependencies are installed
- Check that react-native-gesture-handler import is first in App.tsx

## Development Tips

- Use hot reload for instant updates
- Check console logs for API errors
- Use React Native Debugger for debugging
- Test on both iOS and Android

## Building for Production

### iOS
```bash
npx expo build:ios
```

### Android
```bash
npx expo build:android
```
##  Quick Run (Windows)

Just double-click `setup_and_run.bat` to install dependencies and start the app.

## Backend Compatibility

This mobile app is fully compatible with the existing EduBond backend. No backend changes are required.

## License

Same as the main EduBond project.
