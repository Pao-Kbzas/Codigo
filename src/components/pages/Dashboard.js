// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AppointmentCalendar from '../AppointmentCalendar';
import DICOMViewer from '../components/dicom/DICOMViewer';
import { getDoctorAppointments } from '../components/services/appointment-service';
import { getPatientStudies } from '../services/study-service';
import { syncOrdersFromRIS } from '../services/ris-integration';
import { queryStudiesByPatientId, importStudyFromPACS } from '../services/pacs-integration';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedStudy, setSelectedStudy] = useState(null);
  const [selectedDicomInstance, setSelectedDicomInstance] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [studies, setStudies] = useState([]);
  const [pacsStudies, setPacsStudies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  
  const navigate = useNavigate();
  const { doctorId } = useParams();
  
  // Cargar citas al cambiar de doctor o fecha
  useEffect(() => {
    if (!doctorId) return;
    
    const loadAppointments = async () => {
      setIsLoading(true);
      try {
        // Obtener rango de fechas (inicio y fin del mes)
        const startDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        const endDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
        
        const data = await getDoctorAppointments(doctorId, startDate, endDate);
        setAppointments(data);
      } catch (error) {
        console.error('Error al cargar citas:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAppointments();
  }, [doctorId, selectedDate]);
  
  // Cargar estudios cuando se selecciona un paciente
  useEffect(() => {
    if (!selectedPatient) {
      setStudies([]);
      setPacsStudies([]);
      return;
    }
    
    const loadStudies = async () => {
      setIsLoading(true);
      try {
        // Cargar estudios de nuestro sistema
        const localStudies = await getPatientStudies(selectedPatient.id);
        setStudies(localStudies);
        
        // Intentar cargar estudios del PACS si el paciente tiene MRN
        if (selectedPatient.risMrn) {
          try {
            const pacsData = await queryStudiesByPatientId(selectedPatient.risMrn);
            setPacsStudies(pacsData);
          } catch (pacsError) {
            console.warn('Error al cargar estudios del PACS:', pacsError);
            // No interrumpimos el flujo principal por error en PACS
          }
        }
      } catch (error) {
        console.error('Error al cargar estudios:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStudies();
  }, [selectedPatient]);
  
  // Función para sincronizar con RIS
  const handleSyncWithRIS = async () => {
    setSyncStatus({ status: 'syncing', message: 'Sincronizando con RIS...' });
    try {
      const result = await syncOrdersFromRIS();
      setSyncStatus({ 
        status: 'success', 
        message: `Sincronización exitosa. Procesados: ${result.processed}, Creados: ${result.created}, Actualizados: ${result.updated}, Fallidos: ${result.failed}`
      });
      
      // Recargar datos si es necesario
      if (result.created > 0 || result.updated > 0) {
        // Recargar citas o estudios según sea necesario
      }
    } catch (error) {
      setSyncStatus({ status: 'error', message: `Error en sincronización: ${error.message}` });
    }
    
    // Limpiar mensaje después de unos segundos
    setTimeout(() => {
      setSyncStatus(null);
    }, 5000);
  };
  
  // Función para importar estudio desde PACS
  const handleImportFromPACS = async (studyInstanceUID) => {
    if (!selectedPatient) return;
    
    setIsLoading(true);
    try {
      await importStudyFromPACS(studyInstanceUID, selectedPatient.id);
      
      // Recargar estudios locales
      const localStudies = await getPatientStudies(selectedPatient.id);
      setStudies(localStudies);
      
      // Actualizar lista de estudios PACS para marcar el importado
      setPacsStudies(prevStudies => 
        prevStudies.map(study => 
          study.studyInstanceUID === studyInstanceUID 
            ? { ...study, importedToLocal: true } 
            : study
        )
      );
    } catch (error) {
      console.error('Error al importar estudio del PACS:', error);
      alert(`Error al importar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para seleccionar paciente desde cita
  const handleSelectAppointment = (appointment) => {
    setSelectedPatient({
      id: appointment.patientId,
      name: appointment.patientName,
      risMrn: appointment.patientMrn
    });
  };
  
  // Función para seleccionar estudio
  const handleSelectStudy = (study) => {
    setSelectedStudy(study);
    setActiveTab('viewer');
    
    // Cargar primera instancia si existe
    if (study.instances && study.instances.length > 0) {
      setSelectedDicomInstance(study.instances[0].id);
    }
  };
  
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Panel de Control - Sistema RIS/PACS</h1>
        
        <div className="tab-navigation">
          <button 
            className={activeTab === 'calendar' ? 'active' : ''} 
            onClick={() => setActiveTab('calendar')}
          >
            Calendario
          </button>
          <button 
            className={activeTab === 'patients' ? 'active' : ''} 
            onClick={() => setActiveTab('patients')}
          >
            Pacientes
          </button>
          <button 
            className={activeTab === 'studies' ? 'active' : ''} 
            onClick={() => setActiveTab('studies')}
            disabled={!selectedPatient}
          >
            Estudios
          </button>
          <button 
            className={activeTab === 'viewer' ? 'active' : ''} 
            onClick={() => setActiveTab('viewer')}
            disabled={!selectedStudy}
          >
            Visor DICOM
          </button>
        </div>
        
        <div className="sync-controls">
          <button 
            className="sync-button" 
            onClick={handleSyncWithRIS}
            disabled={isLoading}
          >
            Sincronizar con RIS
          </button>
          
          {syncStatus && (
            <div className={`sync-status ${syncStatus.status}`}>
              {syncStatus.message}
            </div>
          )}
        </div>
      </header>
      
      <main className="dashboard-content">
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Cargando datos...</p>
          </div>
        )}
        
        {activeTab === 'calendar' && (
          <div className="calendar-container">
            <AppointmentCalendar 
              doctorId={doctorId} 
              onSelectAppointment={handleSelectAppointment}
            />
          </div>
        )}
        
        {activeTab === 'patients' && (
          <div className="patients-container">
            <h2>Pacientes</h2>
            {/* Lista de pacientes o formulario de búsqueda */}
            <button onClick={() => navigate('/patients/new')}>
              Nuevo Paciente
            </button>
            
            <div className="appointments-list">
              <h3>Citas del Día</h3>
              {appointments
                .filter(apt => {
                  const today = new Date();
                  const aptDate = new Date(apt.date);
                  return (
                    aptDate.getDate() === today.getDate() &&
                    aptDate.getMonth() === today.getMonth() &&
                    aptDate.getFullYear() === today.getFullYear()
                  );
                })
                .map(appointment => (
                  <div 
                    key={appointment.id} 
                    className="appointment-card"
                    onClick={() => handleSelectAppointment(appointment)}
                  >
                    <div className="appointment-time">
                      {new Date(appointment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="appointment-patient">
                      {appointment.patientName}
                    </div>
                    <div className="appointment-type">
                      {appointment.studyType || 'Consulta General'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {activeTab === 'studies' && selectedPatient && (
          <div className="studies-container">
            <div className="patient-header">
              <h2>Estudios de {selectedPatient.name}</h2>
              <button onClick={() => navigate(`/studies/new?patientId=${selectedPatient.id}`)}>
                Nuevo Estudio
              </button>
            </div>
            
            <div className="studies-section">
              <h3>Estudios Locales</h3>
              <div className="studies-list">
                {studies.length === 0 ? (
                  <p>No hay estudios disponibles para este paciente.</p>
                ) : (
                  studies.map(study => (
                    <div 
                      key={study.id} 
                      className={`study-card ${selectedStudy?.id === study.id ? 'selected' : ''}`}
                      onClick={() => handleSelectStudy(study)}
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
                      <div className={`study-status status-${study.status}`}>
                        {study.status}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {selectedPatient.risMrn && (
              <div className="studies-section">
                <h3>Estudios en PACS</h3>
                <div className="studies-list">
                  {pacsStudies.length === 0 ? (
                    <p>No hay estudios PACS disponibles para este paciente.</p>
                  ) : (
                    pacsStudies.map(study => (
                      <div 
                        key={study.studyInstanceUID} 
                        className="study-card pacs-study"
                      >
                        <div className="study-date">
                          {new Date(study.studyDate).toLocaleDateString()}
                        </div>
                        <div className="study-description">
                          {study.studyDescription || 'Sin descripción'}
                        </div>
                        <div className="study-modality">
                          {study.modality}
                        </div>
                        {!study.importedToLocal && (
                          <button 
                            className="import-button"
                            onClick={() => handleImportFromPACS(study.studyInstanceUID)}
                            disabled={isLoading}
                          >
                            Importar
                          </button>
                        )}
                        {study.importedToLocal && (
                          <div className="imported-badge">
                            Importado
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'viewer' && selectedStudy && (
          <div className="viewer-container">
            <div className="viewer-header">
              <h2>Visor DICOM - {selectedStudy.studyDescription}</h2>
              <div className="patient-info">
                Paciente: {selectedPatient?.name} | 
                Modalidad: {selectedStudy.modality} | 
                Fecha: {new Date(selectedStudy.createdAt).toLocaleDateString()}
              </div>
            </div>
            
            <div className="viewer-content">
              <DICOMViewer 
                instanceId={selectedDicomInstance} 
              />
            </div>
            
            <div className="study-thumbnails">
              {selectedStudy.instances && selectedStudy.instances.map(instance => (
                <div 
                  key={instance.id}
                  className={`thumbnail ${selectedDicomInstance === instance.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDicomInstance(instance.id)}
                >
                  <div className="thumbnail-number">
                    {instance.instanceNumber || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
