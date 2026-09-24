/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      lineClamp: {
        3: '3',
      },
    },
  },
  plugins: [],
}
