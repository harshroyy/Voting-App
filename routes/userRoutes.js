const express = require('express');
const router = express.Router();
const User = require("./../models/user.js")
const {jwtAuthMiddleware, generateToken} = require('./../jwt');


router.post('/signup', async (req, res) => {
    try {
        // Extract the role from the request body
        const { role } = req.body;
        
        if (role === 'admin') {
            const existingAdmin = await User.findOne({ role: 'admin' });
            if (existingAdmin) {
                return res.status(400).json({ message: "Admin already present" }); 
            }
        }
        
        const data = req.body; // Asumming the new body contains person data
        
        // Create a new person document using the mongoose model
        const newUser = new User(data);
        
        // Save the new user to the database
        const response = await newUser.save();
        console.log('data saved');
        
        // Creating the jwt token 
        const payload = {
            id: response.id
        }
        console.log(JSON.stringify(payload));
        const token = generateToken(payload);
        console.log("token is ", token);

        res.status(200).json({response: response, token: token});
    }

    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server not found" });
    }
})

// login route
router.post('/login', async(req, res) => {
    try{

        //extract aadharCardNumber and password from request body
        const {aadharCardNumber, password}  = req.body;
 
        // find user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        if(!user || !(await user.comparePassword(password))) {
            return res.status(401).json({error: "invalid username or password"});
        }

        // generate token
        const payload = {
            id : user.id,
        }
        const token = generateToken(payload);

        // return token as response
        res.json({token})
    }
    catch(err) {
        console.error(err);
        res.status(500).json({error : "internal server error"});
    }
})

// profile route 
router.get('/profile', jwtAuthMiddleware, async(req, res ) =>{
     try {
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);

        res.status(200).json({user});
     }
     catch(err) {
        console.error(err);
        res.status(500).json({error : "internal server error"});
    }
} )


router.put('/profile/password',jwtAuthMiddleware, async(req, res) => {
    try {
        const userId = req.user.id; // Extract the id from token
        const {currentPassword, newPassword} = req.body // Extract current and new password from request body

        // Check if user is present by userId
        const user = await User.findById(userId);

        if(!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({error: "invalid username or password"});
        }

        user.password = newPassword;
        await user.save();
        
        console.log("password updated");
        res.status(200).json({message: "Password Updated"});
    } 
    catch(err) {
        console.log(err);
        res.status(500).json({error: "Server failed"});
    }
})



module.exports = router;