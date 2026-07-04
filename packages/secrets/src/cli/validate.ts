import { createSecretsLoader } from '../loader.js';

const loader = createSecretsLoader();
const result = loader.validate();

if (!result.valid) {
  console.error('❌ Secrets validation failed!\n');
  console.error('Errors:');
  Object.entries(result.errors).forEach(([key, msgs]) => {
    console.error(`  ${key}:`);
    msgs.forEach(msg => { console.error(`    - ${msg}`); });
  });
  process.exit(1);
}

loader.printReport();

if (loader.getWarnings().length > 0) {
  process.exit(1);
}

process.exit(0);
