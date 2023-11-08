const mongoose = require('mongoose')
const { Schema } = mongoose

const EntrepriseSchema = new Schema({
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
typeCompany: {
    type:String,

},
companyName:{
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








module.exports = mongoose.model('Entreprise', EntrepriseSchema)
