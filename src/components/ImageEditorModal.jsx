import { useEffect, useMemo, useState } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function buildCenteredCrop(mediaWidth, mediaHeight, aspectRatio) {
  if (!mediaWidth || !mediaHeight) return undefined;

  if (aspectRatio) {
    return centerCrop(
      makeAspectCrop(
        {
          unit: "%",
          width: 88
        },
        aspectRatio,
        mediaWidth,
        mediaHeight
      ),
      mediaWidth,
      mediaHeight
    );
  }

  return {
    unit: "%",
    x: 6,
    y: 6,
    width: 88,
    height: 88
  };
}

function aspectLabel(aspectRatio) {
  if (!aspectRatio) return "Libre";
  if (Math.abs(aspectRatio - 1) < 0.01) return "1:1";
  if (Math.abs(aspectRatio - 2) < 0.01) return "2:1";
  return `${aspectRatio.toFixed(2)}:1`;
}

function recommendationText(aspectRatio) {
  if (Math.abs((aspectRatio || 0) - 1) < 0.01) {
    return "Logo cuadrado. Deja aire alrededor del simbolo para que no se corte en la app.";
  }

  if (Math.abs((aspectRatio || 0) - 2) < 0.01) {
    return "Banner horizontal. Centra la informacion importante para que se vea bien en mobile.";
  }

  return "Recorte libre. Ajusta el encuadre solo si quieres mejorar la composicion.";
}

function ImageEditorModal({ editor, onCancel, onSave }) {
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!editor) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !saving) {
        onCancel();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editor, onCancel, saving]);

  const cropMeta = useMemo(
    () => ({
      aspectText: aspectLabel(editor?.aspectRatio),
      recommendation: recommendationText(editor?.aspectRatio)
    }),
    [editor?.aspectRatio]
  );

  if (!editor) return null;

  const handleImageLoad = (event) => {
    const { width, height } = event.currentTarget;
    const nextCrop = buildCenteredCrop(width, height, editor.aspectRatio);
    setCrop(nextCrop);
    setCompletedCrop(nextCrop);
  };

  const handleSave = async () => {
    if (!completedCrop?.width || !completedCrop?.height) return;
    setSaving(true);
    try {
      await onSave(completedCrop);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onCancel()}>
      <article
        className="modal image-editor-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="image-editor-title"
        aria-describedby="image-editor-description"
      >
        <header className="image-editor-header">
          <div>
            <h2 id="image-editor-title">{editor.title}</h2>
            <p id="image-editor-description" className="muted">
              Arrastra el recorte y ajusta sus bordes. Relacion: {cropMeta.aspectText}.
            </p>
          </div>
          <button type="button" className="button secondary image-editor-close" onClick={onCancel} disabled={saving}>
            Cerrar
          </button>
        </header>

        <div className="content image-editor-content">
          <div className="image-editor-frame-wrap">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(_, percentCrop) => setCompletedCrop(percentCrop)}
              aspect={editor.aspectRatio}
              keepSelection
              ruleOfThirds
              minWidth={editor.minWidth}
              minHeight={editor.minHeight}
              className="image-editor-crop"
            >
              <img
                className="image-editor-preview"
                src={editor.objectUrl}
                alt={editor.title}
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          </div>

          <div className="image-editor-panel">
            <div className="image-editor-tip">
              <strong>Recomendacion</strong>
              <p>{cropMeta.recommendation}</p>
            </div>
            <div className="image-editor-tip">
              <strong>Consejo</strong>
              <p>
                Usa una seleccion amplia si el contenido ya esta bien compuesto. Recorta mas cerrado
                solo cuando quieras destacar marca, local o producto.
              </p>
            </div>
          </div>
        </div>

        <div className="actions image-editor-actions">
          <button type="button" className="button secondary" onClick={onCancel} disabled={saving}>
            Cancelar
          </button>
          <button
            type="button"
            className="button"
            onClick={handleSave}
            disabled={saving || !completedCrop?.width || !completedCrop?.height}
          >
            {saving ? "Guardando..." : "Usar este encuadre"}
          </button>
        </div>
      </article>
    </div>
  );
}

export default ImageEditorModal;
