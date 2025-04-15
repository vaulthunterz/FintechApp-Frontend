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
API_URL=http://localhost:8000/api/v1
```

For production, update the API_URL to point to your deployed backend.

## Deployment

### Expo Deployment

Expo deployment is specifically for the frontend React Native application. Here's how to deploy:

1. **Configure app.json**:
   ```json
   {
     "expo": {
       "name": "Expense Categorization App",
       "slug": "expense-categorization",
       "version": "1.0.0",
       "orientation": "portrait",
       "icon": "./assets/icon.png",
       "splash": {
         "image": "./assets/splash.png",
         "resizeMode": "contain",
         "backgroundColor": "#ffffff"
       },
       "updates": {
         "fallbackToCacheTimeout": 0
       },
       "assetBundlePatterns": ["**/*"],
       "ios": {
         "supportsTablet": true,
         "bundleIdentifier": "com.yourcompany.expensecategorization"
       },
       "android": {
         "adaptiveIcon": {
           "foregroundImage": "./assets/adaptive-icon.png",
           "backgroundColor": "#FFFFFF"
         },
         "package": "com.yourcompany.expensecategorization"
       },
       "web": {
         "favicon": "./assets/favicon.png"
       }
     }
   }
   ```

2. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

3. **Login to Expo**:
   ```bash
   eas login
   ```

4. **Configure EAS**:
   ```bash
   eas build:configure
   ```

5. **Create a build**:
   ```bash
   eas build --platform android
   eas build --platform ios
   ```

6. **Submit to stores**:
   ```bash
   eas submit --platform android
   eas submit --platform ios
   ```

### Environment-Specific Configuration

For managing different environments, create an `eas.json` file:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "API_URL": "http://localhost:8000/api/v1"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "API_URL": "https://your-deployed-backend.com/api/v1"
      }
    }
  }
}
```

### Continuous Updates with EAS Update

After initial deployment, you can push updates without app store approval:

```bash
eas update --branch production --message "Fixed bug in expense chart"
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
