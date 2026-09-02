const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data
  await prisma.auditLog.deleteMany({});
  await prisma.application.deleteMany({});
  await prisma.placementDrive.deleteMany({});
  await prisma.company.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Existing data cleaned.');

  // Password hashes
  const adminPasswordHash = await bcrypt.hash('Admin@1234', 10);
  const officerPasswordHash = await bcrypt.hash('Officer@1234', 10);
  const studentPasswordHash = await bcrypt.hash('Student@1234', 10);

  // 1. Create Admin & Officer
  const admin = await prisma.user.create({
    data: {
      email: 'admin@college.edu',
      passwordHash: adminPasswordHash,
      fullName: 'Dr. A. K. Sharma (Principal / Admin)',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const officer = await prisma.user.create({
    data: {
      email: 'officer@college.edu',
      passwordHash: officerPasswordHash,
      fullName: 'Prof. Rajesh Nair (Head of Placements)',
      role: 'OFFICER',
      isActive: true,
    },
  });

  // 2. Create Students (~28 students)
  const studentDataList = [
    { email: 'riya.sharma@college.edu', fullName: 'Riya Sharma', rollNumber: '21CS045', department: 'CSE', cgpa: 8.7, activeBacklogs: 0 },
    { email: 'riya.s.sharma@college.edu', fullName: 'Riya S. Sharma', rollNumber: '21CS046', department: 'CSE', cgpa: 8.4, activeBacklogs: 0 },
    { email: 'riya.sharmila@college.edu', fullName: 'Riya Sharmila', rollNumber: '21IT022', department: 'IT', cgpa: 7.9, activeBacklogs: 0 },
    { email: 'rahul.kumar@college.edu', fullName: 'Rahul Kumar', rollNumber: '21IT032', department: 'IT', cgpa: 7.2, activeBacklogs: 1 },
    { email: 'aman.verma@college.edu', fullName: 'Aman Verma', rollNumber: '21ECE015', department: 'ECE', cgpa: 6.5, activeBacklogs: 2 },
    { email: 'priya.patel@college.edu', fullName: 'Priya Patel', rollNumber: '21CS078', department: 'CSE', cgpa: 9.3, activeBacklogs: 0 },
    { email: 'sneha.reddy@college.edu', fullName: 'Sneha Reddy', rollNumber: '21CS102', department: 'CSE', cgpa: 8.9, activeBacklogs: 0 },
    { email: 'vikram.singh@college.edu', fullName: 'Vikram Singh', rollNumber: '21MECH012', department: 'MECH', cgpa: 7.6, activeBacklogs: 0 },
    { email: 'ananya.deshmukh@college.edu', fullName: 'Ananya Deshmukh', rollNumber: '21IT008', department: 'IT', cgpa: 8.2, activeBacklogs: 0 },
    { email: 'karthik.rajan@college.edu', fullName: 'Karthik Rajan', rollNumber: '21ECE044', department: 'ECE', cgpa: 7.8, activeBacklogs: 0 },
    { email: 'aravind.swamy@college.edu', fullName: 'Aravind Swamy', rollNumber: '21EEE019', department: 'EEE', cgpa: 7.4, activeBacklogs: 1 },
    { email: 'divya.menon@college.edu', fullName: 'Divya Menon', rollNumber: '21CS031', department: 'CSE', cgpa: 9.1, activeBacklogs: 0 },
    { email: 'rohit.gupta@college.edu', fullName: 'Rohit Gupta', rollNumber: '21IT055', department: 'IT', cgpa: 6.8, activeBacklogs: 0 },
    { email: 'meera.iyer@college.edu', fullName: 'Meera Iyer', rollNumber: '21ECE029', department: 'ECE', cgpa: 8.5, activeBacklogs: 0 },
    { email: 'siddharth.jain@college.edu', fullName: 'Siddharth Jain', rollNumber: '21CS115', department: 'CSE', cgpa: 8.1, activeBacklogs: 0 },
    { email: 'pooja.hegde@college.edu', fullName: 'Pooja Hegde', rollNumber: '21IT064', department: 'IT', cgpa: 7.5, activeBacklogs: 0 },
    { email: 'varun.dhawan@college.edu', fullName: 'Varun Dhawan', rollNumber: '21MECH045', department: 'MECH', cgpa: 6.9, activeBacklogs: 1 },
    { email: 'tanvi.shah@college.edu', fullName: 'Tanvi Shah', rollNumber: '21CS099', department: 'CSE', cgpa: 9.5, activeBacklogs: 0 },
    { email: 'aditya.roy@college.edu', fullName: 'Aditya Roy', rollNumber: '21ECE058', department: 'ECE', cgpa: 7.1, activeBacklogs: 0 },
    { email: 'neha.kapoor@college.edu', fullName: 'Neha Kapoor', rollNumber: '21EEE033', department: 'EEE', cgpa: 8.0, activeBacklogs: 0 },
    { email: 'mohammed.ali@college.edu', fullName: 'Mohammed Ali', rollNumber: '21CS060', department: 'CSE', cgpa: 8.6, activeBacklogs: 0 },
    { email: 'shreya.ghoshal@college.edu', fullName: 'Shreya Ghoshal', rollNumber: '21IT041', department: 'IT', cgpa: 8.8, activeBacklogs: 0 },
    { email: 'tarun.khanna@college.edu', fullName: 'Tarun Khanna', rollNumber: '21MECH023', department: 'MECH', cgpa: 7.0, activeBacklogs: 2 },
    { email: 'deepika.padukone@college.edu', fullName: 'Deepika Padukone', rollNumber: '21CS018', department: 'CSE', cgpa: 9.0, activeBacklogs: 0 },
    { email: 'ishaan.khatter@college.edu', fullName: 'Ishaan Khatter', rollNumber: '21ECE007', department: 'ECE', cgpa: 6.7, activeBacklogs: 0 },
    { email: 'kavya.maran@college.edu', fullName: 'Kavya Maran', rollNumber: '21IT077', department: 'IT', cgpa: 8.3, activeBacklogs: 0 },
    { email: 'suresh.raina@college.edu', fullName: 'Suresh Raina', rollNumber: '21EEE005', department: 'EEE', cgpa: 7.3, activeBacklogs: 0 },
    // Student with 0 applications (edge case test)
    { email: 'zero.apps@college.edu', fullName: 'Zero Applications Student', rollNumber: '21CS000', department: 'CSE', cgpa: 7.0, activeBacklogs: 0 },
  ];

  const students = [];
  for (const s of studentDataList) {
    const studentUser = await prisma.user.create({
      data: {
        email: s.email,
        passwordHash: studentPasswordHash,
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        department: s.department,
        cgpa: s.cgpa,
        activeBacklogs: s.activeBacklogs,
        role: 'STUDENT',
        isActive: true,
      },
    });
    students.push(studentUser);
  }

  console.log(`✅ Created ${students.length} students + 2 staff users.`);

  // 3. Create Companies (10 companies)
  const companyDataList = [
    { name: 'TCS', industry: 'IT Services & Consulting', minPackage: 350000, maxPackage: 750000, websiteUrl: 'https://tcs.com' },
    { name: 'Infosys', industry: 'Enterprise Software & IT', minPackage: 450000, maxPackage: 950000, websiteUrl: 'https://infosys.com' },
    { name: 'Wipro', industry: 'IT & Digital Services', minPackage: 400000, maxPackage: 650000, websiteUrl: 'https://wipro.com' },
    { name: 'Microsoft', industry: 'Product & Cloud Computing', minPackage: 1400000, maxPackage: 4500000, websiteUrl: 'https://microsoft.com' },
    { name: 'Google', industry: 'Software & Internet Services', minPackage: 1800000, maxPackage: 5500000, websiteUrl: 'https://google.com' },
    { name: 'Amazon', industry: 'E-Commerce & Cloud AWS', minPackage: 1600000, maxPackage: 4400000, websiteUrl: 'https://amazon.com' },
    { name: 'Accenture', industry: 'Strategy & Technology Consulting', minPackage: 450000, maxPackage: 1200000, websiteUrl: 'https://accenture.com' },
    { name: 'Capgemini', industry: 'Consulting & Engineering', minPackage: 400000, maxPackage: 800000, websiteUrl: 'https://capgemini.com' },
    { name: 'Cognizant', industry: 'Digital & IT Services', minPackage: 400000, maxPackage: 750000, websiteUrl: 'https://cognizant.com' },
    { name: 'L&T Technology Services', industry: 'Engineering & R&D Services', minPackage: 500000, maxPackage: 1000000, websiteUrl: 'https://ltts.com' },
  ];

  const companies = {};
  for (const c of companyDataList) {
    const comp = await prisma.company.create({ data: c });
    companies[c.name] = comp;
  }
  console.log(`✅ Created ${Object.keys(companies).length} companies.`);

  // 4. Create Placement Drives (12 drives)
  const driveDataList = [
    {
      companyName: 'TCS',
      roleTitle: 'Software Engineer (Ninja / Digital)',
      minCgpa: 6.5,
      driveDate: new Date('2026-02-18'),
      status: 'Completed',
      eligibleDepts: 'CSE,IT,ECE',
    },
    {
      companyName: 'Infosys',
      roleTitle: 'Systems Engineer / Specialist Programmer',
      minCgpa: 7.0,
      driveDate: new Date('2026-03-05'),
      status: 'Completed',
      eligibleDepts: 'CSE,IT',
    },
    {
      companyName: 'Wipro',
      roleTitle: 'Project Engineer (Elite NLTH)',
      minCgpa: 6.0,
      driveDate: new Date('2026-03-20'),
      status: 'Completed',
      eligibleDepts: 'CSE,IT,ECE,MECH,EEE',
    },
    {
      companyName: 'Microsoft',
      roleTitle: 'Software Development Engineer (SDE-1)',
      minCgpa: 8.0,
      driveDate: new Date('2026-04-10'),
      status: 'Ongoing',
      eligibleDepts: 'CSE,IT,ECE',
    },
    {
      companyName: 'Google',
      roleTitle: 'Associate Software Engineer (Campus 2026)',
      minCgpa: 8.5,
      driveDate: new Date('2026-05-15'),
      status: 'Upcoming',
      eligibleDepts: 'CSE,IT',
    },
    {
      companyName: 'Amazon',
      roleTitle: 'SDE-1 (AWS & Retail Platform)',
      minCgpa: 7.5,
      driveDate: new Date('2026-04-25'),
      status: 'Ongoing',
      eligibleDepts: 'CSE,IT,ECE',
    },
    {
      companyName: 'Accenture',
      roleTitle: 'Advanced Associate Software Engineer (AASE)',
      minCgpa: 6.5,
      driveDate: new Date('2026-04-02'),
      status: 'Ongoing',
      eligibleDepts: 'CSE,IT,ECE,EEE',
    },
    {
      companyName: 'Capgemini',
      roleTitle: 'Senior Analyst / Software Engineer',
      minCgpa: 6.0,
      driveDate: new Date('2026-05-08'),
      status: 'Upcoming',
      eligibleDepts: 'CSE,IT,ECE,MECH',
    },
    {
      companyName: 'Cognizant',
      roleTitle: 'Programmer Analyst Trainee (GenC Elevate)',
      minCgpa: 6.5,
      driveDate: new Date('2026-05-22'),
      status: 'Upcoming',
      eligibleDepts: 'CSE,IT,ECE',
    },
    {
      companyName: 'L&T Technology Services',
      roleTitle: 'Graduate Engineer Trainee (GET)',
      minCgpa: 7.0,
      driveDate: new Date('2026-06-05'),
      status: 'Upcoming',
      eligibleDepts: 'MECH,EEE,ECE',
    },
  ];

  const drives = [];
  for (const d of driveDataList) {
    const drive = await prisma.placementDrive.create({
      data: {
        companyId: companies[d.companyName].id,
        roleTitle: d.roleTitle,
        minCgpa: d.minCgpa,
        driveDate: d.driveDate,
        status: d.status,
        eligibleDepts: d.eligibleDepts,
      },
    });
    drives.push({ ...drive, companyName: d.companyName });
  }
  console.log(`✅ Created ${drives.length} placement drives.`);

  // 5. Create ~100 Applications across students & drives
  // Riya Sharma is student[0]
  const riya = students[0];

  const applicationRecords = [
    // Riya Sharma's applications (6 applications)
    { studentIndex: 0, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' }, // TCS
    { studentIndex: 0, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 950000, outcome: 'Pending' }, // Infosys
    { studentIndex: 0, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' }, // Wipro
    { studentIndex: 0, driveIndex: 3, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 2400000, outcome: 'Pending' }, // Microsoft
    { studentIndex: 0, driveIndex: 4, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' }, // Google
    { studentIndex: 0, driveIndex: 5, stage: 'UNDER_REVIEW', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' }, // Amazon

    // Riya S. Sharma (Similar Name 1)
    { studentIndex: 1, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 1, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 1, driveIndex: 3, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 2400000, outcome: 'Pending' },
    { studentIndex: 1, driveIndex: 6, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 650000, outcome: 'Pending' },

    // Riya Sharmila (Similar Name 2)
    { studentIndex: 2, driveIndex: 0, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 350000, outcome: 'Pending' },
    { studentIndex: 2, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 2, driveIndex: 7, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Rahul Kumar
    { studentIndex: 3, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 3, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 450000, outcome: 'Pending' },
    { studentIndex: 3, driveIndex: 2, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 3, driveIndex: 6, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Aman Verma
    { studentIndex: 4, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 4, driveIndex: 2, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 4, driveIndex: 6, stage: 'UNDER_REVIEW', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Priya Patel (High CGPA 9.3)
    { studentIndex: 5, driveIndex: 0, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 5, driveIndex: 1, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 950000, outcome: 'Placed' },
    { studentIndex: 5, driveIndex: 3, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 4200000, outcome: 'Placed' },
    { studentIndex: 5, driveIndex: 4, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 4500000, outcome: 'Pending' },
    { studentIndex: 5, driveIndex: 5, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 3200000, outcome: 'Placed' },

    // Sneha Reddy
    { studentIndex: 6, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 6, driveIndex: 1, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 6, driveIndex: 3, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 2400000, outcome: 'Pending' },
    { studentIndex: 6, driveIndex: 5, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 2800000, outcome: 'Pending' },

    // Vikram Singh (MECH)
    { studentIndex: 7, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 7, driveIndex: 7, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 450000, outcome: 'Pending' },
    { studentIndex: 7, driveIndex: 9, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 600000, outcome: 'Pending' },

    // Ananya Deshmukh
    { studentIndex: 8, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 8, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 500000, outcome: 'Pending' },
    { studentIndex: 8, driveIndex: 6, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },

    // Karthik Rajan
    { studentIndex: 9, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 9, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 420000, outcome: 'Placed' },
    { studentIndex: 9, driveIndex: 3, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 9, driveIndex: 6, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 550000, outcome: 'Pending' },

    // Aravind Swamy (EEE)
    { studentIndex: 10, driveIndex: 2, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 400000, outcome: 'Pending' },
    { studentIndex: 10, driveIndex: 6, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 450000, outcome: 'Pending' },
    { studentIndex: 10, driveIndex: 9, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Divya Menon (CSE 9.1)
    { studentIndex: 11, driveIndex: 0, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 11, driveIndex: 3, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 3800000, outcome: 'Placed' },
    { studentIndex: 11, driveIndex: 4, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 4000000, outcome: 'Pending' },
    { studentIndex: 11, driveIndex: 5, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 3000000, outcome: 'Placed' },

    // Rohit Gupta
    { studentIndex: 12, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 12, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 12, driveIndex: 6, stage: 'ASSESSMENT', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Meera Iyer
    { studentIndex: 13, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 13, driveIndex: 1, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 13, driveIndex: 3, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 1800000, outcome: 'Pending' },
    { studentIndex: 13, driveIndex: 6, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 800000, outcome: 'Pending' },

    // Siddharth Jain
    { studentIndex: 14, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 14, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 600000, outcome: 'Pending' },
    { studentIndex: 14, driveIndex: 5, stage: 'ASSESSMENT', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 14, driveIndex: 6, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },

    // Pooja Hegde
    { studentIndex: 15, driveIndex: 0, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 350000, outcome: 'Pending' },
    { studentIndex: 15, driveIndex: 1, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 15, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 400000, outcome: 'Placed' },

    // Varun Dhawan (MECH)
    { studentIndex: 16, driveIndex: 2, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 400000, outcome: 'Pending' },
    { studentIndex: 16, driveIndex: 7, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 16, driveIndex: 9, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 500000, outcome: 'Pending' },

    // Tanvi Shah (CSE 9.5)
    { studentIndex: 17, driveIndex: 0, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 17, driveIndex: 3, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 4400000, outcome: 'Placed' },
    { studentIndex: 17, driveIndex: 4, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 5200000, outcome: 'Placed' },
    { studentIndex: 17, driveIndex: 5, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 3800000, outcome: 'Placed' },

    // Aditya Roy
    { studentIndex: 18, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 18, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 18, driveIndex: 6, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 500000, outcome: 'Pending' },

    // Neha Kapoor (EEE)
    { studentIndex: 19, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 19, driveIndex: 2, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 420000, outcome: 'Pending' },
    { studentIndex: 19, driveIndex: 6, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 19, driveIndex: 9, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 550000, outcome: 'Pending' },

    // Mohammed Ali
    { studentIndex: 20, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 20, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 650000, outcome: 'Pending' },
    { studentIndex: 20, driveIndex: 3, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 1800000, outcome: 'Pending' },
    { studentIndex: 20, driveIndex: 5, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 2200000, outcome: 'Pending' },

    // Shreya Ghoshal (IT)
    { studentIndex: 21, driveIndex: 0, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 21, driveIndex: 1, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 950000, outcome: 'Placed' },
    { studentIndex: 21, driveIndex: 3, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 1600000, outcome: 'Pending' },
    { studentIndex: 21, driveIndex: 6, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 850000, outcome: 'Placed' },

    // Tarun Khanna (MECH)
    { studentIndex: 22, driveIndex: 2, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 22, driveIndex: 7, stage: 'UNDER_REVIEW', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 22, driveIndex: 9, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 500000, outcome: 'Pending' },

    // Deepika Padukone (CSE 9.0)
    { studentIndex: 23, driveIndex: 0, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 23, driveIndex: 3, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 3600000, outcome: 'Placed' },
    { studentIndex: 23, driveIndex: 4, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 4500000, outcome: 'Pending' },
    { studentIndex: 23, driveIndex: 5, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 3000000, outcome: 'Placed' },

    // Ishaan Khatter (ECE)
    { studentIndex: 24, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 24, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 24, driveIndex: 6, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Kavya Maran (IT)
    { studentIndex: 25, driveIndex: 0, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 700000, outcome: 'Placed' },
    { studentIndex: 25, driveIndex: 1, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 750000, outcome: 'Pending' },
    { studentIndex: 25, driveIndex: 6, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 800000, outcome: 'Placed' },
    { studentIndex: 25, driveIndex: 8, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },

    // Suresh Raina (EEE)
    { studentIndex: 26, driveIndex: 0, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 350000, outcome: 'Pending' },
    { studentIndex: 26, driveIndex: 2, stage: 'OFFERED', offerStatus: 'ACCEPTED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 26, driveIndex: 6, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 500000, outcome: 'Pending' },
    { studentIndex: 26, driveIndex: 9, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
  ];

  // Additional realistic application records to reach ~100 records
  const additionalCombinations = [
    // CSE/IT batch cross applications
    { studentIndex: 1, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 420000, outcome: 'Placed' },
    { studentIndex: 1, driveIndex: 8, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 2, driveIndex: 1, stage: 'SHORTLISTED', offerStatus: 'PENDING', packageOffered: 450000, outcome: 'Pending' },
    { studentIndex: 2, driveIndex: 6, stage: 'ASSESSMENT', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 3, driveIndex: 8, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 4, driveIndex: 7, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 5, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 5, driveIndex: 8, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 6, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 6, driveIndex: 4, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 7, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 8, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 8, driveIndex: 7, stage: 'APPLIED', offerStatus: 'PENDING', packageOffered: null, outcome: 'Pending' },
    { studentIndex: 9, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 10, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 11, driveIndex: 1, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 950000, outcome: 'Placed' },
    { studentIndex: 11, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 650000, outcome: 'Placed' },
    { studentIndex: 12, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 13, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 14, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 15, driveIndex: 6, stage: 'INTERVIEW', offerStatus: 'PENDING', packageOffered: 600000, outcome: 'Pending' },
    { studentIndex: 16, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 17, driveIndex: 1, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 950000, outcome: 'Placed' },
    { studentIndex: 18, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 19, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 20, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 21, driveIndex: 2, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 400000, outcome: 'Placed' },
    { studentIndex: 22, driveIndex: 0, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 23, driveIndex: 1, stage: 'OFFERED', offerStatus: 'DECLINED', packageOffered: 950000, outcome: 'Placed' },
    { studentIndex: 24, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
    { studentIndex: 25, driveIndex: 2, stage: 'OFFERED', offerStatus: 'OFFERED', packageOffered: 450000, outcome: 'Placed' },
    { studentIndex: 26, driveIndex: 1, stage: 'REJECTED', offerStatus: 'NOT_OFFERED', packageOffered: null, outcome: 'Not Placed' },
  ];

  const allAppsToInsert = [...applicationRecords, ...additionalCombinations];
  let createdAppCount = 0;

  for (const app of allAppsToInsert) {
    const student = students[app.studentIndex];
    const drive = drives[app.driveIndex];
    if (!student || !drive) continue;

    // Avoid duplicate combinations
    try {
      await prisma.application.create({
        data: {
          studentId: student.id,
          driveId: drive.id,
          stage: app.stage,
          offerStatus: app.offerStatus,
          packageOffered: app.packageOffered,
          outcome: app.outcome,
          appliedOn: new Date(Date.now() - Math.floor(Math.random() * 30 + 1) * 86400000),
        },
      });
      createdAppCount++;
    } catch (err) {
      console.error('App insert error:', err.message);
    }
  }

  console.log(`✅ Created ${createdAppCount} placement application records.`);

  // 6. Create initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        actorName: admin.fullName,
        role: 'ADMIN',
        action: 'SYSTEM_INITIALIZED',
        impactedEntity: 'SYSTEM',
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 5 * 86400000),
      },
      {
        userId: officer.id,
        actorName: officer.fullName,
        role: 'OFFICER',
        action: 'CREATE_DRIVE',
        impactedEntity: 'Microsoft - SDE-1',
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 3 * 86400000),
      },
      {
        userId: officer.id,
        actorName: officer.fullName,
        role: 'OFFICER',
        action: 'UPDATE_APPLICATION_STAGE',
        impactedEntity: 'Riya Sharma -> TCS (Offered)',
        ipAddress: '127.0.0.1',
        timestamp: new Date(Date.now() - 1 * 86400000),
      },
    ],
  });

  console.log('✅ Audit logs initialized.');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
