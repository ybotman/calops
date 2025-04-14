'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to dashboard after a brief delay
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      padding: '0 20px'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Page Not Found</h1>
      <p style={{ marginBottom: '2rem' }}>Redirecting to dashboard...</p>
    </div>
  );
}
