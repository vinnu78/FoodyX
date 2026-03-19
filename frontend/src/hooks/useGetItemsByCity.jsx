import axios from "axios";
import { useEffect } from "react";
import { serverUrl } from "../App";
import { useDispatch, useSelector } from "react-redux";
import { setItemsInMyCity } from "../redux/userSlice";

function useGetItemsByCity() {

  const dispatch = useDispatch();
  const { currentCity } = useSelector((state) => state.user);

  useEffect(() => {

    if (!currentCity || currentCity === "Unknown") return;

    const fetchItems = async () => {

      try {

        console.log("Fetching items for city:", currentCity);

        const result = await axios.get(
          `${serverUrl}/api/item/get-by-city/${encodeURIComponent(currentCity)}`,
          { withCredentials: true }   // ⭐ IMPORTANT FIX
        );

        console.log("Items received:", result.data);

        dispatch(setItemsInMyCity(result.data || []));

      } catch (error) {

        console.log(
          "Items fetch error:",
          error?.response?.data || error.message
        );

        dispatch(setItemsInMyCity([]));

      }

    };

    fetchItems();

  }, [currentCity, dispatch]);

}

export default useGetItemsByCity;