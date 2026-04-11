import DeliveryAssignment from "../models/deliveryAssignment.model.js"
import Order from "../models/order.model.js"
import Shop from "../models/shop.model.js"
import User from "../models/user.model.js"
import { sendDeliveryOtpMail } from "../utils/mail.js"
import RazorPay from "razorpay"
import dotenv from "dotenv"
import { count } from "console"

dotenv.config()
let instance = new RazorPay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const placeOrder = async (req, res) => {
  try {
    const { cartItems, paymentMethod, deliveryAddress } = req.body;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!deliveryAddress.text || !deliveryAddress.latitude || !deliveryAddress.longitude) {
      return res.status(400).json({ message: "Send complete deliveryAddress" });
    }

    // Group items by shop
    const groupItemsByShop = {};
    cartItems.forEach(item => {
      const shopId = item.shop;
      if (!groupItemsByShop[shopId]) groupItemsByShop[shopId] = [];
      groupItemsByShop[shopId].push(item);
    });

    // Create shop orders
    const shopOrders = await Promise.all(
      Object.keys(groupItemsByShop).map(async shopId => {
        const shop = await Shop.findById(shopId).populate("owner");
        if (!shop) throw new Error("Shop not found");

        const items = groupItemsByShop[shopId];
        const subtotal = items.reduce((sum, i) => sum + Number(i.price) * Number(i.quantity), 0);

        // Delivery charge: free if subtotal >= 500, else 40
        const deliveryCharge = subtotal >= 500 ? 0 : 40;

        return {
          shop: shop._id,
          shopName: shop.name, // Include shop name
          owner: shop.owner._id,
          subtotal,
          deliveryCharge,
          totalAmount: subtotal + deliveryCharge,
          shopOrderItems: items.map(i => ({
            item: i.id,
            price: i.price,
            quantity: i.quantity,
            name: i.name
          }))
        };
      })
    );

    // Total amount across all shops
    const totalAmount = shopOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Total delivery charge (sum of shop-level charges)
    const totalDeliveryCharge = shopOrders.reduce((sum, o) => sum + o.deliveryCharge, 0);

    // Online payment
    if (paymentMethod === "online") {
      const razorOrder = await instance.orders.create({
        amount: Math.round(totalAmount * 100),
        currency: "INR",
        receipt: `receipt_${Date.now()}`
      });

      const newOrder = await Order.create({
        user: req.userId,
        paymentMethod,
        deliveryAddress,
        totalAmount,
        deliveryCharge: totalDeliveryCharge,
        shopOrders,
        razorpayOrderId: razorOrder.id,
        payment: false
      });

      return res.status(200).json({
        razorOrder,
        orderId: newOrder._id
      });
    }

    // COD
    const newOrder = await Order.create({
      user: req.userId,
      paymentMethod,
      deliveryAddress,
      totalAmount,
      deliveryCharge: totalDeliveryCharge,
      shopOrders
    });

    await newOrder.populate("shopOrders.shopOrderItems.item", "name image price");
    await newOrder.populate("shopOrders.shop", "name");
    await newOrder.populate("shopOrders.owner", "name socketId");
    await newOrder.populate("user", "name email mobile");

    // Notify shop owners
    const io = req.app.get("io");
    if (io) {
      newOrder.shopOrders.forEach(shopOrder => {
        const ownerSocketId = shopOrder.owner.socketId;
        if (ownerSocketId) {
          io.to(ownerSocketId).emit("newOrder", {
            _id: newOrder._id,
            paymentMethod: newOrder.paymentMethod,
            user: newOrder.user,
            shopOrders: shopOrder,
            createdAt: newOrder.createdAt,
            deliveryAddress: newOrder.deliveryAddress,
            payment: newOrder.payment,
            totalAmount: shopOrder.totalAmount,
            deliveryCharge: shopOrder.deliveryCharge
          });
        }
      });
    }

    return res.status(201).json(newOrder);

  } catch (error) {
    console.log("Place order error:", error);
    return res.status(500).json({ message: `Place order error: ${error.message}` });
  }
}

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_payment_id, orderId } = req.body
        const payment = await instance.payments.fetch(razorpay_payment_id)
        if (!payment || payment.status != "captured") {
            return res.status(400).json({ message: "payment not captured" })
        }
        const order = await Order.findById(orderId)
        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }

        order.payment = true
        order.razorpayPaymentId = razorpay_payment_id
        await order.save()

        await order.populate("shopOrders.shopOrderItems.item", "name image price")
        await order.populate("shopOrders.shop", "name")
        await order.populate("shopOrders.owner", "name socketId")
        await order.populate("user", "name email mobile")

        const io = req.app.get('io')

        if (io) {
            order.shopOrders.forEach(shopOrder => {
                const ownerSocketId = shopOrder.owner.socketId
                if (ownerSocketId) {
                    io.to(ownerSocketId).emit('newOrder', {
                        _id: order._id,
                        paymentMethod: order.paymentMethod,
                        user: order.user,
                        shopOrders: shopOrder,
                        createdAt: order.createdAt,
                        deliveryAddress: order.deliveryAddress,
                        payment: order.payment
                    })
                }
            });
        }


        return res.status(200).json(order)

    } catch (error) {
        return res.status(500).json({ message: `verify payment  error ${error}` })
    }
}



