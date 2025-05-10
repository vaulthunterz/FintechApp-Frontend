# Expense Categorization Frontend

This is the frontend application for the Expense Categorization project, built with React Native and Expo.

## Features

- Cross-platform (iOS, Android, Web) support
- Expense tracking and visualization
- Investment recommendations
- Dark mode support
- SMS transaction detection
- Interactive data visualizations

## Setup Guide

Follow these steps to set up and run the frontend application:

### Prerequisites

- Node.js 14 or higher
- npm or yarn
- Expo CLI

### Setup Commands

```bash
# 1. Install dependencies
npm install

# 2. Start the Expo development server
npx expo start

# 3. Run on specific platforms
npx expo start --android  # For Android
npx expo start --ios      # For iOS
npx expo start --web      # For Web
```

### Environment Configuration

Create a `.env` file in the root directory with the following variables:

```
API_URL=http://localhost:8000/api
```

For production, update the API_URL to point to your deployed backend.

## Deployment

### Web Deployment with Firebase

The web version of the app is deployed to Firebase Hosting. Here's how to deploy:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase**:
   ```bash
   firebase login
   ```

3. **Deploy to Firebase**:
   ```bash
   npm run deploy-web
   ```

   This script will:
   - Build the web version of your app
   - Add CDN links for icon fonts
   - Deploy to Firebase Hosting

### Mobile Deployment

For mobile deployment, you can use EAS Build:

```bash
# Configure EAS
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

## Project Structure

```
/app                    # Main application code
  /components           # Reusable components
  /screens              # Screen components
  /navigation           # Navigation configuration
  /contexts             # React contexts
  /hooks                # Custom hooks
  /services             # API services
  /utils                # Utility functions
/assets                 # Static assets
```

## Libraries Used

- **React Navigation**: For navigation between screens
- **React Native Gifted Charts**: For data visualization
- **Expo**: For cross-platform development
- **Axios**: For API requests
- **React Native Paper**: UI component library

## Learn More About Expo

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.
