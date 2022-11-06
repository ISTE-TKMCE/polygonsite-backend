const express = require("express")
const { json } = require("sequelize")
const db = require("./models")
const { User } = require('./models')
const multer = require("multer")
const bodyParser = require("body-parser")
const path = require("path")
const cors = require("cors");
const { createHmac } = require("crypto")
require("dotenv").config()
const app = express()
app.use(bodyParser.json())

const publicdrc = path.resolve(__dirname, 'public')
app.use(express.static(publicdrc))
app.use(bodyParser.urlencoded({
    extended: false
}));

const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './public/screenshots')
    },
    filename: (req, file, cb) => {

        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname)
    }
})
const upload = multer({ storage });
app.put("/user",
    upload.single('file'),
    async (req, res) => {
        const data= await JSON.parse(req.body.data)
        console.log(data)
        const user = await User.findOne({ email: data.email })
        if (user) {
            return res.send(JSON.stringify({ status: 403, message: "Email already registered" }))
        }
        else {



            // console.log(req.file.path)

            return User.create({
                name: data.name,
                email: data.email,
                phonenumber: data.phonenumber,
                collegename: data.collegename,
                transactionid: data.transactionid,
                imageurl: new Date().toISOString().replace(/:/g, '-') + '-' + req.file.originalname,
                isverified: false
            }).then((response) => res.send(JSON.stringify({ status: 200, message: "User registered successfully" }))).catch((err) => res.send(JSON.stringify({ status: 400, message: "Couldn't register User" })))



        }
    })
app.get("/", (req,res)=>res.send("<p>Hey</p>"))
app.get("/users", async (req, res) => {
    if (req.headers.authorization === process.env.TOKEN) {
        return User.findAll().then((users) => res.send(JSON.stringify({ status: 200, data: users, message: 'Successfully fetched data' }))).catch((err) => res.send(JSON.stringify({ status: 400, message: "Couldn't fetch Users" })))
    }
    else {
        return res.send(JSON.stringify({ status: 401, message: 'Unauthorized' }))
    }
})

app.post("/verify", async (req, res) => {
    console.log(process.env.TOKEN)
    if (req.headers.authorization === process.env.TOKEN) {
        return User.findOne({ email: req.body.email }).then((user) => { user.isverified = true; user.save(); res.send(JSON.stringify({ status: 200, message: 'Successfully verified user' })) }).catch((err) => res.send(JSON.stringify({ status: 400, message: "Couldn't verify Users" })))
    }
    else {
        return res.send(JSON.stringify({ status: 401, message: 'Unauthorized' }))
    }
})
db.sequelize.sync().then(req => {
    app.listen(5000, () => {
        console.log("server running");
    })
});