export const getMyOrders = async (req, res) => {
    try {
        const user = await User.findById(req.userId);

        if (user.role === "user") {
            const orders = await Order.find({ user: req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("shopOrders.owner", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price");

            return res.status(200).json(orders);
        } else if (user.role === "owner") {
            const orders = await Order.find({ "shopOrders.owner": req.userId })
                .sort({ createdAt: -1 })
                .populate("shopOrders.shop", "name")
                .populate("user", "name email mobile")
                .populate("shopOrders.shopOrderItems.item", "name image price")
                .populate("shopOrders.assignedDeliveryBoy", "fullName mobile");

            const filteredOrders = orders.map(order => {
                const shopOrder = order.shopOrders.find(o => String(o.owner._id) === String(req.userId));

                // Correct subtotal for owner: include delivery charge proportionally if needed
                let shopOrderTotal = shopOrder.subtotal;

                // Optional: if deliveryCharge is for whole order, divide proportionally
                if (order.deliveryCharge) {
                    const totalItemsSubtotal = order.shopOrders.reduce((sum, o) => sum + o.subtotal, 0);
                    const proportion = shopOrder.subtotal / totalItemsSubtotal;
                    shopOrderTotal += order.deliveryCharge * proportion;
                }

                return {
                    _id: order._id,
                    paymentMethod: order.paymentMethod,
                    user: order.user,
                    shopOrders: {
                        ...shopOrder.toObject(),
                        subtotal: shopOrderTotal // updated subtotal including delivery charge
                    },
                    createdAt: order.createdAt,
                    deliveryAddress: order.deliveryAddress,
                    payment: order.payment,
                    totalAmount: order.totalAmount // totalAmount already includes deliveryCharge
                };
            });

            return res.status(200).json(filteredOrders);
        }
    } catch (error) {
        return res.status(500).json({ message: `get User order error ${error}` });
    }
}


export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, shopId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(400).json({ message: "Order not found" });
    }

    const shopOrder = order.shopOrders.find(
      o => String(o.shop) === String(shopId)
    );

    if (!shopOrder) {
      return res.status(400).json({ message: "Shop order not found" });
    }

    // ✅ status update
    shopOrder.status = status;

    let deliveryBoysPayload = [];

    if (status === "out of delivery" && !shopOrder.assignment) {

      // 🔥 DEBUG (IMPORTANT)
      const allUsers = await User.find();
      console.log("👥 ALL USERS:", allUsers);

      const availableBoys = await User.find({
        role: { $regex: "^deliveryboy$", $options: "i" } // ✅ FIX
      });

      console.log("🚚 DELIVERY BOYS:", availableBoys);

      if (availableBoys.length === 0) {
        console.log("❌ NO DELIVERY BOYS FOUND");
      }

      const candidates = availableBoys.map(b => b._id);

      // ✅ CREATE ASSIGNMENT
      const deliveryAssignment = await DeliveryAssignment.create({
        order: order._id,
        shop: shopOrder.shop,
        shopOrderId: shopOrder._id,
        broadcastedTo: candidates,
        status: "broadcasted"
      });

      shopOrder.assignment = deliveryAssignment._id;

      deliveryBoysPayload = availableBoys.map(b => ({
        id: b._id,
        fullName: b.fullName,
        mobile: b.mobile
      }));

      const shopData = await Shop.findById(shopOrder.shop);

      const io = req.app.get("io");

      if (io) {
        availableBoys.forEach(boy => {
          if (boy.socketId) {
            io.to(boy.socketId).emit("newAssignment", {
              assignmentId: deliveryAssignment._id,
              orderId: order._id,
              shopName: shopData?.name,
              deliveryAddress: order.deliveryAddress,
              items: shopOrder.shopOrderItems,
              subtotal: shopOrder.subtotal,
              deliveryCharge: shopOrder.deliveryCharge
            });
          }
        });
      }
    }

    await order.save();

    return res.status(200).json({
      message: "Order status updated",
      shopOrder,
      availableBoys: deliveryBoysPayload
    });

  } catch (error) {
    console.error("Update Order Status Error:", error);
    return res.status(500).json({
      message: `Order status error: ${error.message}`
    });
  }
};
export const getDeliveryBoyAssignment = async (req, res) => {
  try {
    console.log("🔥 LOGGED IN DELIVERY BOY:", req.userId);

    const assignments = await DeliveryAssignment.find({
      status: "broadcasted"
    })
      .populate("order")
      .populate("shop");

    console.log("📦 ALL ASSIGNMENTS:", assignments);

    const formatted = assignments.map(a => {
      const shopOrder = a.order.shopOrders.find(
        so => so._id.equals(a.shopOrderId)
      );

      return {
        assignmentId: a._id,
        orderId: a.order._id,
        shopName: a.shop?.name,
        deliveryAddress: a.order.deliveryAddress,
        items: shopOrder?.shopOrderItems || [],
        subtotal: shopOrder?.subtotal || 0,
        deliveryCharge: shopOrder?.deliveryCharge || 0,
        totalAmount:
          (shopOrder?.subtotal || 0) +
          (shopOrder?.deliveryCharge || 0),
        status: a.status
      };
    });

    return res.status(200).json(formatted);

  } catch (error) {
    return res.status(500).json({
      message: `get Assignment error ${error.message}`
    });
  }
};
export const acceptOrder = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await DeliveryAssignment.findById(assignmentId)
      .populate("order");

    if (!assignment) {
      return res.status(400).json({ message: "Assignment not found" });
    }

    // Already accepted by you
    if (
      assignment.status === "assigned" &&
      String(assignment.assignedTo) === String(req.userId)
    ) {
      return res.status(200).json({
        _id: assignment.order._id,
        user: assignment.order.user,
        shopOrder: assignment.order.shopOrders.id(assignment.shopOrderId),
        deliveryAddress: assignment.order.deliveryAddress
      });
    }

    // Already taken by someone else
    if (
      assignment.status === "assigned" &&
      String(assignment.assignedTo) !== String(req.userId)
    ) {
      return res.status(400).json({
        message: "Order already taken by another delivery boy"
      });
    }

    // Check active delivery
    const activeAssignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned"
    });

    if (activeAssignment) {
      return res.status(400).json({
        message: "You already have an active delivery"
      });
    }

    // Assign
    assignment.assignedTo = req.userId;
    assignment.status = "assigned";
    assignment.acceptedAt = new Date();
    await assignment.save();

    const order = assignment.order;

    const shopOrder = order.shopOrders.id(assignment.shopOrderId);
    shopOrder.assignedDeliveryBoy = req.userId;
    shopOrder.status = "out of delivery";

    await order.save();

    return res.status(200).json({
      _id: order._id,
      user: order.user,
      shopOrder,
      deliveryAddress: order.deliveryAddress
    });

  } catch (error) {
    console.error("Accept order error:", error);
    return res.status(500).json({
      message: `Accept order error: ${error.message}`
    });
  }
};


