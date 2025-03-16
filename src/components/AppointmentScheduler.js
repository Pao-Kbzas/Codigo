// src/components/AppointmentScheduler.js
import { useState, useEffect } from "react";
import { db } from "./services/firebaseConfig";
import { collection, addDoc, getDocs } from "firebase/firestore";

const AppointmentScheduler = () => {
  const [appointments, setAppointments] = useState([]);
  const [newAppointment, setNewAppointment] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      const querySnapshot = await getDocs(collection(db, "appointments"));
      setAppointments(querySnapshot.docs.map(doc => doc.data()));
    };
    fetchAppointments();
  }, []);

  const handleAddAppointment = async () => {
    await addDoc(collection(db, "appointments"), { name: newAppointment });
    setNewAppointment("");
  };

  return (
    <div>
      <h2>Agendar Cita</h2>
      <input
        value={newAppointment}
        onChange={(e) => setNewAppointment(e.target.value)}
        placeholder="Nombre de la cita"
      />
      <button onClick={handleAddAppointment}>Agregar Cita</button>
      <ul>
        {appointments.map((appointment, index) => (
          <li key={index}>{appointment.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentScheduler;
