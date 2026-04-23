const mongoose=require('mongoose')

const projectschema= new mongoose.Schema({
    name:{
        type:String,
        required : true
    },

    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace"
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", projectschema);
