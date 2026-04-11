// socketHandler.js
import User from "./models/user.model.js";

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`New socket connected: ${socket.id}`);

    // 🔹 User identity emit (login/connection)
    socket.on('identity', async ({ userId }) => {
      try {
        if (!userId) return;
        const user = await User.findByIdAndUpdate(
          userId,
          { socketId: socket.id, isOnline: true },
          { new: true }
        );
        console.log(`User ${userId} is online with socket ${socket.id}`);
      } catch (error) {
        console.error('Error in identity event:', error);
      }
    });

    // 🔹 Update user location and broadcast
    socket.on('updateLocation', async ({ latitude, longitude, userId }) => {
      try {
        if (!userId || latitude === undefined || longitude === undefined) return;

        const user = await User.findByIdAndUpdate(
          userId,
          {
            location: {
              type: 'Point',
              coordinates: [longitude, latitude],
            },
            isOnline: true,
            socketId: socket.id
          },
          { new: true }
        );

        if (user) {
          io.emit('updateDeliveryLocation', {
            deliveryBoyId: userId,
            latitude,
            longitude
          });
          console.log(`Location updated for user ${userId}`);
        }
      } catch (error) {
        console.error('Error updating delivery location:', error);
      }
    });

    // 🔹 Disconnect event
    socket.on('disconnect', async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { socketId: null, isOnline: false }
        );
        console.log(`Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error('Error on disconnect:', error);
      }
    });
  });
};