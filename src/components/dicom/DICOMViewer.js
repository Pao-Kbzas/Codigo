// src/components/dicom/DICOMViewer.js
import React, { useState, useEffect, useRef } from 'react';

// Asumimos que Orthanc se usará para visualizar DICOM
const DICOMViewer = ({ studyId, orthancUrl = 'http://localhost:8042' }) => {
  const [loading, setLoading] = useState(true);
  const iframeRef = useRef(null);

  useEffect(() => {
    // Si no hay studyId, no hacemos nada
    if (!studyId) {
      setLoading(false);
      return;
    }

    // Configurar el visor cuando el componente se monte
    const setupViewer = () => {
      setLoading(false);
    };

    setupViewer();
  }, [studyId, orthancUrl]);

  // URL para Stone Viewer de Orthanc (ajustar según sea necesario)
  const viewerUrl = studyId 
    ? `${orthancUrl}/stone-webviewer/app/viewer.html?study=${studyId}` 
    : '';

  return (
    <div className="dicom-viewer-container">
      {loading ? (
        <div className="loading">Cargando visor DICOM...</div>
      ) : (
        <>
          {studyId ? (
            <iframe
              ref={iframeRef}
              src={viewerUrl}
              title="DICOM Viewer"
              width="100%"
              height="600px"
              style={{ border: 'none' }}
            />
          ) : (
            <div className="no-study-selected">
              No hay estudio seleccionado para visualizar
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DICOMViewer;