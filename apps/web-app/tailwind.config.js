const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

/** @type {import('tailwindcss').Config} */
module.exports = {
  mode: 'jit',
  content: [
    join(
      __dirname,
      '{src,pages,components,app}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      colors: {
        white: '#ffffff',
        black: '#100D0D',
        gray: {
          50: '#fafaf9',
          100: '#f5f5f4',
          200: '#e7e5e4',
          300: '#d6d3d1',
          400: '#a8a29e',
          500: '#78716c',
          600: '#57534e',
          700: '#44403c',
          800: '#292524',
          900: '#1c1917',
          950: '#0c0a09',
        },
        green: {
          50: '#f0fdf4',
          100: '#dbfde6',
          200: '#baf8cf',
          300: '#84f1aa',
          400: '#48e07d',
          500: '#1db954',
          600: '#14a547',
          700: '#13823b',
          800: '#156633',
          900: '#13542c',
          950: '#042f15',
        },
      },
    },
  },
  plugins: [require('prettier-plugin-tailwindcss')],
};
