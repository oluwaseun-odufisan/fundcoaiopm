import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from './models/adminModel.js';

dotenv.config();

const debugLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'oluwaseun.odufisan@gmail.com';     // ← change if you used a different email
    const plainPassword = 'admin*123#';           // ← change to the password you are typing in login

    console.log('\n🔍 Checking admin with email:', email);

    const admin = await Admin.findOne({ email }).select('+password'); // force include password

    if (!admin) {
      console.log('❌ No admin found with this email!');
      return;
    }

    console.log('✅ Admin found!');
    console.log('   Role:', admin.role);
    console.log('   isActive:', admin.isActive);
    console.log('   Stored password (first 30 chars):', admin.password.substring(0, 30) + '...');

    // Check if it looks like a bcrypt hash
    const looksHashed = admin.password.startsWith('$2a$') || admin.password.startsWith('$2b$');
    console.log('   Looks like hashed password?', looksHashed ? 'YES ✅' : 'NO ❌ (this is the problem!)');

    // Test the compare method that your login uses
    const matched = await admin.comparePassword(plainPassword);
    console.log('\n🔑 comparePassword result:', matched ? '✅ MATCHES (login should work)' : '❌ DOES NOT MATCH');

    if (!matched) {
      console.log('\n💡 Problem found: Either the stored password is plain text, or the wrong password was used when seeding.');
    }

  } catch (err) {
    console.error('❌ Debug error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

debugLogin();