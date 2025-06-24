'use client';

import { Box, Typography, Alert, Card, CardContent, Divider, List, ListItem, ListItemText, Chip, Grid } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import EventIcon from '@mui/icons-material/Event';
import RepeatIcon from '@mui/icons-material/Repeat';
import CategoryIcon from '@mui/icons-material/Category';
import GroupsIcon from '@mui/icons-material/Groups';

export default function EventGuide() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Event Management Guide
      </Typography>

      {/* Event Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            <EventIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Event System Overview
          </Typography>
          <Typography variant="body1" paragraph>
            Events are the core content of the system. They represent activities that happen at specific 
            times and locations. Events are created and managed by organizers.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip label="Festivals" color="primary" size="small" />
            <Chip label="Workshops" color="primary" size="small" />
            <Chip label="Milongas" color="primary" size="small" />
            <Chip label="Classes" color="primary" size="small" />
            <Chip label="Practices" color="primary" size="small" />
            <Chip label="Concerts" color="primary" size="small" />
          </Box>
        </CardContent>
      </Card>

      {/* Data Structure */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Event Data Structure
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              1. Basic Information
            </Typography>
            <List dense>
              <ListItem>• <strong>Title</strong> - Main event name (required)</ListItem>
              <ListItem>• <strong>Standards Title</strong> - Normalized title for consistency</ListItem>
              <ListItem>• <strong>Short Title</strong> - Abbreviated version</ListItem>
              <ListItem>• <strong>Description</strong> - Full event details</ListItem>
              <ListItem>• <strong>Cost</strong> - Pricing information</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              2. Date and Time
            </Typography>
            <List dense>
              <ListItem>• <strong>Start Date</strong> - When event begins (required)</ListItem>
              <ListItem>• <strong>End Date</strong> - When event ends</ListItem>
              <ListItem>• <strong>Is All Day</strong> - Flag for all-day events</ListItem>
              <ListItem>• <strong>Expires At</strong> - When event should be removed from listings</ListItem>
            </List>
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Events automatically expire 30 days after end date unless otherwise specified
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              3. Categories
              <CategoryIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'bottom' }} />
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Events can have up to three category levels for classification:
            </Typography>
            <List dense>
              <ListItem>• <strong>Category First</strong> - Primary category (e.g., "Workshop")</ListItem>
              <ListItem>• <strong>Category Second</strong> - Sub-category (e.g., "Weekend Workshop")</ListItem>
              <ListItem>• <strong>Category Third</strong> - Specific type (e.g., "Intermediate Level")</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              4. Organizer Relationships
              <GroupsIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'bottom' }} />
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold">Owner Organizer</Typography>
                <Typography variant="body2" color="text.secondary">
                  Primary organizer who created/owns the event
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold">Granted Organizer</Typography>
                <Typography variant="body2" color="text.secondary">
                  Co-organizer with management permissions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="body2" fontWeight="bold">Alternate Organizer</Typography>
                <Typography variant="body2" color="text.secondary">
                  Additional organizer for special cases
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              5. Location Information
            </Typography>
            <List dense>
              <ListItem>• <strong>Venue ID</strong> - Reference to venue record</ListItem>
              <ListItem>• <strong>Location Name</strong> - Override venue name if needed</ListItem>
              <ListItem>• <strong>Venue Geolocation</strong> - Coordinates from venue</ListItem>
              <ListItem>• <strong>Mastered City/Division/Region</strong> - Geographic hierarchy</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              6. Images
            </Typography>
            <List dense>
              <ListItem>• <strong>Event Image</strong> - Main event photo</ListItem>
              <ListItem>• <strong>Banner Image</strong> - Header image</ListItem>
              <ListItem>• <strong>Featured Image</strong> - For homepage features</ListItem>
              <ListItem>• <strong>Series Images</strong> - Multiple images array</ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Status Flags */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Event Status Flags
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Visibility Flags
              </Typography>
              <List dense>
                <ListItem>• <strong>isActive</strong> - Event is visible</ListItem>
                <ListItem>• <strong>isFeatured</strong> - Show in featured section</ListItem>
                <ListItem>• <strong>isCanceled</strong> - Event was canceled</ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Source Flags
              </Typography>
              <List dense>
                <ListItem>• <strong>isDiscovered</strong> - Found via discovery</ListItem>
                <ListItem>• <strong>isOwnerManaged</strong> - Managed by owner</ListItem>
                <ListItem>• <strong>isBtcImported</strong> - Imported from BTC</ListItem>
                <ListItem>• <strong>isAiGenerated</strong> - Created by AI</ListItem>
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Recurring Events */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            <RepeatIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Recurring Events
          </Typography>
          <Typography variant="body1" paragraph>
            Events can repeat using recurrence rules:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Recurrence Rule" 
                secondary="RRULE format string defines repeat pattern"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Is Repeating Flag" 
                secondary="Indicates if event has recurrence"
              />
            </ListItem>
          </List>
          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2">
              Recurring events create individual instances for each occurrence. 
              Changes to the series require special handling.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="subtitle1" gutterBottom>
          Event Management Best Practices
        </Typography>
        <List dense>
          <ListItem>• Always verify venue assignment and coordinates</ListItem>
          <ListItem>• Use consistent category naming across similar events</ListItem>
          <ListItem>• Set appropriate expiration dates for long-running events</ListItem>
          <ListItem>• Include complete description with schedule details</ListItem>
          <ListItem>• Upload high-quality images in correct dimensions</ListItem>
          <ListItem>• Mark canceled events instead of deleting them</ListItem>
        </List>
      </Alert>
    </Box>
  );
}