import { exec } from "child_process";

export async function runupdateall() {
  console.log("Checking for globally installed npm packages...");
  console.log("This may take a moment...\n");

  // First, get the list of global packages
  exec("npm ls -g --json", (error, stdout) => {
    if (error) {
      console.log(`Error getting package list: ${error.message}`);
      return;
    }

    try {
      const data = JSON.parse(stdout);
      const packages: Array<{ name: string; version: string }> = [];

      // Extract packages from the dependencies
      if (data.dependencies) {
        for (const [name, info] of Object.entries(data.dependencies)) {
          if (
            typeof info === "object" &&
            info !== null &&
            "version" in info &&
            typeof info.version === "string"
          ) {
            packages.push({
              name,
              version: info.version,
            });
          }
        }
      }

      console.log(`Found ${packages.length} globally installed packages`);
      console.log("Checking for available updates...\n");

      if (packages.length === 0) {
        console.log("No global packages found.");
        return;
      }

      let checkCount = 0;
      const packagesToUpdate: Array<{ name: string; latest: string }> = [];

      // Check each package for updates
      packages.forEach(pkg => {
        const command = `npm view ${pkg.name} version --json`;

        exec(command, (viewError, viewStdout) => {
          checkCount++;

          if (viewError) {
            console.log(`Could not check ${pkg.name}: ${viewError.message}`);
          } else {
            try {
              const versionData = JSON.parse(viewStdout);
              const latestVersion = versionData.version || versionData.latest;

              if (latestVersion && latestVersion !== pkg.version) {
                console.log(`${pkg.name}: ${pkg.version} -> ${latestVersion}`);
                packagesToUpdate.push({
                  name: pkg.name,
                  latest: latestVersion,
                });
              } else {
                // Check for special versions (nightly, dev, preview) if current version matches latest
                const specialVersions = ["nightly", "dev", "preview"];
                specialVersions.forEach(specType => {
                  const specCommand = `npm view ${pkg.name}@${specType} version --json`;
                  exec(specCommand, (specError, specStdout) => {
                    if (!specError && specStdout.trim()) {
                      try {
                        const specData = JSON.parse(specStdout);
                        const specVersion = specData.version || specData.latest;
                        if (specVersion && specVersion !== pkg.version) {
                          console.log(
                            `${pkg.name}: ${pkg.version} -> ${specVersion} (${specType})`,
                          );
                          packagesToUpdate.push({
                            name: pkg.name,
                            latest: specVersion,
                          });
                        }
                      } catch {
                        // Ignore parsing errors for special versions
                      }
                    }
                  });
                });
              }
            } catch {
              console.log(`Could not parse version info for ${pkg.name}`);
            }
          }

          // When all packages have been checked, start updates
          if (checkCount === packages.length) {
            if (packagesToUpdate.length === 0) {
              console.log("\nAll packages are already up to date! ✅");
              return;
            }

            console.log(
              `\nFound ${packagesToUpdate.length} packages with updates available.`,
            );
            console.log("Starting updates...\n");

            // Update packages one by one
            let updateIndex = 0;

            function updateNext() {
              if (updateIndex >= packagesToUpdate.length) {
                console.log("\n🎉 All updates completed!");
                return;
              }

              const pkgToUpdate = packagesToUpdate[updateIndex];
              if (pkgToUpdate) {
                console.log(
                  `Updating ${pkgToUpdate.name} to ${pkgToUpdate.latest}...`,
                );

                const updateCommand = `npm install -g ${pkgToUpdate.name}@${pkgToUpdate.latest}`;

                exec(updateCommand, updateError => {
                  if (updateError) {
                    console.log(
                      `❌ Failed to update ${pkgToUpdate.name}: ${updateError.message}`,
                    );
                  } else {
                    console.log(`✅ ${pkgToUpdate.name} updated successfully!`);
                  }

                  updateIndex++;
                  updateNext(); // Update the next package
                });
              } else {
                updateIndex++;
                updateNext();
              }
            }

            updateNext();
          }
        });
      });
    } catch (parseError) {
      console.log(`Error parsing npm output: ${parseError}`);
    }
  });
}

export default runupdateall;
