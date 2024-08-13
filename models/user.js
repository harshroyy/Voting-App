const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    name : {
        type: String,
        required: true
    },
    age: {
        type: Number
    },
    email: {
        type: String,
        unique: true
    },
    mobile: {
        type: String,
    },
    address: {
        type: String,
        required: true
    },
    aadharCardNumber: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['voter', 'admin'],
        default: 'voter'
    },
    isVoted: {
        type: Boolean,
        default: false
    }
});


userSchema.pre('save', async function(next) {
    const person  = this;

    // hash password generate , if modified
    if(!person.isModified('password')) return next();

    try{
           const salt = await bcrypt.genSalt(10);

           // hash password
           const hashedPassword = await bcrypt.hash(person.password, salt);

           // override thhe plain password with the hashed one
           person.password = hashedPassword;
           next();
    }catch(err) {
           return next(err);
    }
})

// Define the comparePassword method on the personSchema
userSchema.methods.comparePassword = async function(candidatePassword) {
    try{
        // Use bcrypt to compare the plaintext password (candidatePassword) with the hashed password (this.password)
        const isMatch = await bcrypt.compare(candidatePassword, this.password);
        return isMatch;
    }
    catch(err) {
        throw err;
    }
}

// create perform models
const User = mongoose.model("User", userSchema);
module.exports = User;