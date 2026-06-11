import { Router } from 'express';
import { prisma } from '../utils/prisma';

export const syncRoutes = Router();

// Get state by email
syncRoutes.get('/:email', async (req, res, next) => {
  try {
    const email = req.params.email;
    const userState = await prisma.userState.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!userState) {
      return res.status(200).json({ success: true, state: null });
    }
    return res.status(200).json({ success: true, state: JSON.parse(userState.stateJson) });
  } catch (error) {
    next(error);
  }
});

// Save state by email
syncRoutes.post('/:email', async (req, res, next) => {
  try {
    const email = req.params.email;
    const { state } = req.body;
    
    if (!state) {
      return res.status(400).json({ success: false, message: 'State payload is required' });
    }

    const stateJson = JSON.stringify(state);

    await prisma.userState.upsert({
      where: { email: email.toLowerCase() },
      update: { stateJson },
      create: { email: email.toLowerCase(), stateJson },
    });

    return res.status(200).json({ success: true, message: 'State synced successfully' });
  } catch (error) {
    next(error);
  }
});
