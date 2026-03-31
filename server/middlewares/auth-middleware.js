const jwt = require("jsonwebtoken");
const {User} = require("../models/user-model");

const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization");

  if (!token) {
    return res
      .status(401)
      .json({ msg: "Unauthorization HTTP, Token not provided" });
  }

  const jwtToken = token.replace("Bearer", "").trim();
  console.log(
    "\n\n########## *******Token form auth middleware******* ##############\n\n"
  );
  console.log("Token form auth middleware : " + jwtToken);

  try {
    const isVerified = jwt.verify(jwtToken, process.env.JWT_SECRET_KEY);
    console.log("Decoded JWT Payload:", isVerified);

    const userData = await User.findOne({
      _id: isVerified.userID,
      username: isVerified.username,
    });
    // .select('-access_token -access_token_expires_in -refresh_token -refresh_token_expires_in -token_type');

    if (!userData) {
      return res.status(401).json({ message: "Unauthorized: User not found." });
    }

    console.log("Data after verifying:", userData);

    req.user = {
      ...userData.user,
      repos: userData.repos,
      _id: userData._id,
      has_completed_onboarding: userData.has_completed_onboarding,
    };
    req.token = token;
    req.userID = userData._id;
    req.access_token = userData.access_token;

    next();
    console.log(
      "\n\n########################################################\n\n"
    );
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Unauthorized: Invalid token." });
  }
};

module.exports = authMiddleware;
