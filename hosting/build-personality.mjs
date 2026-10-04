// Wrap the Figma originals with the approved positions and sizes.
// All inputs live in this repository; no Figma connection is needed to rebuild.
import {readFileSync, writeFileSync, mkdirSync} from "node:fs";

const metadata = JSON.parse(readFileSync(new URL("./personality-assets.json", import.meta.url)));
const layout = JSON.parse(readFileSync(new URL("./personality-layout.json", import.meta.url)));
const output = new URL("./public/assets/stars/layout/", import.meta.url);
mkdirSync(output, {recursive: true});

for (const [filename, placement] of Object.entries(layout)) {
  const source = new URL(`./${metadata.sourceDirectory}/${filename}`, import.meta.url);
  const data = readFileSync(source).toString("base64");
  const size = (320 * placement.scale).toFixed(5);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320"><image x="${placement.x.toFixed(5)}" y="${placement.y.toFixed(5)}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" href="data:image/svg+xml;base64,${data}"/></svg>\n`;
  writeFileSync(new URL(filename, output), svg);
}
console.log(`Generated ${Object.keys(layout).length} personality SVGs.`);
