import { defineConfig } from 'rollup';
import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJson('react');
const pkgPath = resolvePkgPath(name);
const distPath = resolvePkgPath(name, true);

export default defineConfig([
	// react
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${distPath}/index.js`,
				format: 'umd',
				name: 'React'
			}
		],
		plugins: [
			getBaseRollupPlugins(),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: distPath,
				baseContents: ({ name, description, version }) => {
					return { name, description, version, main: 'index.js' };
				}
			})
		]
	},
	{
		input: `${pkgPath}/src/jsx.ts`,
		output: [
			// jsx-runtime
			{
				file: `${distPath}/jsx-runtime.js`,
				format: 'umd',
				name: 'jsx'
			},
			// jsx-dev-runtime
			{
				file: `${distPath}/jsx-dev-runtime.js`,
				format: 'umd',
				name: 'jsx'
			}
		],
		plugins: getBaseRollupPlugins()
	}
]);
