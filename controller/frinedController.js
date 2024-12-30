const Friend=require("../schema/friend");

const createFriend = async (req, res) => {
  const { userId, friendId } = req.body;

  try {
    const friend = new Friend({
      userId,
      friend: friendId,
    });
    await friend.save();
    res.status(201).json(friend);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const deleteFriend = async (req, res) => {
    const { userId, friendId } = req.body;
  
    try {
      const friend = await Friend.findOneAndDelete({ userId, friend: friendId });
  
      if (!friend) {
        return res.status(404).json({ message: "Friend not found" });
      }
  
      res.status(200).json({ message: "Friend removed" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  const getAllFriends = async (req, res) => {
    const { userId } = req.params; 
  
    try {
      const friends = await Friend.find({ userId })
        .populate("friend", "name image")
        .select("-userId"); 
  
      res.status(200).json(friends);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };

  module.exports={
    createFriend,deleteFriend,getAllFriends
  }