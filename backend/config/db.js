const mongoose=require('mongoose')

const ConnectDB = async () =>{
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected");
    }
    catch (error){
        console.error(error)
    }
}

module.exports=ConnectDB