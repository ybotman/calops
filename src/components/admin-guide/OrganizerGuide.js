'use client';

import { Box, Typography, Alert, Card, CardContent, Divider, List, ListItem, ListItemText, Chip } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';

export default function OrganizerGuide() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Organizer Management Guide
      </Typography>

      {/* Ownership Model */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Important: Organizer Ownership Model
        </Typography>
        <Typography variant="body2" paragraph>
          Organizers manage their own profiles and events, but the <strong>admin owns the UserLogin records</strong>. 
          This means:
        </Typography>
        <List dense>
          <ListItem>• Admins control user access and permissions</ListItem>
          <ListItem>• Organizers control their public information and events</ListItem>
          <ListItem>• Changes to user permissions don't affect organizer data</ListItem>
        </List>
      </Alert>

      {/* Organizer Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            What is an Organizer?
          </Typography>
          <Typography variant="body1" paragraph>
            An Organizer is an entity that creates and manages events. They can be:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            <Chip icon={<PersonIcon />} label="Event Organizer" color="primary" />
            <Chip icon={<BusinessIcon />} label="Venue" color="secondary" />
            <Chip label="Teacher" />
            <Chip label="Maestro" />
            <Chip label="DJ" />
            <Chip label="Orchestra" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            Most organizers are "Event Organizers" but can have multiple types.
          </Typography>
        </CardContent>
      </Card>

      {/* Data Structure */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Organizer Data Structure
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              1. Basic Information
            </Typography>
            <List dense>
              <ListItem>• Full Name - Public display name</ListItem>
              <ListItem>• Short Name - Abbreviated version</ListItem>
              <ListItem>• Description - Public bio/description</ListItem>
              <ListItem>• Public Contact Info - Phone, email, website, address</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              2. Status Flags
            </Typography>
            <List dense>
              <ListItem>• <strong>isActive</strong> - Currently active organizer</ListItem>
              <ListItem>• <strong>isEnabled</strong> - Allowed to create/manage events</ListItem>
              <ListItem>• <strong>wantRender</strong> - Wants profile page generated</ListItem>
              <ListItem>• <strong>isRendered</strong> - Profile page has been generated</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              3. User Connection
            </Typography>
            <List dense>
              <ListItem>• <strong>linkedUserLogin</strong> - Reference to UserLogin record</ListItem>
              <ListItem>• <strong>firebaseUserId</strong> - Direct Firebase UID reference</ListItem>
              <ListItem>• <strong>delegatedOrganizerIds</strong> - Other organizers they can manage</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              4. Location Assignment
            </Typography>
            <List dense>
              <ListItem>• Mastered Region ID</ListItem>
              <ListItem>• Mastered Division ID</ListItem>
              <ListItem>• Mastered City ID</ListItem>
            </List>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              These determine where the organizer operates and where their events appear.
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              5. Images
            </Typography>
            <List dense>
              <ListItem>• Banner Image - Header image for profile</ListItem>
              <ListItem>• Profile Image - Avatar/logo</ListItem>
              <ListItem>• Landscape Image - Wide format image</ListItem>
              <ListItem>• Logo Image - Square logo</ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* User-Organizer Connection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            User-Organizer Connection Process
          </Typography>
          <Typography variant="body1" paragraph>
            When connecting a user to an organizer:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="1. Link User Action" 
                secondary="Admin uses 'Link User' button in Organizer Management"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="2. Bidirectional Update" 
                secondary="Both UserLogin and Organizer records are updated with references"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="3. Role Assignment" 
                secondary="User automatically receives 'Regional Organizer' role if not present"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="4. Permission Activation" 
                secondary="User can now manage the organizer's events and profile"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Key Concepts */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="subtitle1" gutterBottom>
          Key Concept: Organizer Independence
        </Typography>
        <Typography variant="body2">
          Organizers can exist without a linked user. This allows admins to create organizer profiles 
          for venues or entities that haven't claimed their profile yet. The organizer data remains 
          intact even if the linked user is removed or disabled.
        </Typography>
      </Alert>
    </Box>
  );
}