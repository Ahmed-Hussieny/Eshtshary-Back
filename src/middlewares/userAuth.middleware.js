import jwt from "jsonwebtoken";
import User from "../../DB/Models/user.model.js";
import Therapist from '../../DB/Models/therapist.model.js';
export const userAuth = (accessRoles) => {
  return async (req, res, next) => {
    const { accesstoken } = req.headers;
    if (accesstoken!== "Bearer_null" && accesstoken) {
      //* check if access token starts with token prefix
      if (!accesstoken.startsWith(process.env.TOKEN_PREFIX))
        return next({ message: "Invalid access token", cause: 401 });

      //* split token from the prefix
      const token = accesstoken.split(process.env.TOKEN_PREFIX)[1];

      //* verify the token
        const decodedData = jwt.verify(token, process.env.JWT_SECRET);
        if (!decodedData || !decodedData.id)
          return next({ message: "Invalid access token", cause: 401 });
        const user = await User.findById(
          decodedData.id,
          "-password"
        );

        const therapist = await Therapist.findById(
          decodedData.id,
          "-password"
        );
        if (!user && !therapist)
          return next({ message: "Invalid access token", cause: 401 });
        req.authUser = user;
        req.authTherapist = therapist;
    }
    return next();
  };
};
