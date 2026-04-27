# Quick Start Guide

## Prerequisites

1. **Node.js 18+** installed
2. **iOS Simulator** (Mac) or **Android Emulator** installed
3. **Backend server** ready to run

## Step 1: Find Your IP Address

The mobile app needs your computer's IP address to connect to the backend during development.

### macOS:
```bash
ipconfig getifaddr en0
```

### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.5`)

## Step 2: Update Environment Variable

Edit `.env` file in the `edubond-mobile` directory:

```bash
cd edubond-mobile
```

Update the file with your IP:
```
API_URL=http://YOUR_IP_HERE:8000
```

Example:
```
API_URL=http://192.168.1.5:8000
```

## Step 3: Start the Backend

In a **new terminal**, navigate to backend and start the server:

```bash
cd ../backend
npm run dev
```

You should see:
```
Server running on port 8000
```

## Step 4: Start the Mobile App

In **another terminal**, navigate to mobile app and start Expo:

```bash
cd ../edubond-mobile
npm start
```

## Step 5: Run on Device/Simulator

When Expo starts, you'll see options:

- Press `i` to open iOS Simulator
- Press `a` to open Android Emulator
- Scan QR code with **Expo Go** app on your phone

## Step 6: Test the App

1. **Register**: Create a new account
   - Select role (Student, Mentor, Alumni)
   - Fill in your details

2. **Explore**:
   - Browse mentors
   - Navigate through tabs
   - Try the AI assistant

## Troubleshooting

### Can't Connect to Backend

1. Check backend is running: `npm run dev` in backend folder
2. Verify `.env` has correct IP address
3. Ensure phone/emulator is on same WiFi network
4. Try using actual IP instead of `localhost`

### App Crashes

```bash
# Clear cache and restart
npm start -- --clear
```

### Metro Bundler Issues

```bash
# Reinstall dependencies
rm -rf node_modules
npm install
npm start
```

## Next Steps

Once the app is running:
- Register a test account
- Test all features
- Checkout [README.md](README.md) for full documentation
- Review [walkthrough.md](walkthrough.md) for implementation details

## Production Deployment

For deploying to production, see the README's deployment section.

---

**Need Help?** Check the full [README.md](README.md) for detailed instructions and troubleshooting.
