import axios from "axios";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";

function UserOrderCard({ data }) {
  const navigate = useNavigate();

  // State to store ratings of items
  const [ratings, setRatings] = useState({});

  // Format order date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Initialize ratings from backend data
  useEffect(() => {
    const initialRatings = {};
    data?.shopOrders?.forEach((shopOrder) => {
      shopOrder?.shopOrderItems?.forEach((item) => {
        // Use backend average rating
        initialRatings[item?.item?._id] = item?.item?.rating?.average || 0;
      });
    });
    setRatings(initialRatings);
  }, [data]);

  // Handle rating click
  const handleRating = async (itemId, rating) => {
    try {
      const res = await axios.post(
        `${serverUrl}/api/item/rating`,
        { itemId, rating },
        { withCredentials: true }
      );

      // Update rating in state with new average from backend
      setRatings((prev) => ({
        ...prev,
        [itemId]: res.data.rating.average,
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      {/* Order Header */}
      <div className="flex justify-between border-b pb-2">
        <div>
          <p className="font-semibold">Order #{data?._id?.slice(-6)}</p>
          <p className="text-sm text-gray-500">Date: {formatDate(data?.createdAt)}</p>
        </div>

        <div className="text-right">
          {data?.paymentMethod === "cod" ? (
            <p className="text-sm text-gray-500">{data?.paymentMethod?.toUpperCase()}</p>
          ) : (
            <p className="text-sm text-gray-500 font-semibold">
              Payment: {data?.payment ? "true" : "false"}
            </p>
          )}
          <p className="font-medium text-blue-600">{data?.shopOrders?.[0]?.status}</p>
        </div>
      </div>

      {/* Shop Orders */}
      {data?.shopOrders?.map((shopOrder, index) => (
        <div
          className="border rounded-lg p-3 bg-[#fffaf7] space-y-3"
          key={index}
        >
          <p className="font-medium">{shopOrder?.shop?.name}</p>

          <div className="flex space-x-4 overflow-x-auto pb-2">
            {shopOrder?.shopOrderItems?.map((item, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-40 border rounded-lg p-2 bg-white"
              >
                <img
                  src={item?.item?.image}
                  alt={item?.item?.name}
                  className="w-full h-24 object-cover rounded"
                />

                <p className="text-sm font-semibold mt-1">{item?.item?.name}</p>

                <p className="text-xs text-gray-500">
                  Qty: {item?.quantity} x ₹{item?.price}
                </p>

                {/* Show rating only for delivered items */}
                {shopOrder?.status === "delivered" && (
                  <div className="flex space-x-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        className={`text-lg ${
                          ratings[item?.item?._id] >= star
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                        onClick={() => handleRating(item?.item?._id, star)}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center border-t pt-2">
            <p className="font-semibold">Subtotal: ₹{shopOrder?.subtotal}</p>
            <span className="text-sm font-medium text-blue-600">{shopOrder?.status}</span>
          </div>
        </div>
      ))}

      {/* Total */}
      <div className="flex justify-between items-center border-t pt-2">
        <p className="font-semibold">Total: ₹{data?.totalAmount}</p>
        <button
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-4 py-2 rounded-lg text-sm"
          onClick={() => navigate(`/track-order/${data?._id}`)}
        >
          Track Order
        </button>
      </div>
    </div>
  );
}

export default UserOrderCard;