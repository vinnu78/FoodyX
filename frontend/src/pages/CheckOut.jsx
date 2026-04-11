import React, { useEffect, useState } from 'react'
import { IoIosArrowRoundBack } from "react-icons/io";
import { IoSearchOutline } from "react-icons/io5";
import { TbCurrentLocation } from "react-icons/tb";
import { IoLocationSharp } from "react-icons/io5";
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useDispatch, useSelector } from 'react-redux';
import "leaflet/dist/leaflet.css"
import { setAddress, setLocation } from '../redux/mapSlice';
import { MdDeliveryDining } from "react-icons/md";
import { FaCreditCard } from "react-icons/fa";
import axios from 'axios';
import { FaMobileScreenButton } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';
import { serverUrl } from '../App';
import { addMyOrder } from '../redux/userSlice';

function RecenterMap({ location }) {
  const map = useMap()

  useEffect(() => {
    if (location?.lat && location?.lon) {
      map.setView([location.lat, location.lon], 16, { animate: true })
    }
  }, [location])

  return null
}

function CheckOut() {

  const { location, address } = useSelector(state => state.map)
  const { cartItems, totalAmount, userData, currentCity } = useSelector(state => state.user)

  const [addressInput, setAddressInput] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("cod")

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const apiKey = import.meta.env.VITE_GEOAPIKEY

  const deliveryFee = totalAmount > 500 ? 0 : 40
  const AmountWithDeliveryFee = totalAmount + deliveryFee

  /* 🔥 FIX: manual city select hone par map update */

  useEffect(() => {

    const getCityLocation = async () => {

      if (!currentCity) return

      try {

        const result = await axios.get(
          `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(currentCity)}&apiKey=${apiKey}`
        )

        const { lat, lon } = result.data.features[0].properties

        dispatch(setLocation({ lat, lon }))

        getAddressByLatLng(lat, lon)

      } catch (error) {
        console.log(error)
      }

    }

    getCityLocation()

  }, [currentCity])

  const onDragEnd = (e) => {
    const { lat, lng } = e.target._latlng
    dispatch(setLocation({ lat, lon: lng }))
    getAddressByLatLng(lat, lng)
  }

  const getCurrentLocation = () => {
    const latitude = userData.location.coordinates[1]
    const longitude = userData.location.coordinates[0]

    dispatch(setLocation({ lat: latitude, lon: longitude }))
    getAddressByLatLng(latitude, longitude)
  }

  const getAddressByLatLng = async (lat, lng) => {
    try {

      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&format=json&apiKey=${apiKey}`
      )

      dispatch(setAddress(result?.data?.results[0]?.address_line2))

    } catch (error) {
      console.log(error)
    }
  }

  const getLatLngByAddress = async () => {
    try {

      const result = await axios.get(
        `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(addressInput)}&apiKey=${apiKey}`
      )

      const { lat, lon } = result.data.features[0].properties

      dispatch(setLocation({ lat, lon }))

    } catch (error) {
      console.log(error)
    }
  }

  const handlePlaceOrder = async () => {

    try {

      const formattedCartItems = cartItems.map((item) => {

  return {

    id: item.id,

    shop: typeof item.shop === "object"
      ? item.shop._id
      : item.shop,

    quantity: item.quantity,

    price: item.price,

    name: item.name

  }

})

      const result = await axios.post(

        `${serverUrl}/api/order/place-order`,

        {

          paymentMethod,

          deliveryAddress: {
            text: addressInput,
            latitude: location.lat,
            longitude: location.lon
          },

          totalAmount: AmountWithDeliveryFee,

          cartItems: formattedCartItems

        },

        { withCredentials: true }

      )

      if (paymentMethod === "cod") {

        dispatch(addMyOrder(result.data))

        navigate("/order-placed")

      } else {

        const orderId = result.data.orderId
        const razorOrder = result.data.razorOrder

        openRazorpayWindow(orderId, razorOrder)

      }

    } catch (error) {

      console.log("ORDER ERROR:", error.response?.data || error.message)

    }

  }

  const openRazorpayWindow = (orderId, razorOrder) => {

    const options = {

      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      amount: razorOrder.amount,

      currency: 'INR',

      name: "",

      description: "Food Delivery Website",

      order_id: razorOrder.id,

      handler: async function (response) {

        try {

          const result = await axios.post(

            `${serverUrl}/api/order/verify-payment`,

            {
              razorpay_payment_id: response.razorpay_payment_id,
              orderId
            },

            { withCredentials: true }

          )

          dispatch(addMyOrder(result.data))

          navigate("/order-placed")

        } catch (error) {
          console.log(error)
        }

      }

    }

    const rzp = new window.Razorpay(options)

    rzp.open()

  }

  useEffect(() => {

    setAddressInput(address)

  }, [address])

  return (

    <div className='min-h-screen bg-[#fff9f6] flex items-center justify-center p-6'>

      <div
        className='absolute top-[20px] left-[20px] z-[10]'
        onClick={() => navigate("/")}
      >
        <IoIosArrowRoundBack size={35} className='text-[#ff4d2d]' />
      </div>

      <div className='w-full max-w-[900px] bg-white rounded-2xl shadow-xl p-6 space-y-6'>

        <h1 className='text-2xl font-bold text-gray-800'>Checkout</h1>

        <section>

          <h2 className='text-lg font-semibold mb-2 flex items-center gap-2 text-gray-800'>
            <IoLocationSharp className='text-[#ff4d2d]' /> Delivery Location
          </h2>

          <div className='flex gap-2 mb-3'>

            <input
              type="text"
              className='flex-1 border border-gray-300 rounded-lg p-2'
              placeholder='Enter Your Delivery Address..'
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
            />

            <button
              className='bg-[#ff4d2d] text-white px-3 py-2 rounded-lg'
              onClick={getLatLngByAddress}
            >
              <IoSearchOutline size={17} />
            </button>

            <button
              className='bg-blue-500 text-white px-3 py-2 rounded-lg'
              onClick={getCurrentLocation}
            >
              <TbCurrentLocation size={17} />
            </button>

          </div>

          <div className='rounded-xl border overflow-hidden'>

            <div className='h-64 w-full'>

              <MapContainer
                className={"w-full h-full"}
                center={[location?.lat || 20.5937, location?.lon || 78.9629]}
                zoom={16}
              >

                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <RecenterMap location={location} />

                <Marker
                  position={[location?.lat || 20.5937, location?.lon || 78.9629]}
                  draggable
                  eventHandlers={{ dragend: onDragEnd }}
                />

              </MapContainer>

            </div>

          </div>

        </section>

        <section>

          <h2 className='text-lg font-semibold mb-3 text-gray-800'>Payment Method</h2>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>

            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${paymentMethod === "cod"
                ? "border-[#ff4d2d] bg-orange-50"
                : "border-gray-200"
                }`}
              onClick={() => setPaymentMethod("cod")}
            >

              <MdDeliveryDining className='text-green-600 text-xl' />

              <div>

                <p className='font-medium text-gray-800'>Cash On Delivery</p>

                <p className='text-xs text-gray-500'>Pay when food arrives</p>

              </div>

            </div>

            <div
              className={`flex items-center gap-3 rounded-xl border p-4 ${paymentMethod === "online"
                ? "border-[#ff4d2d] bg-orange-50"
                : "border-gray-200"
                }`}
              onClick={() => setPaymentMethod("online")}
            >

              <FaMobileScreenButton className='text-purple-700 text-lg' />
              <FaCreditCard className='text-blue-700 text-lg' />

              <div>

                <p className='font-medium text-gray-800'>UPI / Card</p>

                <p className='text-xs text-gray-500'>Pay Online</p>

              </div>

            </div>

          </div>

        </section>

        <section>

          <h2 className='text-lg font-semibold mb-3 text-gray-800'>Order Summary</h2>

          <div className='rounded-xl border bg-gray-50 p-4 space-y-2'>

            {cartItems.map((item, index) => (

              <div key={index} className='flex justify-between text-sm text-gray-700'>

                <span>{item.name} x {item.quantity}</span>

                <span>₹{item.price * item.quantity}</span>

              </div>

            ))}

            <hr />

            <div className='flex justify-between font-medium'>

              <span>Subtotal</span>

              <span>₹{totalAmount}</span>

            </div>

            <div className='flex justify-between'>

              <span>Delivery Fee</span>

              <span>{deliveryFee === 0 ? "Free" : `₹${deliveryFee}`}</span>

            </div>

            <div className='flex justify-between text-lg font-bold text-[#ff4d2d]'>

              <span>Total</span>

              <span>₹{AmountWithDeliveryFee}</span>

            </div>

          </div>

        </section>

        <button
          className='w-full bg-[#ff4d2d] text-white py-3 rounded-xl font-semibold'
          onClick={handlePlaceOrder}
        >
          {paymentMethod === "cod" ? "Place Order" : "Pay & Place Order"}
        </button>

      </div>

    </div>

  )

}

export default CheckOut