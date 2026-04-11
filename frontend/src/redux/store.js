import { configureStore } from "@reduxjs/toolkit"; // sirf configureStore
import userSlice from "./userSlice";
import ownerSlice from "./ownerSlice";
import mapSlice from "./mapSlice";

export const store = configureStore({
  reducer: {
    user: userSlice,
    owner: ownerSlice,
    map: mapSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // ignore socket warnings
        ignoredPaths: ["user.socket"],
        ignoredActions: ["user/setSocket"],
      },
    }),
});