export const getCurrentOrder = async (req, res) => {
  try {
    const assignment = await DeliveryAssignment.findOne({
      assignedTo: req.userId,
      status: "assigned"
    })
      .populate("shop", "name")
      .populate({
        path: "order",
        populate: [{ path: "user", select: "fullName email mobile" },
        { path: "shopOrders.shop", select: "name" }]
      });

    // ✅ FIX: null return (NOT {order:null})
    if (!assignment) {
      return res.status(200).json(null);
    }

    const shopOrder = assignment.order.shopOrders.find(
      so => String(so._id) === String(assignment.shopOrderId)
    );

    return res.status(200).json({
      _id: assignment.order._id,
      user: assignment.order.user,
      shopOrder,
      deliveryAddress: assignment.order.deliveryAddress
    });

  } catch (error) {
    return res.status(500).json({
      message: `getCurrentOrder error: ${error.message}`
    });
  }
};
export const getOrderById = async (req, res) => {
    try {
        const { orderId } = req.params
        const order = await Order.findById(orderId)
            .populate("user")
            .populate({
                path: "shopOrders.shop",
                model: "Shop"
            })
            .populate({
                path: "shopOrders.assignedDeliveryBoy",
                model: "User"
            })
            .populate({
                path: "shopOrders.shopOrderItems.item",
                model: "Item"
            })
            .lean()

        if (!order) {
            return res.status(400).json({ message: "order not found" })
        }
        return res.status(200).json(order)
    } catch (error) {
        return res.status(500).json({ message: `get by id order error ${error}` })
    }
}

