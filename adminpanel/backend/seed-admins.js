import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/userModel.js';   // ← change path if your model is in different folder

dotenv.config();

const seedAllAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const admins = [
      {
        firstName: 'Executive',
        lastName: 'User',
        email: 'executive@fundcoai.com',
        password: 'exec123',
        role: 'executive',
        position: 'Executive Director',
      },
      {
        firstName: 'Team',
        lastName: 'Lead',
        email: 'teamlead@fundcoai.com',
        password: 'lead123',
        role: 'team-lead',
        position: 'Team Lead',
        unitSector: 'Operations',
      },
    ];

    for (const adminData of admins) {
      // Delete any existing user with this email
      await User.deleteOne({ email: adminData.email });

      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      const newAdmin = new User({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        otherName: '',
        position: adminData.position || '',
        unitSector: adminData.unitSector || '',
        email: adminData.email.toLowerCase().trim(),
        password: hashedPassword,
        role: adminData.role,
        isActive: true,
        activityLogs: [],
      });

      await newAdmin.save();
      console.log(`✅ Created ${adminData.role.toUpperCase()} → ${adminData.email}`);
    }

    console.log('\n🎉 ALL THREE ADMINS CREATED SUCCESSFULLY!');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('Executive       → executive@fundcoaiopm.com        / exec123');
    console.log('Team Lead       → teamlead@fundcoaiopm.com          / lead123');
    console.log('══════════════════════════════════════════════════════════════');
    console.log('You can now log in with any of the above credentials.');

  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedAllAdmins();