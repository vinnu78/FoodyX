import React from 'react';
import { FaCircleCheck } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom';

function DeliveredSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex flex-col justify-center items-center text-center px-4">

      {/* Icon */}
      <div className="bg-green-100 p-6 rounded-full shadow-md mb-6 animate-bounce">
        <FaCircleCheck className="text-green-500 text-7xl" />
      </div>

      {/* Heading */}
      <h1 className="text-4xl font-extrabold text-gray-800 mb-3">
        Delivered Successfully 🎉
      </h1>

      {/* Subtext */}
      <p className="text-gray-500 max-w-md mb-8">
        The order has been delivered to the customer.  
        Great job! Keep delivering happiness 🚀
      </p>

      {/* Buttons */}
      <div className="flex gap-4 flex-wrap justify-center">

        <button
          onClick={() => navigate("/delivery-dashboard")}
          className="bg-[#ff4d2d] hover:bg-[#e64526] text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-md transition-all duration-200 active:scale-95"
        >
          🚚 Next Order
        </button>

        <button
          onClick={() => navigate("/home")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-xl text-lg font-semibold shadow-md transition-all duration-200 active:scale-95"
        >
          🏠 Go Home
        </button>

      </div>

      {/* Footer */}
      <p className="text-sm text-gray-400 mt-10">
        Thank you for your service ❤️
      </p>

    </div>
  );
}

export default DeliveredSuccess;