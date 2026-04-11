import axios from "axios";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setCurrentAddress, setCurrentCity, setCurrentState } from "../redux/userSlice";
import { setAddress, setLocation } from "../redux/mapSlice";

function useUpdateLocation() {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (!userData) return;
    if (!navigator.geolocation) return;

    let lastUpdate = 0;

    const updateLocation = async (lat, lon) => {
      const now = Date.now();
      if (now - lastUpdate < 5000) return; // prevent spam

      lastUpdate = now;

      try {
        const res = await axios.post(
          `${serverUrl}/api/user/update-location`,
          {
            lat: lat,     // ✅ MATCH BACKEND
            lon: lon      // ✅ MATCH BACKEND
          },
          { withCredentials: true }
        );

        const { city, state, address } = res.data;

        if (city) dispatch(setCurrentCity(city));
        if (state) dispatch(setCurrentState(state));
        if (address) {
          dispatch(setCurrentAddress(address));
          dispatch(setAddress(address));
        }

        dispatch(setLocation({ lat, lon }));

      } catch (err) {
        console.error("Location error:", err.response?.data || err.message);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error(err.message),
      { enableHighAccuracy: true, timeout: 15000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userData, dispatch]);
}

export default useUpdateLocation;