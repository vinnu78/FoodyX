import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { IoIosArrowRoundBack } from "react-icons/io";
import DeliveryBoyTracking from "../components/DeliveryBoyTracking";
import { useSelector } from "react-redux";

function TrackOrderPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { socket } = useSelector((state) => state.user);

  const [currentOrder, setCurrentOrder] = useState(null);
  const [liveLocations, setLiveLocations] = useState({});

  // 🔹 Fetch order details
  const handleGetOrder = async () => {
    try {
      const result = await axios.get(
        `${serverUrl}/api/order/get-order-by-id/${orderId}`,
        { withCredentials: true }
      );

      const orderData = result.data;

      orderData.shopOrders = orderData.shopOrders.map((shopOrder) => {
  const deliveryCharge = (shopOrder.subtotal || 0) < 500 ? 40 : 0;
  const totalAmount = (shopOrder.subtotal || 0) + deliveryCharge;

  return {
    ...shopOrder,
    deliveryCharge,
    totalAmount,
  };
});

      setCurrentOrder(orderData);
    } catch (error) {
      console.log(error);
    }
  };

  // 🔹 Listen for delivery boy live location
  useEffect(() => {
    if (!socket || typeof socket.on !== "function") return;

    socket.on("updateDeliveryLocation", ({ deliveryBoyId, latitude, longitude }) => {
      setLiveLocations((prev) => ({
        ...prev,
        [deliveryBoyId]: { lat: latitude, lon: longitude },
      }));
    });

    return () => {
      socket.off("updateDeliveryLocation");
    };
  }, [socket]);

  // 🔹 Fetch order on mount
  useEffect(() => {
    handleGetOrder();
  }, [orderId]);

  return (
    <div className="max-w-4xl mx-auto p-4 flex flex-col gap-6">
      {/* Back Button */}
      <div
        className="flex items-center gap-4 mb-4 cursor-pointer"
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
        <h1 className="text-2xl font-bold">Track Order</h1>
      </div>

      {/* Order Cards */}
      {currentOrder?.shopOrders?.map((shopOrder) => (
        <div
          className="bg-white p-4 rounded-2xl shadow-md border border-orange-100 space-y-4"
          key={shopOrder._id}
        >
          <div>
            <p className="text-lg font-bold mb-2 text-[#ff4d2d]">
              {shopOrder.shop.name}
            </p>

            <p className="font-semibold">
              Items: {shopOrder.shopOrderItems?.map((i) => i.name).join(", ")}
            </p>

            <p>
              <span className="font-semibold">Subtotal:</span> ₹{shopOrder.subtotal}
            </p>

            <p>
              <span className="font-semibold">Delivery Charge:</span> ₹{shopOrder.deliveryCharge}
            </p>

            <p className="font-semibold text-lg">
              Total: ₹{shopOrder.totalAmount}
            </p>

            <p className="mt-6">
              <span className="font-semibold">Delivery address:</span>{" "}
              {currentOrder.deliveryAddress?.text}
            </p>
          </div>

          {/* Delivery Info */}
          {shopOrder.status !== "delivered" ? (
            <>
              {shopOrder.assignedDeliveryBoy ? (
                <div className="text-sm text-gray-700">
                  <p className="font-semibold">
                    Delivery Boy Name: {shopOrder.assignedDeliveryBoy.fullName}
                  </p>
                  <p className="font-semibold">
                    Contact: {shopOrder.assignedDeliveryBoy.mobile}
                  </p>
                </div>
              ) : (
                <p className="font-semibold">Delivery Boy is not assigned yet.</p>
              )}
            </>
          ) : (
            <p className="text-green-600 font-semibold text-lg">Delivered</p>
          )}

          {/* Map Tracking */}
          {shopOrder.assignedDeliveryBoy && shopOrder.status !== "delivered" && (
            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-md">
              <DeliveryBoyTracking
                data={{
                  deliveryBoyLocation:
                    liveLocations[shopOrder.assignedDeliveryBoy._id] || {
                      lat: shopOrder.assignedDeliveryBoy.location.coordinates[1],
                      lon: shopOrder.assignedDeliveryBoy.location.coordinates[0],
                    },
                  customerLocation: {
                    lat: currentOrder.deliveryAddress.latitude,
                    lon: currentOrder.deliveryAddress.longitude,
                  },
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default TrackOrderPage;