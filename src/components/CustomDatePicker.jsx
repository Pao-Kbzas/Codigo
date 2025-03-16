import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';
import { TextField, InputAdornment } from '@mui/material';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

// Registrar el locale español
registerLocale('es', es);

const CustomDatePicker = ({ label, value, onChange, required, minDate, fullWidth = true }) => {
  // Componente personalizado para la entrada del DatePicker
  const CustomInput = React.forwardRef(({ value, onClick }, ref) => (
    <TextField
      label={label}
      value={value}
      onClick={onClick}
      ref={ref}
      fullWidth={fullWidth}
      required={required}
      margin="normal"
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <CalendarTodayIcon />
          </InputAdornment>
        ),
        readOnly: true
      }}
    />
  ));

  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      minDate={minDate}
      locale="es"
      dateFormat="dd/MM/yyyy"
      customInput={<CustomInput />}
    />
  );
};

export default CustomDatePicker;