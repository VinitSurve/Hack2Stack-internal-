/**
 * This is a helper script to install the react-feather package
 * Run this script with: node install-feather.js
 */
const { execSync } = require('child_process');

console.log('Installing react-feather package...');
try {
  execSync('npm install react-feather --save', { stdio: 'inherit' });
  console.log('Successfully installed react-feather package!');
} catch (error) {
  console.error('Failed to install package:', error.message);
  process.exit(1);
}
