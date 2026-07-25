import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create students
  const student1 = await prisma.student.create({
    data: {
      rollNumber: '21CS045',
      fullName: 'Riya Sharma',
      department: 'CSE',
      cgpa: 8.7,
      batchYear: 2026,
      phone: '9876543210',
      backlogCount: 0,
    },
  });

  const student2 = await prisma.student.create({
    data: {
      rollNumber: '21IT032',
      fullName: 'Rahul Kumar',
      department: 'IT',
      cgpa: 7.2,
      batchYear: 2026,
      backlogCount: 1,
    },
  });

  const student3 = await prisma.student.create({
    data: {
      rollNumber: '21ECE015',
      fullName: 'Aman Verma',
      department: 'ECE',
      cgpa: 6.5,
      batchYear: 2026,
      backlogCount: 2,
    },
  });

  // Create users (Fix 2.2: all have valid CGPA, per spec)
  const passwordHash = await bcrypt.hash('Student@1234', 12);

  await prisma.user.create({
    data: {
      name: 'Riya Sharma',
      email: 'riya.sharma@college.edu',
      passwordHash,
      role: 'student',
      studentId: student1.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rahul Kumar',
      email: 'rahul.kumar@college.edu',
      passwordHash,
      role: 'student',
      studentId: student2.id,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Aman Verma',
      email: 'aman.verma@college.edu',
      passwordHash,
      role: 'student',
      studentId: student3.id,
    },
  });

  const officerHash = await bcrypt.hash('Officer@1234', 12);
  await prisma.user.create({
    data: {
      name: 'Placement Officer',
      email: 'officer@college.edu',
      passwordHash: officerHash,
      role: 'officer',
    },
  });

  const adminHash = await bcrypt.hash('Admin@1234', 12);
  await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@college.edu',
      passwordHash: adminHash,
      role: 'admin',
    },
  });

  // Companies
  const tcs = await prisma.company.create({
    data: {
      name: 'TCS',
      industry: 'IT Services',
      packageMin: 350000,
      packageMax: 700000,
      website: 'https://tcs.com',
    },
  });

  const infosys = await prisma.company.create({
    data: {
      name: 'Infosys',
      industry: 'IT Services',
      packageMin: 450000,
      packageMax: 900000,
    },
  });

  const wipro = await prisma.company.create({
    data: {
      name: 'Wipro',
      industry: 'IT Services',
      packageMin: 400000,
      packageMax: 650000,
    },
  });

  // Drives
  const tcsDrive = await prisma.placementDrive.create({
    data: {
      companyId: tcs.id,
      driveDate: new Date('2026-08-15'),
      eligibleDepartments: 'CSE,IT,ECE',
      minCgpa: 7.0,
      roleOffered: 'Software Developer',
      status: 'upcoming',
    },
  });

  const infosysDrive = await prisma.placementDrive.create({
    data: {
      companyId: infosys.id,
      driveDate: new Date('2026-09-10'),
      eligibleDepartments: 'CSE,IT',
      minCgpa: 7.5,
      roleOffered: 'Systems Engineer',
      status: 'upcoming',
    },
  });

  const wiproDrive = await prisma.placementDrive.create({
    data: {
      companyId: wipro.id,
      driveDate: new Date('2026-08-20'),
      eligibleDepartments: 'CSE,IT,ECE',
      minCgpa: 6.5,
      roleOffered: 'Project Engineer',
      status: 'ongoing',
    },
  });

  // Applications (Fix 2.10: offerStatus defaults to 'pending')
  await prisma.application.create({
    data: {
      studentId: student1.id,
      driveId: tcsDrive.id,
      stage: 'offer',
      offerStatus: 'offer_accepted',
      package: 550000,
    },
  });

  await prisma.application.create({
    data: {
      studentId: student2.id,
      driveId: infosysDrive.id,
      stage: 'interview',
      offerStatus: 'pending', // Fix 2.10: explicit default
    },
  });

  await prisma.application.create({
    data: {
      studentId: student3.id,
      driveId: wiproDrive.id,
      stage: 'rejected',
      offerStatus: 'rejected',
    },
  });

  await prisma.application.create({
    data: {
      studentId: student1.id,
      driveId: infosysDrive.id,
      stage: 'applied',
      offerStatus: 'pending',
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
