import React from 'react';
import Link from 'next/link';
import Logo from './Logo';

interface HeaderProps {
  showNavigation?: boolean;
}

export default function Header({ showNavigation = false }: HeaderProps) {
  return (
    <header className="bg-imx-white border-b-4 border-imx-red shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Logo size="lg" />
          </Link>
          
          {/* Navigation */}
          {showNavigation && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link 
                href="/intake/questions" 
                className="text-imx-black hover:text-imx-red font-medium transition-colors"
              >
                Start Intake
              </Link>
              <Link 
                href="/admin" 
                className="bg-imx-red text-imx-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors font-medium"
              >
                Admin
              </Link>
            </nav>
          )}
          
          {/* Mobile menu button */}
          {showNavigation && (
            <div className="md:hidden">
              <button className="text-imx-black hover:text-imx-red">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}