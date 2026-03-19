/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react'
import { FaLocationDot, FaChevronDown, FaPlus } from "react-icons/fa6";
import { IoIosSearch } from "react-icons/io";
import { FiShoppingCart } from "react-icons/fi";
import { TbReceipt2 } from "react-icons/tb";
import { useDispatch, useSelector } from 'react-redux';
import { setSearchItems, setUserData, setCurrentCity } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';

function Nav() {

  const { userData, currentCity, cartItems } = useSelector(state => state.user)
  const { myShopData } = useSelector(state => state.owner)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [query, setQuery] = useState("")
  const [showCityDropdown, setShowCityDropdown] = useState(false)
  const [cityQuery, setCityQuery] = useState("")
  const [cities, setCities] = useState([])
  const [showInfo, setShowInfo] = useState(false)

  // ================= LOGOUT =================
  const handleLogOut = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true })
      dispatch(setUserData(null))
    } catch (error) {
      console.log(error)
    }
  }

  // ================= SEARCH ITEMS =================
  const handleSearchItems = async () => {

    if (!query) {
      dispatch(setSearchItems(null))
      return
    }

    try {

      const result = await axios.get(
        `${serverUrl}/api/item/search-items`,
        {
          params: {
            query: query,
            city: currentCity
          },
          withCredentials: true
        }
      )

      dispatch(setSearchItems(result.data))

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    handleSearchItems()
  }, [query, currentCity])


  // ================= FETCH INDIA CITIES =================
  const fetchCities = async () => {

    if (cityQuery.length < 1) {
      setCities([])
      return
    }

    try {

      const options = {
        method: 'GET',
        url: 'https://wft-geo-db.p.rapidapi.com/v1/geo/cities',
        params: {
          namePrefix: cityQuery,
          limit:5,
          countryIds: "IN"   // 🔥 ONLY INDIA
        },
        headers: {
          'X-RapidAPI-Key': 'bc3a087494msh76f2bb7ed420b46p1aecc2jsnf12ae568b978',
          'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com'
        }
      }

      const res = await axios.request(options)

      const cityList = res.data.data.map(item => item.city)

      setCities(cityList)

    } catch (error) {

      const fallbackCities = [
        "Delhi",
        "Mumbai",
        "Patna",
        "Kolkata",
        "Bangalore",
        "Hyderabad",
        "Chennai",
        "Pune"
      ]

      const filtered = fallbackCities.filter(c =>
        c.toLowerCase().includes(cityQuery.toLowerCase())
      )

      setCities(filtered)
    }
  }

  useEffect(() => {

    const delay = setTimeout(() => {
      fetchCities()
    }, 800)

    return () => clearTimeout(delay)

  }, [cityQuery])


  // ================= SELECT CITY =================
  const selectCity = (city) => {

    dispatch(setCurrentCity(city))
    setShowCityDropdown(false)
    setCityQuery("")

  }


  // ================= GPS LOCATION =================
  const getCurrentLocation = () => {

    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {

      const { latitude, longitude } = pos.coords

      try {

        const res = await axios.get(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )

        const cityName = res.data.city || res.data.locality

        if (cityName) dispatch(setCurrentCity(cityName))

        setShowCityDropdown(false)

      } catch (err) {
        console.log(err)
      }

    })
  }


  return (

    <div className='w-full h-[90px] flex items-center justify-between px-[20px] fixed top-0 z-[9999] bg-[#fff9f6] shadow-md'>

      {/* LOGO */}
      <h1
        className='text-3xl font-bold text-[#ff4d2d] cursor-pointer'
        onClick={() => navigate("/")}
      >
        FoodyX
      </h1>


      {/* ================= USER NAVBAR ================= */}

      {userData?.role === "user" && (

        <div className='md:w-[60%] lg:w-[45%] h-[70px] bg-white shadow-xl rounded-lg flex items-center gap-4 relative'>

          {/* LOCATION */}
          <div
            className='flex items-center gap-2 px-4 cursor-pointer border-r border-gray-300'
            onClick={() => setShowCityDropdown(prev => !prev)}
          >

            <FaLocationDot size={25} className="text-[#ff4d2d]" />

            <div className='truncate font-medium'>
              {currentCity || "Select City"}
            </div>

            <FaChevronDown size={16} />

          </div>


          {/* CITY DROPDOWN */}
          {showCityDropdown && (

            <div className='absolute top-[75px] left-0 w-[300px] bg-white shadow-xl rounded-lg p-2 z-50'>

              <div
                className='p-2 hover:bg-gray-100 cursor-pointer flex gap-2'
                onClick={getCurrentLocation}
              >
                <FaLocationDot />
                Use my current location
              </div>

              <input
                type="text"
                placeholder='Search city...'
                className='w-full border p-2 rounded my-2'
                value={cityQuery}
                onChange={(e) => setCityQuery(e.target.value)}
              />

              {cities.map((city, index) => (
                <div
                  key={index}
                  className='p-2 hover:bg-gray-100 cursor-pointer'
                  onClick={() => selectCity(city)}
                >
                  {city}
                </div>
              ))}

            </div>
          )}


          {/* FOOD SEARCH */}
          <div className='w-full flex items-center gap-2 px-4'>

            <IoIosSearch size={25} className='text-[#ff4d2d]' />

            <input
              type="text"
              placeholder='Search delicious food...'
              className='w-full outline-none'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

          </div>

        </div>
      )}



      {/* ================= RIGHT SECTION ================= */}

      <div className='flex items-center gap-4'>

        {/* USER CART */}
        {userData?.role === "user" && (

          <>
            <div
              className='relative cursor-pointer'
              onClick={() => navigate("/cart")}
            >
              <FiShoppingCart size={25} className='text-[#ff4d2d]' />

              <span className='absolute right-[-8px] top-[-10px] text-[#ff4d2d] font-semibold'>
                {cartItems.length}
              </span>
            </div>

            <button
              className='px-3 py-1 rounded-lg bg-[#ff4d2d]/10 text-[#ff4d2d]'
              onClick={() => navigate("/my-orders")}
            >
              My Orders
            </button>
          </>
        )}



        {/* OWNER NAVBAR */}
        {userData?.role === "owner" && (

          <>

            {myShopData && (

              <button
                className='flex items-center gap-2 px-3 py-1 bg-[#ff4d2d]/10 text-[#ff4d2d] rounded-lg'
                onClick={() => navigate("/add-item")}
              >
                <FaPlus />
                Add Food
              </button>

            )}

            <button
              className='flex items-center gap-2 px-3 py-1 bg-[#ff4d2d]/10 text-[#ff4d2d] rounded-lg'
              onClick={() => navigate("/my-orders")}
            >
              <TbReceipt2 />
              Orders
            </button>

          </>

        )}



        {/* USER PROFILE */}
        <div
          className='w-[40px] h-[40px] rounded-full flex items-center justify-center bg-[#ff4d2d] text-white font-semibold cursor-pointer'
          onClick={() => setShowInfo(prev => !prev)}
        >
          {userData?.fullName?.slice(0, 1)}
        </div>


        {/* PROFILE DROPDOWN */}
        {showInfo && (

          <div className='absolute top-[90px] right-[10px] w-[180px] bg-white shadow-xl rounded-lg p-4'>

            <div className='font-semibold'>
              {userData?.fullName}
            </div>

            <div
              className='text-[#ff4d2d] cursor-pointer mt-2'
              onClick={handleLogOut}
            >
              Log Out
            </div>

          </div>

        )}

      </div>

    </div>
  )
}

export default Nav