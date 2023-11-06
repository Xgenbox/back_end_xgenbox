const mongoose = require('mongoose')
const { Schema } = mongoose

const CollectorSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },

firstName:{
    type:String,
    // required:true,

},
lastName: {
    type:String,
    // required:true,

},
entityType: {
    type:String,

},
  status:{
    type:String,
    // required:true,
    enum:[ 'in progress', 'valid', 'denied' ]
},

companyName:String,

  },
   {timestamps:true}
    );








module.exports = mongoose.model('collector', CollectorSchema)
