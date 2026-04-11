import User from "../models/user.model.js";

/* =========================
   GET CURRENT USER
========================= */
export const getCurrentUser = async (req, res) => {
  try {

    const userId = req.userId;

    if (!userId) {
      return res.status(400).json({
        message: "UserId not found"
      });
    }

    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json(user);

  } catch (error) {

    return res.status(500).json({
      message: `Get current user error: ${error.message}`
    });

  }
};


/* =========================
   UPDATE USER LOCATION
========================= */
export const updateUserLocation = async (req, res) => {

  try {

    const userId = req.userId;

    const { lat, lon } = req.body;

    if (!lat || !lon) {
      return res.status(400).json({
        message: "Latitude and Longitude required"
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        location: {
          type: "Point",
          coordinates: [lon, lat]
        }
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    return res.status(200).json({
      message: "Location updated successfully",
      location: user.location
    });

  } catch (error) {

    return res.status(500).json({
      message: `Update location error: ${error.message}`
    });

  }

};