const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('pt_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Log login activity
    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          actorName: user.fullName,
          role: user.role,
          action: 'LOGIN',
          impactedEntity: 'USER_SESSION',
          ipAddress: req.ip || '127.0.0.1',
        },
      });
    } catch (logErr) {
      console.error('Failed to write audit log for login:', logErr.message);
    }

    return res.status(200).json({
      token,
      role: user.role.toLowerCase(),
      user: {
        id: user.id,
        name: user.fullName,
        fullName: user.fullName,
        email: user.email,
        role: user.role.toLowerCase(),
        rollNumber: user.rollNumber,
        department: user.department,
        cgpa: user.cgpa,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/logout', authenticateToken, async (req, res) => {
  try {
    if (req.user) {
      try {
        await prisma.auditLog.create({
          data: {
            userId: req.user.id,
            actorName: req.user.fullName || 'User',
            role: req.user.role || 'STUDENT',
            action: 'LOGOUT',
            impactedEntity: 'USER_SESSION',
            ipAddress: req.ip || '127.0.0.1',
          },
        });
      } catch (logErr) {
        // ignore
      }
    }

    res.clearCookie('pt_session', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(200).json({ message: 'Logged out' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        rollNumber: true,
        department: true,
        cgpa: true,
        activeBacklogs: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    return res.status(200).json({
      id: user.id,
      name: user.fullName,
      fullName: user.fullName,
      email: user.email,
      role: user.role.toLowerCase(),
      rollNumber: user.rollNumber,
      department: user.department,
      cgpa: user.cgpa,
      activeBacklogs: user.activeBacklogs,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

router.post('/refresh', authenticateToken, async (req, res) => {
  const tokenPayload = {
    id: req.user.id,
    email: req.user.email,
    role: req.user.role,
    fullName: req.user.fullName,
  };
  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
  return res.status(200).json({ token });
});

module.exports = router;