export const sendDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        const otp = Math.floor(1000 + Math.random() * 9000).toString()
        shopOrder.deliveryOtp = otp
        shopOrder.otpExpires = Date.now() + 5 * 60 * 1000
        await order.save()
        await sendDeliveryOtpMail(order.user, otp)
        return res.status(200).json({ message: `Otp sent Successfuly to ${order?.user?.fullName}` })
    } catch (error) {
        return res.status(500).json({ message: `delivery otp error ${error}` })
    }
}

export const verifyDeliveryOtp = async (req, res) => {
    try {
        const { orderId, shopOrderId, otp } = req.body
        const order = await Order.findById(orderId).populate("user")
        const shopOrder = order.shopOrders.id(shopOrderId)
        if (!order || !shopOrder) {
            return res.status(400).json({ message: "enter valid order/shopOrderid" })
        }
        if (shopOrder.deliveryOtp !== otp || !shopOrder.otpExpires || shopOrder.otpExpires < Date.now()) {
            return res.status(400).json({ message: "Invalid/Expired Otp" })
        }

        shopOrder.status = "delivered"
        shopOrder.deliveredAt = Date.now()
        await order.save()
        await DeliveryAssignment.deleteOne({
            shopOrderId: shopOrder._id,
            order: order._id,
            assignedTo: shopOrder.assignedDeliveryBoy
        })

        return res.status(200).json({ message: "Order Delivered Successfully!" })

    } catch (error) {
        return res.status(500).json({ message: `verify delivery otp error ${error}` })
    }
}

export const getTodayDeliveries=async (req,res) => {
    try {
        const deliveryBoyId=req.userId
        const startsOfDay=new Date()
        startsOfDay.setHours(0,0,0,0)

        const orders=await Order.find({
           "shopOrders.assignedDeliveryBoy":deliveryBoyId,
           "shopOrders.status":"delivered",
           "shopOrders.deliveredAt":{$gte:startsOfDay}
        }).lean()

     let todaysDeliveries=[] 
     
     orders.forEach(order=>{
        order.shopOrders.forEach(shopOrder=>{
            if(shopOrder.assignedDeliveryBoy==deliveryBoyId &&
                shopOrder.status=="delivered" &&
                shopOrder.deliveredAt &&
                shopOrder.deliveredAt>=startsOfDay
            ){
                todaysDeliveries.push(shopOrder)
            }
        })
     })

let stats={}

todaysDeliveries.forEach(shopOrder=>{
    const hour=new Date(shopOrder.deliveredAt).getHours()
    stats[hour]=(stats[hour] || 0) + 1
})

let formattedStats=Object.keys(stats).map(hour=>({
 hour:parseInt(hour),
 count:stats[hour]   
}))

formattedStats.sort((a,b)=>a.hour-b.hour)

return res.status(200).json(formattedStats)
  

    } catch (error) {
        return res.status(500).json({ message: `today deliveries error ${error}` }) 
    }
}



