import {
  MultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
  RGBLuminanceSource,
  BinaryBitmap,
  HybridBinarizer,
} from "@zxing/library";
import { createCanvas, loadImage } from "canvas";
import logger from "../utils/logger.js";

function rgbaToGrayscale(rgba, width, height) {
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    gray[i] = (r + g + b) / 3;
  }
  return gray;
}

export const decodeBarcode = async (buffer) => {
  try {
    const img = await loadImage(buffer);

    const maxWidth = 800;
    const scale = Math.min(1, maxWidth / img.width);
    const w = Math.floor(img.width * scale);
    const h = Math.floor(img.height * scale);

    const canvas = createCanvas(w, h);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    const imageData = ctx.getImageData(0, 0, w, h);
    const grayData = rgbaToGrayscale(imageData.data, w, h);

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_8,
      BarcodeFormat.EAN_13,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
    ]);

    const reader = new MultiFormatReader();
    reader.setHints(hints);

    const luminanceSource = new RGBLuminanceSource(grayData, w, h);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));

    const result = reader.decode(binaryBitmap);

    return result.text;
  } catch (err) {
    logger.error("Barcode decode failed", { message: err.message, stack: err.stack });
    return null;
  }
};
