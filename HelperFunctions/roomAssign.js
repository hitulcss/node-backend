const { LectureTable } = require("../models/addLecture");
const { lectureRoomTable } = require("../models/lectureRoom");
const moment = require('moment');

const findVacantRoom = (rooms , roomSize) => {
    for( let room of rooms){
        // if( room?.students?.length < roomSize ){
        if( room?.students?.length < 20 ){
            return room?._id ;
        }
        continue;
    }

    return 'newRoom';

}

const roomAssign = async(batchId ,  userIds  , roomSize ) => {
    // let roomSize  = 20 ; 
    
    // console.log(batchId , userIds , roomSize);
    // for( let userId of userIds){
        // get upcominglecture from now of this given batch which lecture_type is TWOWAY
        const lectures = await LectureTable.find({batch :  batchId , lecture_type : 'TWOWAY'}).select('_id starting_date teacher') ;
        // let currentDate = moment().add(5, 'hours').add(30 , 'minutes').format('DD-MM-YYYY HH:mm:ss');
        let currentDate = moment().add(5, 'hours').add(30 , 'minutes').format('DD-MM-YYYY');
      
    //   let upcomingLecture = lectures.filter((item) => {
    //     let startDate = moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY HH:mm:ss');
    //     return (  moment(currentDate, 'DD-MM-YYYY HH:mm:ss').isSameOrBefore(moment(startDate, 'DD-MM-YYYY HH:mm:ss')) ) ;
    //   });
    let upcomingLecture = lectures.filter((item) => {
        let startDate = moment(item?.starting_date, 'DD-MM-YYYY HH:mm:ss').format('DD-MM-YYYY');
        return (  moment(currentDate, 'DD-MM-YYYY').isSameOrBefore(moment(startDate, 'DD-MM-YYYY')) ) ;
      });

      for( let lecture of upcomingLecture){
        let rooms = await lectureRoomTable.find({lecture : lecture?._id}).select('_id students');
        

        // find room in which space is exist for this user
        let vacantRoomId =  findVacantRoom(rooms , roomSize);
        let randomNumber =  Math.floor(Math.random() * 100) + 100000 ;
        if( vacantRoomId == 'newRoom'){
            // let random = Math.random()
            let newRoom = new lectureRoomTable({
                lecture : lecture?._id ,
                batch : batchId ,
                title : `New Room ${randomNumber}` , 
                mentor : lecture?.teacher ,
                students : [ ...userIds],

            })
            const saveRoom = await newRoom.save();
            // console.log(saveRoom?.title , saveRoom?._id)

        }else {
            // insert into existing room
            const newRoom = await lectureRoomTable.findByIdAndUpdate( vacantRoomId  ,
                 { $addToSet :  { students :  { $each : userIds}}},
                 { new : true , lean : true}
            ) ;
            // console.log( newRoom?._id , newRoom?.students , newRoom?.title);

        }

      }
        
    // }
}

module.exports = {
    roomAssign 
}