// socketHandler.js

import User from "./models/user.model.js";

export const socketHandler = (io) => {

  io.on("connection", (socket) => {
    console.log(`✅ New socket connected: ${socket.id}`);

    // ===============================
    // 🔹 USER CONNECT (IDENTITY)
    // ===============================
    socket.on("identity", async ({ userId }) => {
      try {
        if (!userId) return;

        const user = await User.findByIdAndUpdate(
          userId,
          {
            socketId: socket.id,
            isOnline: true,
          },
          { new: true }
        );

        console.log(`🟢 User ${userId} connected`);
      } catch (error) {
        console.error("❌ Identity error:", error);
      }
    });

    // ===============================
    // 🔹 LOCATION UPDATE (Delivery Boy)
    // ===============================
    socket.on("updateLocation", async ({ latitude, longitude, userId }) => {
      try {
        if (!userId || latitude == null || longitude == null) return;

        const user = await User.findByIdAndUpdate(
          userId,
          {
            location: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            socketId: socket.id,
            isOnline: true,
          },
          { new: true }
        );

        if (user) {
          // 🔥 ONLY send to specific room (better than broadcast)
          io.emit("updateDeliveryLocation", {
            deliveryBoyId: userId,
            latitude,
            longitude,
          });

          console.log(`📍 Location updated: ${userId}`);
        }
      } catch (error) {
        console.error("❌ Location update error:", error);
      }
    });

    // ===============================
    // 🔹 NEW ORDER EVENT (IMPORTANT)
    // ===============================
    socket.on("newOrder", async (orderData) => {
      try {
        // 👉 send to owner
        if (orderData?.ownerSocketId) {
          io.to(orderData.ownerSocketId).emit("newOrder", orderData);
        }

        // 👉 send to delivery boy (optional)
        if (orderData?.deliverySocketId) {
          io.to(orderData.deliverySocketId).emit("newOrder", orderData);
        }

        console.log("🛒 New order emitted");
      } catch (error) {
        console.error("❌ New order error:", error);
      }
    });

    // ===============================
    // 🔹 ORDER STATUS UPDATE
    // ===============================
    socket.on("updateStatus", ({ orderId, status, userSocketId }) => {
      try {
        if (userSocketId) {
          io.to(userSocketId).emit("update-status", {
            orderId,
            status,
          });
        }

        console.log(`🔄 Order status updated: ${orderId}`);
      } catch (error) {
        console.error("❌ Status update error:", error);
      }
    });

    // ===============================
    // 🔹 DISCONNECT
    // ===============================
    socket.on("disconnect", async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            socketId: null,
            isOnline: false,
          }
        );

        console.log(`🔴 Socket disconnected: ${socket.id}`);
      } catch (error) {
        console.error("❌ Disconnect error:", error);
      }
    });

  });
};