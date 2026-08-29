import { Server as SocketIOServer } from 'socket.io';

export function getSocketIO(): SocketIOServer | null {
  if (typeof global !== 'undefined' && (global as any).io) {
    return (global as any).io as SocketIOServer;
  }
  return null;
}

export function emitQueueUpdated(centreId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("centre:" + centreId).emit('queue_updated', payload);
    io.to('admin:analytics').emit('queue_updated', payload);
    io.emit('queue_updated', payload);
  }
}

export function emitIncidentReported(centreId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("centre:" + centreId).emit('incident_reported', payload);
    io.to('admin:analytics').emit('incident_reported', payload);
    io.emit('incident_reported', payload);
  }
}

export function emitIncidentResolved(centreId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("centre:" + centreId).emit('incident_resolved', payload);
    io.to('admin:analytics').emit('incident_resolved', payload);
    io.emit('incident_resolved', payload);
  }
}

export function emitEtaUpdated(bookingId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("booking:" + bookingId).emit('eta_updated', payload);
    io.to('admin:analytics').emit('eta_updated', payload);
    io.emit('eta_updated', payload);
  }
}

export function emitStageChanged(bookingId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("booking:" + bookingId).emit('stage_changed', payload);
    io.to('admin:analytics').emit('stage_changed', payload);
    io.emit('stage_changed', payload);
  }
}

export function emitNotification(userId: string, payload: any) {
  const io = getSocketIO();
  if (io) {
    io.to("farmer:" + userId).emit('notification', payload);
    io.emit('notification', payload);
  }
}
