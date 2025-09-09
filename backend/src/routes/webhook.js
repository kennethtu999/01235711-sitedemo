const express = require("express");
const router = express.Router();
const {
  handleGitHubWebhook,
  handleGitHubWebhookTest,
} = require("../controllers/webhookController");

// GitHub Webhook 測試端點 (GET)
router.get("/github", handleGitHubWebhookTest);

// GitHub Webhook 處理端點 (POST)
router.post("/github", handleGitHubWebhook);

module.exports = router;
