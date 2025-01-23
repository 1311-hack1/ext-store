const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const ChromeExtension = require('crx');
const { execSync } = require('child_process');

async function buildExtension(extensionPath) {
  const manifestPath = path.join(extensionPath, 'manifest.json');
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
  const version = manifest.version;

  // Create version directory if it doesn't exist
  const versionDir = path.join(extensionPath, 'versions', version);
  await fs.ensureDir(path.join(versionDir, 'source'));
  await fs.ensureDir(path.join(versionDir, 'crx'));

  // Copy source files
  await fs.copy(
    path.join(extensionPath, 'source'),
    path.join(versionDir, 'source')
  );

  // Generate private key if not exists
  const keyPath = path.join(extensionPath, 'key.pem');
  if (!await fs.pathExists(keyPath)) {
    execSync('openssl genrsa -out key.pem 2048', { cwd: extensionPath });
  }

  // Build CRX
  const crx = new ChromeExtension({
    privateKey: await fs.readFile(keyPath),
    path: path.join(versionDir, 'source')
  });

  const crxBuffer = await crx.pack();
  const crxPath = path.join(versionDir, 'crx', `${manifest.name}-${version}.crx`);
  await fs.writeFile(crxPath, crxBuffer);

  console.log(`Built ${manifest.name} v${version}`);
}

async function buildAll() {
  try {
    const extensions = glob.sync('extension-store/extensions/*/');
    
    for (const extensionPath of extensions) {
      await buildExtension(extensionPath);
    }
    
    console.log('All extensions built successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

buildAll(); 