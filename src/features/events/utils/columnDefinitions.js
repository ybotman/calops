/**
 * Column definitions for event data tables
 */

import { format } from 'date-fns';

// Helper function to format date
const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy h:mm a');
  } catch (e) {
    return 'Invalid date';
  }
};

// Default column definitions for event tables
export const eventColumns = [
  {
    field: 'title',
    headerName: 'Title',
    flex: 1,
    minWidth: 200,
    valueGetter: (params) => params.row.title || 'Untitled Event'
  },
  {
    field: 'dates',
    headerName: 'Dates',
    flex: 1,
    minWidth: 200,
    valueGetter: (params) => {
      const startDate = formatDate(params.row.startDate);
      const endDate = formatDate(params.row.endDate);
      return `${startDate} - ${endDate}`;
    }
  },
  {
    field: 'location',
    headerName: 'Location',
    flex: 1,
    minWidth: 200,
    valueGetter: (params) => {
      const venue = params.row.location?.venueName || 'N/A';
      const city = params.row.masteredCityName || params.row.location?.city || '';
      const region = params.row.masteredRegionName || params.row.location?.region || '';
      
      if (city && region) {
        return `${venue}, ${city}, ${region}`;
      } else if (city) {
        return `${venue}, ${city}`;
      } else if (region) {
        return `${venue}, ${region}`;
      } else {
        return venue;
      }
    }
  },
  {
    field: 'organizer',
    headerName: 'Organizer',
    flex: 1,
    minWidth: 150,
    valueGetter: (params) => params.row.organizer?.name || 'N/A'
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    valueGetter: (params) => params.row.active ? 'Active' : 'Inactive'
  }
];

// Simplified column definitions for more compact views
export const compactEventColumns = [
  {
    field: 'title',
    headerName: 'Title',
    flex: 1,
    minWidth: 200
  },
  {
    field: 'startDate',
    headerName: 'Start Date',
    width: 150,
    valueGetter: (params) => formatDate(params.row.startDate)
  },
  {
    field: 'location',
    headerName: 'Location',
    width: 150,
    valueGetter: (params) => params.row.location?.city || 'N/A'
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    valueGetter: (params) => params.row.active ? 'Active' : 'Inactive'
  }
];

export default eventColumns;