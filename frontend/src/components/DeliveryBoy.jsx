import React, { useEffect, useState } from 'react';
import Nav from './Nav';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { useNavigate } from "react-router-dom";
import DeliveryBoyTracking from '../components/DeliveryBoyTracking';
import { ClipLoader } from 'react-spinners';
import { BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar as BarComp } from 'recharts';
import useUpdateLocation from '../hooks/useUpdateLocation';

function DeliveryBoy() {
  const navigate = useNavigate();
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

  useUpdateLocation();

  useEffect(() => {
    if (!socket || typeof socket.emit !== 'function' || userData?.role !== "deliveryBoy") return;

    let watchId;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setDeliveryBoyLocation({ lat: latitude, lon: longitude });
          socket.emit('updateLocation', {
            latitude,
            longitude,
            userId: userData._id
          });
        },
        (error) => console.log(error),
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [socket, userData]);

  const totalEarning = todayDeliveries.reduce((sum, d) => sum + (d.count || 0) * ratePerDelivery, 0);

 const getAssignments = async () => {
  if (!userData?.role || userData.role !== "deliveryBoy") return;

  try {
    const result = await axios.get(
      `${serverUrl}/api/order/get-assignments`,
      { withCredentials: true }
    );

  setAvailableAssignments(
  (result.data || []).map(a => ({
    ...a,
    subtotal: a.subtotal || 0,
    // ❌ 
    // deliveryCharge: a.deliveryCharge ?? (a.subtotal < 500 ? 40 : 0),
    // ✅ नया
    deliveryCharge: a.subtotal < 500 ? 40 : 0,
    totalAmount: (a.subtotal || 0) + (a.subtotal < 500 ? 40 : 0),
    shopOrderItems: a.items || []
  }))
);
  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
  }
};

  const getCurrentOrder = async () => {
  try {
    const res = await axios.get(
      `${serverUrl}/api/order/get-current-order`,
      { withCredentials: true }
    );

    if (!res.data) {
      setCurrentOrder(null);
      return;
    }

    const shopOrder = res.data.shopOrder;

    const formatted = {
      ...res.data,
      shopOrder: {
        ...shopOrder,
        subtotal: shopOrder?.subtotal || 0,
        deliveryCharge: shopOrder?.deliveryCharge ?? (shopOrder?.subtotal < 500 ? 40 : 0),
totalAmount: (shopOrder?.subtotal || 0) + (shopOrder?.deliveryCharge ?? (shopOrder?.subtotal < 500 ? 40 : 0)),
        shopOrderItems: shopOrder?.shopOrderItems || []
      }
    };

    setCurrentOrder(formatted);

  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
  }
};

  const acceptOrder = async (assignmentId) => {
  try {
    const res = await axios.post(
      `${serverUrl}/api/order/accept-order/${assignmentId}`,
      {},
      { withCredentials: true }
    );

    const shopOrder = res.data.shopOrder;

    const formatted = {
      ...res.data,
      shopOrder: {
        ...shopOrder,
        subtotal: shopOrder?.subtotal || 0,
        deliveryCharge: shopOrder?.deliveryCharge ?? (shopOrder?.subtotal < 500 ? 40 : 0),
totalAmount: (shopOrder?.subtotal || 0) + (shopOrder?.deliveryCharge ?? (shopOrder?.subtotal < 500 ? 40 : 0)),
        shopOrderItems: shopOrder?.shopOrderItems || []
      }
    };

    setCurrentOrder(formatted);

    setAvailableAssignments(prev =>
      prev.filter(a => (a.assignmentId || a._id) !== assignmentId)
    );

    socket?.emit("order-accepted", formatted);

  } catch (error) {
    console.log("ERROR:", error.response?.data || error.message);
    alert(
      "Cannotaccept this order: " +
      (error.response?.data?.message || "Server Error")
    );
  }
};
 useEffect(() => {
  if (!socket || typeof socket.on !== "function") return;

  const handleNewAssignment = (data) => {
    if (!data) return;

    setAvailableAssignments(prev => [
      ...prev,
      {
        ...data,
        subtotal: data.subtotal || 0,
        deliveryCharge: data.deliveryCharge || 0,
        totalAmount:
          (data.subtotal || 0) +
          (data.deliveryCharge || 0),
        shopOrderItems: data.items || []
      }
    ]);
  };

  const handleOrderUpdate = (data) => {
    if (data.deliveryBoyId === userData?._id && data.shopOrder) {
      setCurrentOrder({
        ...data,
        shopOrder: {
          ...data.shopOrder,
          subtotal: data.shopOrder.subtotal || 0,
          deliveryCharge: data.shopOrder.deliveryCharge || 0,
          totalAmount:
            (data.shopOrder.subtotal || 0) +
            (data.shopOrder.deliveryCharge || 0),
          shopOrderItems: data.shopOrder.shopOrderItems || []
        }
      });
    }
  };

  socket.on("newAssignment", handleNewAssignment);
  socket.on("order-tracing-update", handleOrderUpdate);

  return () => {
    socket.off("newAssignment", handleNewAssignment);
    socket.off("order-tracing-update", handleOrderUpdate);
  };
}, [socket, userData]);

  // --- OTP Functions
  const sendOtp = async () => {
    if (!currentOrder) return;
    setLoading(true);
    try {
      await axios.post(`${serverUrl}/api/order/send-delivery-otp`, {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder?._id
      }, { withCredentials: true });
      setLoading(false);
      setShowOtpBox(true);
    } catch (error) {
      console.log(error);
      setLoading(false);
      alert("Failed to send OTP");
    }
  };

  const verifyOtp = async () => {
  if (!currentOrder) return;
  setMessage("");

  try {
    const result = await axios.post(
      `${serverUrl}/api/order/verify-delivery-otp`,
      {
        orderId: currentOrder._id,
        shopOrderId: currentOrder.shopOrder?._id,
        otp
      },
      { withCredentials: true }
    );

    // SUCCESS MESSAGE
    setMessage(result.data.message);

    // RESET STATE
    // RESET STATE FIRST
setShowOtpBox(false);
setOtp("");
setCurrentOrder(null);

// optional refresh
await getAssignments();
await handleTodayDeliveries();

// ✅ LAST me navigation
navigate("/delivered-success");

  } catch (error) {
    console.log(error);
    alert("Invalid OTP");
  }
};

  // --- Today's deliveries
  const handleTodayDeliveries = async () => {
    if (!userData?.role || userData.role !== "deliveryBoy") return;
    try {
      const result = await axios.get(`${serverUrl}/api/order/get-today-deliveries`, { withCredentials: true });
      setTodayDeliveries(result.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!userData?.role || userData.role !== "deliveryBoy") return;
    getAssignments();
    getCurrentOrder();
    handleTodayDeliveries();
  }, [userData]);

  if (!userData) return <div className='flex justify-center items-center w-screen h-screen'><ClipLoader size={50} color="#ff4d2d" /></div>;

  const shopOrder = currentOrder?.shopOrder;
  const shopName = shopOrder?.shop?.name || "N/A";
  const items = shopOrder?.shopOrderItems || [];
  const totalAmount = shopOrder?.totalAmount || 0;

  const deliveryBoyCoords = deliveryBoyLocation || {
    lat: userData?.location?.coordinates?.[1] || 0,
    lon: userData?.location?.coordinates?.[0] || 0
  };

  return (
    <div className='w-screen min-h-screen flex flex-col gap-5 items-center bg-[#fff9f6] overflow-y-auto'>
      <Nav />

      <div className='w-full max-w-[800px] flex flex-col gap-5 items-center'>

        {/* DeliveryBoy Info */}
        <div className='bg-white rounded-2xl shadow-md p-5 flex flex-col justify-start items-center w-[90%] border border-orange-100 text-center gap-2'>
          <h1 className='text-xl font-bold text-[#ff4d2d]'>Welcome, {userData.fullName}</h1>
          <p className='text-[#ff4d2d] '>
            <span className='font-semibold'>Latitude:</span> {deliveryBoyCoords.lat}, 
            <span className='font-semibold'> Longitude:</span> {deliveryBoyCoords.lon}
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
                <div key={a.assignmentId || a._id} className='border rounded-lg p-4 flex justify-between items-center'>
                  <div>
                    <p className='text-sm font-semibold'>{a?.shopName}</p>
                    <p className='text-sm text-gray-500'>
                      <span className='font-semibold'>Delivery Address:</span> {a?.deliveryAddress?.text || "N/A"}
                    </p>
                    <p className='text-xs text-gray-400'>
                      {a.shopOrderItems?.length || 0} items | ₹{a.subtotal || 0} + Delivery ₹{a.deliveryCharge || 0} = ₹{a.totalAmount || 0}
                    </p>
                  </div>
                  <button
                    className='bg-orange-500 text-white px-4 py-1 rounded-lg text-sm hover:bg-orange-600'
                    onClick={() => acceptOrder(a.assignmentId || a._id)}
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
  <p className='font-semibold text-sm'>{shopName}</p>
  <p className='text-sm text-gray-500'>{currentOrder.deliveryAddress?.text || "N/A"}</p>
  <p className='text-xs text-gray-400'>
    {items.length} items | ₹{shopOrder?.subtotal || 0} + Delivery ₹{shopOrder?.deliveryCharge || 0} = ₹{totalAmount || 0}
  </p>
  {/* ✅ Customer info */}
  <p className='text-sm text-gray-600 mt-1'>
    Customer: {currentOrder.user?.fullName} | 📞 {currentOrder.user?.mobile || "N/A"}
  </p>
</div>

          <DeliveryBoyTracking data={{
            deliveryBoyLocation: deliveryBoyCoords,
            customerLocation: {
              lat: currentOrder.deliveryAddress?.latitude || 0,
              lon: currentOrder.deliveryAddress?.longitude || 0
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
              <p className='text-sm font-semibold mb-2'>Enter OTP sent to <span className='text-orange-500'>{currentOrder.user?.fullName}</span></p>
              <input
                type="text"
                className='w-full border px-3 py-2 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-orange-400'
                placeholder='Enter OTP'
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              {message && <p className='text-center text-green-400 text-2xl mb-4'>{message}</p>}
             <button
  type="button"
  className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 transition-all"
  onClick={(e) => {
    e.preventDefault();   // 🔥 IMPORTANT
    verifyOtp();
  }}
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