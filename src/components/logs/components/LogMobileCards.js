'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Stack,
  Divider,
  IconButton,
  Pagination
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BugReportIcon from '@mui/icons-material/BugReport';
import TerminalIcon from '@mui/icons-material/Terminal';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
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
 * LogMobileCards component
 * Mobile-friendly card view for logs
 */
const LogMobileCards = ({
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
  const safeRows = Array.isArray(logs) ? logs.filter(log => log != null) : [];
  
  const handlePageChange = (event, newPage) => {
    if (onPaginationChange) {
      onPaginationChange({ page: newPage - 1, pageSize: pagination.pageSize });
    }
  };

  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);

  if (loading) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>Loading logs...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography color="error">Error loading logs</Typography>
      </Box>
    );
  }

  if (safeRows.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography>No logs found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Stack spacing={2}>
        {safeRows.map((log) => {
          const logId = log._id || log.id || `${log.timestamp || Date.now()}-${log.action || 'unknown'}`;
          const isSuccess = log.status === LOG_STATUS.SUCCESS;
          const httpStatusInfo = log.httpStatus ? formatHttpStatus(log.httpStatus) : null;
          
          return (
            <Card 
              key={logId}
              sx={{ 
                maxWidth: { xs: '100%', sm: 600 },
                mx: 'auto',
                width: '100%',
                cursor: 'pointer',
                '&:hover': {
                  boxShadow: 3
                }
              }}
              onClick={() => onRowClick && onRowClick(log)}
            >
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                {/* Header Row */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      icon={getLevelIcon(log.level)}
                      label={log.level?.toUpperCase()}
                      size="small"
                      color={LOG_LEVEL_COLORS[log.level] || 'default'}
                      sx={{ fontWeight: 'medium' }}
                    />
                    <Chip
                      label={isSuccess ? 'Success' : 'Failed'}
                      size="small"
                      color={isSuccess ? 'success' : 'error'}
                      variant={isSuccess ? 'outlined' : 'filled'}
                    />
                    {httpStatusInfo && (
                      <Chip
                        label={httpStatusInfo.text}
                        size="small"
                        color={httpStatusInfo.color}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick && onRowClick(log);
                    }}
                  >
                    <InfoOutlinedIcon />
                  </IconButton>
                </Box>

                {/* Action and Resource */}
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 0.5 }}>
                  {log.action || 'Unknown Action'}
                </Typography>
                {log.resource && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Resource: {log.resource}
                  </Typography>
                )}

                <Divider sx={{ my: 1 }} />

                {/* Meta Information */}
                <Stack spacing={0.5}>
                  {/* Timestamp */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AccessTimeIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="text.secondary">
                      {formatTimestamp(log.timestamp)}
                    </Typography>
                  </Box>

                  {/* User */}
                  {(log.userName || log.userEmail || log.userId) && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOutlineIcon fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {formatUserName(log)}
                      </Typography>
                    </Box>
                  )}

                  {/* Duration */}
                  {log.duration && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="caption" 
                        color={log.duration > 1000 ? 'warning.main' : 'text.secondary'}
                      >
                        Duration: {formatDuration(log.duration)}
                      </Typography>
                    </Box>
                  )}
                </Stack>

                {/* Error Message if present */}
                {log.error && (
                  <Box sx={{ mt: 1, p: 1, bgcolor: 'error.lighter', borderRadius: 1 }}>
                    <Typography variant="caption" color="error">
                      {log.error}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages}
            page={pagination.page + 1}
            onChange={handlePageChange}
            color="primary"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
};

LogMobileCards.propTypes = {
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

export default LogMobileCards;