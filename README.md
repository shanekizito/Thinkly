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

1.  **Clone**:
    ```bash
    git clone https://github.com/shanekizito/Thinkly
    cd thinkly
    ```

2.  **Install**:
    ```bash
    npm install
    ```

3.  **Configure**:
    - Rename `.env.example` to `.env`.
    - Populate Firebase and OpenAI credentials.

4.  **Run**:
    ```bash
    npx expo start
    ```
