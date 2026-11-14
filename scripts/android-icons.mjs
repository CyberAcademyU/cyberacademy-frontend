/**
 * Ajusta los iconos de Android después de `capacitor-assets generate --android`.
 *
 * - El foreground adaptativo se genera a tamaño de icono legacy (48dp) y
 *   Android lo escala a 108dp, con lo que el logo queda borroso. Aquí se
 *   rasteriza el SVG a los tamaños reales del icono adaptativo.
 * - El foreground incluye el fondo de marca a sangre, porque algunos
 *   launchers (MIUI/HyperOS) ignoran la capa <background> y ponen una placa
 *   blanca detrás. El background sigue existiendo como PNG por el mismo motivo.
 * - Los iconos legacy se generan con las esquinas transparentes; aquí se
 *   aplanan sobre el fondo de marca para que nunca se vea blanco detrás.
 */
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const RES = 'android/app/src/main/res';
const BACKGROUND = '#070709';

// Icono adaptativo: lienzo de 108dp (foreground y background).
const ADAPTIVE_SIZES = {
  ldpi: 81,
  mdpi: 108,
  hdpi: 162,
  xhdpi: 216,
  xxhdpi: 324,
  xxxhdpi: 432,
};

const ADAPTIVE_ICON = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

const COLOR = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${BACKGROUND}</color>
</resources>
`;

for (const [density, size] of Object.entries(ADAPTIVE_SIZES)) {
  const foreground = await sharp('assets/icon-foreground.svg')
    .resize(size, size)
    .png()
    .toBuffer();
  await writeFile(join(RES, `mipmap-${density}`, 'ic_launcher_foreground.png'), foreground);

  const background = await sharp({
    create: { width: size, height: size, channels: 4, background: BACKGROUND },
  })
    .png()
    .toBuffer();
  await writeFile(join(RES, `mipmap-${density}`, 'ic_launcher_background.png'), background);

  for (const name of ['ic_launcher.png', 'ic_launcher_round.png']) {
    const file = join(RES, `mipmap-${density}`, name);
    const flattened = await sharp(file).flatten({ background: BACKGROUND }).png().toBuffer();
    await writeFile(file, flattened);
  }

  console.log(`${density}: foreground, background y legacy a ${size}px`);
}

for (const name of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  await writeFile(join(RES, 'mipmap-anydpi-v26', name), ADAPTIVE_ICON);
}
await writeFile(join(RES, 'values', 'ic_launcher_background.xml'), COLOR);

console.log('iconos adaptativos y color de fondo actualizados');
