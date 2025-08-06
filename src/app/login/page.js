'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Container,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Divider,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import AppleIcon from '@mui/icons-material/Apple';
import EmailIcon from '@mui/icons-material/Email';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, error, loginWithGoogle, loginWithApple, loginWithEmail, authRequired } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  // Skip login if auth not required
  useEffect(() => {
    if (!authRequired && !loading) {
      router.push('/dashboard');
    }
  }, [authRequired, loading, router]);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      await loginWithGoogle();
      // Redirect handled by useEffect
    } catch (error) {
      setLoginError(error.message || 'Failed to login with Google');
      setIsLoggingIn(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      await loginWithApple();
      // Redirect handled by useEffect
    } catch (error) {
      setLoginError(error.message || 'Failed to login with Apple');
      setIsLoggingIn(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      await loginWithEmail(email, password);
      // Redirect handled by useEffect
    } catch (error) {
      let errorMessage = 'Failed to login';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else {
        errorMessage = error.message;
      }
      setLoginError(errorMessage);
      setIsLoggingIn(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 1 }}>
            CALOPS Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Calendar Operations Dashboard
          </Typography>
          
          {(error || loginError) && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error || loginError}
            </Alert>
          )}

          {!showEmailForm ? (
            <>
              <Button
                fullWidth
                variant="contained"
                startIcon={<GoogleIcon />}
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                sx={{ mb: 2, py: 1.5 }}
              >
                {isLoggingIn ? <CircularProgress size={24} /> : 'Sign in with Google'}
              </Button>
              
              <Button
                fullWidth
                variant="contained"
                startIcon={<AppleIcon />}
                onClick={handleAppleLogin}
                disabled={isLoggingIn}
                sx={{ 
                  mb: 2, 
                  py: 1.5,
                  backgroundColor: '#000',
                  '&:hover': {
                    backgroundColor: '#333'
                  }
                }}
              >
                {isLoggingIn ? <CircularProgress size={24} /> : 'Sign in with Apple'}
              </Button>
              
              <Divider sx={{ width: '100%', my: 2 }}>OR</Divider>
              
              <Button
                fullWidth
                variant="outlined"
                startIcon={<EmailIcon />}
                onClick={() => setShowEmailForm(true)}
                disabled={isLoggingIn}
                sx={{ py: 1.5 }}
              >
                Sign in with Email
              </Button>
            </>
          ) : (
            <>
              <IconButton
                onClick={() => setShowEmailForm(false)}
                sx={{ alignSelf: 'flex-start', mb: 2 }}
              >
                <ArrowBackIcon />
              </IconButton>
              
              <Box component="form" onSubmit={handleEmailLogin} sx={{ width: '100%' }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoggingIn}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2, py: 1.5 }}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </Box>
            </>
          )}
          
          <Typography variant="caption" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
            Admin access only. Regional Admins and System Admins only.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}