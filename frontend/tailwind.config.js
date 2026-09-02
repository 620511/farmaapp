export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0A1B45',
          900: '#0F2657',
          800: '#153270',
          700: '#1B3F8C'
        },
        teal: {
          600: '#0F8F79',
          500: '#17A98C',
          400: '#2BC4A3'
        },
        coral: {
          500: '#E4483D'
        }
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif']
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #153270 0%, #0F8F79 100%)',
        'logo-gradient': 'linear-gradient(135deg, #0F2657 0%, #17A98C 100%)'
      }
    }
  },
  plugins: []
}
