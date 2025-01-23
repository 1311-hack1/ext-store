const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const semver = require('semver');

async function validateManifest(manifestPath) {
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  
  // Required fields
  const requiredFields = ['name', 'version', 'manifest_version', 'description'];
  for (const field of requiredFields) {
    if (!manifest[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  // Version validation
  if (!semver.valid(manifest.version)) {
    throw new Error('Invalid version format. Use semantic versioning');
  }

  // Permissions validation
  if (manifest.permissions) {
    const dangerousPermissions = ['<all_urls>', 'tabs'];
    const foundDangerous = manifest.permissions.filter(p => 
      dangerousPermissions.includes(p)
    );
    
    if (foundDangerous.length > 0) {
      console.warn(`Warning: Using potentially dangerous permissions: ${foundDangerous.join(', ')}`);
    }
  }

  return true;
}

async function validateExtension(extensionPath) {
  const name = path.basename(extensionPath);
  console.log(`Validating ${name}...`);

  // Check required files
  const requiredFiles = ['manifest.json', 'README.md'];
  for (const file of requiredFiles) {
    const filePath = path.join(extensionPath, file);
    if (!await fs.pathExists(filePath)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }

  // Validate manifest
  await validateManifest(path.join(extensionPath, 'manifest.json'));

  // Validate source code presence
  const sourcePath = path.join(extensionPath, 'source');
  if (!await fs.pathExists(sourcePath)) {
    throw new Error('Missing source code directory');
  }

  console.log(`${name} validation successful`);
  return true;
}

async function validateAll() {
  try {
    const extensions = glob.sync('extension-store/extensions/*/');
    
    for (const extensionPath of extensions) {
      await validateExtension(extensionPath);
    }
    
    console.log('All extensions validated successfully');
  } catch (error) {
    console.error('Validation failed:', error);
    process.exit(1);
  }
}

validateAll(); 