'use client';

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BugReportIcon from '@mui/icons-material/BugReport';
import TerminalIcon from '@mui/icons-material/Terminal';
import { 
  LOG_LEVELS, 
  LOG_LEVEL_COLORS,
  LOG_STATUS 
} from '../utils/logConstants';
import { 
  formatTimestamp, 
  formatDuration,
  formatHttpStatus,
  formatUserName 
} from '../utils/logFormatters';

/**
 * Get icon for log level
 */
const getLevelIcon = (level) => {
  switch (level) {
    case LOG_LEVELS.ERROR:
      return <ErrorOutlineIcon fontSize="small" />;
    case LOG_LEVELS.WARN:
      return <WarningAmberIcon fontSize="small" />;
    case LOG_LEVELS.INFO:
      return <InfoOutlinedIcon fontSize="small" />;
    case LOG_LEVELS.DEBUG:
      return <BugReportIcon fontSize="small" />;
    case LOG_LEVELS.CONSOLE:
      return <TerminalIcon fontSize="small" />;
    default:
      return null;
  }
};

/**
 * LogTable component
 * Displays logs in a DataGrid with sorting, filtering, and actions
 */
const LogTable = ({
  logs = [],
  loading = false,
  pagination = {
    page: 0,
    pageSize: 50,
    totalCount: 0
  },
  onPaginationChange,
  onRowClick,
  error
}) => {
  // Ensure logs is always an array
  const safeRows = Array.isArray(logs) ? logs : [];
  const [sortModel, setSortModel] = useState([
    { field: 'timestamp', sort: 'desc' }
  ]);

  // Define columns for DataGrid
  const columns = [
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      width: 180,
      renderCell: (params) => (
        <Tooltip title={formatTimestamp(params.value)} arrow>
          <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
            {formatTimestamp(params.value, true)}
          </Typography>
        </Tooltip>
      )
    },
    {
      field: 'level',
      headerName: 'Level',
      width: 100,
      renderCell: (params) => (
        <Chip
          icon={getLevelIcon(params.value)}
          label={params.value?.toUpperCase()}
          size="small"
          color={LOG_LEVEL_COLORS[params.value] || 'default'}
          sx={{ fontWeight: 'medium' }}
        />
      )
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 120,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'resource',
      headerName: 'Resource',
      width: 120
    },
    {
      field: 'userName',
      headerName: 'User',
      width: 150,
      valueGetter: (params) => params.row ? formatUserName(params.row) : '',
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <Tooltip title={params.row.userEmail || params.row.userId || ''} arrow>
            <Typography variant="body2" noWrap>
              {params.value}
            </Typography>
          </Tooltip>
        );
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => {
        const isSuccess = params.value === LOG_STATUS.SUCCESS;
        return (
          <Chip
            label={params.value}
            size="small"
            color={isSuccess ? 'success' : 'error'}
            variant={isSuccess ? 'outlined' : 'filled'}
          />
        );
      }
    },
    {
      field: 'httpStatus',
      headerName: 'HTTP',
      width: 80,
      renderCell: (params) => {
        if (!params.value) return '-';
        const { text, color } = formatHttpStatus(params.value);
        return (
          <Chip
            label={text}
            size="small"
            color={color}
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 90,
      valueGetter: (params) => params.row?.duration || 0,
      renderCell: (params) => {
        if (!params.row) return '-';
        const duration = formatDuration(params.row.duration);
        const isLong = params.row.duration > 1000;
        return (
          <Typography 
            variant="body2" 
            color={isLong ? 'warning.main' : 'text.secondary'}
            sx={{ fontWeight: isLong ? 'medium' : 'normal' }}
          >
            {duration}
          </Typography>
        );
      }
    },
    {
      field: 'details',
      headerName: 'Details',
      width: 80,
      sortable: false,
      renderCell: (params) => {
        if (!params.row) return null;
        return (
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              if (onRowClick && params.row) {
                onRowClick(params.row);
              }
            }}
            color="primary"
          >
            <InfoOutlinedIcon />
          </IconButton>
        );
      }
    }
  ];

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (onPaginationChange) {
      onPaginationChange({ page: newPage, pageSize: pagination.pageSize });
    }
  };

  const handlePageSizeChange = (newPageSize) => {
    if (onPaginationChange) {
      onPaginationChange({ page: 0, pageSize: newPageSize });
    }
  };

  // Handle row click
  const handleRowClick = (params) => {
    if (onRowClick) {
      onRowClick(params.row);
    }
  };

  // Calculate row height based on content
  const getRowHeight = () => 52;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <DataGrid
        rows={safeRows}
        columns={columns}
        loading={loading}
        pageSize={pagination.pageSize}
        page={pagination.page}
        rowCount={pagination.totalCount || logs.length}
        paginationMode="server"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        rowsPerPageOptions={[25, 50, 100, 250]}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        onRowClick={handleRowClick}
        getRowId={(row) => row._id || row.id || `${row.timestamp}-${row.action}`}
        getRowHeight={getRowHeight}
        disableSelectionOnClick
        density="comfortable"
        sx={{
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
            cursor: 'pointer'
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'background.default',
            borderBottom: '2px solid',
            borderBottomColor: 'divider',
          }
        }}
        componentsProps={{
          pagination: {
            labelRowsPerPage: 'Logs per page:',
          }
        }}
        localeText={{
          noRowsLabel: error ? 'Error loading logs' : 'No logs found',
          MuiTablePagination: {
            labelDisplayedRows: ({ from, to, count }) => 
              `${from}-${to} of ${count !== -1 ? count : `more than ${to}`} logs`
          }
        }}
      />
    </Box>
  );
};

LogTable.propTypes = {
  logs: PropTypes.array,
  loading: PropTypes.bool,
  pagination: PropTypes.shape({
    page: PropTypes.number,
    pageSize: PropTypes.number,
    totalCount: PropTypes.number
  }),
  onPaginationChange: PropTypes.func,
  onRowClick: PropTypes.func,
  error: PropTypes.any
};

export default LogTable;