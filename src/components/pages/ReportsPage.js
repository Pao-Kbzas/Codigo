// src/components/pages/ReportsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { getStudyById } from '../../services/study-service';
import { getStudyReport, addStudyReport } from '../../services/study-service';
import { getPatientById } from '../../services/patient-service';

const ReportsPage = ({ isNew = false }) => {
  const [report, setReport] = useState(null);
  const [study, setStudy] = useState(null);
  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [formData, setFormData] = useState({
    findings: '',
    impression: '',
    recommendation: '',
    physicianName: '',
    additionalNotes: ''
  });
  
  const { reportId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Obtener studyId de los parámetros de la URL si es un nuevo informe
  useEffect(() => {
    if (isNew) {
      const params = new URLSearchParams(location.search);
      const studyId = params.get('studyId');
      
      if (studyId) {
        loadStudyData(studyId);
      }
    } else if (reportId) {
      loadReportData();
    }
  }, [isNew, reportId, location]);
  
  // Cargar datos del informe
  const loadReportData = async () => {
    try {
      setIsLoading(true);
      
      // En un caso real, necesitarías un servicio específico para obtener informes por ID.
      // Aquí estamos simulando esto obteniendo primero el estudio relacionado.
      const report = await getStudyReport(reportId);
      setReport(report);
      
      if (report) {
        // Cargar datos del estudio asociado
        await loadStudyData(report.studyId);
        
        // Preparar datos del formulario
        setFormData({
          findings: report.findings || '',
          impression: report.impression || '',
          recommendation: report.recommendation || '',
          physicianName: report.physicianName || '',
          additionalNotes: report.additionalNotes || ''
        });
      }
    } catch (error) {
      console.error('Error al cargar informe:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar datos del estudio
  const loadStudyData = async (studyId) => {
    try {
      setIsLoading(true);
      
      const studyData = await getStudyById(studyId);
      setStudy(studyData);
      
      // Cargar datos del paciente
      if (studyData && studyData.patientId) {
        await loadPatientData(studyData.patientId);
      }
    } catch (error) {
      console.error('Error al cargar estudio:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar datos del paciente
  const loadPatientData = async (patientId) => {
    try {
      const patientData = await getPatientById(patientId);
      setPatient(patientData);
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
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
  
  // Guardar informe
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!study) return;
    
    setIsLoading(true);
    
    try {
      if (isNew) {
        // Crear nuevo informe
        const newReportId = await addStudyReport(study.id, {
          ...formData,
          studyId: study.id
        });
        
        navigate(`/reports/${newReportId}`);
      } else {
        // Actualizar informe existente (simulado, ya que no tenemos el servicio específico)
        // En un caso real, necesitarías un método updateStudyReport
        
        // Recargar datos actualizados
        await loadReportData();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error al guardar informe:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="reports-page">
      <header>
        <h1>{isNew ? 'Nuevo Informe' : 'Informe Médico'}</h1>
        
        {/* Botones de acción */}
        {!isNew && !isEditing && (
          <div className="action-buttons">
            <button onClick={() => setIsEditing(true)}>Editar</button>
            <button onClick={() => navigate(-1)}>Volver</button>
            <button onClick={() => window.print()}>Imprimir</button>
          </div>
        )}
      </header>
      
      {isLoading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <>
          {/* Información del paciente y estudio */}
          {patient && study && (
            <div className="report-header-info">
              <div className="patient-info">
                <h2>Paciente</h2>
                <p><strong>Nombre:</strong> {patient.fullName}</p>
                <p><strong>ID:</strong> {patient.medicalRecordNumber || patient.documentNumber}</p>
                {patient.birthDate && (
                  <p>
                    <strong>Edad:</strong> {
                      Math.floor((new Date() - new Date(patient.birthDate)) / (365.25 * 24 * 60 * 60 * 1000))
                    } años
                  </p>
                )}
              </div>
              
              <div className="study-info">
                <h2>Estudio</h2>
                <p><strong>Tipo:</strong> {study.studyDescription}</p>
                <p><strong>Modalidad:</strong> {study.modality}</p>
                <p>
                  <strong>Fecha:</strong> {
                    study.completedDate 
                      ? new Date(study.completedDate).toLocaleDateString() 
                      : new Date(study.createdAt).toLocaleDateString()
                  }
                </p>
              </div>
            </div>
          )}
          
          {/* Formulario del informe (solo en modo edición) */}
          {(isNew || isEditing) && (
            <form onSubmit={handleSubmit} className="report-form">
              <div className="form-group">
                <label htmlFor="findings">Hallazgos</label>
                <textarea
                  id="findings"
                  name="findings"
                  value={formData.findings}
                  onChange={handleChange}
                  rows="6"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="impression">Impresión Diagnóstica</label>
                <textarea
                  id="impression"
                  name="impression"
                  value={formData.impression}
                  onChange={handleChange}
                  rows="4"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="recommendation">Recomendaciones</label>
                <textarea
                  id="recommendation"
                  name="recommendation"
                  value={formData.recommendation}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="physicianName">Médico Informante</label>
                <input
                  type="text"
                  id="physicianName"
                  name="physicianName"
                  value={formData.physicianName}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="additionalNotes">Notas Adicionales</label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows="3"
                />
              </div>
              
              <div className="form-actions">
                <button type="submit" disabled={isLoading}>
                  {isNew ? 'Crear Informe' : 'Guardar Cambios'}
                </button>
                <button type="button" onClick={() => isNew ? navigate(-1) : setIsEditing(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
          
          {/* Vista del informe (solo en modo visualización) */}
          {!isNew && !isEditing && report && (
            <div className="report-content">
              <div className="report-section">
                <h3>HALLAZGOS</h3>
                <div className="report-text">{report.findings}</div>
              </div>
              
              <div className="report-section">
                <h3>IMPRESIÓN DIAGNÓSTICA</h3>
                <div className="report-text">{report.impression}</div>
              </div>
              
              {report.recommendation && (
                <div className="report-section">
                  <h3>RECOMENDACIONES</h3>
                  <div className="report-text">{report.recommendation}</div>
                </div>
              )}
              
              {report.additionalNotes && (
                <div className="report-section">
                  <h3>NOTAS ADICIONALES</h3>
                  <div className="report-text">{report.additionalNotes}</div>
                </div>
              )}
              
              <div className="report-footer">
                <div className="report-date">
                  Fecha del Informe: {new Date(report.createdAt).toLocaleDateString()}
                </div>
                
                <div className="report-physician">
                  {report.physicianName}
                  <div className="physician-title">Médico Informante</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsPage;