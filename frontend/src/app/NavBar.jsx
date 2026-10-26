// [Person 1 – app shell] Top bar on every page: the FloodLink brand, links for the user's role, the live switches
// (high-priority alerts, location sharing) and logout. On phones the links move into a slide-out menu.
// Rendered by App.jsx.
import { useState } from 'react';
import {
  AppBar, Avatar, Box, Button, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon, ListItemText,
  Stack, Toolbar, Tooltip, Typography,
} from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import InsightsIcon from '@mui/icons-material/Insights';
import LogoutIcon from '@mui/icons-material/Logout';
import MapIcon from '@mui/icons-material/Map';
import MenuIcon from '@mui/icons-material/Menu';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import BrandMark from './BrandMark';
import { logout } from '../features/auth/authSlice';
import { AlertsToggle, LocationToggle } from '../features/live/LiveControls';

// Which links each role sees
function linksForRole(role) {
  const links = [
    { to: '/', label: 'Live map', icon: MapIcon },
    { to: '/post', label: 'Ask for help', icon: CampaignIcon },
  ];
  if (role === 'VOLUNTEER') links.push({ to: '/volunteer', label: 'My tasks', icon: DirectionsRunIcon });
  if (role === 'ADMIN') links.push({ to: '/admin', label: 'Insights', icon: InsightsIcon });
  return links;
}

function UserBadge({ user }) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <Avatar sx={{ width: 32, height: 32, fontSize: 14, fontWeight: 700, bgcolor: 'primary.dark' }}>
        {user.name.charAt(0).toUpperCase()}
      </Avatar>
      <Box sx={{ lineHeight: 1.1 }}>
        <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
        <Typography variant="caption" color="text.secondary">{user.role.toLowerCase()}</Typography>
      </Box>
    </Stack>
  );
}

// The phone menu: the same links and switches, stacked vertically
function MobileMenu({ open, onClose, user, links, pathname, onLogout }) {
  return (
    <Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: 280, p: 2 } }}>
      <UserBadge user={user} />
      <Divider sx={{ my: 2 }} />
      <List disablePadding>
        {links.map((link) => (
          <ListItemButton key={link.to} component={RouterLink} to={link.to} selected={pathname === link.to}
            onClick={onClose} sx={{ borderRadius: 2 }}>
            <ListItemIcon><link.icon /></ListItemIcon>
            <ListItemText primary={link.label} />
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Stack spacing={1} alignItems="flex-start">
        <AlertsToggle showLabel />
        <LocationToggle showLabel />
        <Button color="inherit" startIcon={<LogoutIcon />} onClick={onLogout}>Log out</Button>
      </Stack>
    </Drawer>
  );
}

export default function NavBar() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  function handleLogout() {
    setMenuOpen(false);
    dispatch(logout());
    navigate('/login');
  }

  const links = user ? linksForRole(user.role) : [];

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
        <Box component={RouterLink} to="/" sx={{ color: 'inherit', textDecoration: 'none', flexGrow: 1 }}>
          <BrandMark />
        </Box>
        {user && (
          <>
            <Stack direction="row" spacing={0.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
              {links.map((link) => {
                const active = pathname === link.to;
                return (
                  <Button key={link.to} component={RouterLink} to={link.to} startIcon={<link.icon />}
                    color={active ? 'primary' : 'inherit'}
                    sx={{ px: 1.5, bgcolor: active ? 'rgba(96, 165, 250, 0.12)' : 'transparent', opacity: active ? 1 : 0.85 }}>
                    {link.label}
                  </Button>
                );
              })}
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' }, ml: 1 }}>
              <AlertsToggle />
              <LocationToggle />
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              <UserBadge user={user} />
              <Tooltip title="Log out">
                <IconButton color="inherit" onClick={handleLogout} aria-label="Log out"><LogoutIcon /></IconButton>
              </Tooltip>
            </Stack>
            <IconButton color="inherit" aria-label="Open menu" onClick={() => setMenuOpen(true)}
              sx={{ display: { xs: 'inline-flex', md: 'none' } }}>
              <MenuIcon />
            </IconButton>
            <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} user={user} links={links}
              pathname={pathname} onLogout={handleLogout} />
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
