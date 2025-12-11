let io = null;

// Initialize socket instance
const setIO = (socketInstance) => {
  io = socketInstance;
};

// Get socket instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { setIO, getIO };
