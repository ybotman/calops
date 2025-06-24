'use client';

import { Box, Typography, Alert, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import PublicIcon from '@mui/icons-material/Public';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import PlaceIcon from '@mui/icons-material/Place';

export default function GeoHierarchyGuide() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Geographic Hierarchy Guide
      </Typography>

      {/* Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            <AccountTreeIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Geographic Organization Structure
          </Typography>
          <Typography variant="body1" paragraph>
            The system organizes all content using a four-level geographic hierarchy:
          </Typography>
          
          <Box sx={{ pl: 2 }}>
            <Typography variant="body1" gutterBottom>
              <PublicIcon sx={{ mr: 1, fontSize: 20, verticalAlign: 'bottom' }} />
              <strong>Country</strong> → Region → Division → City
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Example: United States → West → California → San Francisco
            </Typography>
          </Box>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              All events, venues, and organizers must be assigned to a location in this hierarchy 
              to appear in geographic filters and searches.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Hierarchy Levels */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Hierarchy Levels Explained
          </Typography>

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              1. Country Level
            </Typography>
            <List dense>
              <ListItem>• Top level of organization</ListItem>
              <ListItem>• Currently supports: United States, Canada, Argentina, etc.</ListItem>
              <ListItem>• Each country has its own region structure</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              2. Region Level
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Large geographic areas within a country
            </Typography>
            <List dense>
              <ListItem>• <strong>Region Name</strong> - Display name (e.g., "West Coast")</ListItem>
              <ListItem>• <strong>Region Code</strong> - Short identifier (e.g., "WEST")</ListItem>
              <ListItem>• <strong>Active Status</strong> - Whether region is in use</ListItem>
            </List>
            <Typography variant="body2" sx={{ mt: 1 }}>
              US Examples: Northeast, Southeast, Midwest, Southwest, West
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              3. Division Level
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              State or province-level organization
            </Typography>
            <List dense>
              <ListItem>• <strong>Division Name</strong> - Full name (e.g., "California")</ListItem>
              <ListItem>• <strong>Division Code</strong> - Abbreviation (e.g., "CA")</ListItem>
              <ListItem>• <strong>States Array</strong> - List of states included</ListItem>
              <ListItem>• Maps to one parent region</ListItem>
            </List>
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Some divisions may include multiple states (e.g., "DC-MD-VA" division)
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              4. City Level
              <PlaceIcon sx={{ ml: 1, fontSize: 20, verticalAlign: 'bottom' }} />
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Specific cities or metropolitan areas
            </Typography>
            <List dense>
              <ListItem>• <strong>City Name</strong> - Full city name</ListItem>
              <ListItem>• <strong>City Code</strong> - Short code (e.g., "SF")</ListItem>
              <ListItem>• <strong>Latitude/Longitude</strong> - Precise coordinates</ListItem>
              <ListItem>• <strong>Location</strong> - GeoJSON point for mapping</ListItem>
            </List>
            
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                City-Specific Fields:
              </Typography>
              <List dense>
                <ListItem>• <strong>isFullyManaged</strong> - Admin actively manages this city</ListItem>
                <ListItem>• <strong>isAISkipped</strong> - Skip in AI discovery processes</ListItem>
                <ListItem>• <strong>discoveredQty</strong> - Count of discovered events</ListItem>
                <ListItem>• <strong>discoveredLastDateRun</strong> - Last discovery scan</ListItem>
              </List>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Usage in System */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            How Geo Hierarchy is Used
          </Typography>
          
          <List>
            <ListItem>
              <ListItemText 
                primary="Event Assignment" 
                secondary="Every event must be assigned to a city, which automatically determines its division and region"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Venue Location" 
                secondary="Venues are mapped to cities based on their coordinates and address"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Organizer Scope" 
                secondary="Organizers operate within specific geographic areas"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="User Permissions" 
                secondary="Admins and organizers can be restricted to specific regions/divisions/cities"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Search and Filtering" 
                secondary="Users browse events by selecting country → region → division → city"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Management Notes */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="subtitle1" gutterBottom>
          Geo Hierarchy Management Notes
        </Typography>
        <List dense>
          <ListItem>• Changes to hierarchy affect all related events and venues</ListItem>
          <ListItem>• New cities must be assigned to the correct division</ListItem>
          <ListItem>• Inactive locations are hidden but preserve historical data</ListItem>
          <ListItem>• Coordinate accuracy is critical for map displays</ListItem>
          <ListItem>• Consider metro areas vs individual cities for dense regions</ListItem>
        </List>
      </Alert>

      {/* Technical Details */}
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Technical Implementation
          </Typography>
          <Typography variant="body2" paragraph>
            The geographic hierarchy uses MongoDB references to maintain relationships:
          </Typography>
          <List dense>
            <ListItem>• Each level stores the ObjectId of its parent</ListItem>
            <ListItem>• Indexes optimize geographic queries</ListItem>
            <ListItem>• 2dsphere indexes enable location-based searches</ListItem>
            <ListItem>• All levels are app-specific (multi-tenant support)</ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}