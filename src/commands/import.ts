import {ImportManager} from '../import/importManager'

export async function runImport(filePath: string): Promise<void> {
	if (!filePath) {
		console.error('❌ Error: Please provide a file path to import.')
		console.log('Usage: npm-updater import <file.json>')
		return
	}

	const importManager = new ImportManager()

	console.log(`📥 Starting import from: ${filePath}`)
	console.log('='.repeat(60))

	try {
		const result = await importManager.importPackages(filePath)

		console.log('\n' + '='.repeat(60))
		if (result.success) {
			console.log(`✅ Import completed successfully!`)
			console.log(`📦 Total packages installed: ${result.installedCount}`)
		} else {
			console.log(`⚠️ Import finished with some issues.`)
			console.log(`📦 Successfully installed: ${result.installedCount}`)
			console.log(`❌ Failed: ${result.failedCount}`)

			if (result.errors.length > 0) {
				console.log('\nErrors encountered:')
				result.errors.forEach(err => console.log(`  - ${err}`))
			}
		}
	} catch (error) {
		console.error(
			'❌ Fatal import error:',
			error instanceof Error ? error.message : 'Unknown error',
		)
	}
}

export default runImport
