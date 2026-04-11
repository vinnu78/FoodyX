import Item from "../models/item.model.js";
import Shop from "../models/shop.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";


// ================= ADD ITEM =================
export const addItem = async (req, res) => {
  try {

    const { name, category, foodType, price } = req.body;

    let image = "";

    if (req.file) {
      image = await uploadOnCloudinary(req.file.path);
    }

    const shop = await Shop.findOne({ owner: req.userId });

    if (!shop) {
      return res.status(400).json({
        message: "Shop not found"
      });
    }

    const item = await Item.create({
      name,
      category,
      foodType,
      price,
      image,
      shop: shop._id
    });

    shop.items.push(item._id);
    await shop.save();

    const updatedShop = await Shop.findById(shop._id)
      .populate("owner")
      .populate({
        path: "items",
        options: { sort: { updatedAt: -1 } }
      });

    return res.status(201).json(updatedShop);

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Add item error"
    });

  }
};



// ================= EDIT ITEM =================
export const editItem = async (req, res) => {

  try {

    const { itemId } = req.params;
    const { name, category, foodType, price } = req.body;

    const updateData = {
      name,
      category,
      foodType,
      price
    };

    if (req.file) {
      updateData.image = await uploadOnCloudinary(req.file.path);
    }

    const item = await Item.findByIdAndUpdate(
      itemId,
      updateData,
      { new: true }
    );

    if (!item) {
      return res.status(400).json({
        message: "Item not found"
      });
    }

    const shop = await Shop.findOne({ owner: req.userId }).populate({
      path: "items",
      options: { sort: { updatedAt: -1 } }
    });

    return res.status(200).json(shop);

  } catch (error) {

    return res.status(500).json({
      message: "Edit item error"
    });

  }

};



// ================= GET ITEM BY ID =================
export const getItemById = async (req, res) => {

  try {

    const { itemId } = req.params;

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    return res.status(200).json(item);

  } catch (error) {

    return res.status(500).json({
      message: "Get item error"
    });

  }

};



// ================= DELETE ITEM =================
export const deleteItem = async (req, res) => {

  try {

    const { itemId } = req.params;

    const item = await Item.findByIdAndDelete(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    const shop = await Shop.findOne({ owner: req.userId });

    shop.items = shop.items.filter(
      (i) => i.toString() !== item._id.toString()
    );

    await shop.save();

    const updatedShop = await Shop.findById(shop._id).populate({
      path: "items",
      options: { sort: { updatedAt: -1 } }
    });

    return res.status(200).json(updatedShop);

  } catch (error) {

    return res.status(500).json({
      message: "Delete item error"
    });

  }

};



// ================= GET ITEMS BY CITY =================
export const getItemByCity = async (req, res) => {

  try {

    let { city } = req.params;

    if (!city) {
      return res.status(400).json({
        message: "City required"
      });
    }

    // remove country if present
    city = city.split(",")[0].trim();

    console.log("Searching items for city:", city);

    const shops = await Shop.find({
      city: { $regex: city, $options: "i" }
    });

    if (!shops.length) {
      return res.status(200).json([]);
    }

    const shopIds = shops.map(shop => shop._id);

    const items = await Item.find({
      shop: { $in: shopIds }
    }).populate("shop", "name city image");

    return res.status(200).json(items);

  } catch (error) {

    console.log(error);

    return res.status(500).json({
      message: "Get items by city error"
    });

  }

};



// ================= GET ITEMS BY SHOP =================
export const getItemsByShop = async (req, res) => {

  try {

    const { shopId } = req.params;

    const shop = await Shop.findById(shopId).populate("items");

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found"
      });
    }

    return res.status(200).json({
      shop,
      items: shop.items
    });

  } catch (error) {

    return res.status(500).json({
      message: "Get items by shop error"
    });

  }

};



// ================= SEARCH ITEMS =================
export const searchItems = async (req, res) => {

  try {

    let { query, city } = req.query;

    if (!query || !city) {
      return res.status(400).json({
        message: "Query and city required"
      });
    }

    city = city.split(",")[0].trim();

    const shops = await Shop.find({
      city: { $regex: city, $options: "i" }
    });

    if (!shops.length) {
      return res.status(200).json([]);
    }

    const shopIds = shops.map(shop => shop._id);

    const items = await Item.find({
      shop: { $in: shopIds },
      $or: [
        { name: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } }
      ]
    }).populate("shop", "name image city");

    return res.status(200).json(items);

  } catch (error) {

    return res.status(500).json({
      message: "Search items error"
    });

  }

};



// ================= RATING SYSTEM =================
export const rating = async (req, res) => {

  try {

    const { itemId, rating } = req.body;

    if (!itemId || !rating) {
      return res.status(400).json({
        message: "ItemId and rating required"
      });
    }

    const item = await Item.findById(itemId);

    if (!item) {
      return res.status(404).json({
        message: "Item not found"
      });
    }

    const newCount = item.rating.count + 1;

    const newAverage =
      ((item.rating.average * item.rating.count) + rating) / newCount;

    item.rating.count = newCount;
    item.rating.average = newAverage;

    await item.save();

    return res.status(200).json({
      rating: item.rating
    });

  } catch (error) {

    return res.status(500).json({
      message: "Rating error"
    });

  }

};