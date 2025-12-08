import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		globals: true,
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		alias: {
			$lib: '/src/lib',
			'$app/environment': '/src/test/mocks/environment.ts',
			'$app/stores': '/src/test/mocks/stores.ts',
			'$app/navigation': '/src/test/mocks/navigation.ts'
		},
		// Required for Svelte 5 - ensure browser build is used
		server: {
			deps: {
				inline: ['svelte']
			}
		}
	},
	// Ensure browser conditions for tests
	resolve: {
		conditions: ['browser']
	}
});
