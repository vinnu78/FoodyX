import axios from 'axios'
import React, { useEffect } from 'react'
import { serverUrl } from '../App'
import { useDispatch, useSelector } from 'react-redux'
import { setMyOrders } from '../redux/userSlice'

function useGetMyOrders() {
  const dispatch = useDispatch()
  const { userData } = useSelector(state => state.user)

  useEffect(() => {
    if (!userData || !userData._id) return // wait until userData is loaded

    const fetchOrders = async () => {
      try {
        const result = await axios.get(`${serverUrl}/api/order/my-orders`, { withCredentials: true })
        dispatch(setMyOrders(result.data || [])) // ensure array
      } catch (error) {
        console.log("Error fetching orders:", error)
      }
    }

    fetchOrders()
  }, [userData, dispatch]) // include dispatch to avoid React warning
}

export default useGetMyOrders