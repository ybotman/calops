'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
  IconButton,
  useMediaQuery,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventIcon from '@mui/icons-material/Event';
import PlaceIcon from '@mui/icons-material/Place';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import { format } from 'date-fns';
import { adminApi } from '@/lib/api-client/index';
import { masteredLocationsApi, venuesApi } from '@/lib/api-client.js';
import { useAppContext } from '@/lib/AppContext';

/**
 * Data Health Dashboard
 * Shows data quality issues across the system
 */
export default function DataHealthPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { currentApp } = useAppContext();
  const appId = currentApp?.id || '1';

  // Data state
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [tabValue, setTabValue] = useState(0);
  const [expandedSection, setExpandedSection] = useState(null);

  // Mastered city assignment state
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [countries, setCountries] = useState([]);
  const [regions, setRegions] = useState([]);
  const [divisions, setDivisions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError, setAssignError] = useState(null);

  // Fetch data health
  const fetchHealthData = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.getDataHealth({
        appId,
        refresh: forceRefresh
      });
      setHealthData(data);
    } catch (err) {
      console.error('Error fetching data health:', err);
      setError(err.message || 'Failed to load data health');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  // Open assign dialog and load countries
  const handleOpenAssignDialog = async (venue) => {
    setSelectedVenue(venue);
    setAssignDialogOpen(true);
    setAssignError(null);
    setSelectedCountry('');
    setSelectedRegion('');
    setSelectedDivision('');
    setSelectedCity('');
    setRegions([]);
    setDivisions([]);
    setCities([]);

    try {
      const countriesData = await masteredLocationsApi.getCountries();
      setCountries(countriesData.countries || countriesData || []);
    } catch (err) {
      console.error('Error loading countries:', err);
      setAssignError('Failed to load countries');
    }
  };

  // Handle country selection
  const handleCountryChange = async (countryId) => {
    setSelectedCountry(countryId);
    setSelectedRegion('');
    setSelectedDivision('');
    setSelectedCity('');
    setDivisions([]);
    setCities([]);

    if (countryId) {
      try {
        const regionsData = await masteredLocationsApi.getRegions(countryId);
        setRegions(regionsData.regions || regionsData || []);
      } catch (err) {
        console.error('Error loading regions:', err);
      }
    } else {
      setRegions([]);
    }
  };

  // Handle region selection
  const handleRegionChange = async (regionId) => {
    setSelectedRegion(regionId);
    setSelectedDivision('');
    setSelectedCity('');
    setCities([]);

    if (regionId) {
      try {
        const divisionsData = await masteredLocationsApi.getDivisions(regionId);
        setDivisions(divisionsData.divisions || divisionsData || []);
      } catch (err) {
        console.error('Error loading divisions:', err);
      }
    } else {
      setDivisions([]);
    }
  };

  // Handle division selection
  const handleDivisionChange = async (divisionId) => {
    setSelectedDivision(divisionId);
    setSelectedCity('');

    if (divisionId) {
      try {
        const citiesData = await masteredLocationsApi.getCities(divisionId);
        setCities(citiesData.cities || citiesData || []);
      } catch (err) {
        console.error('Error loading cities:', err);
      }
    } else {
      setCities([]);
    }
  };

  // Assign mastered city to venue
  const handleAssignMasteredCity = async () => {
    if (!selectedVenue || !selectedCity) return;

    setAssignLoading(true);
    setAssignError(null);

    try {
      await venuesApi.updateVenue(selectedVenue._id, {
        masteredCityId: selectedCity
      });
      setAssignDialogOpen(false);
      // Refresh data health to update the list
      fetchHealthData(true);
    } catch (err) {
      console.error('Error assigning mastered city:', err);
      setAssignError(err.message || 'Failed to assign mastered city');
    } finally {
      setAssignLoading(false);
    }
  };

  // Issue categories with metadata
  const issueCategories = [
    {
      key: 'eventsWithoutVenue',
      label: 'Events Without Venue',
      icon: <EventIcon />,
      severity: 'warning',
      description: 'Events that have no venue assigned'
    },
    {
      key: 'eventsWithoutOwner',
      label: 'Events Without Owner',
      icon: <EventIcon />,
      severity: 'error',
      description: 'Events missing ownerOrganizerID'
    },
    {
      key: 'eventsWithoutAuthor',
      label: 'Events Without Author',
      icon: <EventIcon />,
      severity: 'warning',
      description: 'Events missing authorOrganizerID'
    },
    {
      key: 'eventsDenormalizedMismatch',
      label: 'Events With Venue Mismatch',
      icon: <EventIcon />,
      severity: 'warning',
      description: 'Events where denormalizedEventInfo does not match venue data'
    },
    {
      key: 'venuesMissingGeocoding',
      label: 'Venues Missing Geocoding',
      icon: <PlaceIcon />,
      severity: 'warning',
      description: 'Venues without latitude/longitude coordinates'
    },
    {
      key: 'venuesMissingMasteredCity',
      label: 'Venues Without Mastered City',
      icon: <PlaceIcon />,
      severity: 'warning',
      description: 'Venues not linked to a mastered city'
    },
    {
      key: 'organizersNotLinkedToUser',
      label: 'Organizers Without User',
      icon: <BusinessIcon />,
      severity: 'info',
      description: 'Organizer records not linked to a user account'
    },
    {
      key: 'usersWithInvalidOrganizerId',
      label: 'Users With Invalid Organizer',
      icon: <PersonIcon />,
      severity: 'error',
      description: 'Users pointing to non-existent organizer records'
    },
    {
      key: 'expiredRecurringEventsStillActive',
      label: 'Expired Recurring Events',
      icon: <EventIcon />,
      severity: 'error',
      description: 'Recurring events past their end date but still active'
    },
    {
      key: 'eventsInPastStillActive',
      label: 'Past Events Still Active',
      icon: <EventIcon />,
      severity: 'warning',
      description: 'Single events in the past that are still marked active'
    }
  ];

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      default: return 'default';
    }
  };

  // Get count for a category
  const getCategoryCount = (key) => {
    if (!healthData?.issues) return 0;
    const issues = healthData.issues[key];
    return Array.isArray(issues) ? issues.length : 0;
  };

  // Get total issues for a tab
  const getTabIssueCount = (tabIndex) => {
    switch (tabIndex) {
      case 0: // Events
        return getCategoryCount('eventsWithoutVenue') +
               getCategoryCount('eventsWithoutOwner') +
               getCategoryCount('eventsWithoutAuthor') +
               getCategoryCount('eventsDenormalizedMismatch') +
               getCategoryCount('expiredRecurringEventsStillActive') +
               getCategoryCount('eventsInPastStillActive');
      case 1: // Venues
        return getCategoryCount('venuesMissingGeocoding') +
               getCategoryCount('venuesMissingMasteredCity');
      case 2: // Users & Organizers
        return getCategoryCount('organizersNotLinkedToUser') +
               getCategoryCount('usersWithInvalidOrganizerId');
      default:
        return 0;
    }
  };

  // Get categories for current tab
  const getCategoriesForTab = (tabIndex) => {
    switch (tabIndex) {
      case 0: // Events
        return issueCategories.filter(c =>
          ['eventsWithoutVenue', 'eventsWithoutOwner', 'eventsWithoutAuthor', 'eventsDenormalizedMismatch', 'expiredRecurringEventsStillActive', 'eventsInPastStillActive'].includes(c.key)
        );
      case 1: // Venues
        return issueCategories.filter(c =>
          ['venuesMissingGeocoding', 'venuesMissingMasteredCity'].includes(c.key)
        );
      case 2: // Users & Organizers
        return issueCategories.filter(c =>
          ['organizersNotLinkedToUser', 'usersWithInvalidOrganizerId'].includes(c.key)
        );
      default:
        return [];
    }
  };

  // Render summary cards
  const renderSummary = () => {
    if (!healthData?.summary) return null;
    const { totalIssues, criticalCount, warningCount } = healthData.summary;
    const infoCount = totalIssues - criticalCount - warningCount;

    return (
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #1976d2' }}>
            <Typography variant="h4">{totalIssues}</Typography>
            <Typography variant="body2" color="text.secondary">Total Issues</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #d32f2f' }}>
            <Typography variant="h4">{criticalCount}</Typography>
            <Typography variant="body2" color="text.secondary">Critical</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #ed6c02' }}>
            <Typography variant="h4">{warningCount}</Typography>
            <Typography variant="body2" color="text.secondary">Warnings</Typography>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Paper sx={{ p: 2, textAlign: 'center', borderTop: '4px solid #2e7d32' }}>
            {totalIssues === 0 ? (
              <>
                <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main' }} />
                <Typography variant="body2" color="text.secondary">All Clear</Typography>
              </>
            ) : (
              <>
                <Typography variant="h4">{infoCount}</Typography>
                <Typography variant="body2" color="text.secondary">Info</Typography>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
    );
  };

  // Render issue category section
  const renderIssueSection = (category) => {
    const issues = healthData?.issues?.[category.key] || [];
    const isExpanded = expandedSection === category.key;
    const count = issues.length;

    if (count === 0) {
      return (
        <Card key={category.key} sx={{ mb: 1, opacity: 0.7 }}>
          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CheckCircleIcon color="success" fontSize="small" />
              <Typography variant="body1">{category.label}</Typography>
              <Chip label="0" size="small" color="success" />
            </Box>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={category.key} sx={{ mb: 1 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer'
            }}
            onClick={() => setExpandedSection(isExpanded ? null : category.key)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {category.icon}
              <Box>
                <Typography variant="body1" fontWeight="medium">
                  {category.label}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {category.description}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip
                label={count}
                size="small"
                color={getSeverityColor(category.severity)}
              />
              <IconButton size="small">
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2 }}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {renderTableHeaders(category.key)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {issues.slice(0, 50).map((issue, idx) => (
                      <TableRow key={issue._id || idx}>
                        {renderTableRow(category.key, issue)}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {count > 50 && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Showing 50 of {count} issues
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  };

  // Render table headers based on issue type
  const renderTableHeaders = (key) => {
    switch (key) {
      case 'eventsWithoutVenue':
      case 'eventsWithoutOwner':
      case 'eventsWithoutAuthor':
      case 'eventsDenormalizedMismatch':
      case 'expiredRecurringEventsStillActive':
      case 'eventsInPastStillActive':
        return (
          <>
            <TableCell>Event Title</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>ID</TableCell>
          </>
        );
      case 'venuesMissingGeocoding':
        return (
          <>
            <TableCell>Venue Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>ID</TableCell>
          </>
        );
      case 'venuesMissingMasteredCity':
        return (
          <>
            <TableCell>Venue Name</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>ID</TableCell>
            <TableCell>Action</TableCell>
          </>
        );
      case 'organizersNotLinkedToUser':
        return (
          <>
            <TableCell>Organizer Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>ID</TableCell>
          </>
        );
      case 'usersWithInvalidOrganizerId':
        return (
          <>
            <TableCell>User Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Invalid Organizer ID</TableCell>
          </>
        );
      default:
        return <TableCell>Item</TableCell>;
    }
  };

  // Render table row based on issue type
  const renderTableRow = (key, issue) => {
    switch (key) {
      case 'eventsWithoutVenue':
      case 'eventsWithoutOwner':
      case 'eventsWithoutAuthor':
      case 'eventsDenormalizedMismatch':
      case 'expiredRecurringEventsStillActive':
      case 'eventsInPastStillActive':
        return (
          <>
            <TableCell>{issue.title || 'Untitled'}</TableCell>
            <TableCell>
              {(issue.startDate || issue.startDateTime) ? format(new Date(issue.startDate || issue.startDateTime), 'MMM d, yyyy') : 'No date'}
            </TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {issue._id?.slice(-8) || 'N/A'}
            </TableCell>
          </>
        );
      case 'venuesMissingGeocoding':
        return (
          <>
            <TableCell>{issue.venueName || issue.name || 'Unnamed'}</TableCell>
            <TableCell>{issue.city && issue.state ? `${issue.city}, ${issue.state}` : (issue.address || 'No location')}</TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {issue._id?.slice(-8) || 'N/A'}
            </TableCell>
          </>
        );
      case 'venuesMissingMasteredCity':
        return (
          <>
            <TableCell>{issue.venueName || issue.name || 'Unnamed'}</TableCell>
            <TableCell>{issue.city && issue.state ? `${issue.city}, ${issue.state}` : (issue.address || 'No location')}</TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {issue._id?.slice(-8) || 'N/A'}
            </TableCell>
            <TableCell>
              <Button
                size="small"
                variant="outlined"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAssignDialog(issue);
                }}
              >
                Assign
              </Button>
            </TableCell>
          </>
        );
      case 'organizersNotLinkedToUser':
        return (
          <>
            <TableCell>{issue.fullName || issue.shortName || 'Unnamed'}</TableCell>
            <TableCell>
              {issue.organizerTypes && (
                <>
                  {issue.organizerTypes.isTeacher && <Chip label="Teacher" size="small" sx={{ mr: 0.5 }} />}
                  {issue.organizerTypes.isDJ && <Chip label="DJ" size="small" sx={{ mr: 0.5 }} />}
                  {issue.organizerTypes.isVenue && <Chip label="Venue" size="small" sx={{ mr: 0.5 }} />}
                  {issue.organizerTypes.isOrchestra && <Chip label="Orchestra" size="small" />}
                </>
              )}
            </TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {issue._id?.slice(-8) || 'N/A'}
            </TableCell>
          </>
        );
      case 'usersWithInvalidOrganizerId':
        return (
          <>
            <TableCell>{issue.displayName || 'Unnamed'}</TableCell>
            <TableCell>{issue.email || 'No email'}</TableCell>
            <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'error.main' }}>
              {issue.organizerId?.slice(-8) || 'N/A'}
            </TableCell>
          </>
        );
      default:
        return <TableCell>{JSON.stringify(issue)}</TableCell>;
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Data Health
        </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => fetchHealthData(true)}
          disabled={loading}
        >
          Force Refresh
        </Button>
      </Box>

      {/* Error display */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Loading */}
      {loading && !healthData && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Content */}
      {healthData && (
        <>
          {/* Summary cards */}
          {renderSummary()}

          {/* Tabs */}
          <Paper sx={{ mb: 2 }}>
            <Tabs
              value={tabValue}
              onChange={(e, v) => {
                setTabValue(v);
                setExpandedSection(null);
              }}
              variant={isMobile ? 'fullWidth' : 'standard'}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab
                label={`Events (${getTabIssueCount(0)})`}
                icon={<EventIcon />}
                iconPosition="start"
              />
              <Tab
                label={`Venues (${getTabIssueCount(1)})`}
                icon={<PlaceIcon />}
                iconPosition="start"
              />
              <Tab
                label={`Users (${getTabIssueCount(2)})`}
                icon={<PersonIcon />}
                iconPosition="start"
              />
            </Tabs>
          </Paper>

          {/* Issue sections for current tab */}
          <Box>
            {getCategoriesForTab(tabValue).map(category => renderIssueSection(category))}
          </Box>

          {/* Cache info */}
          {healthData.generatedAt && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Data generated: {format(new Date(healthData.generatedAt), 'MMM d, yyyy h:mm a')}
              {healthData.cached && ' (cached)'}
            </Typography>
          )}
        </>
      )}

      {/* Assign Mastered City Dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Assign Mastered City
          {selectedVenue && (
            <Typography variant="body2" color="text.secondary">
              Venue: {selectedVenue.name || selectedVenue.venueName}
              {selectedVenue.city && selectedVenue.state && ` (${selectedVenue.city}, ${selectedVenue.state})`}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {assignError && (
            <Alert severity="error" sx={{ mb: 2 }}>{assignError}</Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {/* Country */}
            <FormControl fullWidth>
              <InputLabel>Country</InputLabel>
              <Select
                value={selectedCountry}
                label="Country"
                onChange={(e) => handleCountryChange(e.target.value)}
              >
                <MenuItem value="">Select Country</MenuItem>
                {countries.map(country => (
                  <MenuItem key={country._id} value={country._id}>
                    {country.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Region */}
            <FormControl fullWidth disabled={!selectedCountry}>
              <InputLabel>Region</InputLabel>
              <Select
                value={selectedRegion}
                label="Region"
                onChange={(e) => handleRegionChange(e.target.value)}
              >
                <MenuItem value="">Select Region</MenuItem>
                {regions.map(region => (
                  <MenuItem key={region._id} value={region._id}>
                    {region.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Division */}
            <FormControl fullWidth disabled={!selectedRegion}>
              <InputLabel>Division</InputLabel>
              <Select
                value={selectedDivision}
                label="Division"
                onChange={(e) => handleDivisionChange(e.target.value)}
              >
                <MenuItem value="">Select Division</MenuItem>
                {divisions.map(division => (
                  <MenuItem key={division._id} value={division._id}>
                    {division.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* City */}
            <FormControl fullWidth disabled={!selectedDivision}>
              <InputLabel>City</InputLabel>
              <Select
                value={selectedCity}
                label="City"
                onChange={(e) => setSelectedCity(e.target.value)}
              >
                <MenuItem value="">Select City</MenuItem>
                {cities.map(city => (
                  <MenuItem key={city._id} value={city._id}>
                    {city.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignMasteredCity}
            disabled={!selectedCity || assignLoading}
          >
            {assignLoading ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
