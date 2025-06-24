'use client';

import { Box, Typography, Alert, CircularProgress } from '@mui/material';
import { useState } from 'react';

export default function StatusGuide() {
  const [loading, setLoading] = useState(true);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Migration Status
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          This page displays the live migration status from tangotiempo.com
        </Typography>
      </Alert>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
          <CircularProgress size={20} />
        </Box>
      )}

      <Box 
        sx={{ 
          width: '100%', 
          height: 'calc(100vh - 300px)', 
          minHeight: '600px',
          border: '1px solid #e0e0e0',
          borderRadius: 1,
          overflow: 'hidden'
        }}
      >
        <iframe
          src="https://tangotiempo.com/migrated-organizers"
          style={{
            width: '100%',
            height: '100%',
            border: 'none'
          }}
          title="Migration Status"
          onLoad={() => setLoading(false)}
        />
      </Box>
    </Box>
  );
}