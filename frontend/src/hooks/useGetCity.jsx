import axios from "axios";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setCurrentCity } from "../redux/userSlice";

function useGetCity() {
  const dispatch = useDispatch();
  const apiKey = import.meta.env.VITE_GEOAPIKEY;

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      dispatch(setCurrentCity("Unknown"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // ✅ Dev override for coordinates
        const lat = import.meta.env.VITE_DEV_LAT || pos.coords.latitude;
        const lon = import.meta.env.VITE_DEV_LON || pos.coords.longitude;

        console.log("GPS:", lat, lon);

        try {
          const res = await axios.get(
            `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lon}&apiKey=${apiKey}`
          );

          const props = res.data.features?.[0]?.properties;

          if (!props) {
            console.log("No Geoapify properties found");
            dispatch(setCurrentCity("Unknown"));
            return;
          }

          // ✅ Detect city with multiple fallbacks
          const detectedCity =
            props.city ||
            props.town ||
            props.village ||
            props.county ||
            props.state;

          // ✅ Dev override for city
          const city = import.meta.env.VITE_DEV_CITY || detectedCity;

          console.log("Detected city:", city);
          dispatch(setCurrentCity(city || "Unknown"));
        } catch (error) {
          console.log("Geoapify error:", error);
          dispatch(setCurrentCity("Unknown"));
        }
      },
      (err) => {
        console.log("Geolocation error:", err);
        dispatch(setCurrentCity("Unknown"));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [dispatch, apiKey]);
}

export default useGetCity;