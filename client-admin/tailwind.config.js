/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Semantic Theme Colors
                bg: {
                    primary: 'rgb(var(--bg-primary) / <alpha-value>)', // Main app background
                    secondary: 'rgb(var(--bg-secondary) / <alpha-value>)', // Sidebar/Header
                    card: 'rgb(var(--bg-card) / <alpha-value>)', // Cards/Panels
                },
                text: {
                    primary: 'rgb(var(--text-primary) / <alpha-value>)',
                    secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
                    muted: 'rgb(var(--text-muted) / <alpha-value>)',
                },
                border: {
                    DEFAULT: 'rgb(var(--border-color) / <alpha-value>)',
                },
                // Brand Accents
                brand: {
                    primary: '#3B82F6', // Blue
                    secondary: '#10B981', // Green
                    accent: '#8B5CF6', // Purple
                    neonBlue: '#00F0FF',
                    neonGreen: '#00FF94'
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'], // Professional typography
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
                'neon-blue': '0 0 10px rgba(0, 240, 255, 0.5)',
                'neon-green': '0 0 10px rgba(0, 255, 148, 0.5)',
            },
            backgroundImage: {
                'gradient-dark': 'linear-gradient(to bottom right, #0B0F19, #111827)',
                'gradient-glass': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0))',
            }
        },
    },
    plugins: [],
}
