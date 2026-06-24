---
name: Cinematic Flow
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#454652'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#767683'
  outline-variant: '#c6c5d4'
  surface-tint: '#4c56af'
  primary: '#000666'
  on-primary: '#ffffff'
  primary-container: '#1a237e'
  on-primary-container: '#8690ee'
  inverse-primary: '#bdc2ff'
  secondary: '#4355b9'
  on-secondary: '#ffffff'
  secondary-container: '#8596ff'
  on-secondary-container: '#11278e'
  tertiary: '#001e24'
  on-tertiary: '#ffffff'
  tertiary-container: '#00353d'
  on-tertiary-container: '#00a6bc'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e0e0ff'
  primary-fixed-dim: '#bdc2ff'
  on-primary-fixed: '#000767'
  on-primary-fixed-variant: '#343d96'
  secondary-fixed: '#dee0ff'
  secondary-fixed-dim: '#bac3ff'
  on-secondary-fixed: '#00105c'
  on-secondary-fixed-variant: '#293ca0'
  tertiary-fixed: '#a1efff'
  tertiary-fixed-dim: '#44d8f1'
  on-tertiary-fixed: '#001f25'
  on-tertiary-fixed-variant: '#004e59'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 45px
    fontWeight: '700'
    lineHeight: 52px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: '0'
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: '0'
  title-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: '0'
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.15px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 16px
  gutter: 12px
  section-gap: 32px
  element-gap: 12px
---

## Brand & Style

The design system is centered on a **Modern Minimalist** aesthetic tailored for high-end mobile video streaming. It prioritizes content immersion by utilizing heavy whitespace and a "lightweight" interface that recedes to let cinematography lead. Following **Material Design 3 (MD3)** principles, the system employs a functional, systematic approach to hierarchy and interaction.

The target audience consists of mobile-first viewers who value a premium, "theatrical" digital environment. The emotional response is one of calm, professional reliability, and effortless discovery. To achieve this, the system avoids visual clutter, favoring precise alignment, intentional grouping, and a refined color application that feels more like a curated gallery than a traditional social app.

## Colors

The palette is anchored by a **Deep Indigo** primary color, chosen for its cinematic depth and professional stability. The background uses a crisp **Off-White** to maintain a sense of airiness and modernism.

- **Primary:** Used for key actions, active states, and branding accents.
- **Secondary/Tertiary:** Reserved for subtle highlights, progress bars, or category tags to provide visual variety without breaking the minimalist harmony.
- **Surface Tones:** A range of ultra-light greys are used for container backgrounds to create subtle distinction between the main canvas and interactive card elements.
- **Status Colors:** Standard MD3 error, success, and warning tones are used, but with desaturated values to remain consistent with the sophisticated brand personality.

## Typography

The typography utilizes **Inter** to achieve a systematic, neutral, and highly readable interface. The hierarchy is strictly governed by MD3 type scales, ensuring that information density remains low and accessible.

- **Headlines:** Use a tighter letter spacing and semi-bold weights to create a strong visual anchor for content sections.
- **Body Text:** Optimized for legibility with generous line heights, ensuring descriptions and metadata are easy to scan.
- **Labels:** Used for navigation items, timestamps, and tags. These use medium weights to differentiate them from body text without needing larger font sizes.
- **Scaling:** Large headlines automatically scale down for mobile screens to prevent awkward text wrapping, maintaining a maximum of 24px-28px for primary page titles.

## Layout & Spacing

This design system employs a **Fluid Grid** model optimized for H5 mobile environments. The layout is centered on an 8px rhythmic grid, ensuring all components align with mathematical precision.

- **Margins:** A standard 16px lateral margin is applied to all main content views to provide breathing room.
- **Navigation:** All navigation is consolidated into a **Navigation Drawer (Left)**, keeping the bottom of the screen clear for video controls and gestures.
- **Breakpoints:** While primarily mobile, the layout transitions to a centered "columnar" view for tablet portrait modes, capping the content width at 600px to maintain the narrow, scrollable feel of an H5 app.
- **Vertical Rhythm:** Sections (e.g., "Recommended," "Trending") are separated by a 32px gap to create a distinct visual pause between content types.

## Elevation & Depth

In accordance with MD3, depth is communicated through **Tonal Layers** and subtle **Ambient Shadows**. 

- **Surface Tiers:** The background is the lowest level (Level 0). Cards and the side drawer sit on Level 1, using a slightly elevated white surface with a very soft, diffused shadow (Blur 8px, Opacity 4%, Y-offset 2px).
- **Interactive States:** Buttons and active cards lift to Level 2 upon interaction, increasing shadow spread to provide tactile feedback.
- **Overlays:** The Navigation Drawer and Modal Dialogs use a semi-transparent scrim (40% Black) to dim the background, focusing all attention on the elevated element.
- **Glassmorphism:** A subtle backdrop blur (12px) is applied specifically to the Video Player control overlay to maintain context of the moving image beneath.

## Shapes

The shape language follows the **Rounded** (Level 2) logic of MD3 to evoke a friendly yet structured feel.

- **Standard Elements:** Buttons, text fields, and small cards use a 8px (0.5rem) corner radius.
- **Large Elements:** Featured video banners and the Navigation Drawer use a 16px (1rem) radius on relevant corners to soften the overall interface.
- **Chips & Pills:** Category tags and "Live" indicators use a full-round (pill) shape to distinguish them from structural card elements.
- **Icons:** Use the "Rounded" variant of the Material Icon set to maintain consistency with the UI's geometry.

## Components

The component library is optimized for `@mui` implementation, adhering to the following stylistic rules:

- **Buttons:** Use "Contained" buttons for primary actions (e.g., Subscribe, Watch Now) with the Indigo primary color. "Outlined" buttons are used for secondary actions like "Share" or "Later."
- **Cards:** Content cards are borderless with a subtle Level 1 shadow. Image ratios should strictly follow 16:9 for video thumbnails. Metadata (Title, Views) is placed directly below the image with standard 8px padding.
- **Navigation Drawer:** Occupies 80% of the screen width when active. It features a clean list of icons and labels, using the Primary color for the "Active" state background (with 12% opacity).
- **Input Fields:** Use the "Filled" MD3 style with a subtle bottom-line indicator. The fill color should be a very light grey (#F1F3F4) to contrast against the white surface.
- **Chips:** Used for genre filtering. When unselected, they have a light grey border; when selected, they transition to a solid Indigo fill with white text.
- **Video Player:** Custom controls should be minimalist, utilizing thin-stroke icons and a slim progress bar (4px height) that expands to 8px during seek operations.