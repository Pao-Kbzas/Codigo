// src/components/pages/StudiesPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getStudyById, getPatientStudies, createStudy, updateStudy } from '../../services/study-service';
import { getPatientById } from '../../services/patient-service';
import DICOMViewer from '../dicom/DICOMViewer';

const StudiesPage = ({ isNew = false }) => {
  const [study, setStudy] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState({
    patientId: '',
    studyDescription: '',
    modality: '',
    scheduledDate: new Date().toISOString().split('T')[0],
    status: 'scheduled',
    priority: 'normal',
    referringPhysician: '',
    notes: ''
  });
  
  const { studyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener patientId de los parámetros de la URL si es una nueva creación
  useEffect(() => {
    if (isNew) {
      const params = new URLSearchParams(location.search);
      const patientId = params.get('patientId');
      
      if (patientId) {
        setFormData(prev => ({ ...prev, patientId }));
        loadPatientData(patientId);
      }
    }
  }, [isNew, location]);
  
  // Cargar datos del estudio si no es nuevo
  useEffect(() => {
    if (!isNew && studyId) {
      loadStudyData(studyId);
    }
  }, [isNew, studyId]);
  
  // Cargar datos del paciente
  const loadPatientData = async (patientId) => {
    try {
      setIsLoading(true);
      const patientData = await getPatientById(patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar datos del estudio
  const loadStudyData = async (id) => {
    try {
      setIsLoading(true);
      const studyData = await getStudyById(id);
      setStudy(studyData);
      
      // Preparar datos del formulario
      setFormData({
        patientId: studyData.patientId,
        studyDescription: studyData.studyDescription || '',
        modality: studyData.modality || '',
        scheduledDate: studyData.scheduledDate ? new Date(studyData.scheduledDate).toISOString().split('T')[0] : '',
        status: studyData.status || 'scheduled',
        priority: studyData.priority || 'normal',
        referringPhysician: studyData.referringPhysician || '',
        notes: studyData.notes || ''
      });
      
      // Cargar datos del paciente
      await loadPatientData(studyData.patientId);
    } catch (error) {
      console.error('Error al cargar estudio:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar estudio
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isNew) {
        // Crear nuevo estudio
        const newStudyId = await createStudy(formData);
        navigate(`/studies/${newStudyId}`);
      } else {
        // Actualizar estudio existente
        await updateStudy(studyId, formData);
        
        // Recargar datos actualizados
        await loadStudyData(studyId);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error al guardar estudio:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="studies-page">
      <header>
        <h1>{isNew ? 'Nuevo Estudio' : 'Detalles del Estudio'}</h1>
        
        {/* Botones de acción */}
        {!isNew && !isEditing && (
          <div className="action-buttons">
            <button onClick={() => setIsEditing(true)}>Editar</button>
            <button onClick={() => navigate(-1)}>Volver</button>
          </div>
        )}
      </header>
      
      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          {/* Información del paciente */}
          {patient && (
            <div className="patient-info-card">
              <h2>Paciente</h2>
              <p><strong>Nombre:</strong> {patient.fullName}</p>
              <p><strong>ID:</strong> {patient.id}</p>
              {patient.birthDate && (
                <p>
                  <strong>Edad:</strong> {
                    Math.floor((new Date() - new Date(patient.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))
                  } años
                </p>
              )}
              <p><strong>Género:</strong> {patient.gender || 'No especificado'}</p>
            </div>
          )}
          
          {/* Formulario de estudio (solo en modo edición) */}
          {(isNew || isEditing) && (
            <form onSubmit={handleSubmit} className="study-form">
              <div className="form-group">
                <label htmlFor="studyDescription">Descripción</label>
                <input
                  type="text"
                  id="studyDescription"
                  name="studyDescription"
                  value={formData.studyDescription}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="modality">Modalidad</label>
                <select
                  id="modality"
                  name="modality"
                  value={formData.modality}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar modalidad</option>
                  <option value="CR">Radiografía Computarizada (CR)</option>
                  <option value="CT">Tomografía Computarizada (CT)</option>
                  <option value="MR">Resonancia Magnética (MR)</option>
                  <option value="US">Ultrasonido (US)</option>
                  <option value="XA">Angiografía (XA)</option>
                  <option value="MG">Mamografía (MG)</option>
                  <option value="DX">Radiografía Digital (DX)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="scheduledDate">Fecha Programada</label>
                <input
                  type="date"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="status">Estado</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                >
                  <option value="scheduled">Programado</option>
                  <option value="in-progress">En Progreso</option>
                  <option value="completed">Completado</option>
                  <option value="reported">Informado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="priority">Prioridad</label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgente</option>
                  <option value="stat">STAT (Inmediato)</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="referringPhysician">Médico Referente</label>
                <input
                  type="text"
                  id="referringPhysician"
                  name="referringPhysician"
                  value={formData.referringPhysician}
                  onChange={handleChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="notes">Notas</label>
                <textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isNew ? 'Crear Estudio' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={() => isNew ? navigate(-1) : setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
          
          {/* Vista de detalles (solo en modo visualización) */}
          {!isNew && !isEditing && study && (
            <div className="study-details">
              <div className="study-info">
                <h2>{study.studyDescription}</h2>
                
                <div className="info-grid">
                  <div className="info-item">
                    <span>Modalidad:</span>
                    <strong>{study.modality}</strong>
                  </div>
                  
                  <div className="info-item">
                    <span>Estado:</span>
                    <strong className={`status-${study.status}`}>{study.status}</strong>
                  </div>
                  
                  <div className="info-item">
                    <span>Fecha Programada:</span>
                    <strong>
                      {study.scheduledDate ? new Date(study.scheduledDate).toLocaleDateString() : 'No especificada'}
                    </strong>
                  </div>
                  
                  <div className="info-item">
                    <span>Fecha Realización:</span>
                    <strong>
                      {study.completedDate ? new Date(study.completedDate).toLocaleDateString() : 'Pendiente'}
                    </strong>
                  </div>
                  
                  <div className="info-item">
                    <span>Prioridad:</span>
                    <strong className={`priority-${study.priority}`}>{study.priority}</strong>
                  </div>
                  
                  <div className="info-item">
                    <span>Médico Referente:</span>
                    <strong>{study.referringPhysician || 'No especificado'}</strong>
                  </div>
                </div>
                
                {study.notes && (
                  <div className="study-notes">
                    <h3>Notas:</h3>
                    <p>{study.notes}</p>
                  </div>
                )}
              </div>
              
              {/* Visor DICOM si hay imágenes */}
              {study.instances && study.instances.length > 0 && (
                <div className="study-viewer">
                  <h3>Imágenes</h3>
                  <DICOMViewer instanceId={study.instances[0].id} />
                </div>
              )}
              
              {/* Sección de informes */}
              <div className="study-reports">
                <h3>Informes</h3>
                
                {study.reportId ? (
                  <button onClick={() => navigate(`/reports/${study.reportId}`)}>
                    Ver Informe
                  </button>
                ) : (
                  <button onClick={() => navigate(`/reports/new?studyId=${study.id}`)}>
                    Crear Informe
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudiesPage;