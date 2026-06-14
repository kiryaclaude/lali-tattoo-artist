/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces
        page: '#0F0F0F',       // app background
        card: '#1D1D1F',       // cards, inputs, chips, secondary buttons
        'card-2': '#262629',   // hover / elevated surface
        line: '#2C2C2F',       // borders, dividers, progress track

        // Text
        muted: '#8C8C92',      // secondary text / subtitles
        hint: '#5E5E63',       // placeholders / disabled hints

        // Brand (green accent)
        brand: {
          light: '#82C9A4',
          DEFAULT: '#6FBF93',
          dark: '#58A87B',
          muted: '#46544C',    // disabled primary button
          tint: '#1B2A22',     // green-tinted surfaces (icon circle, selected chip)
          contrast: '#0E1A13', // text/icon on a brand-filled surface
        },

        // Warning (parental-consent notice)
        warn: {
          bg: '#2A2310',
          line: '#6E5A1E',
          text: '#E0C879',
          icon: '#E2A93B',
        },

        // Kept for any remaining references; mapped onto the green brand
        sky: {
          50: '#11241a',
          100: '#15301f',
          200: '#1f4a32',
          300: '#3f7d5b',
          400: '#58A87B',
          500: '#6FBF93',
          600: '#6FBF93',
          700: '#58A87B',
          800: '#3f7d5b',
          900: '#15301f',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  darkMode: 'class',
  plugins: [],
}
