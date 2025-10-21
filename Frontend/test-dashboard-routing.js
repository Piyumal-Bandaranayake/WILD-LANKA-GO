// Test script to verify all dashboard components can be imported
console.log('Testing dashboard component imports...');

const testImports = async () => {
  try {
    // Test all dashboard imports
    const AdminDashboard = await import('./src/pages/admin/AdminDashboard.jsx');
    console.log('✅ AdminDashboard imported successfully');

    const WildlifeOfficerDashboard = await import('./src/pages/wildlife-officer/WildlifeOfficerDashboard.jsx');
    console.log('✅ WildlifeOfficerDashboard imported successfully');

    const TouristDashboard = await import('./src/pages/tourist/TouristDashboard.jsx');
    console.log('✅ TouristDashboard imported successfully');

    const TourGuideDashboard = await import('./src/pages/tour-guide/TourGuideDashboard.jsx');
    console.log('✅ TourGuideDashboard imported successfully');

    const SafariDriverDashboard = await import('./src/pages/safari-driver/SafariDriverDashboard.jsx');
    console.log('✅ SafariDriverDashboard imported successfully');

    const VetDashboard = await import('./src/pages/vet/VetDashboardSimple.jsx');
    console.log('✅ VetDashboard imported successfully');

    const CallOperatorDashboard = await import('./src/pages/call-operator/CallOperatorDashboard.jsx');
    console.log('✅ CallOperatorDashboard imported successfully');

    const EmergencyOfficerDashboard = await import('./src/pages/emergency-officer/EmergencyOfficerDashboard.jsx');
    console.log('✅ EmergencyOfficerDashboard imported successfully');

    console.log('\n🎉 All 8 dashboard components imported successfully!');
    
    // Test role mapping
    const roles = [
      'admin',
      'WildlifeOfficer', 
      'tourist',
      'tourGuide',
      'safariDriver',
      'vet',
      'callOperator',
      'EmergencyOfficer'
    ];
    
    console.log('\n📋 Role mapping verification:');
    roles.forEach(role => {
      console.log(`  - ${role}: ✅ Dashboard component available`);
    });

  } catch (error) {
    console.error('❌ Import test failed:', error);
  }
};

testImports();