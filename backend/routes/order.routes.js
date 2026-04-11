import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  acceptOrder,
  getCurrentOrder,
  getDeliveryBoyAssignment,
  getMyOrders,
  getOrderById,
  getTodayDeliveries,
  placeOrder,
  sendDeliveryOtp,
  updateOrderStatus,
  verifyDeliveryOtp,
  verifyPayment
} from "../controllers/order.controllers.js";

const orderRouter = express.Router();

// ----------------- Order Placement & Payment -----------------
orderRouter.post("/place-order", isAuth, placeOrder);
orderRouter.post("/verify-payment", isAuth, verifyPayment);

// ----------------- User Orders -----------------
orderRouter.get("/my-orders", isAuth, getMyOrders);
orderRouter.get("/get-order-by-id/:orderId", isAuth, getOrderById);

// ----------------- Delivery Boy Assignments -----------------
orderRouter.get("/get-assignments", isAuth, getDeliveryBoyAssignment);
orderRouter.get("/get-current-order", isAuth, getCurrentOrder);
orderRouter.get("/get-today-deliveries", isAuth, getTodayDeliveries);
orderRouter.post("/accept-order/:assignmentId", isAuth, acceptOrder);

// ----------------- Delivery OTP -----------------
orderRouter.post("/send-delivery-otp", isAuth, sendDeliveryOtp);
orderRouter.post("/verify-delivery-otp", isAuth, verifyDeliveryOtp);

// ----------------- Update Order Status by Shop Owner -----------------
orderRouter.post("/update-status/:orderId/:shopId", isAuth, updateOrderStatus);

export default orderRouter;