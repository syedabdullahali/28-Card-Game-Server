const Room=require("../schema/room");

const Create_Room = async (req, res) => {
  try {
    const { playerLimit } = req.body;

    const roomId = `room_${Math.random().toString(36).substr(2, 9)}`;
    const newRoom = new Room({
        roomId,
        playerLimit,
        players: []
    });

    await newRoom.save();
    res.json({ roomId });
    res
      .status(201)
      .json({ success: true, message: "Room Created", data: newRoom });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports={Create_Room}