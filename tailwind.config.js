//
// This is your Tailwind CSS configuration, where
// you can define global style constants such as
// color palette, fonts and sizes.
//
// Read more at https://tailwindcss.com.
//

const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  important: true,
  theme: {
    extend: {
      colors: {
        gray: colors.coolGray,
        blue: colors.blue,
        red: colors.red,
        rose: colors.rose,
        pink: colors.pink,
        lightBlue: colors.lightBlue,
        blueGray: colors.blueGray,
        emerald: colors.emerald,
        lime: colors.lime,
        teal: colors.teal,
        amber: colors.amber,
        orange: colors.orange,
        purple: colors.purple,
        fuchsia: colors.fuchsia,
        turquoise: {
          50: '#effdfd',
          100: '#d2f7f9',
          200: '#aaf0f4',
          300: '#76e4ec',
          400: '#39d0dd',
          500: '#14b4c6',
          600: '#0892a2',
          700: '#097684',
          800: '#0b5e6b',
          900: '#0d4f5a',
        },
      },
      extend: {
        spacing: {
          128: '32rem',
          144: '36rem',
        },
        borderRadius: {
          '4xl': '2rem',
        },
      },
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        serif: ['Merriweather', ...defaultTheme.fontFamily.serif],
        mono: ['Menlo', ...defaultTheme.fontFamily.mono],
        system: ['Inter', ...defaultTheme.fontFamily.sans],
        lato: ['Lato', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  variants: {},
  plugins: [require('@tailwindcss/typography')],
}
