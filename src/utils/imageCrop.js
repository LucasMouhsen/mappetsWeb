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

function buildCanvas({ image, exportWidth, exportHeight, sourceCrop = null, backgroundColor = null }) {
  const canvas = document.createElement("canvas");
  canvas.width = exportWidth;
  canvas.height = exportHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("No se pudo inicializar el editor de imagen.");
  }

  if (backgroundColor) {
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, exportWidth, exportHeight);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  if (sourceCrop) {
    context.drawImage(
      image,
      sourceCrop.x,
      sourceCrop.y,
      sourceCrop.width,
      sourceCrop.height,
      0,
      0,
      exportWidth,
      exportHeight
    );
    return canvas;
  }

  context.drawImage(image, 0, 0, exportWidth, exportHeight);
  return canvas;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((result) => {
      if (!result) {
        reject(new Error("No se pudo exportar la imagen editada."));
        return;
      }
      resolve(result);
    }, type, quality);
  });
}

function getFileExtension(file, fallback = ".jpg") {
  return file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : fallback;
}

function getFileBaseName(file) {
  return file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
}

function getExtensionForType(type, fallbackExtension = ".jpg") {
  switch (type) {
    case "image/jpeg":
      return ".jpg";
    case "image/png":
      return ".png";
    case "image/webp":
      return ".webp";
    default:
      return fallbackExtension;
  }
}

async function exportCanvasAsFile({
  canvas,
  file,
  outputType,
  quality = 0.9,
  minQuality = 0.6,
  maxBytes,
  suffix = "optimized"
}) {
  let exportType = outputType || file.type || "image/jpeg";
  let currentQuality = quality;
  let backgroundColor = exportType === "image/jpeg" ? "#ffffff" : null;
  let workingCanvas = canvas;

  if (backgroundColor) {
    workingCanvas = buildCanvas({
      image: canvas,
      exportWidth: canvas.width,
      exportHeight: canvas.height,
      backgroundColor
    });
  }

  let blob = await canvasToBlob(workingCanvas, exportType, currentQuality);

  if (maxBytes && blob.size > maxBytes && exportType === "image/png") {
    exportType = "image/jpeg";
    currentQuality = Math.min(0.82, quality);
    backgroundColor = "#ffffff";
    workingCanvas = buildCanvas({
      image: canvas,
      exportWidth: canvas.width,
      exportHeight: canvas.height,
      backgroundColor
    });
    blob = await canvasToBlob(workingCanvas, exportType, currentQuality);
  }

  while (maxBytes && blob.size > maxBytes && exportType !== "image/png" && currentQuality > minQuality) {
    const nextQuality = Math.max(minQuality, Number((currentQuality - 0.08).toFixed(2)));
    if (nextQuality === currentQuality) break;
    currentQuality = nextQuality;
    blob = await canvasToBlob(workingCanvas, exportType, currentQuality);
  }

  const fallbackExtension = getFileExtension(file);
  const extension = getExtensionForType(blob.type || exportType, fallbackExtension);
  const baseName = getFileBaseName(file);

  return new File([blob], `${baseName}-${suffix}${extension}`, {
    type: blob.type || exportType,
    lastModified: Date.now()
  });
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

export async function optimizeImageFile(file, options = {}) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const naturalWidth = image.naturalWidth || image.width;
    const naturalHeight = image.naturalHeight || image.height;
    const widthRatio = options.maxWidth ? options.maxWidth / naturalWidth : 1;
    const heightRatio = options.maxHeight ? options.maxHeight / naturalHeight : 1;
    const scale = Math.min(1, widthRatio, heightRatio);
    const exportWidth = Math.max(1, Math.round(naturalWidth * scale));
    const exportHeight = Math.max(1, Math.round(naturalHeight * scale));
    const canvas = buildCanvas({
      image,
      exportWidth,
      exportHeight,
      backgroundColor: options.outputType === "image/jpeg" ? "#ffffff" : null
    });

    const optimizedFile = await exportCanvasAsFile({
      canvas,
      file,
      outputType: options.outputType,
      quality: options.quality,
      minQuality: options.minQuality,
      maxBytes: options.maxBytes,
      suffix: options.suffix || "optimized"
    });

    if (!options.maxBytes && optimizedFile.size >= file.size) {
      return file;
    }

    if (options.maxBytes && file.size <= options.maxBytes && optimizedFile.size >= file.size) {
      return file;
    }

    return optimizedFile;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function renderCroppedImage({
  file,
  objectUrl,
  crop,
  outputWidth,
  outputHeight,
  outputType,
  quality,
  maxBytes
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

  const canvas = buildCanvas({
    image,
    exportWidth,
    exportHeight,
    sourceCrop,
    backgroundColor: outputType === "image/jpeg" ? "#ffffff" : null
  });

  return exportCanvasAsFile({
    canvas,
    file,
    outputType,
    quality: quality ?? 0.88,
    minQuality: 0.58,
    maxBytes,
    suffix: "crop"
  });
}
