import { Router } from "express";
import {
  register,
  login,
  getMe,
  logout,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);

authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", requireAuth, logout);

export default authRouter;
