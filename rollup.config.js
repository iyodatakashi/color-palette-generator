import typescript from '@rollup/plugin-typescript';
import { defineConfig } from 'rollup';

export default defineConfig([
	// ES Module build
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/index.esm.js',
			format: 'esm',
			sourcemap: true
		},
		plugins: [
			typescript({
				tsconfig: './tsconfig.json',
				declaration: true,
				declarationDir: './dist'
			})
		]
	},
	// CommonJS build
	{
		input: 'src/index.ts',
		output: {
			file: 'dist/index.js',
			format: 'cjs',
			sourcemap: true
		},
		plugins: [
			typescript({
				tsconfig: './tsconfig.json',
				declaration: false
			})
		]
	}
]);
