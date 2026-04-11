import axios from 'axios';
import React, { useState } from 'react';
import { MdPhone } from "react-icons/md";
import { serverUrl } from '../App';
import { useDispatch } from 'react-redux';
import { updateOrderStatus } from '../redux/userSlice';

function OwnerOrderCard({ data }) {
  const [availableBoys, setAvailableBoys] = useState([]);
  const dispatch = useDispatch();

  const handleUpdateStatus = async (orderId, shopId, status) => {
    if (!status) return;
    try {
      const result = await axios.post(
        `${serverUrl}/api/order/update-status/${orderId}/${shopId}`,
        { status },
        { withCredentials: true }
      );

      dispatch(updateOrderStatus({ orderId, shopId, status }));
      setAvailableBoys(result.data.availableBoys || []);
      console.log("Order Update Response:", result.data);
    } catch (error) {
      console.error("Error updating order:", error.response?.data || error.message);
    }
  };

  const shopOrders = data.shopOrders;
  const assignedBoy = shopOrders?.assignedDeliveryBoy;

  // Calculate total including delivery charge
  const total = data?.totalAmount || (shopOrders?.subtotal + (data?.deliveryCharge || 0));

  return (
    <div className='bg-white rounded-lg shadow p-4 space-y-4'>
      {/* User Info */}
      <div>
        <h2 className='text-lg font-semibold text-gray-800'>
          {data?.user?.fullName}
        </h2>

        <p className='text-sm text-gray-500'>
          {data?.user?.email}
        </p>

        <p className='flex items-center gap-2 text-sm text-gray-600 mt-1'>
          <MdPhone />
          <span>{data?.user?.mobile}</span>
        </p>

        <p className='text-sm text-gray-600 mt-1'>
          Payment: {data?.paymentMethod?.toLowerCase() === "online"
            ? (data?.payment ? "Online Paid ✅" : "Online Pending ⏳")
            : "Cash on Delivery 💵"}
        </p>
      </div>

      {/* Delivery Address */}
      <div className='flex flex-col gap-1 text-gray-600 text-sm'>
        <p>{data?.deliveryAddress?.text}</p>
        <p className='text-xs text-gray-500'>
          Lat: {data?.deliveryAddress?.latitude} , Lon: {data?.deliveryAddress?.longitude}
        </p>
      </div>

      {/* Order Items */}
      <div className='flex space-x-4 overflow-x-auto pb-2'>
        {shopOrders?.shopOrderItems?.map((item, index) => (
          <div key={index} className='flex-shrink-0 w-40 border rounded-lg p-2 bg-white'>
            <img
              src={item?.item?.image}
              alt={item?.name}
              className='w-full h-24 object-cover rounded'
            />
            <p className='text-sm font-semibold mt-1'>{item?.name}</p>
            <p className='text-xs text-gray-500'>
              Qty: {item?.quantity} x ₹{item?.price}
            </p>
          </div>
        ))}
      </div>

      {/* Status Dropdown */}
      <div className='flex justify-between items-center mt-auto pt-3 border-t border-gray-100'>
        <span className='text-sm'>
          Status:{" "}
          <span className='font-semibold capitalize text-[#ff4d2d]'>
            {shopOrders?.status}
          </span>
        </span>

        <select
          className='rounded-md border px-3 py-1 text-sm focus:outline-none focus:ring-2 border-[#ff4d2d] text-[#ff4d2d]'
          onChange={(e) =>
            handleUpdateStatus(data._id, shopOrders.shop._id, e.target.value)
          }
        >
          <option value="">Change</option>
          <option value="pending">Pending</option>
          <option value="preparing">Preparing</option>
          <option value="out of delivery">Out Of Delivery</option>
        </select>
      </div>

      {/* Delivery Boys */}
      {shopOrders?.status === "out of delivery" && (
        <div className="mt-3 p-2 border rounded-lg text-sm bg-orange-50">
          {assignedBoy
            ? <p className='font-semibold'>Assigned Delivery Boy:</p>
            : <p className='font-semibold'>Available Delivery Boys:</p>
          }

          {availableBoys.length > 0 ? (
            availableBoys.map((b, index) => (
              <div key={index} className='text-gray-800'>
                {b.fullName} - {b.mobile}
              </div>
            ))
          ) : assignedBoy ? (
            <div>
              {assignedBoy.fullName} - {assignedBoy.mobile}
            </div>
          ) : (
            <div className='text-gray-500'>
              Waiting for delivery boy to accept...
            </div>
          )}
        </div>
      )}

      {/* Total */}
      <div className='text-right font-bold text-gray-800 text-sm'>
        Total: ₹{total}
      </div>
    </div>
  );
}

export default OwnerOrderCard;