const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()


const mongoose = require('mongoose')
mongoose .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }) 
  .then(() => console.log("MongoDB connected")) 
  .catch((err) => console.log(err));
const bodyParser = require("body-parser")
app.use(bodyParser.urlencoded({extended: false}))


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// *****************************

//user Schema and Model
let userSchema = new mongoose.Schema({
  "username": {
    "type": String,
    "required": true
  }
})

let User = new mongoose.model("User", userSchema)


//POST
app.post("/api/users", (req, res) => {

  let newUser = new User({
    "username": req.body.username,
  })
  
  User.findOne({"username": req.body.username}).exec((err, user) => {
    if (err) {
      return console.log(err)
    }
    if (user === null) {
      newUser.save()
      res.json(newUser)
    } else {
      res.json("Username already taken.")
    }
  })

})

//GET
app.get("/api/users", (req, res) => {

  User.find().exec((err, allUsers) => {
    if (err) {
      return console.log(err)
    }
    res.json(allUsers)
  })

})

//Exercise Schema and Model
let exerciseSchema = new mongoose.Schema({
  "userId": String,
  "username": String,
  "description": {
    "type": String,
    "required": true
  },
  "duration": {
    "type": Number,
    "required": true
  },
  "date": String

})

let Exercise = new mongoose.model("Exercise", exerciseSchema)


//POST 2
app.post("/api/users/:_id/exercises", (req, res) => {

  User.findOne({"_id": req.params._id}, (err, user) => {

    if (err) {
      res.json("Invalid Id.")
      return console.log(err)
    }

    if(/\D/ig.test(req.body.duration)) {
      return res.json("Duration field must be a number.")
    }

    let newExercise = new Exercise({
      "userId": req.params._id,
      "username": user.username,
      "description": req.body.description,
      "duration": req.body.duration,
      "date": new Date(req.body.date).toDateString()
    })

    if (newExercise.date === "Invalid Date") {
      newExercise.date = new Date().toDateString()
    }

    newExercise.save();
    
    res.json({
      "_id": newExercise.userId,
      "username": newExercise.username,
      "description": newExercise.description,
      "duration": newExercise.duration,
      "date": newExercise.date
    })

  })
})


//GET 2

app.get("/api/users/:_id/logs", (req, res) => {

  let limit = parseInt(req.query.limit)


  let from = new Date(req.query.from).getTime()
  let to = new Date(req.query.from).getTime()
 


  Exercise.find({"userId": req.params._id}).limit(limit).select("-_id -userId -username -__v").exec((err, exercises) => {
    
    if (err) {
      return console.log(err)
    }


    //if from is stated

    let fromExercises = []
    let length = exercises.length
    for (let i = 0; i <= length - 1 ; i++) {
      let dateUnix = new Date(exercises[i].date).getTime()
      if (parseInt(dateUnix) >= parseInt(from)) {
        let sliced = exercises.slice(i, i+1)
        fromExercises.push(...sliced)
      }
    }

    // //if to is stated

    // let toExercises = []
    // for (let i = 0; i <= length - 1 ; i++) {
    //   let dateUnix = new Date(exercises[i].date).getTime()
    //   if (parseInt(dateUnix) <= parseInt(to)) {
    //     let sliced = exercises.slice(i, i+1)
    //     toExercises.push(...sliced)
    //   }
    // }


    User.findOne({"_id": req.params._id}).select("-__v").exec((err, user) => {
      if (err) {
        return console.log(err)
      }

      res.json({
        "id": user._id,
        "username": user.username,
        "count": exercises.length,
        "log": exercises
      })

    })

  })


})


// **************************




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
