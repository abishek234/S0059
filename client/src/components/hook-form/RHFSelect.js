import PropTypes from 'prop-types';
import { useFormContext, Controller } from 'react-hook-form';
import { TextField, MenuItem } from '@mui/material';

RHFSelect.propTypes = {
  name: PropTypes.string.isRequired,
  options: PropTypes.array.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  helperText: PropTypes.string,
};

export default function RHFSelect({ name, options, label, placeholder, helperText, ...other }) {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...field}
          select
          fullWidth
          label={label}
          placeholder={placeholder}
          error={!!error}
          helperText={error ? error?.message : helperText}
          {...other}
        >
          {placeholder && (
            <MenuItem value="" disabled>
              {placeholder}
            </MenuItem>
          )}
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}