import passport from "passport";
import { Strategy } from "passport-google-oauth20";

console.log("DEBUG: google-strategy.mjs is being executed");

passport.use(new Strategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5001/api/auth/google/callback",
    scope: ["profile","openid","email"]
  },
  function(accessToken, refreshToken, profile, cb) {
    // User.findOrCreate({ googleId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
    console.log("Google Strategy: "+JSON.stringify(profile));
    console.log("Google Strategy: "+JSON.stringify(accessToken));
    console.log("Google Strategy: "+JSON.stringify(refreshToken));
    console.log("Google Strategy: "+JSON.stringify(cb));
  }
));