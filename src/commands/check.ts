import {PackageTracker, type TrackedPackage} from '../database/packageTracker'
import {ConfigManager} from '../config/configManager'

export async function runcheck(packageManager?: string): Promise<void> {
	const configManager = ConfigManager.getInstance()
	await configManager.initialize()

	const tracker = new PackageTracker()
	await tracker.initialize()

	const pms = packageManager
		? [packageManager]
		: configManager.getConfig().packageManagers.enabled

	console.log(`🔍 Checking global packages for updates (${pms.join(', ')})...`)
	console.log('='.repeat(80))

	try {
		const trackedPackages: TrackedPackage[] = await tracker.scanAllPackages(pms)

		if (trackedPackages.length === 0) {
			console.log('No global packages found.')
			return
		}

		const outdated = trackedPackages.filter(
			(pkg: TrackedPackage) => pkg.isOutdated,
		)

		if (outdated.length === 0) {
			console.log('✅ All global packages are up to date!')
			return
		}

		console.log(`Found ${outdated.length} packages with updates available:\n`)

		// Define column widths
		const nameWidth = 30
		const managerWidth = 10
		const currentWidth = 15
		const latestWidth = 15

		// Header
		console.log(
			'Package'.padEnd(nameWidth) +
				'Manager'.padEnd(managerWidth) +
				'Current'.padEnd(currentWidth) +
				'Latest'.padEnd(latestWidth),
		)
		console.log('-'.repeat(80))

		for (const pkg of outdated) {
			console.log(
				pkg.name.padEnd(nameWidth) +
					pkg.packageManager.padEnd(managerWidth) +
					pkg.currentVersion.padEnd(currentWidth) +
					(pkg.latestVersion || 'N/A').padEnd(latestWidth),
			)
		}

		console.log('\n' + '='.repeat(80))
		console.log(
			`Summary: ${outdated.length}/${trackedPackages.length} packages can be updated.`,
		)
		console.log(
			'Run `npm-updater updateall` or `npm-updater update <package>` to update.',
		)
	} catch (error) {
		console.error(
			'❌ Error checking for updates:',
			error instanceof Error ? error.message : 'Unknown error',
		)
	}
}

export default runcheck
