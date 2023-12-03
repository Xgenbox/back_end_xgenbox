const mongoose = require('mongoose')
const { Schema } = mongoose

const medicineModel = new Schema({
 name: {
    type:String,
    // required:true,
 },

},
   {timestamps:true}
    );








module.exports = mongoose.model('medicine', medicineModel)
