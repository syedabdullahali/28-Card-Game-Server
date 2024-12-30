const express = require('express');
const router = express.Router();
const {isUser}=require('../middleware/AutMiddleware');
const {Create_Room}=require("../controller/roomController")
router.post("/create",isUser,Create_Room);

module.exports = router;