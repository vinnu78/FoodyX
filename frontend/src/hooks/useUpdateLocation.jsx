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
    if (!userData) return; // Only track if logged in
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported");
      return;
    }

    const updateLocation = async (lat, lon) => {
      try {
        const res = await axios.post(
          `${serverUrl}/api/user/update-location`,
          { lat, lon },
          { withCredentials: true } // send cookies for auth
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
        console.error("Error updating location:", err.response?.data || err.message);
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => updateLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.error("Geolocation error:", err.message),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 } // increased timeout
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [userData, dispatch]);
}

export default useUpdateLocation;