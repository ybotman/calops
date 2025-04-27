'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Stack,
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Link
} from '@mui/material';
import {
  EditOutlined as EditIcon,
  DeleteOutline as DeleteIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

/**
 * ApplicationCard component for displaying application information
 * @param {Object} props - Component props
 * @param {Object} props.application - The application data to display
 * @param {Function} props.onEdit - Handler for edit action
 * @param {Function} props.onDelete - Handler for delete action
 * @param {Function} props.onActivate - Handler for activation toggle
 */
const ApplicationCard = ({ application, onEdit, onDelete, onActivate }) => {
  if (!application) return null;

  const {
    appId,
    name,
    description,
    url,
    logoUrl,
    isActive
  } = application;

  // Get initials from name for avatar if logo is not available
  const getInitials = () => {
    if (!name) return 'AP';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        opacity: isActive ? 1 : 0.7
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            mb: 2,
            gap: 2
          }}
        >
          <Avatar 
            src={logoUrl} 
            alt={name}
            sx={{ width: 56, height: 56 }}
          >
            {!logoUrl && getInitials()}
          </Avatar>
          <Box>
            <Typography variant="h6" component="div" gutterBottom>
              {name}
            </Typography>
            <Typography 
              variant="caption" 
              color="text.secondary"
              component="div"
              sx={{ mb: 1 }}
            >
              App ID: {appId}
            </Typography>
          </Box>
        </Box>

        <Chip 
          label={isActive ? 'Active' : 'Inactive'} 
          color={isActive ? 'success' : 'default'} 
          size="small" 
          sx={{ mb: 2 }}
        />
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {description}
        </Typography>
        
        {url && (
          <Link 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
          >
            <Typography variant="body2">{url}</Typography>
            <OpenInNewIcon fontSize="small" />
          </Link>
        )}
      </CardContent>
      
      <CardActions>
        <Stack 
          direction="row" 
          spacing={1} 
          sx={{ width: '100%', justifyContent: 'space-between' }}
        >
          <Box>
            <Tooltip title="Edit Application">
              <IconButton onClick={() => onEdit(application)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Application">
              <IconButton onClick={() => onDelete(application)} size="small" color="error">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Button 
            size="small" 
            variant="outlined" 
            color={isActive ? "error" : "success"}
            onClick={() => onActivate(application)}
          >
            {isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
};

export default ApplicationCard;