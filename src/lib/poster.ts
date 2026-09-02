/** Read an image file and return a compact JPEG data URL suitable for storage/sync. */
export async function fileToPoster(file: File, maxWidth = 480): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("Could not read that image"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, maxWidth / (img.naturalWidth || maxWidth));
  const w = Math.max(1, Math.round((img.naturalWidth || maxWidth) * scale));
  const h = Math.max(1, Math.round((img.naturalHeight || maxWidth) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.72);
}
