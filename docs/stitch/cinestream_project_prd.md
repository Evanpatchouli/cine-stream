# CineStream - Project Brief & PRD

## 1. Project Overview
CineStream is a modern, lightweight mobile H5 web application for streaming TV series. The design prioritizes a clean, cinematic experience following Material Design 3 (MD3) principles, optimized for development with the @mui component library.

## 2. Design Vision
- **Style**: Modern, minimalist, and lightweight.
- **Visual Identity**: "Cinematic Flow" — utilizes a deep indigo and neutral palette to emphasize content.
- **Navigation**: Global side drawer navigation (no bottom tabs) to maximize screen real estate for content discovery and viewing.

## 3. Core Features & User Flows
### 3.1 Authentication
- **Login**: Secure entry via mobile number and password. Minimalist interface with clear calls to action for registration.

### 3.2 Content Discovery
- **Theater Hall (Home)**: The central hub for browsing. Includes a global search bar, category filtering (Drama, Thriller, Comedy, etc.), and curated sections (Trending, Continue Watching).
- **Global Search**: Accessible via the top app bar for quick content retrieval.

### 3.3 Personalized Space
- **My Space**: User profile management, statistics (Watched/Saved counts), and account settings (Personal Info, Subscription, Playback Preferences).
- **Watch History**: Chronological list of recently viewed episodes with progress indicators.
- **My Collection**: A dedicated grid view for saved shows and movies, filterable by genre.

### 3.4 Viewing Experience
- **Playback Page**: 
  - Integrated video player with immersive UI.
  - Contextual metadata (Year, Season, Rating, Description).
  - Episode selector with "Now Playing" indicators.
  - Cast information.
  - **Theatrical View**: Built-in logic for rotating to landscape for full-screen viewing.

## 4. Technical Specifications
- **Framework**: H5 Web App (Mobile Optimized).
- **Component Library**: @mui (Material UI).
- **Design System Tokens**:
  - **Primary Color**: #1a237e (Deep Indigo).
  - **Surface Colors**: Light grey/white backgrounds for a "lightweight" feel.
  - **Typography**: Inter (Clean, readable sans-serif).
  - **Shape**: 8px border radius for consistency across cards and buttons.

## 5. Screen Inventory
- `SCREEN_2`: Login (登录 - CineStream)
- `SCREEN_8`: Theater Hall (剧场大厅 - CineStream)
- `SCREEN_5`: Playback Page (播放页 - CineStream)
- `SCREEN_6`: My Space (我的空间 - CineStream)
- `SCREEN_4`: Watch History (观看历史 - CineStream)
- `SCREEN_7`: My Collection (我的收藏 - CineStream)

## 6. Future Roadmap
- Implementation of "Theater Mode" social viewing features.
- Advanced recommendation engine based on watch history.
- Offline download management UI.
