import { Inter } from 'next/font/google';
import { ThemeRegistry } from '@/components/ThemeRegistry';
import { AuthProvider } from '@/lib/firebase-auth';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Calendar Admin',
  description: 'Administration for the Calendar Backend',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeRegistry>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeRegistry>
      </body>
    </html>
  );
}