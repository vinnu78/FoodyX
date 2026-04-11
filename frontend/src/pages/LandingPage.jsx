import React from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'

function LandingPage() {

  const navigate = useNavigate()

  const handleExplore = () => {
    navigate("/signin")
  }

  const categories = [
    {
      name: "Pizza",
      img: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Burger",
      img: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Biryani",
      img: "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Chinese",
      img: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=600&q=80"
    },
    {
      name: "Dessert",
      img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=600&q=80"
    }
  ]

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#fff9f6] overflow-x-hidden">

      {/* 🔝 HEADER */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center px-5 md:px-10 py-4 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-[#ff4d2d] cursor-pointer">
          FoodyX
        </h1>

        <div className="flex gap-3">
          <button 
            className="text-[#ff4d2d] font-medium text-sm md:text-base"
            onClick={() => navigate("/signin")}
          >
            Login
          </button>

          <button 
            className="bg-[#ff4d2d] text-white px-4 md:px-5 py-2 rounded-lg text-sm md:text-base"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* 🔥 HERO SECTION */}
      <div className="flex flex-col items-center justify-center text-center px-4 md:px-6 py-12 md:py-16 gap-4">

        <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
          Discover the best food & drinks
        </h1>

        <p className="text-gray-500 text-base md:text-lg">
          Order from restaurants near you 🍕🍔
        </p>

        <button 
          className="bg-[#ff4d2d] text-white px-6 md:px-8 py-2 md:py-3 rounded-lg text-base md:text-lg mt-3 hover:opacity-90 transition"
          onClick={handleExplore}
        >
          Explore Food
        </button>

      </div>

      {/* 🍔 POPULAR CATEGORIES */}
      <div className="px-5 md:px-10 py-8 md:py-12">
        <h2 className="text-xl md:text-2xl font-semibold mb-6">Popular Categories</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 md:gap-6">

          {categories.map((item, index) => (

            <div
              key={index}
              onClick={() => navigate("/signin")}
              className="bg-white rounded-xl shadow-md hover:scale-105 transition cursor-pointer overflow-hidden"
            >

              <img
                src={item.img}
                alt={item.name}
                className="w-full h-28 md:h-32 object-cover"
              />

              <div className="p-3 md:p-4 text-center">
                <h3 className="font-medium text-sm md:text-base">{item.name}</h3>
              </div>

            </div>

          ))}

        </div>
      </div>

      {/* 🚀 FEATURES */}
      <div className="px-5 md:px-10 py-8 md:py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md text-center">
          <h2 className="text-lg md:text-xl font-semibold">👤 User</h2>
          <p className="text-gray-500 text-sm mt-2">
            Order food easily with live tracking
          </p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md text-center">
          <h2 className="text-lg md:text-xl font-semibold">🏪 Owner</h2>
          <p className="text-gray-500 text-sm mt-2">
            Manage shop & grow business
          </p>
        </div>

        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md text-center">
          <h2 className="text-lg md:text-xl font-semibold">🚴 Delivery Boy</h2>
          <p className="text-gray-500 text-sm mt-2">
            Deliver & earn money
          </p>
        </div>

      </div>

      {/* 📱 APP PROMO SECTION */}
      <div className="px-5 md:px-10 py-8 md:py-12 bg-[#ffece6] text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          Get the FoodyX App
        </h2>
        <p className="text-gray-600 text-sm md:text-base">
          Faster ordering experience on mobile 📱
        </p>
      </div>

      {/* 🔥 Footer */}
      <Footer />

    </div>
  )
}

export default LandingPage