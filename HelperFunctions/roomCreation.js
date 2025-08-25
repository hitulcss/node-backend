const { MybatchTable } = require("../models/MyBatches");
const { lectureRoomTable } = require("../models/lectureRoom");

const roomCreation = async (batchId, lectureId, teacherId, from) => {
  let roomSize = 20; // it should be changed
  // let isRoomCreate = from == "new" ? true : false;
  let roomExist = await lectureRoomTable.find({ lecture: lectureId });
  // if (roomExist?.length > 0) {
  //   isRoomCreate = false;
  // }else{
  //   isRoomCreate = true
  // }
  if (roomExist?.length <= 0  || from == 'new') {
    const myBatches = await MybatchTable.find({ batch_id: batchId })
      .sort({ createdAt: 1 })
      .select("user");
    let userIds = myBatches?.map((item) => item?.user);

    let roomCount = Math.ceil(myBatches?.length / roomSize);
    let roomCreatePromise = [];
    let startIndex = 0;
    let endIndex = roomSize;
    for (let i = 0; i < roomCount; i++) {
      let newRoom = new lectureRoomTable({
        students: userIds.slice(startIndex, endIndex),
        mentor: [teacherId],
        title: `room-${i}`,
        lecture: lectureId,
        batch: batchId,
        isActive: true,
      });
      startIndex = endIndex;
      endIndex = endIndex + roomSize;
      // await newRoom.save();

      roomCreatePromise.push(newRoom.save());
    }
    await Promise.all(roomCreatePromise);
  }
};

module.exports = {
  roomCreation,
};
