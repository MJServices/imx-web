'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';

export default function TestSupabase() {
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    setStatus('Testing connection...');
    
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('intake_forms')
        .select('count')
        .limit(1);
      
      if (error) {
        setStatus(`❌ Error: ${error.message}`);
      } else {
        setStatus('✅ Supabase connection successful!');
      }
    } catch (error) {
      setStatus(`❌ Connection failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const testInsert = async () => {
    setIsLoading(true);
    setStatus('Testing insert...');
    
    try {
      const testData = {
        submission_id: `test_${Date.now()}`,
        first_name: 'Test',
        last_name: 'User',
        phone_number: '555-0123',
        vehicle_year: '2023',
        make: 'Toyota',
        model: 'Camry',
        ownership: 'Financed'
      };

      const { data, error } = await supabase
        .from('intake_forms')
        .insert(testData)
        .select();
      
      if (error) {
        setStatus(`❌ Insert Error: ${error.message}`);
      } else {
        setStatus(`✅ Insert successful! Created record with ID: ${data[0]?.id}`);
      }
    } catch (error) {
      setStatus(`❌ Insert failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Supabase Connection Test
        </h1>
        
        <div className="space-y-4">
          <div className="flex space-x-4">
            <Button 
              onClick={testConnection}
              disabled={isLoading}
            >
              Test Connection
            </Button>
            
            <Button 
              onClick={testInsert}
              disabled={isLoading}
              variant="outline"
            >
              Test Insert
            </Button>
          </div>
          
          {status && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-mono">{status}</p>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Setup Instructions:</h3>
            <ol className="text-sm text-blue-800 space-y-1">
              <li>1. Make sure you've run the SQL from supabase-schema.sql in your Supabase SQL Editor</li>
              <li>2. Check that your .env.local has the correct SUPABASE_URL and SUPABASE_ANON_KEY</li>
              <li>3. Verify Row Level Security policies allow your operations</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}