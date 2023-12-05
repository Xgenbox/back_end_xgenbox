

const mongoose = require('mongoose')
const { Schema } = mongoose

const WasteModel = new Schema({

  waste: [
    {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medicine',
        // default: mongoose.Types.ObjectId()
      },
      value: {
        type: Number,
        default: 0
      }
    }
  ],



},
   {timestamps:true}
    );








module.exports = mongoose.model('waste', WasteModel)
