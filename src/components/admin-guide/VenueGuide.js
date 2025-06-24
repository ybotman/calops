'use client';

import { Box, Typography, Alert, Card, CardContent, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import MapIcon from '@mui/icons-material/Map';

export default function VenueGuide() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Venue Management Guide
      </Typography>

      {/* Known Issues Alert */}
      <Alert severity="error" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Known Issues with Venue Management
        </Typography>
        <Typography variant="body2" paragraph>
          The venue system currently has several issues that admins should be aware of:
        </Typography>
        <List dense>
          <ListItem>• <strong>Edit Issues:</strong> Venue editing may not save all fields correctly</ListItem>
          <ListItem>• <strong>Create Issues:</strong> New venue creation sometimes fails with validation errors</ListItem>
          <ListItem>• <strong>Geo-mapping Issues:</strong> Coordinate validation and map display can be unreliable</ListItem>
          <ListItem>• <strong>Search Issues:</strong> Venue search may not return expected results</ListItem>
        </List>
        <Typography variant="body2" color="error">
          These issues are being addressed in upcoming updates. Use caution when making changes.
        </Typography>
      </Alert>

      {/* Venue Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            What is a Venue?
          </Typography>
          <Typography variant="body1" paragraph>
            A Venue is a physical location where events take place. Venues are:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Location-based entities" 
                secondary="Must have valid address and coordinates"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Reusable across events" 
                secondary="Multiple events can reference the same venue"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Geo-hierarchically organized" 
                secondary="Assigned to city, division, and region"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Data Structure */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Venue Data Structure
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              1. Basic Information
            </Typography>
            <List dense>
              <ListItem>• <strong>Name</strong> - Full venue name</ListItem>
              <ListItem>• <strong>Short Name</strong> - Abbreviated name (optional)</ListItem>
              <ListItem>• <strong>Phone</strong> - Contact number</ListItem>
              <ListItem>• <strong>Comments</strong> - Internal notes</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              2. Address Information
            </Typography>
            <List dense>
              <ListItem>• <strong>Address1</strong> - Primary street address (required)</ListItem>
              <ListItem>• <strong>Address2</strong> - Additional address info</ListItem>
              <ListItem>• <strong>Address3</strong> - Extra address line</ListItem>
              <ListItem>• <strong>City</strong> - City name (required)</ListItem>
              <ListItem>• <strong>State</strong> - State/province code</ListItem>
              <ListItem>• <strong>Zip</strong> - Postal code</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              3. Geolocation Data
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <LocationOnIcon color="primary" />
              <Typography variant="body1">
                Critical for map display and distance calculations
              </Typography>
            </Box>
            <List dense>
              <ListItem>• <strong>Latitude</strong> - Decimal degrees (required)</ListItem>
              <ListItem>• <strong>Longitude</strong> - Decimal degrees (required)</ListItem>
              <ListItem>• <strong>Geolocation</strong> - GeoJSON Point format [longitude, latitude]</ListItem>
              <ListItem>• <strong>isValidVenueGeolocation</strong> - Indicates if coordinates are verified</ListItem>
            </List>
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Note: Coordinates must be in [longitude, latitude] order for GeoJSON compatibility
              </Typography>
            </Alert>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              4. Geographic Hierarchy
            </Typography>
            <List dense>
              <ListItem>• <strong>masteredCityId</strong> - Reference to city in geo hierarchy</ListItem>
              <ListItem>• <strong>masteredDivisionId</strong> - Reference to division/state</ListItem>
              <ListItem>• <strong>masteredRegionId</strong> - Reference to region/country area</ListItem>
              <ListItem>• <strong>masteredCountryId</strong> - Reference to country</ListItem>
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              These references ensure venues appear in the correct geographic filters.
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Geo-mapping Features */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            <MapIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Geo-mapping Features
          </Typography>
          <Typography variant="body1" paragraph>
            The system provides several geo-mapping capabilities:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Map Display" 
                secondary="Venues shown on interactive maps with clustering"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Distance Calculations" 
                secondary="Find venues within X miles of a location"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Geocoding" 
                secondary="Convert addresses to coordinates (when working)"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Validation" 
                secondary="Verify coordinates match the stated address"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Alert severity="info" icon={<InfoIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Best Practices for Venue Management
        </Typography>
        <List dense>
          <ListItem>• Always verify coordinates using an external mapping service</ListItem>
          <ListItem>• Use consistent naming conventions (avoid duplicates)</ListItem>
          <ListItem>• Include landmarks or cross-streets in address fields</ListItem>
          <ListItem>• Set isActive to false instead of deleting venues with history</ListItem>
          <ListItem>• Add helpful information in the comments field for other admins</ListItem>
        </List>
      </Alert>

      {/* Technical Notes */}
      <Card>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            <EditLocationIcon sx={{ mr: 1, verticalAlign: 'bottom' }} />
            Technical Notes
          </Typography>
          <Typography variant="body2" paragraph>
            The venue system uses MongoDB geospatial indexes for efficient location queries. 
            Key technical details:
          </Typography>
          <List dense>
            <ListItem>• 2dsphere index on geolocation field</ListItem>
            <ListItem>• Text search index on name, address, and city</ListItem>
            <ListItem>• Compound indexes for app-specific queries</ListItem>
            <ListItem>• Automatic timestamp updates on save</ListItem>
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}