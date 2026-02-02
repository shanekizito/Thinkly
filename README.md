# Thinkly

> **AI-Powered Personalized Learning Platform**
> *Adaptive learning through personalized daily courses.*

Thinkly is a React Native application that leverages AI to generate personalized educational content. It features a cross-platform architecture (iOS & Android) built with Expo, integrating Firebase for real-time data syncing and OpenAI for dynamic content generation.

---

## Tech Stack

### Core
- **React Native (Expo)**: Managed workflow.
- **TypeScript**: Strictly typed codebase.
- **Expo Router**: File-based routing.

### Services
- **Firebase Auth**: Authentication (Email, Google, Facebook).
- **Firebase Firestore**: User data, courses, and progress tracking.
- **OpenAI API**: Dynamic generation of course content and quizzes.

### Key Features
- **Secure Authentication**: OAuth providers and secure credential management.
- **Dynamic Content**: Personalized daily challenges generated via GPT models.
- **Gamification**: Badge system, streaks, and XP tracking.
- **In-App Purchases (IAP)**: Subscription model for premium content access.
- **Localization**: Multi-language support with context-based state management.
- **Theming**: Dark/Light mode support.

---

## Architecture

The project follows a **Feature-Based** directory structure:

```
src/
├── components/     # Reusable UI components
├── contexts/       # Global state (Auth, Localization, Theme)
├── hooks/          # Custom hooks (e.g., useAuth)
├── features/       # Domain logic (e.g., DailyChallenge)
├── services/       # External integrations (Firebase, OpenAI)
└── utility/        # Helpers and constants
app/                # Navigation routes
```

### Engineering Practices
- **Type Safety**: strict TypeScript configuration.
- **Modular Imports**: Path aliases (`@components`, `@services`) for maintainability.
- **Secret Management**: Environment variables handled via `app.config.ts` and `.env`.
- **Component Isolation**: Separation of concerns between UI and business logic.

---

## Trade-offs & Improvements

### Trade-offs
1.  **State Management**: 
    - *Choice*: React Context.
    - *Rationale*: Low boiler-plate and sufficient for current app complexity compared to Redux/Zustand.

2.  **Expo Managed Workflow**:
    - *Choice*: Managed workflow over bare workflow.
    - *Rationale*: Simplified CI/CD and native module handling via config plugins.

### Future Roadmap
- **Testing**: Add Jest and React Native Testing Library coverage.
- **Performance**: Implement `FlashList` for large lists to improve scrolling performance on older devices.
- **Offline Support**: Enhanced Firestore persistence for offline course access.
- **Accessibility**: Comprehensive screen reader audit.
- **Analytics**: Detailed user engagement tracking.

---

## Getting Started

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/shanekizito/Thinkly
cd thinkly

# Install dependencies
npm install
```

### 2. Environment Configuration

The app relies on several external services. You need to configure environment variables to run the app.

1.  **Rename the environment file**:
    ```bash
    cp .env.example .env
    ```

2.  **Obtain API Keys**:

    **Firebase (Auth & Firestore)**
    - Go to the [Firebase Console](https://console.firebase.google.com/).
    - Create a new project or select an existing one.
    - Navigate to **Project Settings > General**.
    - Add an iOS and Android app to get your `google-services.json` and `GoogleService-Info.plist`. Place these in the root directory.
    - Under the **SDK Setup and Configuration** section, copy the configuration values:
        - `EXPO_PUBLIC_API_KEY`: ApiKey
        - `EXPO_PUBLIC_AUTH_DOMAIN`: AuthDomain
        - `EXPO_PUBLIC_PROJECT_ID`: ProjectId
        - `EXPO_PUBLIC_STORAGE_BUCKET`: StorageBucket
        - `EXPO_PUBLIC_MESSAGING_SENDER_ID`: MessagingSenderId
        - `EXPO_PUBLIC_APP_ID`: AppId

    **OpenAI (Content Generation)**
    - Go to [OpenAI Platform](https://platform.openai.com/api-keys).
    - Create a new API Key.
    - Set it as `OPENAI_API_KEY`.

    **Google Authentication**
    - Go to [Google Cloud Console](https://console.cloud.google.com/).
    - Navigate to **APIs & Services > Credentials**.
    - Create OAuth 2.0 Client IDs for **Web**, **Android**, and **iOS**.
    - Populate the following variables:
        - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
        - `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`
        - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
        - `EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID` (can use the Web ID for development).

    **Facebook Authentication**
    - Go to [Meta for Developers](https://developers.facebook.com/).
    - Create an App and set up **Facebook Login**.
    - Copy your **App ID** and set it as `EXPO_PUBLIC_FACEBOOK_APP_ID`.

    **Stripe (In-App Purchases)**
    - Go to the [Stripe Dashboard](https://dashboard.stripe.com/).
    - Get your **Publishable Key** (begins with `pk_test_` or `pk_live_`).
    - Set it as `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

### 3. Run the App

```bash
npx expo start
```
