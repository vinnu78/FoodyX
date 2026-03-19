import React, { useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'

import LandingPage from './pages/LandingPage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import ForgotPassword from './pages/ForgotPassword'
import Home from './pages/Home'
import About from './pages/About'
import Contact from './pages/Contact'
import Team from './pages/Team'
import CreateEditShop from './pages/CreateEditShop'
import AddItem from './pages/AddItem'
import EditItem from './pages/EditItem'
import CartPage from './pages/CartPage'
import CheckOut from './pages/CheckOut'
import OrderPlaced from './pages/OrderPlaced'
import MyOrders from './pages/MyOrders'
import TrackOrderPage from './pages/TrackOrderPage'
import Shop from './pages/Shop'

import useGetCurrentUser from './hooks/useGetCurrentUser'
import useGetCity from './hooks/useGetCity'
import useGetMyshop from './hooks/useGetMyShop'
import useGetShopByCity from './hooks/useGetShopByCity'
import useGetItemsByCity from './hooks/useGetItemsByCity'
import useGetMyOrders from './hooks/useGetMyOrders'
import useUpdateLocation from './hooks/useUpdateLocation'

import { setSocket } from './redux/userSlice'

export const serverUrl = "http://localhost:5000"

function App() {
  const { userData } = useSelector(state => state.user)
  const dispatch = useDispatch()

  // 🔥 Custom Hooks
  useGetCurrentUser()
  useUpdateLocation()
  useGetCity()
  useGetMyshop()
  useGetShopByCity()
  useGetItemsByCity()
  useGetMyOrders()

  // 🔥 Socket Setup
  useEffect(() => {
    const socketInstance = io(serverUrl, { withCredentials: true })
    dispatch(setSocket(socketInstance))

    socketInstance.on('connect', () => {
      console.log("Socket Connected ✅")
      if (userData?._id) {
        socketInstance.emit('identity', { userId: userData._id })
      }
    })

    return () => socketInstance.disconnect()
  }, [userData?._id])

  return (
    <Routes>
      {/* 🔥 PUBLIC ROUTES */}
      <Route path='/' element={!userData ? <LandingPage /> : <Navigate to="/home" />} />
      <Route path='/about' element={<About />} />
      <Route path='/contact' element={<Contact />} />
      <Route path='/team' element={<Team />} />

      {/* 🔐 AUTH ROUTES */}
      <Route path='/signin' element={!userData ? <SignIn /> : <Navigate to="/home" />} />
      <Route path='/signup' element={!userData ? <SignUp /> : <Navigate to="/home" />} />
      <Route path='/forgot-password' element={!userData ? <ForgotPassword /> : <Navigate to="/home" />} />

      {/* 🔒 PROTECTED ROUTES */}
      <Route path='/home' element={userData ? <Home /> : <Navigate to="/signin" />} />
      <Route path='/create-edit-shop' element={userData ? <CreateEditShop /> : <Navigate to="/signin" />} />
      <Route path='/add-item' element={userData ? <AddItem /> : <Navigate to="/signin" />} />
      <Route path='/edit-item/:itemId' element={userData ? <EditItem /> : <Navigate to="/signin" />} />
      <Route path='/cart' element={userData ? <CartPage /> : <Navigate to="/signin" />} />
      <Route path='/checkout' element={userData ? <CheckOut /> : <Navigate to="/signin" />} />
      <Route path='/order-placed' element={userData ? <OrderPlaced /> : <Navigate to="/signin" />} />
      <Route path='/my-orders' element={userData ? <MyOrders /> : <Navigate to="/signin" />} />
      <Route path='/track-order/:orderId' element={userData ? <TrackOrderPage /> : <Navigate to="/signin" />} />
      <Route path='/shop/:shopId' element={userData ? <Shop /> : <Navigate to="/signin" />} />

      {/* ❌ Catch-all route */}
      <Route path='*' element={<Navigate to='/' />} />
    </Routes>
  )
}

export default App