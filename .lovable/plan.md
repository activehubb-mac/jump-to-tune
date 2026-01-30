
# Adjust Glass Card Opacity to 50%

## Summary
Reduce the glass card opacity from 70% to 50% to show more of the cosmic starfield background through all UI components.

## Changes

### File: `src/index.css`

Update all three glass utility classes to use 50% opacity instead of 70%:

| Utility Class | Current | New |
|---------------|---------|-----|
| `.glass` | `hsl(var(--card) / 0.7)` | `hsl(var(--card) / 0.5)` |
| `.glass-card` | `hsl(var(--card) / 0.7)` | `hsl(var(--card) / 0.5)` |
| `.glass-card-bordered` | `hsl(var(--card) / 0.7)` | `hsl(var(--card) / 0.5)` |

## Visual Effect
- Cards will appear lighter and more ethereal
- More of the cosmic starfield will be visible through UI elements
- The backdrop blur (12px) remains unchanged to keep text readable
- Creates a more immersive "floating in space" aesthetic
