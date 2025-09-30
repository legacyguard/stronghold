import type { Config } from 'tailwindcss'

const config: Config = {
  // Povedzte Tailwindu, kde má hľadať triedy na použitie
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    // Tu si rozšírime predvolenú tému o naše vlastné hodnoty
    extend: {
      colors: {
        'primary': '#8B9D6B',
        'primary-light': '#A4B584',
        'background': '#F5F1E8',
        'text-dark': '#4A3429',
        'text-light': '#8B7355',
        'neutral-dark': '#5D4037',
        'neutral-light': '#B8956D',
        'neutral-beige': '#EDE8DD',
        'surface': '#FEFCF8',
        'border': '#E8E0D3',
      },
      fontFamily: {
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      fontSize: {
        'h1': ['32px', { fontWeight: '600' }],
        'h2': ['18px', { fontWeight: '400' }],
        'h3': ['24px', { fontWeight: '600' }],
        'body': ['16px', { fontWeight: '400' }],
        'caption': ['14px', { fontWeight: '400' }],
        'nav': ['12px', { fontWeight: '500' }],
      },
      fontWeight: {
        'regular': '400',
        'medium': '500',
        'semibold': '600',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'lg': '12px', // Standard border radius pre všetky komponenty
      },
    },
  },
  plugins: [],
}
export default config


