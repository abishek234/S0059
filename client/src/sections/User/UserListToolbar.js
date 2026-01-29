// sections/@dashboard/app/User/UserListToolbar.js - FIXED layout
import PropTypes from 'prop-types';
import { styled } from '@mui/material/styles';
import { 
  Toolbar, 
  Tooltip, 
  IconButton, 
  Typography, 
  OutlinedInput, 
  InputAdornment,
  Popover,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Divider
} from '@mui/material';
import { useState } from 'react';
import Iconify from '../../components/Iconify'; 

// ----------------------------------------------------------------------
const RootStyle = styled(Toolbar)(({ theme }) => ({
  height: 96,
  display: 'flex',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 3),
}));

const SearchStyle = styled(OutlinedInput)(({ theme }) => ({
  width: 240,
  transition: theme.transitions.create(['box-shadow', 'width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter,
  }),
  '&.Mui-focused': { 
    width: 320, 
    boxShadow: theme.customShadows.z8 
  },
  '& fieldset': {
    borderWidth: `1px !important`,
    borderColor: `${theme.palette.grey[500_32]} !important`,
  },
}));

// ----------------------------------------------------------------------
UserListToolbar.propTypes = {
  numSelected: PropTypes.number,
  filterName: PropTypes.string,
  onFilterName: PropTypes.func,
  statusFilter: PropTypes.string,
  onStatusFilterChange: PropTypes.func,
  verificationFilter: PropTypes.string,
  onVerificationFilterChange: PropTypes.func,
};

export default function UserListToolbar({ 
  numSelected, 
  filterName, 
  onFilterName,
  statusFilter,
  onStatusFilterChange,
  verificationFilter,
  onVerificationFilterChange
}) {
  const [filterAnchor, setFilterAnchor] = useState(null);

  const handleOpenFilter = (event) => {
    setFilterAnchor(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setFilterAnchor(null);
  };

  const handleClearFilters = () => {
    onStatusFilterChange({ target: { value: '' } });
    onVerificationFilterChange({ target: { value: '' } });
  };

  const isFilterOpen = Boolean(filterAnchor);
  const hasActiveFilters = statusFilter || verificationFilter;

  return (
    <>
      <RootStyle
        sx={{
          ...(numSelected > 0 && {
            color: 'primary.main',
            bgcolor: 'primary.lighter',
          }),
        }}
      >
        {/* Left side - Search or Selected Count */}
        {numSelected > 0 ? (
          <Typography component="div" variant="subtitle1">
            {numSelected} selected
          </Typography>
        ) : (
          <SearchStyle
            value={filterName}
            onChange={onFilterName}
            placeholder="Search user..."
            startAdornment={
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', width: 20, height: 20 }} />
              </InputAdornment>
            }
          />
        )}

        {/* Right side - Filter Button or Delete Button */}
        {numSelected > 0 ? (
          <Tooltip title="Delete">
            <IconButton>
              <Iconify icon="eva:trash-2-fill" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip title="Filter list">
            <IconButton onClick={handleOpenFilter}>
              <Iconify 
                icon="ic:round-filter-list" 
                sx={{ 
                  color: hasActiveFilters ? 'primary.main' : 'text.secondary',
                  width: 24, 
                  height: 24 
                }} 
              />
            </IconButton>
          </Tooltip>
        )}
      </RootStyle>

      {/* Filter Popover */}
      <Popover
        open={isFilterOpen}
        anchorEl={filterAnchor}
        onClose={handleCloseFilter}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            p: 3,
            width: 300,
            mt: 1.5,
          },
        }}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          Filters
        </Typography>

        <Stack spacing={3}>
          {/* Status Filter */}
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={onStatusFilterChange}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="suspended">Suspended</MenuItem>
            </Select>
          </FormControl>

          {/* Verification Filter */}
          <FormControl fullWidth size="small">
            <InputLabel>Verification</InputLabel>
            <Select
              value={verificationFilter}
              onChange={onVerificationFilterChange}
              label="Verification"
            >
              <MenuItem value="">All Users</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="pending">Pending Verification</MenuItem>
            </Select>
          </FormControl>

          <Divider />

          {/* Action Buttons */}
          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
            >
              Clear All
            </Button>
            <Button
              fullWidth
              variant="contained"
              onClick={handleCloseFilter}
            >
              Apply
            </Button>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}