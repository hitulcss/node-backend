const mongoose=require('mongoose')

const presentorderIdFinder=new mongoose.Schema({
    presentorderId:{
        type:Number,
        required:true
    }
})


const presentorderIdtable=new mongoose.model('presentOrderIdTable',presentorderIdFinder);

module.exports={
    presentorderIdtable
}