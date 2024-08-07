const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// User Schema
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  rooms: [{ type: Schema.Types.ObjectId, ref: 'Room' }]
});

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password; 
  return user;
};

module.exports = mongoose.model('User', userSchema);
