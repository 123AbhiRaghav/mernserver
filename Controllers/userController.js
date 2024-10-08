const users = require("../Models/userSchema.js")
const moment = require("moment")
const csv = require("fast-csv")
const fs = require("fs")
const BASE_URL = process.env.BASE_URL

exports.userPost = async(req,res) => {
    const file = req.file.filename;
    const {fname, lname, email,mobile,gender,location,status} = req.body;

    if(!fname || !lname || !email || !mobile || !gender || !location || !status){
         res.status(401).json("All inputs are required")
    }

    try{
      const preuser = await users.findOne({email: email})
      if(preuser){
        res.status(401).json("This user already exists")
      } else {
        const datecreated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss")

        const userData = new users({
            fname,lname,email,mobile,gender,location,status, profile: file,datecreated
        })
        await userData.save()
        res.status(200).json(userData)
      }
    }
    catch(err) {
        res.status(401).json(err)
        console.log(err)
    }
}

exports.userGet = async(req,res) => {
   const search = req.query.search || ""
    const gender = req.query.gender || ""
    const status = req.query.status || ""
    const sort = req.query.sort || ""
    const page = req.query.page || 1
    const ITEM_PER_PAGE = 4;

   const query = {
    fname: { $regex: search, $options: "i" }
   }

   if (gender !== "All") {
    query.gender = gender
   }  

   if (status !== "All") {
    query.status = status
}

  try {
    const skip = (page - 1) * ITEM_PER_PAGE
    const count = await users.countDocuments(query);
  
    const userData = await users.find(query)
    .sort({ datecreated: sort == "new" ? -1 : 1 })
    .limit(ITEM_PER_PAGE)
    .skip(skip);

    const pageCount = Math.ceil(count/ITEM_PER_PAGE);

    res.status(200).json({
      Pagination:{
        count,pageCount
      }, userData
    })
  } catch (error) {
    res.status(401).json(error)
  }
}

exports.getSingleUser = async(req,res) => {
  const {id} = req.params
  try {
    const userdata = await users.findOne({ _id: id });
    res.status(200).json(userdata)
  } catch (error) {
    res.status(401).json(error)
  }
}

exports.userEdit = async(req,res) => {
   const { id } = req.params;
  const { fname, lname, email, mobile, gender, location, status, user_profile } = req.body;
   const file = req.file ? req.file.filename : user_profile

   const dateUpdated = moment(new Date()).format("YYYY-MM-DD hh:mm:ss");

  try {
      const updateUser = await users.findByIdAndUpdate({ _id: id }, {
          fname, lname, email, mobile, gender, location, status, profile: file, dateUpdated
      }, {
          new: true
      });

      await updateUser.save();
      res.status(200).json(updateUser);
  } catch (error) {
      res.status(401).json(error)
  }
 }

 exports.userDelete = async(req,res) => {
  const { id } = req.params;
  try {
      const deletUser = await users.findByIdAndDelete({ _id: id });
      res.status(200).json(deletUser);
  } catch (error) {
      res.status(401).json(error)
  }
 }

exports.userStatus = async(req,res)=>{
  const { id } = req.params;
  const { data } = req.body;

  try {
    const userStatusUpdate = await users.findByIdAndUpdate({ _id: id }, { status: data }, { new: true });
    res.status(200).json(userStatusUpdate)
  } catch (error) {
     res.status(401).json(error)
  }
}

exports.userExport = async(req,res) => {
    try {
      const usersData = await users.find();
      const csvStream = csv.format({ headers: true });

      if(!fs.existsSync("public/files/export/")){
        if(!fs.existsSync("public/files")){
          fs.mkdirSync("public/files/")
        }
       if(!fs.existsSync("public/files/export")){
        fs.mkdirSync("./public/files/export/");
       }
      }

       const writableStream = fs.createWriteStream(
        "public/files/export/users.csv"
       )

       csvStream.pipe(writableStream)

       writableStream.on("finish", function(){
        res.json({
          downloadUrl: `${BASE_URL}/files/export/users.csv`,
        })
       })

       if(usersData.length > 0){
        usersData.map((user) => {
          csvStream.write({
            FirstName: user.fname ? user.fname : "-",
            LastName: user.lname ? user.lname : "-",
            Email: user.email ? user.email : "-",
            Phone: user.mobile ? user.mobile : "-",
            Gender: user.gender ? user.gender : "-",
            Status: user.status ? user.status : "-",
            Profile: user.profile ? user.profile : "-",
            Location: user.location ? user.location : "-",
            DateCreated: user.datecreated ? user.datecreated : "-",
            DateUpdated: user.dateUpdated ? user.dateUpdated : "-",
          })
        })
       }
       csvStream.end()
       writableStream.end()

    } catch (error) {
      res.status(401).json(error)
    }
}
