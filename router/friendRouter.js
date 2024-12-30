const express = require('express');
const router = express.Router();
const {isUser}=require('../middleware/AutMiddleware');
const {createFriend,getAllFriends,deleteFriend}=require("../controller/frinedController");

router.post("/create",isUser,createFriend);
router.get("/",isUser,getAllFriends);
router.delete("/",isUser,deleteFriend);

module.exports = router;