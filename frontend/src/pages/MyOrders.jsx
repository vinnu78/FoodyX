import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoIosArrowRoundBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import UserOrderCard from "../components/UserOrderCard";
import OwnerOrderCard from "../components/OwnerOrderCard";
import { setMyOrders, updateRealtimeOrderStatus } from "../redux/userSlice";

function MyOrders() {

  const { userData, myOrders, socket } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {

    // socket check
    if (!socket || typeof socket.on !== "function") return;

    socket.on("newOrder", (data) => {
      if (data?.shopOrders?.owner?._id === userData?._id) {
        dispatch(setMyOrders([data, ...myOrders]));
      }
    });

    socket.on("update-status", ({ orderId, shopId, status, userId }) => {
      if (userId === userData?._id) {
        dispatch(updateRealtimeOrderStatus({ orderId, shopId, status }));
      }
    });

    return () => {
      socket.off("newOrder");
      socket.off("update-status");
    };

  }, [socket, userData, myOrders, dispatch]);

  return (
    <div className="w-full min-h-screen bg-[#fff9f6] flex justify-center px-4">
      <div className="w-full max-w-[800px] p-4">

        <div className="flex items-center gap-[20px] mb-6">
          <div onClick={() => navigate("/")}>
            <IoIosArrowRoundBack size={35} className="text-[#ff4d2d]" />
          </div>
          <h1 className="text-2xl font-bold">My Orders</h1>
        </div>

        <div className="space-y-6">

          {myOrders?.length === 0 && (
            <p className="text-center text-gray-500">
              No Orders Found
            </p>
          )}

          {myOrders?.map((order) => (
            userData?.role === "user" ? (
              <UserOrderCard data={order} key={order._id} />
            ) : userData?.role === "owner" ? (
              <OwnerOrderCard data={order} key={order._id} />
            ) : null
          ))}

        </div>
      </div>
    </div>
  );
}

export default MyOrders;