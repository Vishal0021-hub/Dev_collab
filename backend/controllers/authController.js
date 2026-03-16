const jwt = require("jsonwebtoken");
const User=require("../models/User")
const bcrypt= require("bcrypt")

//Register user
exports.registerUser=async (req,res) =>{
    try{
        const {name,email,password} = req.body; //destructing the data 

    // check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    //hashpassord
    const salt = await bcrypt.genSalt(10)
    const hashpassord= await bcrypt.hash(password,salt)

    // create user

    const user= await User.create({
        name,
        email,
        password:hashpassord
    });

    res.status(201).json({
        message: "User registerd successfully",
        user
    });
    }
    catch(error){
        res.status(500).json({message: error.message});
    }
};

// Login user 

exports.loginUser=async (req,res) => {
    try{
        const {email,password} = req.body;

        //check if user exists
        const user= await User.findOne({email});

        if(!user){
            return res.status(400).json({message: "Invalid Credentials"});
        }

       // compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // create token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user
    });
    }
    catch(error){
        return res.status(400).json({message: error.message})
    }
}