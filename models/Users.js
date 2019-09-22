const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const ObjectId = mongoose.Schema.Types.ObjectId

require('./Habits');

const Habits = mongoose.model('Habits').schema; // should be renamed to habit

const { Schema } = mongoose;

const UsersSchema = new Schema({
  email: { type: String, unique: true, required: true, dropDups: true },
  username: { type: String, unique: true, dropDups: true },
  firstName: { type: String },
  lastName: { type: String },
  displayUserName: { type: Boolean, default: false },
  salt: { type: String, required: true },
  hash: { type: String, required: true },
  // habits      : [Habits]
  habits: [{
    type: ObjectId,
    ref: 'Habits'
  }]
});

UsersSchema.methods.setPassword = function (password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function (password) {
  const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
  return this.hash === hash;
};

UsersSchema.methods.generateJWT = function () {
  const opts = {
    expiresIn: 60 * 60 * 24 * 7,
  }
  return jwt.sign({
    _id: this._id,
    email: this.email
  }, process.env.JWT_SECRET, opts)
}

mongoose.model('Users', UsersSchema);
