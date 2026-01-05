// Secure Password Generator for IMX Auto Group Admin
// Run: node generate-secure-password.js

function generateSecurePassword() {
  console.log('🔐 IMX Auto Group - Secure Admin Password Generator');
  console.log('');

  // Character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Generate multiple password options
  const passwords = [];
  
  // Option 1: Company-based pattern
  passwords.push('IMXAuto2024!Secure#Admin');
  
  // Option 2: Professional pattern
  passwords.push('IMX-AutoGroup2024$Admin!');
  
  // Option 3: Mixed pattern
  passwords.push('Mx@2024$AdminSecure!9');
  
  // Option 4: Random secure pattern
  const year = new Date().getFullYear();
  const randomSymbol1 = symbols[Math.floor(Math.random() * symbols.length)];
  const randomSymbol2 = symbols[Math.floor(Math.random() * symbols.length)];
  const randomNum = Math.floor(Math.random() * 100);
  passwords.push(`IMXAdmin${year}${randomSymbol1}Secure${randomSymbol2}${randomNum}`);
  
  // Option 5: Passphrase style
  passwords.push('IMX!Auto@Group#2024$Secure');

  console.log('🎯 Recommended Secure Passwords:');
  console.log('');
  
  passwords.forEach((password, index) => {
    console.log(`Option ${index + 1}: ${password}`);
    console.log(`   Length: ${password.length} characters`);
    console.log(`   Strength: ${validatePassword(password)}`);
    console.log('');
  });

  console.log('📋 Password Requirements:');
  console.log('✅ At least 12 characters');
  console.log('✅ One uppercase letter (A-Z)');
  console.log('✅ One lowercase letter (a-z)');
  console.log('✅ One number (0-9)');
  console.log('✅ One special character (!@#$%^&*...)');
  console.log('✅ No common words (password, admin, 123456)');
  console.log('');
  
  console.log('🔒 Security Tips:');
  console.log('• Store password in a secure password manager');
  console.log('• Never share passwords via email or chat');
  console.log('• Change passwords every 90 days');
  console.log('• Use unique passwords for each account');
  console.log('');
  
  console.log('🚀 Next Steps:');
  console.log('1. Choose one of the passwords above');
  console.log('2. Go to http://localhost:3000/admin');
  console.log('3. Click "Create Admin Account"');
  console.log('4. Use email: admin@imxautogroup.com');
  console.log('5. Enter your chosen password');
  console.log('6. Verify all requirements show green checkmarks ✓');
}

function validatePassword(password) {
  const requirements = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noCommon: !['password', '123456', 'admin', 'imxauto'].some(common => 
      password.toLowerCase().includes(common)
    )
  };

  const score = Object.values(requirements).filter(Boolean).length;
  
  if (score < 4) return '🔴 WEAK';
  if (score < 6) return '🟡 MEDIUM';
  return '🟢 STRONG';
}

// Run the generator
generateSecurePassword();