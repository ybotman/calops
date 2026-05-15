import { useState } from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useAppContext } from '@/lib/AppContext';
import { useAuth } from '@/contexts/AuthContext';
import packageJson from '../../package.json';

// Icons
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import BuildIcon from '@mui/icons-material/Build';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AppsIcon from '@mui/icons-material/Apps';
import EventIcon from '@mui/icons-material/Event';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import PlaceIcon from '@mui/icons-material/Place';
import SchoolIcon from '@mui/icons-material/School';
import HeadphonesIcon from '@mui/icons-material/Headphones';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import GridOnIcon from '@mui/icons-material/GridOn';
import GitHubIcon from '@mui/icons-material/GitHub';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import CloudIcon from '@mui/icons-material/Cloud';
import BugReportIcon from '@mui/icons-material/BugReport';
import TimelineIcon from '@mui/icons-material/Timeline';
import StorageIcon from '@mui/icons-material/Storage';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import MapIcon from '@mui/icons-material/Map';

// Navigation — Activity Heatmaps section (groups all heatmap-style views)
const activityHeatmapItems = [
  { name: 'Site Heatmap',   icon: <GridOnIcon />, href: '/dashboard/analytics/visitor-heatmap' },
  { name: 'Events Heatmap', icon: <GridOnIcon />, href: '/dashboard/analytics/event-creation' },
];

// Navigation — Events Activity section
const eventsActivityItems = [
  { name: 'Audit Trail', icon: <EventIcon />, href: '/dashboard/analytics/event-activity' },
];

// Navigation — User Activity section (Search at bottom per Toby 2026-05-12)
const userActivityItems = [
  { name: 'Login',        icon: <AccessTimeIcon />,   href: '/dashboard/analytics/logins' },
  { name: 'Stream',       icon: <AccessTimeIcon />,   href: '/dashboard/analytics/activity-tracking' },
  { name: 'Map & Center', icon: <MapIcon />,          href: '/dashboard/analytics/activity-map' },
  { name: 'Session Geo',  icon: <CloudIcon />,        href: '/dashboard/analytics/session-geo' },
  { name: 'Search',       icon: <PersonSearchIcon />, href: '/dashboard/analytics/user-activity' },
];

// Navigation — Errors section
const errorsItems = [
  { name: 'API',    icon: <BugReportIcon />, href: '/dashboard/errors/api' },
  { name: 'Trends', icon: <TimelineIcon />,  href: '/dashboard/errors/trends' },
];

// Navigation items - Data section
const dataNavItems = [
  { name: 'Users', icon: <PeopleIcon />, href: '/dashboard/users' },
  { name: 'Organizers', icon: <SchoolIcon />, href: '/dashboard/organizers' },
  { name: 'Venues', icon: <BusinessIcon />, href: '/dashboard/venues' },
  { name: 'Events', icon: <EventIcon />, href: '/dashboard/events' },
  { name: 'Data Health', icon: <HealthAndSafetyIcon />, href: '/dashboard/data-health' },
];

// Navigation items - Other
const otherNavItems = [
  { name: 'Admin Guide', icon: <MenuBookIcon />, href: '/dashboard/admin-guide' },
];

// Organizer Types submenu items
const organizerTypeItems = [
  { name: 'DJ Management', icon: <HeadphonesIcon />, href: '/dashboard/dj-management' },
  { name: 'Teacher Management', icon: <SchoolIcon />, href: '/dashboard/teacher-management' },
  { name: 'Orchestra Management', icon: <MusicNoteIcon />, href: '/dashboard/orchestra-management' },
  { name: 'Venue Management', icon: <BusinessIcon />, href: '/dashboard/venue-management' },
];

const drawerWidth = 240;

// App-specific theming
const appThemes = {
  '1': { // TangoTiempo
    name: 'TangoTiempo',
    headerBg: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)', // Tango red
    headerColor: '#ffffff',
  },
  '2': { // HarmonyJunction
    name: 'HarmonyJunction',
    headerBg: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)', // Barbershop blue
    headerColor: '#ffffff',
  },
  default: {
    name: 'CalOps',
    headerBg: 'linear-gradient(135deg, #424242 0%, #212121 100%)', // Neutral gray
    headerColor: '#ffffff',
  }
};

