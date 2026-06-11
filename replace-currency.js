const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'admin-panel/src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace <span>${amount.toFixed(2)}</span> with <span>{formatCurrency(amount)}</span>
  content = content.replace(/\$\{([^}]+)\.toFixed\(2\)\}/g, '{formatCurrency($1)}');
  
  // Replace `$${amount.toFixed(2)}` inside template literals with `${formatCurrency(amount)}`
  content = content.replace(/\$\$\{([^}]+)\.toFixed\(2\)\}/g, '${formatCurrency($1)}');
  
  // Replace `>$$amount.toFixed(2)<` or `>$amount.toFixed(2)<` -> `>{formatCurrency(amount)}<` (jsx text)
  content = content.replace(/>\$([a-zA-Z0-9_.\-\(\)\[\]]+)\.toFixed\(2\)</g, '>{formatCurrency($1)}<');

  // Any remaining \$([a-zA-Z0-9_.\-\(\)\[\]]+)\.toFixed\(2\)
  content = content.replace(/\$([a-zA-Z0-9_.\-\(\)\[\]]+)\.toFixed\(2\)/g, '{formatCurrency($1)}');

  // Replace in specific known places like Invoices.tsx HTML string
  // \$\$\{item.unitPrice.toFixed\(2\)\} -> \$\{formatCurrency\(item.unitPrice\)\}
  // Oh wait, \$\$\{...\} was already handled above.

  if (content !== originalContent) {
    // Need to add import
    if (!content.includes("import { formatCurrency }")) {
      const importStatement = "import { formatCurrency } from '../lib/utils';\n";
      // Find a good place for import. After other imports or top of file.
      // But we need to make sure the relative path is correct.
      const depth = filePath.split('src/')[1].split('/').length - 1;
      const relativePath = depth === 0 ? './lib/utils' : '../'.repeat(depth) + 'lib/utils';
      const exactImport = `import { formatCurrency } from '${relativePath}';\n`;
      
      const lastImportIndex = content.lastIndexOf('import ');
      if (lastImportIndex !== -1) {
        const endOfImport = content.indexOf('\n', lastImportIndex);
        content = content.slice(0, endOfImport + 1) + exactImport + content.slice(endOfImport + 1);
      } else {
        content = exactImport + content;
      }
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walkDir(srcDir);
