const mongoose = require('mongoose')
const { Schema } = mongoose

const medicineModel = new Schema({
 name: {
    type:String,
    // required:true,
 },
 wasteCount: {
      type:Number,
      default:0,
 }

},
   {timestamps:true}
    );








module.exports = mongoose.model('medicine', medicineModel)
