import React, { useEffect, useState } from 'react';
import Nav from './Nav';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import DeliveryBoyTracking from './DeliveryBoyTracking';
import { ClipLoader } from 'react-spinners';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar as BarComp } from 'recharts';

function DeliveryBoy() {
  const { userData, socket } = useSelector(state => state.user);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [showOtpBox, setShowOtpBox] = useState(false);
  const [availableAssignments, setAvailableAssignments] = useState([]);
  const [otp, setOtp] = useState("");
  const [todayDeliveries, setTodayDeliveries] = useState([]);
  const [deliveryBoyLocation, setDeliveryBoyLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const ratePerDelivery = 50;

  // --- Geolocation + Socket ---
  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function' || userData?.role !== "deliveryBoy") return;

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setDeliveryBoyLocation({ lat: latitude, lon: longitude });
          socket.emit('updateLocation', {
            latitude,
            longitude,
            userId: userData._id
          });
        },
        error => console.log(error),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData]);

  const totalEarning = todayDeliveries.reduce((sum, d) => sum + d.count * ratePerDelivery, 0);

  // --- Fetch Available Orders ---
  const getAssignments = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-assignments`, { withCredentials: true });
      setAvailableAssignments(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  // --- Fetch Current Order ---
  const getCurrentOrder = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-current-order`, { withCredentials: true });
      setCurrentOrder(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  // --- Accept Order ---
  const acceptOrder = async (assignmentId) => {
    try {
      await axios.post(`${serverUrl}/api/order/accept-order/${assignmentId}`, {}, { withCredentials: true });
      await getCurrentOrder();
      // Remove accepted order from available
      setAvailableAssignments(prev => prev.filter(a => a.assignmentId !== assignmentId));
    } catch (error) {
      console.log(error);
      alert("Cannot accept this order: " + error.response?.data?.message || "Server Error");
    }
  };

  // --- Socket Listener for new assignment ---
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') return;
    const handleNewAssignment = (data) => setAvailableAssignments(prev => [...prev, data]);
    socket.on('newAssignment', handleNewAssignment);

    return () => {
      socket.off('newAssignment', handleNewAssignment);
    };
  }, [socket]);

  // --- Send OTP ---
  const sendOtp = async () => {
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/order/send-delivery-otp`, {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder._id
      }, { withCredentials: true });
      setLoading(false);
      setShowOtpBox(true);
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Failed to send OTP");
    }
  };

  // --- Verify OTP ---
  const verifyOtp = async () => {
    setMessage("");
    try {
      const result = await axios.post(`${serverUrl}/api/order/verify-delivery-otp`, {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder._id,
        otp
      }, { withCredentials: true });
      setMessage(result.data.message);
      setShowOtpBox(false);
      setOtp("");
      setCurrentOrder(null);  // clear current order after delivery
      getAssignments();        // refresh available orders
      handleTodayDeliveries(); // refresh today's deliveries
    } catch (error) {
      console.log(error);
      alert("Invalid OTP");
    }
  };

  // --- Fetch today's deliveries ---
  const handleTodayDeliveries = async () => {
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries`, { withCredentials: true });
      setTodayDeliveries(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  // --- Initial load ---
  useEffect(() => {
    getAssignments();
    getCurrentOrder();
    handleTodayDeliveries();
  }, [userData]);

  if (!userData) return <div className='flex justify-center items-center w-screen h-screen'><ClipLoader size={50} color="#ff4d2d" /></div>;

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />

      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>
        {/* DeliveryBoy Info */}
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData.fullName}</h1>
          <p className='text-[#ff4d2d] '>
            <span className='font-semibold'>Latitude:</span> {deliveryBoyLocation?.lat || 'N/A'}, 
            <span className='font-semibold'> Longitude:</span> {deliveryBoyLocation?.lon || 'N/A'}
          </p>
        </div>

        {/* Today's Deliveries */}
        <div className='bg-white rounded-2xl shadow-md p-5 w-[90%] mb-6 border border-orange-100'>
          <h1 className='text-lg font-bold mb-3 text-[#ff4d2d] '>Today Deliveries</h1>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={todayDeliveries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(value) => [value, "orders"]} labelFormatter={label => `${label}:00`} />
              <BarComp dataKey="count" fill='#ff4d2d' />
            </BarChart>
          </ResponsiveContainer>
          <div className='max-w-sm mx-auto mt-6 p-6 bg-white rounded-2xl shadow-lg text-center'>
            <h1 className='text-xl font-semibold text-gray-800 mb-2'>Today's Earning</h1>
            <span className='text-3xl font-bold text-green-600'>₹{totalEarning}</span>
          </div>
        </div>

        {/* Available Orders */}
        {!currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h1 className='text-lg font-bold mb-4 flex items-center gap-2'>Available Orders</h1>
          <div className='space-y-4'>
            {availableAssignments?.length > 0
              ? availableAssignments.map((a) => (
                <div key={a.assignmentId} className='border rounded-lg p-4 flex justify-between items-center'>
                  <div>
                    <p className='text-sm font-semibold'>{a?.shopName}</p>
                    <p className='text-sm text-gray-500'>
                      <span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress.text}
                    </p>
                    <p className='text-xs text-gray-400'>{a.items.length} items | ₹{a.subtotal}</p>
                  </div>
                  <button
                    className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600'
                    onClick={() => acceptOrder(a.assignmentId)}
                  >
                    Accept
                  </button>
                </div>
              ))
              : <p className='text-gray-400 text-sm'>No Available Orders</p>}
          </div>
        </div>}

        {/* Current Order */}
        {currentOrder && <div className='bg-white rounded-2xl p-5 shadow-md w-[90%] border border-orange-100'>
          <h2 className='text-lg font-bold mb-3'>📦 Current Order</h2>
          <div className='border rounded-lg p-4 mb-3'>
            <p className='font-semibold text-sm'>{currentOrder?.shopOrder.shop.name}</p>
            <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress.text}</p>
            <p className='text-xs text-gray-400'>
              {currentOrder.shopOrder.shopOrderItems.length} items | ₹{currentOrder.shopOrder.subtotal}
            </p>
          </div>

          <DeliveryBoyTracking data={{
            deliveryBoyLocation: deliveryBoyLocation || {
              lat: userData.location.coordinates[1],
              lon: userData.location.coordinates[0]
            },
            customerLocation: {
              lat: currentOrder.deliveryAddress.latitude,
              lon: currentOrder.deliveryAddress.longitude
            }
          }} />

          {!showOtpBox ? (
            <button
              className='mt-4 w-full bg-green-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:bg-green-600 active:scale-95 transition-all duration-200'
              onClick={sendOtp}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color='white' /> : "Mark As Delivered"}
            </button>
          ) : (
            <div className='mt-4 p-4 border rounded-xl bg-gray-50'>
              <p className='text-sm font-semibold mb-2'>Enter OTP sent to <span className='text-orange-500'>{currentOrder.user.fullName}</span></p>
              <input
                type="text"
                className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              {message && <p className='text-center text-green-400 text-2xl mb-4'>{message}</p>}
              <button
                className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all"
                onClick={verifyOtp}
              >
                Submit OTP
              </button>
            </div>
          )}
        </div>}

      </div>
    </div>
  )
}

export default DeliveryBoy;