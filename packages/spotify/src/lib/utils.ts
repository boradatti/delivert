// import { createCanvas, loadImage } from 'canvas';

// export async function getImageDataUrl(imageUrl: string) {
//   const image = await loadImage(imageUrl);
//   const canvas = createCanvas(image.width, image.height);
//   const ctx = canvas.getContext('2d');
//   ctx.drawImage(image, 0, 0);
//   return canvas.toDataURL();
// }

import { encode, decode } from 'node-base64-image'


export async function getImageDataUrl(imageUrl: string) {
  const image = await encode(imageUrl, {
    string: true,
  });
  return `data:image/jpeg;base64,${image}`
}
