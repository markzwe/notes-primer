import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  openConversation,
  getConversations,
  postGroup,
} from "../controllers/conversation.controller.js";
import messageRouter from "./message.routes.js";
const router = Router();
router.use(requireAuth);
router.post("/", openConversation);
router.get("/", getConversations);
router.post("/groups", postGroup);
router.use("/:conversationId/messages", messageRouter);
export default router;
