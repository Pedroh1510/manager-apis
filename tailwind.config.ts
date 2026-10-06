import type { Config } from 'tailwindcss';

const withOpacity = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
	darkMode: 'class',
	content: ['./index.html', './src/**/*.{ts,tsx}'],
	theme: {
		extend: {
			colors: {
				canvas: withOpacity('--color-canvas'),
				surface: withOpacity('--color-surface'),
				'surface-raised': withOpacity('--color-surface-raised'),
				border: withOpacity('--color-border'),
				text: withOpacity('--color-text'),
				'text-muted': withOpacity('--color-text-muted'),
				'text-subtle': withOpacity('--color-text-subtle'),
				accent: withOpacity('--color-accent'),
				'accent-muted': withOpacity('--color-accent-muted'),
				success: withOpacity('--color-success'),
				'success-bg': withOpacity('--color-success-bg'),
				danger: withOpacity('--color-danger'),
				'danger-bg': withOpacity('--color-danger-bg'),
				warning: withOpacity('--color-warning'),
				'warning-bg': withOpacity('--color-warning-bg')
			},
			fontFamily: {
				sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
				mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
			},
			borderRadius: {
				sm: '4px',
				md: '6px',
				lg: '10px'
			},
			boxShadow: {
				raised: '0 1px 2px rgb(0 0 0 / 0.06), 0 1px 1px rgb(0 0 0 / 0.04)',
				overlay: '0 12px 32px rgb(0 0 0 / 0.28), 0 2px 8px rgb(0 0 0 / 0.16)'
			},
			transitionDuration: {
				DEFAULT: '150ms'
			},
			keyframes: {
				'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
				'drawer-in': { from: { transform: 'translateX(16px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
				'toast-in': { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } }
			},
			animation: {
				'fade-in': 'fade-in 150ms ease-out',
				'drawer-in': 'drawer-in 200ms cubic-bezier(0.16, 1, 0.3, 1)',
				'toast-in': 'toast-in 200ms cubic-bezier(0.16, 1, 0.3, 1)'
			}
		}
	},
	plugins: []
};

export default config;
