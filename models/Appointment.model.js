const mongoose = require('mongoose')
const { Schema } = mongoose

const AppointmentSchema = new Schema({
    user:{
        type:Schema.Types.ObjectId,
        ref:'User',
        required:true

    },
    phone:{
        type:String,
        // required:true,


    },

firstName:{
    type:String,
    // required:true,

},
lastName: {
    type:String,
    // required:true,

},
preferredDate:{
    type:String,
    // required:true,


},
reason: {
    type:String,
    // required:true,


},
comment: {
    type:String,
    // required:true,
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








module.exports = mongoose.model('Appointment', AppointmentSchema)
