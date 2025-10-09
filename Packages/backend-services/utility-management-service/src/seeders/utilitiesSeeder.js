const db = require('../models');

// Real Ahmedabad coordinates and locations
async function seedUtilities() {
  try {
    console.log('========================================');
    console.log('🏙️  SEEDING AHMEDABAD UTILITY DATA');
    console.log('========================================\n');

    // Test database connection
    console.log('🔌 Connecting to PostgreSQL database...');
    await db.sequelize.authenticate();
    console.log(`✅ Connected to: ${process.env.POSTGRES_DB}`);
    console.log(`📊 Host: ${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}\n`);

    // Sync all models (create tables if they don't exist)
    console.log('🔄 Synchronizing database models...');
    await db.sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized\n');

    // Clear existing data
    console.log('🗑️  Clearing existing utility data...');
    await db.WaterTank.destroy({ where: {}, truncate: true });
    await db.WasteBin.destroy({ where: {}, truncate: true });
    await db.StreetLight.destroy({ where: {}, truncate: true });
    console.log('✅ Existing data cleared\n');

    // =================================
    // 💧 WATER TANKS - Real Ahmedabad Areas
    // =================================
    console.log('💧 Seeding water supply tanks across Ahmedabad...');
    const waterTanks = await db.WaterTank.bulkCreate([
      // Central Ahmedabad
      {
        zone: 'Ashram Road',
        location: 'Ahmedabad Central Water Tank - Ashram Road',
        capacity: 15000,
        currentLevel: 12500,
        latitude: 23.0225,
        longitude: 72.5714,
        lastRefill: new Date(),
        status: 'active',
        isActive: true
      },
      {
        zone: 'Ellis Bridge',
        location: 'Municipal Water Tank - Ellis Bridge Area',
        capacity: 12000,
        currentLevel: 8500,
        latitude: 23.0258,
        longitude: 72.5820,
        lastRefill: new Date(Date.now() - 3600000), // 1 hour ago
        status: 'active',
        isActive: true
      },
      
      // West Ahmedabad
      {
        zone: 'Vastrapur',
        location: 'Vastrapur Zone Water Storage Tank',
        capacity: 18000,
        currentLevel: 15200,
        latitude: 23.0393,
        longitude: 72.5076,
        lastRefill: new Date(),
        status: 'active',
        isActive: true
      },
      {
        zone: 'Satellite',
        location: 'Satellite Township Water Tank',
        capacity: 14000,
        currentLevel: 9800,
        latitude: 23.0302,
        longitude: 72.5080,
        lastRefill: new Date(Date.now() - 7200000), // 2 hours ago
        status: 'active',
        isActive: true
      },
      {
        zone: 'Bodakdev',
        location: 'Bodakdev Residential Water Tank',
        capacity: 16000,
        currentLevel: 4200,
        latitude: 23.0514,
        longitude: 72.5067,
        lastRefill: new Date(Date.now() - 86400000), // 1 day ago
        status: 'maintenance',
        isActive: true
      },

      // East Ahmedabad
      {
        zone: 'Maninagar',
        location: 'Maninagar Industrial Water Tank',
        capacity: 20000,
        currentLevel: 16800,
        latitude: 22.9965,
        longitude: 72.6187,
        lastRefill: new Date(),
        status: 'active',
        isActive: true
      },
      {
        zone: 'Nikol',
        location: 'Nikol Area Municipal Water Storage',
        capacity: 13000,
        currentLevel: 7800,
        latitude: 23.0638,
        longitude: 72.6450,
        lastRefill: new Date(Date.now() - 14400000), // 4 hours ago
        status: 'active',
        isActive: true
      },

      // North Ahmedabad
      {
        zone: 'Sabarmati',
        location: 'Sabarmati Riverfront Water Tank',
        capacity: 22000,
        currentLevel: 19500,
        latitude: 23.0676,
        longitude: 72.5906,
        lastRefill: new Date(),
        status: 'active',
        isActive: true
      },
      {
        zone: 'Chandkheda',
        location: 'Chandkheda Zone Water Supply Tank',
        capacity: 11000,
        currentLevel: 5200,
        latitude: 23.1258,
        longitude: 72.5676,
        lastRefill: new Date(Date.now() - 21600000), // 6 hours ago
        status: 'active',
        isActive: true
      },

      // South Ahmedabad
      {
        zone: 'Vatva',
        location: 'Vatva Industrial Area Water Tank',
        capacity: 17000,
        currentLevel: 13600,
        latitude: 22.9406,
        longitude: 72.6138,
        lastRefill: new Date(),
        status: 'active',
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${waterTanks.length} water supply tanks\n`);

    // =================================
    // 🗑️ WASTE BINS - Real Ahmedabad Areas
    // =================================
    console.log('🗑️  Seeding waste collection bins across Ahmedabad...');
    const wasteBins = await db.WasteBin.bulkCreate([
      // Central Areas
      {
        zone: 'Law Garden',
        location: 'Law Garden Market - Central Waste Collection',
        capacity: 800,
        currentFill: 680,
        latitude: 23.0225,
        longitude: 72.5714,
        lastCollection: new Date(Date.now() - 43200000), // 12 hours ago
        status: 'full',
        isActive: true
      },
      {
        zone: 'C.G. Road',
        location: 'C.G. Road Commercial Area Waste Bin',
        capacity: 1000,
        currentFill: 750,
        latitude: 23.0320,
        longitude: 72.5308,
        lastCollection: new Date(Date.now() - 21600000), // 6 hours ago
        status: 'full',
        isActive: true
      },
      {
        zone: 'Lal Darwaja',
        location: 'Lal Darwaja Heritage Area Waste Collection',
        capacity: 600,
        currentFill: 280,
        latitude: 23.0225,
        longitude: 72.5947,
        lastCollection: new Date(Date.now() - 7200000), // 2 hours ago
        status: 'normal',
        isActive: true
      },

      // West Ahmedabad
      {
        zone: 'Vastrapur Lake',
        location: 'Vastrapur Lake Park Waste Management',
        capacity: 500,
        currentFill: 320,
        latitude: 23.0393,
        longitude: 72.5076,
        lastCollection: new Date(Date.now() - 14400000), // 4 hours ago
        status: 'normal',
        isActive: true
      },
      {
        zone: 'Gurukul',
        location: 'Gurukul Residential Area Waste Bin',
        capacity: 700,
        currentFill: 420,
        latitude: 23.0448,
        longitude: 72.5147,
        lastCollection: new Date(Date.now() - 10800000), // 3 hours ago
        status: 'normal',
        isActive: true
      },
      {
        zone: 'Thaltej',
        location: 'Thaltej Cross Roads Waste Collection',
        capacity: 650,
        currentFill: 580,
        latitude: 23.0567,
        longitude: 72.5089,
        lastCollection: new Date(Date.now() - 36000000), // 10 hours ago
        status: 'full',
        isActive: true
      },

      // East Ahmedabad
      {
        zone: 'Kalupur Railway Station',
        location: 'Kalupur Station Platform Waste Management',
        capacity: 900,
        currentFill: 720,
        latitude: 23.0225,
        longitude: 72.6017,
        lastCollection: new Date(Date.now() - 28800000), // 8 hours ago
        status: 'full',
        isActive: true
      },
      {
        zone: 'Isanpur',
        location: 'Isanpur Residential Waste Collection Point',
        capacity: 550,
        currentFill: 240,
        latitude: 23.0174,
        longitude: 72.6455,
        lastCollection: new Date(Date.now() - 5400000), // 1.5 hours ago
        status: 'normal',
        isActive: true
      },

      // North Ahmedabad
      {
        zone: 'Kalol Highway',
        location: 'Kalol Highway Commercial Waste Bin',
        capacity: 750,
        currentFill: 630,
        latitude: 23.1167,
        longitude: 72.4833,
        lastCollection: new Date(Date.now() - 50400000), // 14 hours ago
        status: 'full',
        isActive: true
      },
      {
        zone: 'Motera Stadium',
        location: 'Motera Stadium Area Waste Management',
        capacity: 1200,
        currentFill: 840,
        latitude: 23.1030,
        longitude: 72.5947,
        lastCollection: new Date(Date.now() - 32400000), // 9 hours ago
        status: 'full',
        isActive: true
      },

      // South Ahmedabad
      {
        zone: 'SG Highway',
        location: 'SG Highway Commercial Zone Waste Bin',
        capacity: 800,
        currentFill: 480,
        latitude: 23.0225,
        longitude: 72.4664,
        lastCollection: new Date(Date.now() - 18000000), // 5 hours ago
        status: 'normal',
        isActive: true
      },
      {
        zone: 'Jivraj Park',
        location: 'Jivraj Park Residential Waste Collection',
        capacity: 600,
        currentFill: 380,
        latitude: 22.9847,
        longitude: 72.5214,
        lastCollection: new Date(Date.now() - 12600000), // 3.5 hours ago
        status: 'normal',
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${wasteBins.length} waste collection bins\n`);

    // =================================
    // 💡 STREET LIGHTS - Real Ahmedabad Areas
    // =================================
    console.log('💡 Seeding street light networks across Ahmedabad...');
    const streetLights = await db.StreetLight.bulkCreate([
      // Major Roads and Highways
      {
        zone: 'Ashram Road',
        location: 'Ashram Road - Paldi to Ellisbridge Stretch',
        totalLights: 120,
        workingLights: 115,
        latitude: 23.0225,
        longitude: 72.5714,
        lastMaintenance: new Date(Date.now() - 172800000), // 2 days ago
        status: 'operational',
        isActive: true
      },
      {
        zone: 'S.G. Highway',
        location: 'S.G. Highway - Gota to Bopal Stretch',
        totalLights: 200,
        workingLights: 185,
        latitude: 23.0589,
        longitude: 72.4664,
        lastMaintenance: new Date(Date.now() - 86400000), // 1 day ago
        status: 'operational',
        isActive: true
      },
      {
        zone: 'C.G. Road',
        location: 'C.G. Road Commercial Area Lighting',
        totalLights: 80,
        workingLights: 72,
        latitude: 23.0320,
        longitude: 72.5308,
        lastMaintenance: new Date(Date.now() - 259200000), // 3 days ago
        status: 'partial',
        isActive: true
      },

      // Residential Areas
      {
        zone: 'Vastrapur',
        location: 'Vastrapur Residential Zone Lighting',
        totalLights: 95,
        workingLights: 89,
        latitude: 23.0393,
        longitude: 72.5076,
        lastMaintenance: new Date(),
        status: 'operational',
        isActive: true
      },
      {
        zone: 'Satellite',
        location: 'Satellite Township Street Lighting',
        totalLights: 110,
        workingLights: 98,
        latitude: 23.0302,
        longitude: 72.5080,
        lastMaintenance: new Date(Date.now() - 432000000), // 5 days ago
        status: 'operational',
        isActive: true
      },
      {
        zone: 'Maninagar',
        location: 'Maninagar Industrial Area Lighting',
        totalLights: 85,
        workingLights: 61,
        latitude: 22.9965,
        longitude: 72.6187,
        lastMaintenance: new Date(Date.now() - 604800000), // 7 days ago
        status: 'partial',
        isActive: true
      },

      // Heritage and Tourist Areas
      {
        zone: 'Sabarmati Riverfront',
        location: 'Sabarmati Riverfront Promenade Lighting',
        totalLights: 150,
        workingLights: 147,
        latitude: 23.0676,
        longitude: 72.5906,
        lastMaintenance: new Date(),
        status: 'operational',
        isActive: true
      },
      {
        zone: 'Old City - Pol Areas',
        location: 'Heritage Pol Areas Traditional Lighting',
        totalLights: 65,
        workingLights: 58,
        latitude: 23.0225,
        longitude: 72.5947,
        lastMaintenance: new Date(Date.now() - 345600000), // 4 days ago
        status: 'partial',
        isActive: true
      },

      // Commercial and IT Areas
      {
        zone: 'Prahlad Nagar',
        location: 'Prahlad Nagar IT Hub Street Lighting',
        totalLights: 130,
        workingLights: 125,
        latitude: 23.0226,
        longitude: 72.4946,
        lastMaintenance: new Date(Date.now() - 86400000), // 1 day ago
        status: 'operational',
        isActive: true
      },
      {
        zone: 'GIFT City Approach',
        location: 'GIFT City Connection Road Lighting',
        totalLights: 180,
        workingLights: 174,
        latitude: 23.1667,
        longitude: 72.6833,
        lastMaintenance: new Date(),
        status: 'operational',
        isActive: true
      },

      // Airport and Connectivity
      {
        zone: 'Airport Road',
        location: 'Sardar Vallabhbhai Patel Airport Road',
        totalLights: 140,
        workingLights: 132,
        latitude: 23.0726,
        longitude: 72.6341,
        lastMaintenance: new Date(Date.now() - 172800000), // 2 days ago
        status: 'operational',
        isActive: true
      },
      {
        zone: 'Ring Road',
        location: 'Ahmedabad Ring Road - Eastern Sector',
        totalLights: 220,
        workingLights: 198,
        latitude: 23.0896,
        longitude: 72.6341,
        lastMaintenance: new Date(Date.now() - 259200000), // 3 days ago
        status: 'operational',
        isActive: true
      }
    ]);
    console.log(`✅ Seeded ${streetLights.length} street lighting zones\n`);

    // =================================
    // 📊 SUMMARY STATISTICS
    // =================================
    console.log('========================================');
    console.log('🎉 AHMEDABAD UTILITY DATA SEEDED!');
    console.log('========================================');
    console.log('📊 SEEDING SUMMARY:');
    console.log(`  💧 Water Supply Tanks: ${waterTanks.length} locations`);
    console.log(`  🗑️  Waste Collection Bins: ${wasteBins.length} locations`);
    console.log(`  💡 Street Light Networks: ${streetLights.length} zones`);
    console.log(`  🏙️  Total Infrastructure Points: ${waterTanks.length + wasteBins.length + streetLights.length}`);
    console.log('========================================');

    // Calculate and display statistics
    const totalWaterCapacity = waterTanks.reduce((sum, tank) => sum + tank.capacity, 0);
    const totalWaterLevel = waterTanks.reduce((sum, tank) => sum + tank.currentLevel, 0);
    const avgWaterLevel = ((totalWaterLevel / totalWaterCapacity) * 100).toFixed(1);

    const totalWasteCapacity = wasteBins.reduce((sum, bin) => sum + bin.capacity, 0);
    const totalWasteFill = wasteBins.reduce((sum, bin) => sum + bin.currentFill, 0);
    const avgWasteFill = ((totalWasteFill / totalWasteCapacity) * 100).toFixed(1);

    const totalLights = streetLights.reduce((sum, light) => sum + light.totalLights, 0);
    const workingLights = streetLights.reduce((sum, light) => sum + light.workingLights, 0);
    const lightEfficiency = ((workingLights / totalLights) * 100).toFixed(1);

    console.log('📈 INFRASTRUCTURE STATISTICS:');
    console.log(`  💧 Average Water Level: ${avgWaterLevel}%`);
    console.log(`  🗑️  Average Waste Fill: ${avgWasteFill}%`);
    console.log(`  💡 Street Light Efficiency: ${lightEfficiency}%`);
    console.log(`  📍 Geographic Coverage: Entire Ahmedabad Municipal Corporation`);
    console.log('========================================\n');

    // Close database connection
    await db.sequelize.close();
    console.log('✅ Database connection closed successfully');
    console.log('🎯 Ready for real-time utility monitoring!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n========================================');
    console.error('❌ SEEDING FAILED');
    console.error('========================================');
    console.error('Error Details:', error.message);
    if (error.stack) {
      console.error('Stack Trace:', error.stack);
    }
    console.error('========================================\n');
    
    try {
      await db.sequelize.close();
    } catch (closeError) {
      console.error('❌ Error closing database:', closeError.message);
    }
    
    process.exit(1);
  }
}

// Execute the seeder
if (require.main === module) {
  console.log('🚀 Starting Ahmedabad Utility Data Seeding Process...\n');
  seedUtilities();
}

module.exports = seedUtilities;
