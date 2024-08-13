const express = require('express');
const router = express.Router();
const User = require("./../models/user.js");
const {jwtAuthMiddleware, generateToken} = require('./../jwt');
const Candidate = require('./../models/candidate.js');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        if(user.role === 'admin') {
            return true;
        }
    }
    catch(err) {
        return false;
    }
}

router.post('/',jwtAuthMiddleware, async (req, res) => {
    try {
        if(! await checkAdminRole(req.user.id)) {
            return res.status(403).json({message: "not an admin"});
        } 
        const data = req.body; // Asumming the new body contains person data
        
        // Create a new person document using the mongoose model
        const newCandidate = new Candidate(data);
        
        // Save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server not found" });
    }
})


router.put('/p/:candidateId', jwtAuthMiddleware, async(req, res) => {
    try {
        if(! await checkAdminRole(req.user.id)) {
            return res.status(403).json({message: "not an admin"});
        }

        const candidateId = req.params.candidateId;
        const updatedCandidateData = req.body;
        
        const response = await Candidate.findByIdAndUpdate(candidateId, updatedCandidateData, {
              new: true,
              runValidators: true,
        })
        
        console.log("candidate data updated");
        res.status(200).json(response);
    } 
    catch(err) {
        console.log(err);
        res.status(500).json({error: "Server failed"});
    }
})

router.delete('/p/:candidateId', jwtAuthMiddleware, async(req, res) => {
    try {
        if(! await checkAdminRole(req.user.id)) {
            return res.status(403).json({message: "not an admin"});
        }

        const candidateId = req.params.candidateId;
        
        const response = await Candidate.findByIdAndDelete(candidateId);
        
        console.log("candidate Deleted");
        res.status(200).json(response);
    } 
    catch(err) {
        console.log(err);
        res.status(500).json({error: "Server failed"});
    }
})

// lets vote
router.post('/vote/:candidateId', jwtAuthMiddleware, async (req, res) => {

    const candidateId = req.params.candidateId;
    const userId = req.user.id;

    try {
        // Find candidate document with the specified candidateId
        const candidate = await Candidate.findById(candidateId);
        if(!candidate) {
            return res.status(400).json({message: 'candiate not found'});
        }
        
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: 'User not found'});
        }

        if(user.isVoted) {
            return res.status(400).json({error: "Already Voted, Can't do again"});
        }

        if(user.role == 'admin') {
            return res.status(403).json({error: "Admin can't Vote"});
        }

        candidate.votes.push({user: userId});
        candidate.voteCount++;
        await candidate.save();

        // update the user document
        user.isVoted = true;
        await user.save();

        res.status(200).json({message: "Voted Sucessfully"});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: "Server failed"});
    }
})

router.get('/vote/count', async (req, res) => {
    try{
        // find all candidate in descending order
        const candidates = await Candidate.find().sort({voteCount: 'desc'});
        
        // Map the candidate to only return their name and votecount
        const voteRecord = candidates.map(candidate => ({
            party: candidate.party,
            count: candidate.voteCount
        }));

        return res.status(200).json({voteRecord});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: "Server failed"});
    }
})

// Get list of all candidates
router.get('/candidatelist', async (req, res) => {
    try {
        // Find all candidates, but only select the 'name' and 'party' fields
        const candidates = await Candidate.find({}, 'name party');
        res.status(200).json(candidates);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Server failed" });
    }
});

module.exports = router;