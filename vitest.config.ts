import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, '.'),
			'@/components': path.resolve(__dirname, './components'),
			'@/lib': path.resolve(__dirname, './lib'),
			'@/styles': path.resolve(__dirname, './styles'),
		},
	},
	test: {
		env: {
			NODE_ENV: 'test',
		},
		environment: 'node',
		globals: true,
		include: ['tests/**/*.test.{ts,tsx}'],
		setupFiles: [],
	},
});
