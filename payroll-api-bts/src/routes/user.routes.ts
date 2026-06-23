import * as user from "../controllers/user.controller";
import { processUploadsGeneral } from "../middlewares/files";
const { check } = require("express-validator");
import express = require("express");
import { validateJWT } from "../middlewares/validate-jwt";
import { createUploadFieldsProcessor } from "../middlewares/upload/createUploadFieldsProcessor";

const uploadUserImage = createUploadFieldsProcessor([
  {
    name: "image",
    maxCount: 1,
    folder: "users/profile",
    kind: "image",
  },
]);

const userRouter: any = express.Router();
userRouter.use(validateJWT);

// Post
userRouter.post(
  "/createUser",
  [
    check("name", "the name is required").not().isEmpty(),
    check("email", "the email is required").not().isEmpty(),
  ],
  user.createUser,
);

userRouter.post(
  "/searchUsers/:limit/:initial",

  user.searchUsers,
);

userRouter.post(
  "/createEmployee",

  processUploadsGeneral({ basePrefix: "employees" }),
  user.createEmployee,
);

// Put

userRouter.put(
  "/updateUser",
  [
    uploadUserImage,
    check("name", "the name is required").not().isEmpty(),
    check("email", "the email is required").not().isEmpty(),
  ],
  user.updateUser,
);

userRouter.put("/updateUserImage", uploadUserImage, user.updateUserImage);

userRouter.put(
  "/updateEmployee/:id",

  processUploadsGeneral({ basePrefix: "employees" }),
  user.updateEmployee,
);

userRouter.put("/resetEmployeePassword/:id", user.resetEmployeePassword);

// Get

userRouter.get(
  "/getOperadoras/:limit/:initial",

  user.getOperadoras,
);
userRouter.get("/getUsers/:limit/:initial", user.getUsers);
userRouter.get(
  "/getUsersByRole/:limit/:initial/:code",

  user.getUsersByRole,
);

userRouter.get(
  "/getEmployeesByDepartment/:departmentId",

  user.getEmployeesByDepartment,
);

userRouter.get(
  "/lookupEmployees",

  user.lookupEmployees,
);

// Delete

userRouter.delete("/deleteUser/:_id", user.deleteUser);

userRouter.put(
  "/updateSchedule/:user_id",

  user.updateSchedule,
);

userRouter.get("/getEmployees", user.getEmployees);

export default userRouter;
