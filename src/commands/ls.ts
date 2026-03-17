import {
	getPackageManager,
	getPackageManagerConfig,
} from '../utils/packageManager'
import {exec} from 'child_process'

export async function runls(packageManager?: string) {
	const pm = getPackageManager(packageManager)
	const config = getPackageManagerConfig(pm)

	console.log(`Listing global packages using ${config.displayName}...`)

	exec(config.listCommand, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`)
			return
		}
		if (stderr) {
			console.log(`stderr: ${stderr}`)
			return
		}
		console.log(stdout)
	})
}
