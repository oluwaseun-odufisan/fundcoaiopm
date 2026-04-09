import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from './models/adminModel.js';

dotenv.config();

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const email = 'oluwaseun.odufisan@gmail.com';
    const plainPassword = 'admin*123#';          // ← VERY SIMPLE PASSWORD

    // Delete old record
    await Admin.deleteOne({ email });
    console.log('🗑️ Old record deleted');

    // Create fresh super-admin
    const superAdmin = new Admin({
      firstName: 'Oluwaseun',
      lastName: 'Odufisan',
      email,
      password: plainPassword,
      role: 'super-admin',
      isActive: true,
      notifications: true,
    });

    await superAdmin.save();

    console.log('\n🎉 SUPER ADMIN CREATED!');
    console.log('══════════════════════════════════════');
    console.log('EMAIL:    ', email);
    console.log('PASSWORD: ', plainPassword);
    console.log('══════════════════════════════════════');
    console.log('→ Go to the login page and use EXACTLY these credentials');

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedSuperAdmin();