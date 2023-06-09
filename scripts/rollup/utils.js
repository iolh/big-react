import fs from 'fs';
import path from 'path';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import replace from '@rollup/plugin-replace';

const pkgPath = path.resolve(__dirname, '../../packages');
const distPath = path.resolve(__dirname, '../../dist/node_modules');

export function resolvePkgPath(pkgName, isDist = false) {
	return path.resolve(isDist ? distPath : pkgPath, pkgName);
}

export function getPackageJson(pkgName) {
	const pkgJsonPath = resolvePkgPath(pkgName, false) + '/package.json';
	const pkgJson = fs.readFileSync(pkgJsonPath, 'utf-8');
	return JSON.parse(pkgJson);
}

export function getBaseRollupPlugins({
	alias = {
		__DEV__: true,
		preventAssignment: true
	},
	ts = {}
} = {}) {
	return [replace(alias), commonjs(), typescript(ts)];
}
