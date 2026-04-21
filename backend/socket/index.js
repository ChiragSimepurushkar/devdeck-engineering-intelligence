import { Server } from 'socket.io';
import logger from '../config/logger.js';

let io;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { id: socket.id });

    // Client joins their org room
    socket.on('join-org', (orgId) => {
      if (orgId) {
        socket.join(`org:${orgId}`);
        logger.debug('Socket joined org room', { socketId: socket.id, orgId });
      }
    });

    socket.on('disconnect', () => {
      logger.debug('Socket disconnected', { id: socket.id });
    });
  });

  return io;
}

export function broadcastPRUpdate(orgId, pr) {
  if (!io) return;
  io.to(`org:${orgId}`).emit('pr:updated', {
    type: 'pr:updated',
    data: pr,
    timestamp: new Date().toISOString(),
  });
  logger.debug('Broadcast pr:updated', { orgId, prNumber: pr.number });
}

export function broadcastMetricUpdate(orgId, metrics) {
  if (!io) return;
  io.to(`org:${orgId}`).emit('metrics:updated', {
    type: 'metrics:updated',
    data: metrics,
    timestamp: new Date().toISOString(),
  });
}

export function broadcastSyncComplete(orgId, repoFullName) {
  if (!io) return;
  io.to(`org:${orgId}`).emit('sync:complete', {
    type: 'sync:complete',
    data: { repoFullName },
    timestamp: new Date().toISOString(),
  });
}

export { io };
