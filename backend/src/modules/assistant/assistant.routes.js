import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";

import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { findAssistantAnswer } from "./assistant.service.js";

const router = Router();

const chatSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Please enter a question")
    .max(500, "Question must be 500 characters or fewer"),
});

const assistantLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      message:
        "Too many assistant requests. Please wait a minute and try again.",
    },
  },
});

router.post(
  "/chat",
  assistantLimiter,
  requireAuth,
  validateBody(chatSchema),
  asyncHandler(async (req, res) => {
    const { message } = req.validatedBody;

    const result = findAssistantAnswer(message, req.user.role);

    res.status(200).json({
      success: true,
      data: {
        answer: result.answer,
        matched: result.matched,
        category: result.category,
      },
    });
  }),
);

export default router;
