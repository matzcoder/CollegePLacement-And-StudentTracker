const express = require('express');
const prisma = require('../db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[?!.,]/g, '')
    .trim();
}

router.post('/query', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const studentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        applications: {
          include: {
            drive: {
              include: {
                company: true,
              },
            },
          },
        },
      },
    });

    const apps = studentUser?.applications || [];
    const norm = normalize(message);

    let responseText = '';
    let intent = 'UNKNOWN';

    if (
      norm.includes('where did i apply') ||
      norm.includes('show my applications') ||
      norm.includes('my applications') ||
      norm.includes('where have i applied') ||
      norm.includes('what companies did i apply') ||
      norm.includes('list my applied')
    ) {
      intent = 'MY_APPLICATIONS';
      if (apps.length === 0) {
        responseText = "You haven't applied to any placement drives yet.";
      } else {
        const appList = apps
          .map((a) => `• ${a.drive.company.name} (${a.drive.roleTitle}) — Status: ${a.stage}`)
          .join('\n');
        responseText = `Here are your applications (${apps.length}):\n${appList}`;
      }
    } else if (
      norm.includes('shortlist') ||
      norm.includes('was i shortlisted') ||
      norm.includes('am i shortlisted')
    ) {
      intent = 'SHORTLISTED_STATUS';
      const shortlisted = apps.filter((a) =>
        ['SHORTLISTED', 'ASSESSMENT', 'INTERVIEW', 'OFFERED', 'OFFER'].includes(a.stage?.toUpperCase())
      );
      if (shortlisted.length === 0) {
        responseText = 'You have not been shortlisted for any drives yet. Keep preparing!';
      } else {
        const companies = shortlisted.map((a) => a.drive.company.name).join(', ');
        responseText = `You are shortlisted for: ${companies}.`;
      }
    } else if (
      norm.includes('offer') ||
      norm.includes('package') ||
      norm.includes('placed') ||
      norm.includes('salary')
    ) {
      intent = 'OFFERS_RECEIVED';
      const offers = apps.filter(
        (a) =>
          a.stage?.toUpperCase() === 'OFFERED' ||
          a.stage?.toUpperCase() === 'OFFER' ||
          a.offerStatus?.toUpperCase() === 'OFFERED' ||
          a.offerStatus?.toUpperCase() === 'ACCEPTED' ||
          a.offerStatus?.toUpperCase() === 'OFFER_ACCEPTED' ||
          a.offerStatus?.toUpperCase() === 'SELECTED'
      );
      if (offers.length === 0) {
        responseText = 'No final offers received yet. Your applications are in progress.';
      } else {
        const offerDetails = offers
          .map((a) => {
            const pkg = a.packageOffered ? `₹${(a.packageOffered / 100000).toFixed(1)} LPA` : 'Package not disclosed';
            return `• ${a.drive.company.name}: ${pkg} (${a.offerStatus})`;
          })
          .join('\n');
        responseText = `Congratulations! You have received ${offers.length} offer(s):\n${offerDetails}`;
      }
    } else if (
      norm.includes('pending') ||
      norm.includes('status') ||
      norm.includes('interview round') ||
      norm.includes('review')
    ) {
      intent = 'PENDING_STATUS';
      const pending = apps.filter((a) =>
        ['APPLIED', 'UNDER_REVIEW', 'ASSESSMENT', 'INTERVIEW'].includes(a.stage?.toUpperCase())
      );
      if (pending.length === 0) {
        responseText = 'You have no pending applications at this time.';
      } else {
        const list = pending.map((a) => `• ${a.drive.company.name} — Stage: ${a.stage}`).join('\n');
        responseText = `You have ${pending.length} in-progress application(s):\n${list}`;
      }
    } else if (norm.includes('company') || norm.includes('companies') || norm.includes('campus')) {
      intent = 'CAMPUS_SUMMARY';
      const totalComps = await prisma.company.count();
      const totalDrives = await prisma.placementDrive.count();
      responseText = `A total of ${totalComps} companies and ${totalDrives} placement drives have visited campus for the 2026 batch.`;
    } else {
      responseText = `Sorry, I could not understand that question.\n\nYou can ask things like:\n• Where did I apply?\n• Am I shortlisted anywhere?\n• What is my package?\n• Which applications are pending?\n• How many companies visited campus?`;
    }

    return res.status(200).json({
      intent,
      response: responseText,
      responseText,
    });
  } catch (err) {
    console.error('Assistant error:', err);
    return res.status(500).json({ error: 'Assistant processing failed' });
  }
});

module.exports = router;
