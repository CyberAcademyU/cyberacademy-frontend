/**
 * Ajusta los iconos de Android después de `capacitor-assets generate --android`.
 *
 * 1. El foreground adaptativo se genera a tamaño de icono legacy (48dp) y
 *    Android lo escala a 108dp, con lo que el logo queda borroso y pequeño.
 *    Aquí se rasteriza el SVG a los tamaños reales del icono adaptativo.
 * 2. Los iconos legacy se generan con las esquinas transparentes. En
 *    launchers que no aplican máscara se ve el fondo del sistema (blanco)
 *    alrededor del logo, así que se aplanan sobre el color de marca.
 */
import { readdir, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const RES = 'android/app/src/main/res';
const BACKGROUND = '#070709';

// Icono adaptativo: 108dp de lienzo para el foreground.
const FOREGROUND_SIZES = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

for (const [density, size] of Object.entries(FOREGROUND_SIZES)) {
  const target = join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png');
  const buffer = await sharp('assets/icon-foreground.svg')
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(target, buffer);
  console.log(`foreground ${density}: ${size}x${size}`);
}

for (const dir of await readdir(RES)) {
  if (!dir.startsWith('mipmap-') || dir.includes('anydpi')) continue;

  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    const file = join(RES, dir, name);
    const flattened = await sharp(file)
      .flatten({ background: BACKGROUND })
      .png()
      .toBuffer();
    await writeFile(`${file}.tmp`, flattened);
    await rename(`${file}.tmp`, file);
  }
  console.log(`legacy aplanado: ${dir}`);
}
