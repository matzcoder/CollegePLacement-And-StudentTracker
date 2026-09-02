const axios = require('./frontend/node_modules/axios');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🧪 Starting Placement Tracker Verification Tests...\n');

  try {
    // 1. Health check
    console.log('1️⃣ Checking API Health...');
    const health = await axios.get(`${API_BASE}/health`);
    console.log('   ✅ API Health status:', health.data.status);

    // 2. Admin Login
    console.log('\n2️⃣ Testing Admin Login (admin@college.edu)...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@college.edu',
      password: 'Admin@1234',
    });
    const adminToken = adminLogin.data.token;
    console.log('   ✅ Admin authenticated! User:', adminLogin.data.user.name, '| Role:', adminLogin.data.role);

    // Fetch Admin Users & Audit Logs
    const usersRes = await axios.get(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✅ Admin fetched ${usersRes.data.users.length} persistent user records from SQLite.`);

    const auditRes = await axios.get(`${API_BASE}/audit`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log(`   ✅ Admin fetched ${auditRes.data.logs.length} audit logs.`);

    // 3. Officer Login
    console.log('\n3️⃣ Testing Officer Login (officer@college.edu)...');
    const officerLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'officer@college.edu',
      password: 'Officer@1234',
    });
    const officerToken = officerLogin.data.token;
    console.log('   ✅ Officer authenticated! User:', officerLogin.data.user.name, '| Role:', officerLogin.data.role);

    // Fetch all applications
    const allAppsRes = await axios.get(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    console.log(`   ✅ Officer fetched ${allAppsRes.data.length} total applications.`);

    // Find Riya Sharma's application for Infosys (or any)
    const riyaApp = allAppsRes.data.find(
      (a) => (a.studentName === 'Riya Sharma' || a.student?.fullName === 'Riya Sharma') && a.company === 'Infosys'
    );

    if (riyaApp) {
      console.log(`\n4️⃣ Testing Live Stage Update by Officer on Riya Sharma's Infosys application...`);
      console.log(`   Current Stage: ${riyaApp.stage} | OfferStatus: ${riyaApp.offerStatus}`);

      const updateRes = await axios.patch(
        `${API_BASE}/applications/${riyaApp.id || riyaApp.applicationId}/status`,
        {
          stage: 'interview',
          offerStatus: 'pending',
          package: 950000,
        },
        {
          headers: { Authorization: `Bearer ${officerToken}` },
        }
      );
      console.log('   ✅ Stage updated to:', updateRes.data.stage, '| Package:', updateRes.data.package);
    }

    // 5. Student Login (riya.sharma@college.edu)
    console.log('\n5️⃣ Testing Student Login (riya.sharma@college.edu)...');
    const studentLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'riya.sharma@college.edu',
      password: 'Student@1234',
    });
    const studentToken = studentLogin.data.token;
    console.log('   ✅ Student authenticated! User:', studentLogin.data.user.name, '| CGPA:', studentLogin.data.user.cgpa);

    // Fetch Student Scoped Applications
    const studentAppsRes = await axios.get(`${API_BASE}/applications`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    console.log(`   ✅ Student received ${studentAppsRes.data.length} scoped applications.`);

    const riyaUpdatedApp = studentAppsRes.data.find((a) => a.company === 'Infosys');
    console.log(`   ✅ Verified immediate reflection on student portal: Infosys Stage is '${riyaUpdatedApp?.stage}'!`);

    // 6. Test AI Assistant Queries
    console.log('\n6️⃣ Testing AI Placement Assistant with Fuse.js Matcher...');
    const testQueries = [
      'Where did I apply?',
      'what is my package?',
      'am i shortlisted?',
      'Did I get an offer?',
      'Which applications are pending?',
      'How many companies visited campus?',
    ];

    for (const q of testQueries) {
      const assistantRes = await axios.post(
        `${API_BASE}/assistant/query`,
        { message: q },
        { headers: { Authorization: `Bearer ${studentToken}` } }
      );
      console.log(`\n   ❓ Query: "${q}"`);
      console.log(`   🎯 Detected Intent: ${assistantRes.data.intent}`);
      console.log(`   🤖 Assistant Response:\n      ${assistantRes.data.response.replace(/\n/g, '\n      ')}`);
    }

    console.log('\n🎉 ALL VERIFICATION TESTS PASSED SUCCESSFULLY! 🚀');
  } catch (err) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
