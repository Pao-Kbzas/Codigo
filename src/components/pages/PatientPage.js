// src/components/pages/PatientPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getPatientById,
  createPatient,
  updatePatient,
  getPatientMedicalHistory,
  addMedicalHistoryEntry
} from '../../services/patient-service';
import { getPatientStudies } from '../../services/study-service';

const PatientPage = ({ isNew = false }) => {
  const [patient, setPatient] = useState(null);
  const [studies, setStudies] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(isNew);
  const [activeTab, setActiveTab] = useState('info');
  const [formData, setFormData] = useState({
    fullName: '',
    documentNumber: '',
    birthDate: '',
    gender: '',
    phone: '',
    email: '',
    address: '',
    medicalRecordNumber: '',
    allergies: '',
    notes: ''
  });
  const [historyEntry, setHistoryEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    title: '',
    description: '',
    type: 'general',
    doctorName: ''
  });
  
  const { patientId } = useParams();
  const navigate = useNavigate();
  
  // Cargar datos del paciente si no es nuevo
  useEffect(() => {
    if (!isNew && patientId) {
      loadPatientData();
    }
  }, [isNew, patientId]);
  
  // Cargar datos del paciente
  const loadPatientData = async () => {
    try {
      setIsLoading(true);
      
      // Obtener datos del paciente
      const patientData = await getPatientById(patientId);
      setPatient(patientData);
      
      // Preparar datos del formulario
      setFormData({
        fullName: patientData.fullName || '',
        documentNumber: patientData.documentNumber || '',
        birthDate: patientData.birthDate ? new Date(patientData.birthDate).toISOString().split('T')[0] : '',
        gender: patientData.gender || '',
        phone: patientData.phone || '',
        email: patientData.email || '',
        address: patientData.address || '',
        medicalRecordNumber: patientData.medicalRecordNumber || '',
        allergies: patientData.allergies || '',
        notes: patientData.notes || ''
      });
      
      // Cargar estudios si está en la pestaña de estudios
      if (activeTab === 'studies') {
        loadStudies();
      }
      
      // Cargar historial médico si está en la pestaña de historial
      if (activeTab === 'history') {
        loadMedicalHistory();
      }
    } catch (error) {
      console.error('Error al cargar datos del paciente:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar estudios del paciente
  const loadStudies = async () => {
    if (!patientId) return;
    
    try {
      setIsLoading(true);
      const studiesData = await getPatientStudies(patientId);
      setStudies(studiesData);
    } catch (error) {
      console.error('Error al cargar estudios:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Cargar historial médico
  const loadMedicalHistory = async () => {
    if (!patientId) return;
    
    try {
      setIsLoading(true);
      const historyData = await getPatientMedicalHistory(patientId);
      setMedicalHistory(historyData);
    } catch (error) {
      console.error('Error al cargar historial médico:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Manejar cambio de pestaña
  useEffect(() => {
    if (patientId) {
      if (activeTab === 'studies') {
        loadStudies();
      } else if (activeTab === 'history') {
        loadMedicalHistory();
      }
    }
  }, [activeTab, patientId]);
  
  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Manejar cambios en el formulario de historial
  const handleHistoryChange = (e) => {
    const { name, value } = e.target;
    setHistoryEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Guardar paciente
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (isNew) {
        // Crear nuevo paciente
        const newPatientId = await createPatient({
          ...formData,
          // Asegurarse de que el nombre en minúsculas esté disponible para búsqueda
          nameLowercase: formData.fullName.toLowerCase()
        });
        navigate(`/patients/${newPatientId}`);
      } else {
        // Actualizar paciente existente
        await updatePatient(patientId, formData);
        
        // Recargar datos actualizados
        await loadPatientData();
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Agregar entrada al historial médico
  const handleAddHistoryEntry = async (e) => {
    e.preventDefault();
    
    if (!patientId) return;
    
    try {
      setIsLoading(true);
      
      await addMedicalHistoryEntry({
        ...historyEntry,
        patientId
      });
      
      // Limpiar formulario
      setHistoryEntry({
        date: new Date().toISOString().split('T')[0],
        title: '',
        description: '',
        type: 'general',
        doctorName: ''
      });
      
      // Recargar historial
      await loadMedicalHistory();
    } catch (error) {
      console.error('Error al agregar entrada al historial:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="patient-page">
      <header>
        <h1>{isNew ? 'Nuevo Paciente' : patient?.fullName || 'Detalles del Paciente'}</h1>
        
        {/* Botones de acción */}
        {!isNew && !isEditing && (
          <div className="action-buttons">
            <button onClick={() => setIsEditing(true)}>Editar</button>
            <button onClick={() => navigate(-1)}>Volver</button>
          </div>
        )}
      </header>
      
      {isLoading && <div className="loading">Cargando...</div>}
      
      {/* Pestañas de navegación */}
      {!isNew && !isEditing && (
        <div className="tabs">
          <button 
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            Información
          </button>
          <button 
            className={activeTab === 'studies' ? 'active' : ''}
            onClick={() => setActiveTab('studies')}
          >
            Estudios
          </button>
          <button 
            className={activeTab === 'history' ? 'active' : ''}
            onClick={() => setActiveTab('history')}
          >
            Historial Médico
          </button>
        </div>
      )}
      
      {/* Formulario de paciente (solo en modo edición) */}
      {(isNew || isEditing) && (
        <form onSubmit={handleSubmit} className="patient-form">
          <div className="form-group">
            <label htmlFor="fullName">Nombre Completo</label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="documentNumber">Número de Documento</label>
            <input
              type="text"
              id="documentNumber"
              name="documentNumber"
              value={formData.documentNumber}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="birthDate">Fecha de Nacimiento</label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="gender">Género</label>
            <select
              id="gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="">Seleccionar</option>
              <option value="male">Masculino</option>
              <option value="female">Femenino</option>
              <option value="other">Otro</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Teléfono</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="address">Dirección</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="medicalRecordNumber">Número de Historia Clínica</label>
            <input
              type="text"
              id="medicalRecordNumber"
              name="medicalRecordNumber"
              value={formData.medicalRecordNumber}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="allergies">Alergias</label>
            <textarea
              id="allergies"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notas</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={isLoading}>
              {isNew ? 'Crear Paciente' : 'Guardar Cambios'}
            </button>
            <button type="button" onClick={() => isNew ? navigate(-1) : setIsEditing(false)}>
              Cancelar
            </button>
          </div>
        </form>
      )}
      
      {/* Vista de detalles (solo en modo visualización) */}
      {!isNew && !isEditing && (
        <div className="patient-details">
          {activeTab === 'info' && patient && (
            <div className="patient-info">
              <div className="info-grid">
                <div className="info-item">
                  <span>Documento:</span>
                  <strong>{patient.documentNumber}</strong>
                </div>
                
                <div className="info-item">
                  <span>Historia Clínica:</span>
                  <strong>{patient.medicalRecordNumber || 'No asignado'}</strong>
                </div>
                
                <div className="info-item">
                  <span>Fecha de Nacimiento:</span>
                  <strong>
                    {patient.birthDate ? new Date(patient.birthDate).toLocaleDateString() : 'No especificada'}
                  </strong>
                </div>
                
                <div className="info-item">
                  <span>Edad:</span>
                  <strong>
                    {patient.birthDate 
                      ? Math.floor((new Date() - new Date(patient.birthDate)) / (365.25 * 24 * 60 * 60 * 1000)) 
                      : 'No disponible'}
                  </strong>
                </div>
                
                <div className="info-item">
                  <span>Género:</span>
                  <strong>{patient.gender || 'No especificado'}</strong>
                </div>
                
                <div className="info-item">
                  <span>Teléfono:</span>
                  <strong>{patient.phone || 'No especificado'}</strong>
                </div>
                
                <div className="info-item">
                  <span>Email:</span>
                  <strong>{patient.email || 'No especificado'}</strong>
                </div>
                
                <div className="info-item">
                  <span>Dirección:</span>
                  <strong>{patient.address || 'No especificada'}</strong>
                </div>
              </div>
              
              {patient.allergies && (
                <div className="allergies-section">
                  <h3>Alergias:</h3>
                  <p>{patient.allergies}</p>
                </div>
              )}
              
              {patient.notes && (
                <div className="notes-section">
                  <h3>Notas:</h3>
                  <p>{patient.notes}</p>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'studies' && (
            <div className="patient-studies">
              <div className="section-header">
                <h2>Estudios</h2>
                <button onClick={() => navigate(`/studies/new?patientId=${patientId}`)}>
                  Nuevo Estudio
                </button>
              </div>
              
              {studies.length === 0 ? (
                <p className="no-data">No hay estudios disponibles para este paciente.</p>
              ) : (
                <div className="studies-list">
                  {studies.map(study => (
                    <div 
                      key={study.id} 
                      className={`study-card status-${study.status}`}
                      onClick={() => navigate(`/studies/${study.id}`)}
                    >
                      <div className="study-date">
                        {new Date(study.createdAt).toLocaleDateString()}
                      </div>
                      <div className="study-description">
                        {study.studyDescription || 'Sin descripción'}
                      </div>
                      <div className="study-modality">
                        {study.modality}
                      </div>
                      <div className="study-status">
                        {study.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'history' && (
            <div className="medical-history">
              <div className="section-header">
                <h2>Historial Médico</h2>
              </div>
              
              <form onSubmit={handleAddHistoryEntry} className="history-form">
                <h3>Agregar Entrada</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="date">Fecha</label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={historyEntry.date}
                      onChange={handleHistoryChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="type">Tipo</label>
                    <select
                      id="type"
                      name="type"
                      value={historyEntry.type}
                      onChange={handleHistoryChange}
                      required
                    >
                      <option value="general">General</option>
                      <option value="consultation">Consulta</option>
                      <option value="treatment">Tratamiento</option>
                      <option value="surgery">Cirugía</option>
                      <option value="medication">Medicación</option>
                      <option value="allergy">Alergia</option>
                      <option value="lab">Laboratorio</option>
                      <option value="imaging">Imagen</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="title">Título</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={historyEntry.title}
                    onChange={handleHistoryChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Descripción</label>
                  <textarea
                    id="description"
                    name="description"
                    value={historyEntry.description}
                    onChange={handleHistoryChange}
                    rows="4"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="doctorName">Médico</label>
                  <input
                    type="text"
                    id="doctorName"
                    name="doctorName"
                    value={historyEntry.doctorName}
                    onChange={handleHistoryChange}
                  />
                </div>
                
                <div className="form-actions">
                  <button type="submit" disabled={isLoading}>
                    Agregar Entrada
                  </button>
                </div>
              </form>
              
              <div className="history-entries">
                <h3>Entradas</h3>
                
                {medicalHistory.length === 0 ? (
                  <p className="no-data">No hay entradas en el historial médico.</p>
                ) : (
                  <div className="entries-list">
                    {medicalHistory.map(entry => (
                      <div key={entry.id} className={`history-entry type-${entry.type}`}>
                        <div className="entry-header">
                          <span className="entry-date">
                            {new Date(entry.date).toLocaleDateString()}
                          </span>
                          <span className="entry-type">{entry.type}</span>
                        </div>
                        <h4 className="entry-title">{entry.title}</h4>
                        <p className="entry-description">{entry.description}</p>
                        {entry.doctorName && (
                          <div className="entry-doctor">
                            <strong>Médico:</strong> {entry.doctorName}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PatientPage;