export default function AdminLayout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { currentApp, updateCurrentApp } = useAppContext();
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [appMenuAnchor, setAppMenuAnchor] = useState(null);
  const [organizerTypesOpen, setOrganizerTypesOpen] = useState(false);
  const [gitOpen, setGitOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAppMenu = (event) => {
    setAppMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const handleAppMenuClose = () => {
    setAppMenuAnchor(null);
  };

  const handleAppChange = (app) => {
    updateCurrentApp(app);
    setAppMenuAnchor(null);
  };

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        py: 1 
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <Box 
            component="img"
            src="/CalOpsWideSmall.jpg"
            alt="Calendar Admin Logo"
            sx={{ 
              height: 40,
              width: 'auto',
              mr: 1
            }}
          />
        </Box>
      </Toolbar>
      <Divider />

      {/* Dashboard Home */}
      <List dense>
        <ListItem disablePadding>
          <ListItemButton component="a" href="/dashboard">
            <ListItemIcon><DashboardIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Activity Heatmaps */}
      <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Activity Heatmaps
      </Typography>
      <List dense>
        {activityHeatmapItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Events Activity */}
      <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Events Activity
      </Typography>
      <List dense>
        {eventsActivityItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* User Activity */}
      <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        User Activity
      </Typography>
      <List dense>
        {userActivityItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Errors */}
      <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Errors
      </Typography>
      <List dense>
        {errorsItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Data Section */}
      <Typography variant="overline" sx={{ px: 2, pt: 1, color: 'text.secondary', fontWeight: 'bold' }}>
        Data
      </Typography>
      <List dense>
        {dataNavItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Other Section */}
      <List dense>
        {otherNavItems.map((item) => (
          <ListItem key={item.name} disablePadding>
            <ListItemButton component="a" href={item.href}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.name} />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Organizer Types with submenu */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setOrganizerTypesOpen(!organizerTypesOpen)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setOrganizerTypesOpen(!organizerTypesOpen);
            }}
            sx={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <ListItemIcon>
              <SupervisorAccountIcon />
            </ListItemIcon>
            <ListItemText primary="Organizer Types" />
            {organizerTypesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={organizerTypesOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            {organizerTypeItems.map((item) => (
              <ListItem key={item.name} disablePadding>
                <ListItemButton component="a" href={item.href} sx={{ pl: 4, touchAction: 'manipulation' }}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>
      </List>
      <Box sx={{ flexGrow: 1 }} />
      <Divider />
      {/* Bottom section - Ops tools */}
      <List dense>
        {/* GIT submenu */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setGitOpen(!gitOpen)}
            onTouchEnd={(e) => {
              e.preventDefault();
              setGitOpen(!gitOpen);
            }}
            sx={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          >
            <ListItemIcon><GitHubIcon /></ListItemIcon>
            <ListItemText primary="GIT" />
            {gitOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={gitOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding dense>
            <ListItem disablePadding>
              <ListItemButton component="a" href="/dashboard/git/pipeline" sx={{ pl: 4, touchAction: 'manipulation' }}>
                <ListItemIcon><GitHubIcon /></ListItemIcon>
                <ListItemText primary="Pipeline" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton component="a" href="/dashboard/git/repos" sx={{ pl: 4, touchAction: 'manipulation' }}>
                <ListItemIcon><StorageIcon /></ListItemIcon>
                <ListItemText primary="Repos" />
              </ListItemButton>
            </ListItem>
          </List>
        </Collapse>

        {/* Infrastructure - now just Vercel */}
        <ListItem disablePadding>
          <ListItemButton component="a" href="/dashboard/infrastructure">
            <ListItemIcon><CloudIcon /></ListItemIcon>
            <ListItemText primary="Deployments" />
          </ListItemButton>
        </ListItem>

        {/* Cost Forecast */}
        <ListItem disablePadding>
          <ListItemButton component="a" href="/dashboard/costs">
            <ListItemIcon><MonetizationOnIcon /></ListItemIcon>
            <ListItemText primary="Cost Forecast" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  // Get theme for current app
  const appTheme = appThemes[currentApp?.id] || appThemes.default;

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: appTheme.headerBg,
          color: appTheme.headerColor,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="subtitle1" noWrap component="div" sx={{ flexGrow: 1 }}>
            <Box onClick={handleAppMenu} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              Current Application: {currentApp.name} <AppsIcon sx={{ ml: 1 }} />
            </Box>
          </Typography>
          
          <Typography variant="caption" sx={{ mr: 2, opacity: 0.7 }}>
            v{packageJson.version}
          </Typography>
          
          
          <Menu
            id="app-menu"
            anchorEl={appMenuAnchor}
            open={Boolean(appMenuAnchor)}
            onClose={handleAppMenuClose}
          >
            <MenuItem onClick={() => handleAppChange({ id: '1', name: 'TangoTiempo' })}>
              TangoTiempo
            </MenuItem>
            <MenuItem onClick={() => handleAppChange({ id: '2', name: 'HarmonyJunction' })}>
              HarmonyJunction
            </MenuItem>
          </Menu>
          
          {user && (
            <Typography variant="body2" sx={{ mr: 1 }}>
              {user.displayName || user.email}
            </Typography>
          )}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar 
              sx={{ width: 32, height: 32 }}
              src={user?.photoURL}
              alt={user?.displayName || user?.email}
            >
              {user && !user.photoURL && (user.displayName || user.email || '').charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better mobile performance
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              touchAction: 'pan-y',
              WebkitOverflowScrolling: 'touch',
            },
          }}
          SlideProps={{
            appear: true,
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1.5, sm: 2, md: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px', // AppBar height
          maxWidth: '100%',
          overflow: 'hidden',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}