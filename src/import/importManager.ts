import {
	getPackageManagerConfig,
	type PackageManager,
} from '../utils/packageManager'
import {exec} from 'child_process'
import {promises as fs} from 'fs'
import {promisify} from 'util'

const execAsync = promisify(exec)

export interface ImportPackage {
	name: string
	version: string
	packageManager: PackageManager
}

export interface ImportResult {
	success: boolean
	installedCount: number
	failedCount: number
	errors: string[]
}

export class ImportManager {
	/**
	 * Import packages from a JSON or list file
	 */
	public async importPackages(filePath: string): Promise<ImportResult> {
		const result: ImportResult = {
			success: true,
			installedCount: 0,
			failedCount: 0,
			errors: [],
		}

		try {
			const content = await fs.readFile(filePath, 'utf-8')
			let packagesToImport: ImportPackage[] = []

			if (filePath.endsWith('.json')) {
				const data = JSON.parse(content)
				if (data.packages && Array.isArray(data.packages)) {
					packagesToImport = data.packages.map(
						(pkg: {name: string; version: string; packageManager: string}) => ({
							name: pkg.name,
							version: pkg.version,
							packageManager: pkg.packageManager as PackageManager,
						}),
					)
				} else {
					throw new Error('Invalid JSON format: missing "packages" array.')
				}
			} else if (filePath.endsWith('.txt') || filePath.endsWith('.list')) {
				// Basic list format: name@version or manager:name@version
				const lines = content.split('\n').filter(line => line.trim())
				packagesToImport = lines
					.map(line => {
						const parts = line.trim().split(':')
						let manager: PackageManager = 'npm'
						let fullPkg = line.trim()

						if (
							parts.length > 1 &&
							['npm', 'pnpm', 'yarn', 'bun'].includes(parts[0]!)
						) {
							manager = parts[0] as PackageManager
							fullPkg = parts.slice(1).join(':')
						}

						const [name, version] = fullPkg.split('@')
						return {
							name: name || '',
							version: version || 'latest',
							packageManager: manager,
						}
					})
					.filter(pkg => pkg.name)
			} else {
				throw new Error('Unsupported file extension. Use .json, .txt, or .list')
			}

			console.log(`📦 Found ${packagesToImport.length} packages to import...`)

			for (const pkg of packagesToImport) {
				try {
					console.log(
						`🚀 Installing ${pkg.name}@${pkg.version} using ${pkg.packageManager}...`,
					)
					const config = getPackageManagerConfig(pkg.packageManager)
					const command = config.installCommand(pkg.name, pkg.version)
					await execAsync(command)
					result.installedCount++
				} catch (err) {
					const errorMsg = `Failed to install ${pkg.name}: ${err instanceof Error ? err.message : 'Unknown error'}`
					console.error(`❌ ${errorMsg}`)
					result.failedCount++
					result.errors.push(errorMsg)
				}
			}

			result.success = result.failedCount === 0
		} catch (error) {
			result.success = false
			result.errors.push(
				error instanceof Error ? error.message : 'Unknown import error',
			)
		}

		return result
	}
}

export default ImportManager
