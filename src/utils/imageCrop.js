function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("No se pudo procesar la imagen."));
    image.src = url;
  });
}

function clampCropValue(value, max) {
  return Math.min(Math.max(0, value), Math.max(0, max));
}

function resolveSourceCrop(crop, image) {
  const naturalWidth = image.naturalWidth || image.width;
  const naturalHeight = image.naturalHeight || image.height;

  if (!crop?.width || !crop?.height || !naturalWidth || !naturalHeight) {
    return null;
  }

  if (crop.unit === "%") {
    const x = Math.round((crop.x / 100) * naturalWidth);
    const y = Math.round((crop.y / 100) * naturalHeight);
    const width = Math.round((crop.width / 100) * naturalWidth);
    const height = Math.round((crop.height / 100) * naturalHeight);

    return {
      x: clampCropValue(x, naturalWidth - 1),
      y: clampCropValue(y, naturalHeight - 1),
      width: Math.max(1, Math.min(width, naturalWidth - x)),
      height: Math.max(1, Math.min(height, naturalHeight - y))
    };
  }

  const renderedWidth = image.width || naturalWidth;
  const renderedHeight = image.height || naturalHeight;
  const scaleX = naturalWidth / renderedWidth;
  const scaleY = naturalHeight / renderedHeight;
  const x = Math.round(crop.x * scaleX);
  const y = Math.round(crop.y * scaleY);
  const width = Math.round(crop.width * scaleX);
  const height = Math.round(crop.height * scaleY);

  return {
    x: clampCropValue(x, naturalWidth - 1),
    y: clampCropValue(y, naturalHeight - 1),
    width: Math.max(1, Math.min(width, naturalWidth - x)),
    height: Math.max(1, Math.min(height, naturalHeight - y))
  };
}

export function createImageEditorSession(file, options = {}) {
  return {
    file,
    objectUrl: URL.createObjectURL(file),
    aspectRatio: options.aspectRatio,
    outputWidth: options.outputWidth,
    outputHeight: options.outputHeight,
    minWidth: options.minWidth,
    minHeight: options.minHeight
  };
}

export function revokeImageEditorSession(session) {
  if (session?.objectUrl) {
    URL.revokeObjectURL(session.objectUrl);
  }
}

export async function renderCroppedImage({
  file,
  objectUrl,
  crop,
  outputWidth,
  outputHeight
}) {
  if (!crop?.width || !crop?.height) {
    throw new Error("Selecciona un area valida antes de guardar.");
  }

  const image = await loadImage(objectUrl || URL.createObjectURL(file));
  const sourceCrop = resolveSourceCrop(crop, image);

  if (!sourceCrop) {
    throw new Error("No se pudo interpretar el area seleccionada.");
  }

  const sourceX = sourceCrop.x;
  const sourceY = sourceCrop.y;
  const sourceWidth = sourceCrop.width;
  const sourceHeight = sourceCrop.height;

  const hasExplicitOutput = Number(outputWidth) > 0 && Number(outputHeight) > 0;
  const exportWidth = hasExplicitOutput
    ? Math.round(outputWidth)
    : Math.max(1, Math.round(sourceWidth));
  const exportHeight = hasExplicitOutput
    ? Math.round(outputHeight)
    : Math.max(1, Math.round(sourceHeight));

  const canvas = document.createElement("canvas");
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo inicializar el editor de imagen.");
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    exportWidth,
    exportHeight
  );

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("No se pudo exportar la imagen editada."));
        return;
      }
      resolve(result);
    }, file.type || "image/jpeg", 0.92);
  });

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".jpg";
  const baseName = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;

  return new File([blob], `${baseName}-crop${extension}`, {
    type: blob.type || file.type,
    lastModified: Date.now()
  });
}
