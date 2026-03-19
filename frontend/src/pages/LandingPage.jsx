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
    <div className="w-screen min-h-screen flex flex-col bg-[#fff9f6]">

      {/* 🔝 HEADER */}
      <div className="w-full flex justify-between items-center px-10 py-6">
        <h1 className="text-4xl font-bold text-[#ff4d2d] cursor-pointer">
          FoodyX
        </h1>

        <div className="flex gap-4">
          <button 
            className="text-[#ff4d2d] font-medium"
            onClick={() => navigate("/signin")}
          >
            Login
          </button>

          <button 
            className="bg-[#ff4d2d] text-white px-5 py-2 rounded-lg"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* 🔥 HERO SECTION */}
      <div className="flex flex-col items-center justify-center text-center px-6 py-16 gap-6">

        <h1 className="text-5xl md:text-6xl font-bold text-gray-800">
          Discover the best food & drinks
        </h1>

        <p className="text-gray-500 text-lg">
          Order from restaurants near you 🍕🍔
        </p>

        <button 
          className="bg-[#ff4d2d] text-white px-8 py-3 rounded-lg text-lg mt-4 hover:opacity-90 transition"
          onClick={handleExplore}
        >
          Explore Food
        </button>

      </div>

      {/* 🍔 POPULAR CATEGORIES */}
      <div className="px-10 py-12">
        <h2 className="text-2xl font-semibold mb-6">Popular Categories</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">

          {categories.map((item, index) => (

            <div
              key={index}
              onClick={() => navigate("/signin")}
              className="bg-white rounded-xl shadow-md hover:scale-105 transition cursor-pointer overflow-hidden"
            >

              <img
                src={item.img}
                alt={item.name}
                className="w-full h-32 object-cover"
              />

              <div className="p-4 text-center">
                <h3 className="font-medium">{item.name}</h3>
              </div>

            </div>

          ))}

        </div>
      </div>

      {/* 🚀 FEATURES */}
      <div className="px-10 py-12 grid md:grid-cols-3 gap-6">

        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-semibold">👤 User</h2>
          <p className="text-gray-500 text-sm mt-2">
            Order food easily with live tracking
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-semibold">🏪 Owner</h2>
          <p className="text-gray-500 text-sm mt-2">
            Manage shop & grow business
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-semibold">🚴 Delivery Boy</h2>
          <p className="text-gray-500 text-sm mt-2">
            Deliver & earn money
          </p>
        </div>

      </div>

      {/* 📱 APP PROMO SECTION */}
      <div className="px-10 py-12 bg-[#ffece6] text-center">
        <h2 className="text-3xl font-bold mb-4">
          Get the FoodyX App
        </h2>
        <p className="text-gray-600">
          Faster ordering experience on mobile 📱
        </p>
      </div>

      {/* 🔥 Footer */}
      <Footer />

    </div>
  )
}

export default LandingPage