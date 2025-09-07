// Socket.io configuration
let io;

const initializeSocket = (socketIO) => {
  io = socketIO;
  
  io.on('connection', (socket) => {
    console.log('Family member connected:', socket.id);
    
    // Join patient-specific room for notifications
    socket.on('join_patient_room', (patientId) => {
      socket.join(`patient_${patientId}`);
      console.log(`Socket ${socket.id} joined room for patient ${patientId}`);
    });
    
    // Leave patient room
    socket.on('leave_patient_room', (patientId) => {
      socket.leave(`patient_${patientId}`);
      console.log(`Socket ${socket.id} left room for patient ${patientId}`);
    });
    
    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Family member disconnected:', socket.id);
    });
  });
  
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = (socketIO) => {
  return initializeSocket(socketIO);
};

module.exports.getIO = getIO;
