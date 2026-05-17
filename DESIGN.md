---
name: Modern Soft SaaS
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434654'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737685'
  outline-variant: '#c3c6d6'
  surface-tint: '#0c56d0'
  primary: '#003d9b'
  on-primary: '#ffffff'
  primary-container: '#0052cc'
  on-primary-container: '#c4d2ff'
  inverse-primary: '#b2c5ff'
  secondary: '#505f76'
  on-secondary: '#ffffff'
  secondary-container: '#d0e1fb'
  on-secondary-container: '#54647a'
  tertiary: '#7b2600'
  on-tertiary: '#ffffff'
  tertiary-container: '#a33500'
  on-tertiary-container: '#ffc6b2'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2ff'
  primary-fixed-dim: '#b2c5ff'
  on-primary-fixed: '#001848'
  on-primary-fixed-variant: '#0040a2'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#ffdbcf'
  tertiary-fixed-dim: '#ffb59b'
  on-tertiary-fixed: '#380d00'
  on-tertiary-fixed-variant: '#812800'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.7'
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.5'
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.04em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 8px
  container-padding-mobile: 20px
  container-padding-desktop: 48px
  gutter: 24px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
  stack-xl: 64px
---

## Brand & Style
This design system shifts the user experience from a technical utility to a welcoming, human-centric environment. The brand personality is approachable, reliable, and effortless. By blending modern minimalism with soft, organic forms, the UI aims to reduce cognitive load and evoke a sense of calm efficiency.

The aesthetic prioritizes clarity and breathability. It utilizes a "Soft SaaS" approach: a departure from rigid, data-heavy dashboards toward a more editorial and fluid interface. Key characteristics include expansive whitespace, gentle depth cues, and an absence of sharp corners, ensuring the product feels like a premium service rather than a complex tool.

## Colors
The palette is anchored by a high-trust primary blue, balanced by a sophisticated range of cool grays. The background strategy relies on layered neutrals—using slightly tinted off-whites to define different functional areas without the need for harsh dividing lines.

- **Primary:** The core brand blue is used for primary actions and brand recognition.
- **Surface:** The default background is a very soft gray (#F8FAFC), providing a cleaner, more modern canvas than pure white.
- **Contrast:** Text colors are kept at high contrast (Slate 900 for headings, Slate 600 for body) to ensure maximum readability against the soft background tones.

## Typography
Inter is used exclusively for its exceptional legibility and systematic flexibility. In this design system, the typeface is treated with a more generous cadence. 

Line heights are intentionally increased (1.6x for body text) to create a relaxed reading experience. Tracking (letter spacing) is slightly widened for smaller labels to maintain clarity, while larger headlines utilize tighter tracking and heavier weights to provide a confident visual anchor. For mobile, headline sizes are scaled down slightly while maintaining the robust line height to prevent text crowding.

## Layout & Spacing
The layout philosophy is built on a fluid 12-column grid that emphasizes generous margins and "breathing room." Elements are never cramped; instead, the design system uses ample negative space to separate distinct functional groups.

A consistent 8px base unit governs all dimensions. Content is typically centered with wide gutters (24px) to ensure a comfortable scanning path. On mobile, padding remains significant (20px) to maintain the "soft" and open feel, while desktop layouts leverage larger 64px vertical stacks to separate major sections.

## Elevation & Depth
Depth is created through the use of "Ambient Layers" rather than heavy, artificial shadows. This design system avoids the flat aesthetic in favor of subtle, multi-layered shadows that simulate soft light.

- **Soft Shadows:** Large blur radii (16px to 32px) with very low opacity (4-8%) are used to lift cards and modals off the surface.
- **Subtle Borders:** Elements use low-contrast borders (1px, Slate 100/200) to define edges without adding visual noise.
- **Tonal Stepping:** Primary containers sit on a #F8FAFC background, while secondary elements or sidebars use a slightly deeper #F1F5F9 tone to create a natural hierarchy.

## Shapes
The shape language is the defining characteristic of this design system. It moves away from the precision of engineering-grade sharp corners to a pill-shaped, fully rounded aesthetic.

All interactive elements, including buttons, input fields, and tags, utilize a high corner radius to appear friendly and touch-friendly. Larger containers like cards and modals use a minimum of 1.5rem (24px) to 2rem (32px) radius to maintain harmony with the rounded components inside them.

## Components
Consistent application of roundness and soft shadows defines the component library.

- **Buttons:** Fully pill-shaped (`rounded-full`) with a subtle 2px vertical offset shadow. Primary buttons use the core blue, while secondary buttons use a ghost style with a subtle border.
- **Cards:** Defined by a 24px or 32px corner radius and a soft ambient shadow. Avoid borders on cards unless they are resting on a background of the same color.
- **Inputs:** Rounded fields with a 1.6x line-height for text. Focus states should transition to the primary blue with a soft 4px outer glow rather than a hard border.
- **Chips & Tags:** Small, fully rounded elements with subtle tinted backgrounds (e.g., light blue background with dark blue text) to signify categories without overwhelming the layout.
- **Lists:** High vertical padding (16px+) between list items and rounded hover states that use a soft gray background.