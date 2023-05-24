import { defineConfig } from 'rollup';
import { getBaseRollupPlugins, getPackageJson, resolvePkgPath } from './utils';
import generatePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module } = getPackageJson('react-dom');
const pkgPath = resolvePkgPath(name);
const distPath = resolvePkgPath(name, true);

export default defineConfig([
	// react-dom
	{
		input: `${pkgPath}/${module}`,
		output: [
			{
				file: `${distPath}/index.js`,
				format: 'umd',
				name: 'React'
			},
			{
				file: `${distPath}/client.js`,
				format: 'umd',
				name: 'React'
			}
		],
		plugins: [
			getBaseRollupPlugins(),
			alias({
				entries: {
					hostConfig: `${pkgPath}/src/hostConfig.ts`
				}
			}),
			generatePackageJson({
				inputFolder: pkgPath,
				outputFolder: distPath,
				baseContents: ({ name, description, version }) => {
					return {
						name,
						description,
						version,
						peerDependencies: {
							react: version
						},
						main: 'index.js'
					};
				}
			})
		]
	}
]);
