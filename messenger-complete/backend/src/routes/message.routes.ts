import { Router } from "express";
import { postMessage, getMessages } from "../controllers/message.controller.js";

const messageRouter = Router({ mergeParams: true });

messageRouter.post("/", postMessage);
messageRouter.get("/", getMessages);

export default messageRouter;
