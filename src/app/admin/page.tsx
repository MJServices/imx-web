'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Header from '@/components/Header';
import AdminSubmissions from '@/components/AdminSubmissions';
import { User } from '@supabase/supabase-js';

interface AdminUser extends User {
  user_metadata?: {
    role?: string;
  };
}

export default function AdminPanel() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    numbers: false,
    special: false,
    noCommon: false
  });
  const router = useRouter();

  // Check authentication on page load
  useEffect(() => {
    // For simple password auth, we start with no user
    setIsLoading(false);
  }, []);

  const validatePassword = (pwd: string) => {
    const requirements = {
      length: pwd.length >= 12,
      uppercase: /[A-Z]/.test(pwd),
      lowercase: /[a-z]/.test(pwd),
      numbers: /\d/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
      noCommon: !['password', '123456', 'admin', 'imxauto'].some(common =>
        pwd.toLowerCase().includes(common)
      )
    };

    return requirements;
  };

  const updatePasswordStrength = (pwd: string) => {
    const requirements = validatePassword(pwd);
    const score = Object.values(requirements).filter(Boolean).length;

    if (score < 4) {
      setPasswordStrength('weak');
    } else if (score < 6) {
      setPasswordStrength('medium');
    } else {
      setPasswordStrength('strong');
    }
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    if (newPassword.length > 0) {
      const requirements = validatePassword(newPassword);
      setPasswordRequirements(requirements);
      updatePasswordStrength(newPassword);
      setShowPasswordRequirements(true);
    } else {
      setShowPasswordRequirements(false);
      setPasswordStrength('');
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        numbers: false,
        special: false,
        noCommon: false
      });
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');

    try {
      // Check if email is from IMX Auto Group domain
      if (!email.endsWith('@imxautogroup.com')) {
        setAuthError('Access denied. Only @imxautogroup.com emails are allowed.');
        setIsAuthenticating(false);
        return;
      }

      // Simple password check - you can customize this
      const correctPassword = 'IMXAdmin2024!'; // Change this to your desired password

      if (password !== correctPassword) {
        setAuthError('Invalid password.');
        setIsAuthenticating(false);
        return;
      }

      // Create a mock user object for successful authentication
      const mockUser = {
        id: 'admin-user',
        email: email.trim(),
        user_metadata: { role: 'admin' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setUser(mockUser as AdminUser);
      setAuthError('');
      console.log('Admin signed in:', email);

    } catch (error) {
      console.error('Sign in error:', error);
      setAuthError('An unexpected error occurred.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setUser(null);
      setEmail('');
      setPassword('');
      setAuthError('');
      console.log('Admin signed out');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-imx-gray-50">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-5rem)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imx-red mx-auto"></div>
            <p className="mt-4 text-imx-gray-600">Checking authentication...</p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication form (not signed in or not admin)
  if (!user) {
    return (
      <div className="min-h-screen bg-imx-gray-50">
        <Header />
        <div className="py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-imx-black mb-2">
                Admin Access
              </h1>
              <p className="text-imx-gray-600">
                Sign in with your IMX Auto Group account
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{authError}</p>
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@imxautogroup.com"
                  required
                  disabled={isAuthenticating}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={isAuthenticating}
                />

                {/* Password Strength Indicator */}
                {showPasswordRequirements && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-xs text-imx-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium ${passwordStrength === 'weak' ? 'text-red-600' :
                          passwordStrength === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                        }`}>
                        {passwordStrength.toUpperCase()}
                      </span>
                    </div>

                    {/* Password Requirements */}
                    <div className="text-xs space-y-1">
                      <div className={`flex items-center ${passwordRequirements.length ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.length ? '✓' : '✗'}</span>
                        At least 12 characters
                      </div>
                      <div className={`flex items-center ${passwordRequirements.uppercase ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.uppercase ? '✓' : '✗'}</span>
                        One uppercase letter
                      </div>
                      <div className={`flex items-center ${passwordRequirements.lowercase ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.lowercase ? '✓' : '✗'}</span>
                        One lowercase letter
                      </div>
                      <div className={`flex items-center ${passwordRequirements.numbers ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.numbers ? '✓' : '✗'}</span>
                        One number
                      </div>
                      <div className={`flex items-center ${passwordRequirements.special ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.special ? '✓' : '✗'}</span>
                        One special character
                      </div>
                      <div className={`flex items-center ${passwordRequirements.noCommon ? 'text-green-600' : 'text-red-600'}`}>
                        <span className="mr-1">{passwordRequirements.noCommon ? '✓' : '✗'}</span>
                        No common words
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={isAuthenticating || !email || !password}
                className="w-full bg-imx-red text-white hover:bg-red-700 disabled:bg-imx-gray-300"
              >
                {isAuthenticating ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>


          </div>
        </div>
      </div>
    );
  }

  // Admin panel (authenticated admin user)
  return (
    <div className="min-h-screen bg-imx-gray-50">
      <Header />
      <div className="py-8">
        <div className="max-w-6xl mx-auto">
          {/* Admin Header */}
          <div className="bg-white rounded-lg shadow-lg border border-imx-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-imx-black mb-2">
                  IMX Auto Group - Admin Panel
                </h1>
                <p className="text-imx-gray-600">
                  Welcome back, {user.email}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-imx-gray-500">Signed in as</p>
                  <p className="font-medium text-imx-black">{user.email}</p>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="border-imx-gray-300 text-imx-gray-700 hover:bg-imx-gray-50"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* Admin Dashboard Content */}
          <div className="space-y-6">
            {/* Submissions Management */}
            <AdminSubmissions />
          </div>
        </div>
      </div>
    </div>
  );
}