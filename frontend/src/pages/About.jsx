function About() {
  return (
    <div className="bg-gradient-to-r from-orange-100 to-orange-50 min-h-screen p-10">
      
      {/* Heading Section */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-orange-600">
          About FoodyX 🍔
        </h1>
        <p className="mt-4 text-gray-600 text-lg">
          Delivering happiness, one meal at a time 🚀
        </p>
      </div>

      {/* Content Section */}
      <div className="mt-10 max-w-3xl mx-auto bg-white shadow-lg rounded-2xl p-8">
        <p className="text-gray-700 text-lg leading-relaxed">
          FoodyX is a modern and user-friendly food delivery platform inspired by
          Swiggy. We bring your favorite meals right to your doorstep with fast
          delivery and seamless ordering experience.
        </p>

        <p className="mt-4 text-gray-700 text-lg leading-relaxed">
          Whether you're craving street food, restaurant dishes, or late-night
          snacks, FoodyX connects you with the best food options around you.
        </p>

        <p className="mt-4 text-gray-700 text-lg leading-relaxed">
          With easy navigation, secure payments, and real-time tracking, we make
          food ordering simple, quick, and enjoyable.
        </p>
      </div>

      {/* Features Section */}
      <div className="mt-12 grid md:grid-cols-3 gap-6 text-center">
        
        <div className="bg-white p-6 rounded-xl shadow-md hover:scale-105 transition">
          <h2 className="text-xl font-semibold text-orange-500">⚡ Fast Delivery</h2>
          <p className="mt-2 text-gray-600">Quick and reliable service at your doorstep</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:scale-105 transition">
          <h2 className="text-xl font-semibold text-orange-500">🍽 Wide Variety</h2>
          <p className="mt-2 text-gray-600">Choose from multiple cuisines and restaurants</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md hover:scale-105 transition">
          <h2 className="text-xl font-semibold text-orange-500">🔒 Secure Payments</h2>
          <p className="mt-2 text-gray-600">Safe and easy payment options</p>
        </div>

      </div>
    </div>
  )
}

export default About