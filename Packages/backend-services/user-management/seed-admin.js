require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

const generateCitizenId = () => 'ADM' + Math.floor(100000 + Math.random() * 900000);

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
  });

  try {
    await User.deleteOne({ email: 'admin@amc.gov.in' }); 
    const adminUser = new User({
      name: 'Super Admin',
      email: 'admin@amc.gov.in',
      mobileNumber: '9876543210',
      password: 'admin123',  
      role: 'admin',
      ward: 'Administrative',
      employeeId: 'ADM001',
      department: 'Administration',
      isActive: true,
      createdByRole: 'system',
      verificationStatus: { mobile: true, email: true },
      citizenId: generateCitizenId(),
    });

    await adminUser.save();
    console.log('Admin created successfully:', adminUser.email);
    console.log('Use password: admin123');
    process.exit(0);

  } catch (err) {
    console.error('Seeder error:', err);
    process.exit(1);
  }
}

seedAdmin();
