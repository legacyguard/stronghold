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
        'primary': '#6B8E23',
        'primary-light': '#8FBC8F',
        'background': '#F0F8E8',
        'text-dark': '#2E2E2E',
        'text-light': '#666666',
        'neutral-dark': '#5D4037',
        'neutral-light': '#A1887F',
        'surface': '#FFFFFF',
        'border': '#F5F5F5',
      },
      fontSize: {
        'h1': '32px',
        'h2': '18px',
        'h3': '24px',
        'body': '16px',
        'caption': '14px',
        'nav': '12px',
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
        'lg': '12px', // Používame 'lg' ako náš štandard, nie 'DEFAULT'
      },
    },
  },
  plugins: [],
}
export default config


