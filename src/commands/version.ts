import consoleClear from 'console-clear'
import {showlogo} from 'src/utils/logo'
import {execSync} from 'child_process'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import {join} from 'path'

let packageJson: {version: string}

try {
	const globalpath = execSync('cmd /c "where npm-updater.cmd"')
		.toString()
		.trim()
	const packageJsonPath = join(
		globalpath,
		'../node_modules',
		'@involvex/npm-global-updater',
		'package.json',
	)
	const packageJsonContent = readFileSync(packageJsonPath)
	packageJson = JSON.parse(packageJsonContent.toString())
} catch {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = dirname(__filename)
	const packageJsonPath = join(__dirname, '..', '..', 'package.json')
	const packageJsonContent = readFileSync(packageJsonPath)
	packageJson = JSON.parse(packageJsonContent.toString())
}

export function showversion() {
	consoleClear()
	showlogo()
	console.log('='.repeat(60))
	console.log('========= Version ============')
	console.log('==========' + packageJson.version + ' =============')
	console.log('='.repeat(60))
}

export function returnversion() {
	return packageJson.version
}

export default showversion
