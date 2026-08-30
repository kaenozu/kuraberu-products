const fs = require('fs');

const articles = [
  'logicool-zone-vibe-100-vs-zone-300',
  'makita-cl107-vs-cl286',
  'panasonic-eh-na0j-vs-eh-na0g',
  'panasonic-eh-na0k-vs-eh-ne9n',
  'panasonic-eh-na9m-vs-refa-beautech',
  'panasonic-eh-nc80-vs-eh-nc50',
  'panasonic-ep-ma110-vs-ep-ma121',
  'panasonic-es-lv9w-vs-es-lv7w',
  'panasonic-es-wp9b-vs-es-wg0b',
  'panasonic-ew-da19-vs-ew-da49',
  'panasonic-ew-dp57-vs-ew-dt73',
  'panasonic-mc-jp860k-vs-mc-sb70km',
  'panasonic-mc-sb53k-vs-mc-sb33j',
  'panasonic-ne-bs9c-vs-ne-ubs10c',
  'panasonic-ni-fs70a-vs-ni-fs60b',
  'panasonic-nt-t501-vs-nt-d700',
  'panasonic-sq-ld560-vs-sq-ld540',
  'recolte-automatic-cooker-vs-panasonic-nf-pc400',
  'roborock-qrevo-curv-vs-dreame-x50',
  'sharp-kc-s50-vs-panasonic-f-vxw55',
];

const seedDir = 'src/content/articles/commercial/';
const products = [];

for (const article of articles) {
  try {
    const content = fs.readFileSync(`${seedDir}${article}.ts`, 'utf8');
    const leftMatch = content.match(/leftProduct:\s*"([^"]+)"/);
    const rightMatch = content.match(/rightProduct:\s*"([^"]+)"/);
    
    if (leftMatch && rightMatch) {
      products.push({
        article,
        left: leftMatch[1],
        right: rightMatch[1]
      });
    }
  } catch (e) {
    console.log(`Error reading ${article}: ${e.message}`);
  }
}

// Output as JSON
fs.writeFileSync('unverified_products.json', JSON.stringify(products, null, 2));
console.log(`Extracted ${products.length} articles`);
console.log('\nProducts to search:');
for (const p of products) {
  console.log(`${p.article}:`);
  console.log(`  LEFT:  ${p.left}`);
  console.log(`  RIGHT: ${p.right}`);
}
