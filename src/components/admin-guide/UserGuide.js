'use client';

import { Box, Typography, Alert, Card, CardContent, Divider, List, ListItem, ListItemText } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

export default function UserGuide() {
  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        User Management Guide
      </Typography>

      {/* Authentication Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Authentication Model
          </Typography>
          <Typography variant="body1" paragraph>
            The system uses Firebase Authentication as the primary authentication provider. Each user has:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Firebase User ID" 
                secondary="Unique identifier from Firebase - this is the primary key for authentication"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="UserLogin Record" 
                secondary="Local database record that extends Firebase data with app-specific information"
              />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* Important Note about Multiple Providers */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Multiple Provider Accounts
        </Typography>
        <Typography variant="body2">
          Currently, if a user signs in with Google and later with Facebook using the same email, 
          these are treated as <strong>separate users</strong> in the system. Future updates may include 
          account merging functionality.
        </Typography>
      </Alert>

      {/* User Data Structure */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            User Data Structure
          </Typography>
          
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              1. Firebase User Info
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Synced from Firebase Authentication:
            </Typography>
            <List dense>
              <ListItem>• Email address</ListItem>
              <ListItem>• Display name</ListItem>
              <ListItem>• Provider information (Google, Facebook, Email)</ListItem>
              <ListItem>• Email verification status</ListItem>
              <ListItem>• Last sign-in time</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              2. Local User Info
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Application-specific user data:
            </Typography>
            <List dense>
              <ListItem>• First and last name</ListItem>
              <ListItem>• Login username</ListItem>
              <ListItem>• Approval status (isApproved, isEnabled, isActive)</ListItem>
              <ListItem>• Default city preference</ListItem>
              <ListItem>• Communication preferences</ListItem>
              <ListItem>• Subscribed events and favorite organizers</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              3. Regional Organizer Info
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              If user is connected to an organizer:
            </Typography>
            <List dense>
              <ListItem>• Linked organizer ID</ListItem>
              <ListItem>• Approval and activation status</ListItem>
              <ListItem>• Allowed geographic regions</ListItem>
            </List>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              4. Regional Admin Info
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Administrative permissions:
            </Typography>
            <List dense>
              <ListItem>• Admin approval status</ListItem>
              <ListItem>• Allowed administrative regions</ListItem>
              <ListItem>• Communication settings for admin functions</ListItem>
            </List>
          </Box>
        </CardContent>
      </Card>

      {/* Roles and Permissions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" color="primary" gutterBottom>
            Roles System
          </Typography>
          <Typography variant="body1" paragraph>
            Users are assigned roles that determine their permissions:
          </Typography>
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mt: 2 }}>
            User Roles:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Named User (NU) - Milonguero" 
                secondary="Default role for all authenticated users - can browse and subscribe to events"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="Regional Organizer (RO)" 
                secondary="Can create and manage events, edit their organizer profile"
              />
            </ListItem>
          </List>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            System Owner Roles:
          </Typography>
          <List>
            <ListItem>
              <ListItemText 
                primary="Regional Admin (RA)" 
                secondary="System owner role - manages users and content within assigned regions"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="System Admin (SA)" 
                secondary="System owner role - full administrative access across all regions"
              />
            </ListItem>
            <ListItem>
              <ListItemText 
                primary="System Operator (SO)" 
                secondary="System owner role - operational management and monitoring capabilities"
              />
            </ListItem>
          </List>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> RA, SA, and SO are system owner roles with elevated privileges. 
              These roles are typically assigned to platform administrators and support staff.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Key Concepts */}
      <Alert severity="info" icon={<InfoIcon />}>
        <Typography variant="subtitle1" gutterBottom>
          Key Concept: User-Organizer Relationship
        </Typography>
        <Typography variant="body2">
          Users and Organizers are separate entities. A user can be linked to an organizer profile, 
          which grants them permission to manage that organizer's events. The organizer connection 
          is bidirectional - both the user and organizer records reference each other.
        </Typography>
      </Alert>
    </Box>
  );
}