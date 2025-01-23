const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');

async function generateIndex() {
  try {
    const extensions = glob.sync('extension-store/extensions/*/');
    const index = {
      lastUpdated: new Date().toISOString(),
      extensions: []
    };

    for (const extensionPath of extensions) {
      const manifestPath = path.join(extensionPath, 'manifest.json');
      const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
      
      // Get all versions
      const versionsPath = path.join(extensionPath, 'versions');
      const versions = await fs.readdir(versionsPath);

      const extensionInfo = {
        id: path.basename(extensionPath),
        name: manifest.name,
        description: manifest.description,
        author: manifest.author || 'Unknown',
        versions: versions.map(version => ({
          version,
          crxPath: `extensions/${path.basename(extensionPath)}/versions/${version}/crx/${manifest.name}-${version}.crx`
        })),
        latestVersion: versions[versions.length - 1],
        manifest_version: manifest.manifest_version,
        permissions: manifest.permissions || []
      };

      index.extensions.push(extensionInfo);
    }

    // Write index file
    await fs.writeJson('extension-store/index.json', index, { spaces: 2 });
    console.log('Index generated successfully');
  } catch (error) {
    console.error('Index generation failed:', error);
    process.exit(1);
  }
}

generateIndex(); 