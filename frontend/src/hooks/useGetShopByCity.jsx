import { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { serverUrl } from "../App";
import { setShopsInMyCity } from "../redux/userSlice";

function useGetShopByCity() {
  const dispatch = useDispatch();
  const { currentCity } = useSelector((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentCity) {
      dispatch(setShopsInMyCity([]));
      return;
    }

    const fetchShops = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await axios.get(
          `${serverUrl}/api/shop/get-by-city/${encodeURIComponent(currentCity)}`,
          { withCredentials: true } // send cookies for auth
        );

        const shops = Array.isArray(result.data) ? result.data : [];
        dispatch(setShopsInMyCity(shops));
      } catch (err) {
        console.error("Error fetching shops:", err.response?.data || err.message);
        dispatch(setShopsInMyCity([]));
        setError(err.response?.data || "Failed to fetch shops");
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, [currentCity, dispatch]);

  return { loading, error };
}

export default useGetShopByCity;