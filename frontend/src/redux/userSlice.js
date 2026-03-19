import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",

  initialState: {
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    myOrders: [],
    searchItems: null,
    socket: null
  },

  reducers: {

    setUserData: (state, action) => {
      state.userData = action.payload;
    },

    setCurrentCity: (state, action) => {
      state.currentCity = action.payload;
    },

    setCurrentState: (state, action) => {
      state.currentState = action.payload;
    },

    setCurrentAddress: (state, action) => {
      state.currentAddress = action.payload;
    },

    setShopsInMyCity: (state, action) => {
      state.shopInMyCity = action.payload;
    },

    setItemsInMyCity: (state, action) => {
      state.itemsInMyCity = action.payload;
    },

    // SOCKET SAFE STORAGE
    setSocket: (state, action) => {
      const socket = action.payload;

      if (socket) {
        state.socket = {
          connected: socket.connected,
          id: socket.id
        };
      } else {
        state.socket = null;
      }
    },

    // CART FUNCTIONS
  addToCart: (state, action) => {
  const cartItem = action.payload;

  // Ensure shop is always string ObjectId
  const shopId = typeof cartItem.shop === "object" ? cartItem.shop._id : cartItem.shop;

  const itemToAdd = { ...cartItem, shop: shopId };

  const existingItem = state.cartItems.find(
    (i) => i.id === itemToAdd.id
  );

  if (existingItem) {
    existingItem.quantity += itemToAdd.quantity;
  } else {
    state.cartItems.push(itemToAdd);
  }

  state.totalAmount = state.cartItems.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );
},

    updateQuantity: (state, action) => {

      const { id, quantity } = action.payload;

      const item = state.cartItems.find(
        (i) => i.id === id
      );

      if (item) {
        item.quantity = quantity;
      }

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    },

    removeCartItem: (state, action) => {

      state.cartItems = state.cartItems.filter(
        (i) => i.id !== action.payload
      );

      state.totalAmount = state.cartItems.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    },

    setTotalAmount: (state, action) => {
      state.totalAmount = action.payload;
    },

    // ORDERS
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },

    addMyOrder: (state, action) => {
      state.myOrders = [action.payload, ...state.myOrders];
    },

    // FIXED ORDER STATUS UPDATE
    updateOrderStatus: (state, action) => {

      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find(
        (o) => o._id === orderId
      );

      if (!order) return;

      // case 1: shopOrders array
      if (Array.isArray(order.shopOrders)) {

        const shopOrder = order.shopOrders.find(
          (so) => so?.shop?._id === shopId
        );

        if (shopOrder) {
          shopOrder.status = status;
        }

      }

      // case 2: single shopOrder object
      else if (order.shopOrder && order.shopOrder?.shop?._id === shopId) {

        order.shopOrder.status = status;

      }

    },

    updateRealtimeOrderStatus: (state, action) => {

      const { orderId, shopId, status } = action.payload;

      const order = state.myOrders.find(
        (o) => o._id === orderId
      );

      if (!order) return;

      if (Array.isArray(order.shopOrders)) {

        const shopOrder = order.shopOrders.find(
          (so) => so?.shop?._id === shopId
        );

        if (shopOrder) {
          shopOrder.status = status;
        }

      }

      else if (order.shopOrder && order.shopOrder?.shop?._id === shopId) {

        order.shopOrder.status = status;

      }

    },

    setSearchItems: (state, action) => {
      state.searchItems = action.payload;
    }

  }

});

export const {
  setUserData,
  setCurrentAddress,
  setCurrentCity,
  setCurrentState,
  setShopsInMyCity,
  setItemsInMyCity,
  addToCart,
  updateQuantity,
  removeCartItem,
  setMyOrders,
  addMyOrder,
  updateOrderStatus,
  updateRealtimeOrderStatus,
  setSearchItems,
  setTotalAmount,
  setSocket
} = userSlice.actions;

export default userSlice.reducer;