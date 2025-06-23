'use client';

import React from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  SwipeableDrawer,
  useMediaQuery,
  useTheme,
  Box,
  IconButton,
  Typography
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DragHandleIcon from '@mui/icons-material/DragHandle';

/**
 * MobileDialog component
 * Renders as SwipeableDrawer on mobile and Dialog on desktop
 * Provides swipe-to-dismiss functionality on mobile devices
 */
const MobileDialog = ({
  open,
  onClose,
  onOpen = () => {},
  title,
  children,
  maxWidth = 'sm',
  fullScreen = false,
  disableSwipeToOpen = true,
  ...dialogProps
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Mobile drawer content with drag handle
  const drawerContent = (
    <Box sx={{ 
      height: '90vh',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: 'background.paper',
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      overflow: 'hidden'
    }}>
      {/* Drag Handle */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center',
        pt: 1,
        pb: 0.5,
        cursor: 'grab',
        '&:active': {
          cursor: 'grabbing'
        }
      }}>
        <DragHandleIcon sx={{ color: 'grey.400' }} />
      </Box>
      
      {/* Title Bar */}
      {title && (
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          px: 2,
          pb: 2,
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton 
            edge="end"
            onClick={onClose}
            aria-label="close"
            size="large"
            sx={{ 
              ml: 1,
              // Ensure good touch target
              minWidth: 44,
              minHeight: 44
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      )}
      
      {/* Content */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
        // Prevent iOS bounce
        overscrollBehavior: 'contain'
      }}>
        {children}
      </Box>
    </Box>
  );
  
  // Use SwipeableDrawer on mobile
  if (isMobile) {
    return (
      <SwipeableDrawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        onOpen={onOpen}
        disableSwipeToOpen={disableSwipeToOpen}
        disableDiscovery
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }
        }}
        {...dialogProps}
      >
        {drawerContent}
      </SwipeableDrawer>
    );
  }
  
  // Use regular Dialog on desktop
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullScreen={fullScreen}
      fullWidth
      PaperProps={{
        sx: {
          // Make dialogs more mobile-friendly even on tablets
          m: { xs: 0, sm: 2 },
          maxHeight: { xs: '100vh', sm: 'calc(100vh - 32px)' },
          height: { xs: '100vh', sm: 'auto' }
        }
      }}
      {...dialogProps}
    >
      {children}
    </Dialog>
  );
};

MobileDialog.propTypes = {
  /**
   * If true, the dialog is open
   */
  open: PropTypes.bool.isRequired,
  
  /**
   * Callback fired when the dialog requests to be closed
   */
  onClose: PropTypes.func.isRequired,
  
  /**
   * Callback fired when the drawer requests to be opened (mobile only)
   */
  onOpen: PropTypes.func,
  
  /**
   * Dialog title (shown in mobile drawer header)
   */
  title: PropTypes.string,
  
  /**
   * Dialog content
   */
  children: PropTypes.node,
  
  /**
   * Maximum width of the dialog on desktop
   */
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', false]),
  
  /**
   * If true, the dialog will be full-screen on desktop
   */
  fullScreen: PropTypes.bool,
  
  /**
   * If true, swipe to open is disabled on mobile
   */
  disableSwipeToOpen: PropTypes.bool
};

export default MobileDialog;