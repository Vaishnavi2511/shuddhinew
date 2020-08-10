var express = require('express');
const app = express();
var router = express.Router();
var config = require('./config.json');
const validator= require('validator')
var signatureVerification = require('./helpers/signatureCreation');
var enums = require('./helpers/enums');
const mongoose = require('mongoose');
// const secrets = require("./config/secrets.js");
const MONGO_DB = process.env.MONGO_DB||require("./config/secrets").MONGO_DB;
mongoose.connect(MONGO_DB, { useNewUrlParser: true,
useCreateIndex: true,
useUnifiedTopology: true});
var session = require('express-session')
var _ = require("lodash")
const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
var multer = require('multer')
var path = require('path')
const cryto = require("crypto");
var storage = multer({
    destination: "./public/uploads/",
    filename: (req, file, cb) => {
        cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    }
});

var receiptno=0
const nodemailer = require('nodemailer');
var singleupload = multer({ storage: storage }).single('file')
var bodyParser = require("body-parser")
var urlencodedParser = bodyParser.urlencoded({ extended: false })
router.use(session({ secret: 'keyboard cat', cookie: { maxAge: 1160000 } }))
const secret = 'abcdefg';
const pdfDocument = require('pdfkit');
const fs = require('fs');
const doc = new pdfDocument();
const fast2sms = require('fast-two-sms')
const uniqid = require('uniqid');
// var popupS = require('popups');
require('dotenv').config();

const cfSdk = require('cashfree-sdk');

const payout_config = {
    Payouts:{
    ClientID: "CF46765CWVC9W5U68Q6YA6",
    ClientSecret: "a7cb5bd335d7383cde32544401c96c9c1632a580",
    ENV: "PROD", 
    }
};

const handleResponse = (response) => {
    if(response.status === "ERROR"){
        throw {name: "handle response error", message: "error returned"};
    }
}

const {Payouts} = cfSdk;
const {Beneficiary, Transfers} = Payouts;
Payouts.Init(payout_config.Payouts);
var sharp = require('sharp');
const { token } = require('morgan');
// const { stringAt } = require('pdfkit/js/data');

const UserSchema = new Schema({
    name: String,
    regid : {
        type: String,
        unique: true,
        required:true
    },
    regcert:{
        type: String,
        default: "images/default.png"
    },
    cert12a:{
        type: String,
        default: "images/default.png"
    },
    cert80g:{
        type: String,
        default: "images/default.png"
    },
    fcra:{
        type: String,
        default: "images/default.png"
    },
    acname:{
        type: String
    },
    acno: {
        type: Number
    },
    ifsccode:{
        type: String
    },
    bankadd:{
        type: String
    },
    authperson:{
        type: String
    },
    phno:{
        type: Number,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
        // required:true
    },
    password: {
        type: String,
        select: false,
      },
    confirmPassword: {
        type: String,
        // validate: function () {
        //   return this.password == this.confirmPassword;
        // }
      },
      description:{
        type: String
    },
    donationtillnow:{
        type:Number,
        default:0
    },
    thisMonthDonations:{
        type:Number,
        default:0
    },
    lastMonthDonations:{
        type:Number,
        default:0
    },
    recentdonors:[{
        donor:{
            type: String,
        },
        amount:{
            type:Number,
        }
    }],
    logo: {
        type: String,
        default: "images/default.png"
    },

    images:{
        type: Array,
        default: []
    },
    resetToken:String,
    resetTokenExpires: Date
});

UserSchema.methods.createResetToken = function () {
    // token generate
    const resetToken = cryto.randomBytes(32).toString("hex");
  
    this.resetToken = resetToken;
  
    this.resetTokenExpires = Date.now() + 1000 * 10 * 60;
  
    return resetToken;
  
  }


  UserSchema.methods.resetPasswordhandler = function(password, confirmPassword) {
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  
  }



const User = mongoose.model('User', UserSchema);



const filter = function (req, file, cb) {
    if (file.mimetype.startsWith("image")) {
      cb(null, true)
    } else {
      cb(new Error("Not an Image! Please upload an image"), false)
    }
}

// const multerStorage = multer.diskStorage({  
//         destination: function (req, file, cb) {
//           cb(null, "./public/uploads/")
//         },
//         filename: (req, file, cb) => {
//             cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
//       }
//     })

const upload = multer({

    dest: function (req, file, cb) {
        cb(null, "./public/uploads/")
      },
      filename: (req, file, cb) => {
          cb(null, file.fieldname + "_" + Date.now() + path.extname(file.originalname));
    },
    fileFilter: filter
  })

  
  let multiImageHandler = upload.fields([{
    name: "regcert", maxCount: 1
  }, {
    name: "cert12a", maxCount: 1    
  },
  {
    name: "cert80g", maxCount: 1
  },
  {
    name: "fcra", maxCount: 1
  },

]);

  async function uploadFile(req, res, next) {
    try {
      // 
        await sharp(req.files.regcert[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })
      // cover
      // start
      await sharp(req.files.cert12a[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

      await sharp(req.files.cert80g[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })

      await sharp(req.files.fcra[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })
      next();
    } catch (err) {
      console.log(err.message);
    }
  }

  let uploadLogoHandler = upload.fields([{
          name: "logo" , maxCount: 1
        }
])


  async function uploadlogo(req, res, next) {
    try {
   await sharp(req.files.logo[0].path).resize(2000, 1500).toFormat("jpeg").jpeg({
        quality: 90
      })
    next();
  } 
  catch (err) {
    console.log(err.message);
  }
}

let uploadImagesHandler = upload.fields([{
    name: "images" , maxCount: 20
    }])

    async function uploadimages(req, res, next) {
        try {
  let promiseArr = [];
    // start
    for (let i = 0; i < req.files.images.length; i++) {
      let filePromise = sharp(req.files.images[i].path)
        .resize(2000, 1500)
        .toFormat("jpeg")
        .jpeg({
          quality: 90
        })
      promiseArr.push(filePromise); 
    
    }
    await Promise.all(promiseArr);
    next();
  } 
  catch (err) {
    console.log(err.message);
  }
}

router.get("/gallery",function(req,res){

    Gallery.find({},(err,docs) => {
        res.render('gallery',{Gal:docs})
    })
})


  router.get('/registerngo', (req, res) => {
  res.render('regngo')
})
  router.post('/registerngo', multiImageHandler, uploadFile,urlencodedParser, function (req, res) {
      User.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
      if(_.isEmpty(doc)) {
        const userpath1 = req.files.regcert[0].path.split("\\").splice(1).join("/");
        const userpath2 = req.files.cert12a[0].path.split("\\").splice(1).join("/");
        const userpath3 = req.files.cert80g[0].path.split("\\").splice(1).join("/");
        const userpath4 = req.files.fcra[0].path.split("\\").splice(1).join("/");
        
      let newUser = new User();
      if(req.body.password !=req.body.confirmPassword)
      {
        res.render('regngo',{message:"Password and confirm password soes not mach. Register again!"})
      }
      newUser.name = req.body.name;
      newUser.regid = req.body.regid;
      newUser.regcert = userpath1;
      newUser.cert12a =userpath2;
      newUser.cert80g =userpath3;
      newUser.fcra = userpath4;
      newUser.acname = req.body.acname;
      newUser.acno = req.body.acno;
      newUser.ifsccode = req.body.ifsccode;
      newUser.bankadd = req.body.bankadd;
      newUser.authperson = req.body.authperson;
      newUser.phno = req.body.phno;
      newUser.email = req.body.email;
      newUser.password = req.body.password;
      newUser.confirmPassword = req.body.confirmPassword;
      newUser.description = req.body.description;
      newUser.save(function (err) {
          if (err) {
              console.log(err.message,"err");
              return
          }
         
           let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear NGO,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
           fast2sms.sendMessage({authorization : process.env.API_KEY,message : "Registered Successfully",numbers:[req.body.phno]})
           const bene = {
            "beneId": newUser._id, 
            "name": req.body.acname,
            "email": req.body.email, 
            "phone": req.body.phno,
            "bankAccount": req.body.acno,
            "ifsc": req.body.ifsccode,    
            "address1" : req.body.bankadd
        };
        (
            async()=>{
                try{
                    const response =await Beneficiary.Add(bene);
                    console.log("beneficiarry addition response");
                    console.log(response);
                }
                catch(err){
                    console.log("err caught in beneficiarry addition");
                    console.log(err);
                    return;
                }
            }
        )();
           res.render('index',{message:"Registered Successfully"})
      });
        }
          else {
            res.render('regngo',{message:"Already registered"})
        }
    })
     
  })

const GovSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    phn: Number,
    reason: String,
    project: String,
    password: {
        type: String,
        required: true
    },
      logo: {
        type: String,
        default: "images/default.png"
    },

    images: {
        type: Array,
        default: []
    },
    resetToken:String,
    resetTokenExpires: Date
});
GovSchema.methods.createResetToken = function () {
    // token generate
    const resetToken = cryto.randomBytes(32).toString("hex");
  
    this.resetToken = resetToken;
  
    this.resetTokenExpires = Date.now() + 1000 * 10 * 60;
  
    return resetToken;
  
  }
 

  GovSchema.methods.resetPasswordhandler = function(password, confirmPassword) {
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  
  }
const Gov = mongoose.model('Gov', GovSchema);
const WorkSchema = new Schema({
    heading: String,
    content: String,
    name: String,
    email: String,
    postedBy: ObjectId
})
const Work = mongoose.model('Work', WorkSchema);
const RecSchema = new Schema({
    name: String,
    email: String,
    date : String,
    receipt: String

})
const Rec = mongoose.model('Rec', RecSchema);

const GallerySchema = new Schema({
    description:String,
    image:{
        type:String
    },
})
const Gallery = mongoose.model('Gallery',GallerySchema);

const DonorSchema = new Schema({
    name: String,
    email: {
        type: String,
        unique: true
    },
    phNum: Number,
    pan: String,
    amount: Number,
    address: String,
    password: String,
    logo: {
        type: String,
        default: "images/default.png"
    },

    images: {
        type: Array,
        default: []
    },
    t :{
        type:String,
        default : "D"
    },

    resetToken:String,
    resetTokenExpires: Date

})

DonorSchema.methods.createResetToken = function () {
    // token generate
    const resetToken = cryto.randomBytes(32).toString("hex");
  
    this.resetToken = resetToken;
  
    this.resetTokenExpires = Date.now() + 1000 * 10 * 60;
  
    return resetToken;
  
  }


  DonorSchema.methods.resetPasswordhandler = function(password, confirmPassword) {
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  
  }

const Donor = mongoose.model('Donor', DonorSchema);

const MemberSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    educQual: {
        type: Array,
    },
    phNum: {
        type: Number,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        } 
    },
    password: {
        type: String,
        required: true
    },
    cnfrmpassword: {
        type: String,
        // validate: function () {
        //     return this.password == this.confirmPassword;
        // },
        required:true
    },
    cityName:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true,
    },
    thisMonthDonations:{
        type:Number,
        default:0
    },
    acname:{
        type: String,
        required:true,
    },
    acno: {
        required:true,
        type: Number
    },
    ifsccode:{
        required:true,
        type: String
    },
    bankadd:{
        required:true,
        type: String
    },
    // idNumber:{
    //     type:String,
    //     required:true,
    //     unique:true
    // },
    interests:{
        type:Array,
        required:true
    },
    totalDonations:{
        type:Number,
        default:0
    },
      logo: {
        type: String,
        default: "images/default.png"
    },

    images: {
        type: Array,
        default: []
    },
    t :{
        type:String,
        default : "M"
    },
    certimem:{
        type:String
    },
   

    resetToken:String,
    resetTokenExpires: Date
});
MemberSchema.methods.createResetToken = function () {
    // token generate
    const resetToken = cryto.randomBytes(32).toString("hex");
  
    this.resetToken = resetToken;
  
    this.resetTokenExpires = Date.now() + 1000 * 10 * 60;
  
    return resetToken;
  
  }


  MemberSchema.methods.resetPasswordhandler = function(password, confirmPassword) {
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  
  }
const Member = mongoose.model('Member', MemberSchema);
const VolunteerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    educQual: {
        type: Array,
    },
    phNum: {
        type: Number,
        required: true,
        trim: true
    },
    email: {
        type: String,
        unique: true,
        required: true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Invalid Email')
            }
        } 
    },
    password: {
        type: String,
        required: true
    },
    cnfrmpassword: {
        type: String,
        // required:true
    },
    cityName:{
        type:String,
        required:true
    },
    address:{
        type:String,
        required:true,
    },
    
    interests:{
        type:Array,
        required:true
    },
    role:{
        type: Array
    },
    totalDonations:{
        type:Number,
        default:0
    },
    thisMonthDonations:{
        type:Number,
        default:0
    },
    acname:{
        type: String
    },
    acno: {
        type: Number
    },
    ifsccode:{
        type: String
    },
    bankadd:{
        type: String
    },
      logo: {
        type: String,
        default: "images/default.png"
    },

    images: {
        type: Array,
        default: []
    },
    t :{
        type:String,
        default : "V"
    },
    pan:{
        type:String,
        default:" "
    },

    resetToken:String,
    resetTokenExpires: Date
});
VolunteerSchema.methods.createResetToken = function () {
    // token generate
    const resetToken = cryto.randomBytes(32).toString("hex");
  
    this.resetToken = resetToken;
  
    this.resetTokenExpires = Date.now() + 1000 * 10 * 60;
  
    return resetToken;
  
  }


  VolunteerSchema.methods.resetPasswordhandler = function(password, confirmPassword) {
    this.password = password;
    this.confirmPassword = confirmPassword;
    this.resetToken = undefined;
    this.resetTokenExpires = undefined;
  
  }
const Volunteer = mongoose.model('Volunteer', VolunteerSchema);
const CauseSchema = new Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    image:{
        type: String
    }
})
const Cause = mongoose.model('Cause', CauseSchema);

var CronJob = require('cron').CronJob;
var job = new CronJob('00 12 1 * *', function() {
    console.log("check")
    User.find({},(err,users)=>{
        if(err){
            return err
        }
        users.map(user=>{
            const transfer = {
                beneId: user._id,
                transferId: uniqid('transfer'),
                amount: (user.thisMonthDonations)*0.90,
            };
            (
                async()=>{
                    try{
                        const response = await Transfers.RequestTransfer(transfer);
                        console.log("request transfer response");
                    }
                    catch(err){
                        console.log("err caught in requesting transfer");
                        console.log(err);
                        return; 
                    }
                    try{
                        const response = await Transfers.GetTransferStatus({
                            "transferId": transfer.transferId,
                        });
                        console.log("get transfer status response");
                        console.log(response);
                        handleResponse(response);
                    }
                    catch(err){
                        console.log("err caught in getting transfer status");
                        console.log(err);
                        return; 
                    }
                }
            )();
            user.lastMonthDonations= user.thisMonthDonations
            user.thisMonthDonations=0
            user.save()
        })
    })
    Member.find({},(err,users)=>{
        if(err){
            return err
        }
        users.map(user=>{
            const transfer = {
                beneId: user._id,
                transferId: uniqid('transfer'),
                amount: (user.thisMonthDonations)*0.5,
            };
            (
                async()=>{
                    try{
                        const response = await Transfers.RequestTransfer(transfer);
                        console.log("request transfer response");
                    }
                    catch(err){
                        console.log("err caught in requesting transfer");
                        console.log(err);
                        return; 
                    }
                    try{
                        const response = await Transfers.GetTransferStatus({
                            "transferId": transfer.transferId,
                        });
                        console.log("get transfer status response");
                        console.log(response);
                        handleResponse(response);
                    }
                    catch(err){
                        console.log("err caught in getting transfer status");
                        console.log(err);
                        return; 
                    }
                }
            )();
            user.thisMonthDonations=0
            user.save()
        })
    })
    Volunteer.find({},(err,users)=>{
        if(err){
            return err
        }
        users.map(user=>{
            const transfer = {
                beneId: user._id,
                transferId: uniqid('transfer'),
                amount: (user.thisMonthDonations)*0.5,
            };
            (
                async()=>{
                    try{
                        const response = await Transfers.RequestTransfer(transfer);
                        console.log("request transfer response");
                    }
                    catch(err){
                        console.log("err caught in requesting transfer");
                        console.log(err);
                        return; 
                    }
                    try{
                        const response = await Transfers.GetTransferStatus({
                            "transferId": transfer.transferId,
                        });
                        console.log("get transfer status response");
                        console.log(response);
                        handleResponse(response);
                    }
                    catch(err){
                        console.log("err caught in getting transfer status");
                        console.log(err);
                        return; 
                    }
                }
            )();
            user.thisMonthDonations=0
            user.save()
        })
    })

}, null, true);
job.start();
router.get('/donateforcause/:id',(req,res)=>{
    tostoreid = req.params.id
    res.redirect("/main/form2")
})


router.get('/gov', function (req, res) {
    res.render('reggov')
})
router.post('/gov', urlencodedParser, singleupload, function (req, res) {
    Gov.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newGov = new Gov();
            newGov.name = req.body.name;
            newGov.email = req.body.email;
            newGov.password = req.body.password;
            newGov.phn = req.body.phn;
            newGov.reason = req.body.reason;
            newGov.project = req.body.project;
            newGov.logo = req.file.filename;
            newGov.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                 let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear CSR,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
                
               fast2sms.sendMessage({authorization : process.env.API_KEY,message : "Registered Successfully",numbers:[req.body.phn]})
                res.render('index',{message:"Registered Successfully"})

            });
        }
        else {
            res.render('reggov', { message: "User already Exists" })
        }
    })
})


router.get('/registermember', (req, res) => {
    res.render('regmember')
})


router.post('/registermember', urlencodedParser, singleupload, function (req, res) {
    Member.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newMember = new Member();
            newMember.name = req.body.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = req.body.phone;
            newMember.email = req.body.email;
            newMember.password = req.body.password;
            newMember.cnfrmpassword = req.body.cnfrmpassword;
            newMember.cityName = req.body.cityname;
            newMember.address = req.body.address;
            
            newMember.interests = req.body.intrest;
            newMember.acname = req.body.acname;
            newMember.acno = req.body.acno;
            newMember.ifsccode = req.body.ifsccode;
            newMember.bankadd = req.body.bankadd;
            newMember.save()
             let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear Member,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
            fast2sms.sendMessage({authorization : process.env.API_KEY,message : "Registered Successfully",numbers:[req.body.phone]})
            const bene = {
                "beneId": newMember._id, 
                "name": req.body.acname,
                "email": req.body.email, 
                "phone": req.body.phno,
                "bankAccount": req.body.acno,
                "ifsc": req.body.ifsccode,    
                "address1" : req.body.address
            };
            (
                async()=>{
                    try{
                        const response =await Beneficiary.Add(bene);
                        console.log("beneficiarry addition response");
                        console.log(response);
                    }
                    catch(err){
                        console.log("err caught in beneficiarry addition");
                        console.log(err);
                        return;
                    }
                }
            )();
            res.render('checkoutmem', {
                postUrl: config.paths[config.enviornment].cashfreePayUrl, user: newMember
            });
             mem = newMember
        }
        else {
            res.render('regmember', { message: "User already Exists" })
        }
    })
})
router.get('/registervolunteer', (req, res) => {
    res.render('regvolunteer')
})
router.post('/registervolunteer', urlencodedParser, singleupload , function (req, res) {
    Volunteer.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            return
        }
        if (_.isEmpty(doc)) {

            let newMember = new Volunteer();
            newMember.name = req.body.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = req.body.phone;
            newMember.email = req.body.email;
            newMember.password = req.body.password;
            newMember.cityName = req.body.cityname;
            newMember.address = req.body.address;
          
            newMember.interests = req.body.intrest;
            newMember.cnfrmpassword = req.body.cnfrmpassword;
            newMember.role = req.body.role;
            newMember.acname = req.body.acname;
            newMember.acno = req.body.acno;
            newMember.ifsccode = req.body.ifsccode;
            newMember.bankadd = req.body.bankadd;
            newMember.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                 let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: req.body.email,
                subject: 'Successfull Registration',
                text: 'Dear Volunteer,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',
               
            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
                
                fast2sms.sendMessage({authorization : process.env.API_KEY,message : "Registered Successfully",numbers:[req.body.phone]})
                const bene = {
                    "beneId": newMember._id, 
                    "name": req.body.acname,
                    "email": req.body.email, 
                    "phone": req.body.phno,
                    "bankAccount": req.body.acno,
                    "ifsc": req.body.ifsccode,    
                    "address1" : req.body.address
                };
                (
                    async()=>{
                        try{
                            const response =await Beneficiary.Add(bene);
                            console.log("beneficiarry addition response");
                            console.log(response);
                        }
                        catch(err){
                            console.log("err caught in beneficiarry addition");
                            console.log(err);
                            return;
                        }
                    }
                )();
                try{
                    const response = Beneficiary.Add(bene);
                    console.log("beneficiarry addition response");
                    console.log(response);
                }
                catch(err){
                    console.log("err caught in beneficiarry addition");
                    console.log(err);
                    return;
                }
                 res.render('index',{message:"Registered Successfully"})
            });
        }
        else {
            res.render('regvolunteer', { message: "User already Exists" })
        }
    })
})
router.get('/galleryupdate',function(req,res){
        res.render('reggal')    
})
router.post('/galleryupdate',urlencodedParser,singleupload,function(req,res){
    let newGal = new Gallery();
    newGal.description = req.body.description;
    newGal.image = req.file.filename;
    newGal.save(function (err) {
        if (err) {
            console.log(err, 'error')
            return
        }
        res.render('index',{message:"Photo updated"});
})
});


router.get('/index', (req, res, next) => {
    console.log("index get hit");
    res.render('checkout', {
        postUrl: config.paths[config.enviornment].cashfreePayUrl, user: req.session.task
    });
});
router.get('/createcause',(req,res)=>{
    res.render('createcause')
})
router.post('/createcause', urlencodedParser, singleupload, function (req, res){
    // const userpath = req.files.logo[0].path.split("\\").splice(1).join("/");
    let newCause = new Cause();
    newCause.name = req.body.name;
    newCause.description = req.body.description;
    newCause.image = req.file.filename;
    newCause.save(function (err) {
        if (err) {
            console.log(err, 'error')
            return
        }
        res.render('index',{message:"Cause updated"})

    })
})


router.get('/form', (req, res) => {
    res.render('form')
})
var ses = ""
router.post('/form', urlencodedParser, (req, res) => {

    Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Volunteer.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                      Donor.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                        if (err) {
                            console.log(err, 'error')
                            res.redirect('/')
                            return
                        }
                        if (_.isEmpty(doc)) {
                             res.render('form', { message: "Donate one time" });
                        }
                        else {
                            req.session.task = doc
                            ses = doc
                            res.redirect('/main/index')
                        }
                    })
                }
                else {
                    req.session.task = doc
                    ses = doc
                    res.redirect('/main/index')
                }
            })
        }
        else {
            req.session.task = doc
            ses = doc
            res.redirect('/main/index')
        }
    })

})
var ses = " "
router.post('/one', urlencodedParser, (req, res) => {
    Donor.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            const pass = cryto.randomBytes(6).toString("hex");
            let newDonor = new Donor();
            newDonor.name = req.body.name;
            newDonor.email = req.body.email;
            newDonor.phNum = req.body.phone;
            newDonor.password = pass;
            newDonor.pan = req.body.pan;
            newDonor.amount = req.body.amount;
            newDonor.address = req.body.address;
            newDonor.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: req.body.email,
                    subject: 'Donor Password',
                    text: 'Dear Donor,\n\n Your Password is. ' + newDonor.password + ' \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                res.redirect('/main/index')
            });
            req.session.task = newDonor;
            ses = newDonor;
        }
        else {
            res.render('form', { message: "Donor already Exists" })
        }

    })
})

router.get('/form1', (req, res) => {
    res.render('form1')
})
var ses = ""
router.post('/form1', urlencodedParser, (req, res) => {
    Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Volunteer.findOne({ password: req.body.password, email: req.body.email}, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    Donor.findOne({ password: req.body.password, email: req.body.email}, function (err, doc) {
                        if (err) {
                            console.log(err, 'error')
                            res.redirect('/')
                            return
                        }
                        if (_.isEmpty(doc)) {
                            res.render('form1', { message: "Donate one time" })
                        }
                        else {
                            req.session.task = doc
                            ses = doc
                            res.redirect('/main/shuddhi')
                        }
                    })
                }
                else {
                    req.session.task = doc
                    ses = doc
                    res.redirect('/main/shuddhi')
                }
            })
        }
        else {
            req.session.task = doc
            ses = doc
            res.redirect('/main/shuddhi')
        }
    })

})
var ses = " "
router.post('/oneo', urlencodedParser, (req, res) => {
    Donor.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            const pass = cryto.randomBytes(6).toString("hex");
            let newDonor = new Donor();
            newDonor.name = req.body.name;
            newDonor.email = req.body.email;
            newDonor.phNum = req.body.phone;
            newDonor.password = pass;
            newDonor.pan = req.body.pan;
            newDonor.amount = req.body.amount;
            newDonor.address = req.body.address;
            newDonor.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: req.body.email,
                    subject: 'Donor Password',
                    text: 'Dear Donor,\n\n Your Password is. ' + newDonor.password + ' \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                res.redirect('/main/shuddhi')
            });
            req.session.task = newDonor;
            ses = newDonor;
        }
        else {
            res.render('form1', { message: "Donor already Exists" })
        }

    })
})
router.get('/shuddhi', (req, res, next) => {
    console.log("index get hit");
    res.render('checkoutshu', {
        postUrl: config.paths[config.enviornment].cashfreePayUrl, user: req.session.task
    });
});
router.get('/form2', (req, res) => {
    res.render('form2')
})
var ses = ""
router.post('/form2', urlencodedParser, (req, res) => {
    Member.findOne({ password: req.body.password, email: req.body.email, name: req.body.name }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Volunteer.findOne({ password: req.body.password, email: req.body.email, name: req.body.name }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    res.render('index', { message: "Please register first" })
                }
                else {
                    req.session.task = doc
                    ses = doc
                    res.redirect('/main/referral')
                }
            })
        }
        else {
            req.session.task = doc
            ses = doc
            res.redirect('/main/referral')
        }
    })

})
var ses = " "
router.post('/one2', urlencodedParser, (req, res) => {
    Donor.findOne({ email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            const pass = cryto.randomBytes(6).toString("hex");
            let newDonor = new Donor();
            newDonor.name = req.body.name;
            newDonor.email = req.body.email;
            newDonor.phNum = req.body.phone;
            newDonor.password = pass;
            newDonor.pan = req.body.pan;
            newDonor.amount = req.body.amount;
            newDonor.address = req.body.address;
            newDonor.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: req.body.email,
                    subject: 'Donor Password',
                    text: 'Dear Donor,\n\n Your Password is. ' + newDonor.password + ' \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                res.redirect('/main/referral')
            });
            req.session.task = newDonor;
            ses = newDonor;
        }
        else {
            res.render('form1', { message: "Donor already Exists" })
        }

    })
})
router.get('/referral', (req, res, next) => {
    console.log("referral get hit");
    res.render('checkoutmember', {
        postUrl: config.paths[config.enviornment].cashfreePayUrl, user: req.session.task
    });
});
router.post('/resultshu', (req, res, next) => {
    console.log("merchantHosted result hit");
    /*try {
        const _id = ses1._id
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }*/
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txTime: req.body.txTime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                receiptno = receiptno + 1
                const doc = new pdfDocument();
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.image('./public/images/rec.jpg',80,0, {
                    fit:[450,550],
                    align:'center',
                    valign:'center'
                     
               });
                 
               doc.fontSize(5)
               doc.text(" " + postData.txTime,-75,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.name,150,145,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(ses.address,140,155,{
                   align:'center'
               });
               doc.fontSize(5)
               doc.text("Receipt No. :" + " " + postData.referenceId,300,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.email,150,173,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.phNum,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.orderAmount,{
                   align:'center'
               });
               doc.fontSize(7)
               doc.text(" " + ses.pan,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.paymentMode,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text( " " + "Donation to SHUDDHI ",{
                   align:'center'
               });
               /*doc.fontSize(20)
               doc.text("NGO phone no. :" + " " + "9654815105",{
                   align:'center'
               });*/
                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: ses.email,
                    subject: 'Successfull Donation',
                    text: 'Dear Donor,\n\nGreetings of the day\n\nPlease find attached your 80G Tax benefit donation receipt. \n\n We thank you for your contribution and we look forward to your continued support and patronage.\n\nYou are a hero and today you have made a difference.\n\n Thanking You \n\n Team SHUDDHI NGO\n\n ',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                let newRec = new Rec();
                newRec.name = ses.name;
                newRec.email = ses.email;
                newRec.date = postData.txTime;
                newRec.receipt = postData.referenceId + '.pdf'
                newRec.save(function (err) {
                    if (err) {
                        console.log(err, 'error')
                        return
                    }
                });



                return res.status(200).render('receipt3', { data: postData, task: ses });
                //return res.status(200).render('receipt1', { data: postData, task: ses, receiptno: receiptno });
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.get('/cause',(req,res)=>{
    Cause.find({},(err, docs) => {
        res.render('cause', { cause: docs })
    })
})
router.post('/cause', urlencodedParser, function (req, res){
    Cause.findOne({ name: req.body.name }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        res.send('localhost:3000/main/donateforcause/'+tocopyid)
    })
})
router.get('/ngo', (req, res) => {
    User.find({}, (err, docs) => {
      Cause.find({},(err,docs1)=>{
        res.render('ngo', { ngo: docs, Causes : docs1 })
    })
})
})
var ses1 = " ";
router.post('/ngo', urlencodedParser, function (req, res) {
    User.findOne({ regid: req.body.regid }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }

        req.session.user = doc
        ses1 = doc
        var regid = req.session.user.regid
        res.redirect('/main/info')
    })
})
router.get('/info',(req,res)=>{
    Work.find({email:ses1.email},(err,docs)=>{
    
        res.render('info',{info:ses1,work:docs})
    })
})
var s = " ";
router.post('/result', (req, res, next) => {
    console.log("merchantHosted result hit");
    try{
        const _id=ses1._id
    }
    catch(err){
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txTime: req.body.txTime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                const _id=ses1._id
                User.findById(_id,(err,user)=>{
                    if(err){
                        return err
                    }
                    user.donationtillnow = user.donationtillnow + parseFloat(req.body.orderAmount)
                    user.thisMonthDonations=user.thisMonthDonations+parseFloat(req.body.orderAmount)
                    if(user.recentdonors.length===3){
                        user.recentdonors.pull({_id:user.recentdonors[0]._id})
                    }
                    const newDonor = {
                        donor : ses.name,
                        amount: req.body.orderAmount
                    }
                    user.recentdonors.push(newDonor)
                    user.save()
                    
                })
                
                receiptno = receiptno + 1
                const doc = new pdfDocument();
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.image('./public/images/rec.jpg',80,0, {
                    fit:[450,550],
                    align:'center',
                    valign:'center'
                     
               });
               doc.fontSize(5)
               doc.text(" " + postData.txTime,-75,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text( " " + ses.name,150,145,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.address,140,155,{
                   align:'center'
               });
               doc.fontSize(5)
               doc.text( " " + postData.referenceId,300,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.email,150,173,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + ses.phNum,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.orderAmount,{
                   align:'center'
               });
               doc.fontSize(7)
               doc.text(" " + ses.pan,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.paymentMode,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + "Donation to " + ses1.name,{
                   align:'center'
               });
               /*doc.fontSize(20)
               doc.text("NGO phone no. :" + " " + ses1.phno,{
                   align:'center'
               });*/

                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: ses.email,
                    subject: 'Successfull Donation',
                    text: 'Dear Donor,\n\nGreetings of the day\n\nPlease find attached your 80G Tax benefit donation receipt. \n\n We thank you for your contribution and we look forward to your continued support and patronage.\n\nYou are a hero and today you have made a difference.\n\n Thanking You \n\n Team SHUDDHI NGO\n\n ',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                let newRec = new Rec();
                newRec.name = ses.name;
                newRec.email = ses.email;
                newRec.date = postData.txTime;
                newRec.receipt = postData.referenceId + '.pdf'
                newRec.save(function (err) {
                    if (err) {
                        console.log(err, 'error')
                        return
                    }
                });



                return res.status(200).render('receipt', { data: postData, task: ses, ngo: ses1 });
                //return res.status(200).render('receipt1', { data: postData, task: ses, receiptno: receiptno });
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.post('/resultmember', (req, res, next) => {
    console.log("merchantHosted result hit");
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txTime: req.body.txTime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                receiptno = receiptno + 1
                const doc = new pdfDocument();
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));

                doc.image('./public/images/certi.jpg',30,10, {
                    width:100,
                    height:200,
                    fit:[500,550],
                    align:'center',
                    valign:'center'
                     
               });
              

                
                doc.fontSize(15)
                doc.fillColor('red').text( " " + mem.name,0,270,{
                   align:'center'
                });

                
                doc.moveDown();
                doc.moveDown();
                doc.fontSize(10)
                doc.font('Courier-Bold').fillColor('blue').text(" " + postData.referenceId,130,340,{
                    align:'center'
                });
                doc.moveDown();
                
                
             
                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: mem.email,
                    subject: 'Successfull Registration',
                    text: 'Dear Member,\n\n We welcome you to our family of Shuddhi NGO.\n\n Please find attached your Life Membership Certificate. \n\nBest wishes for all the good works you can now do for people and communities with this membership. \n\n Best Regards \n\n Team SHUDDHI NGO \n\n Website: https://www.shuddhi.org \n\n Facebook Page: https://www.facebook.com/shuddhi.org \n\n Instagram Page: https://www.instagram.com/ngoshuddhi \n\n  YouTube Channel: https://www.youtube.com/shuddhingo \n\n --- \n\n SHUDDHI® \n\n Non Governmental Organisation (NGO) \n\n Head Office: New Delhi, India - 110088 \n\n Email: info@shuddhi.org \n\n Website: www.shuddhi.org \n\n',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                mem.certimem = postData.referenceId + '.pdf';
                mem.save()
                return res.status(200).render('certificate', { data: postData, task: mem });
                // return res.status(200).render('receipt', { data: postData, task: ses, receiptno: receiptno });
                
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
var tostoreid=''
router.post('/resultdonatevol', (req, res, next) => {
    console.log("merchantHosted result hit");
    const _id=req.session.user._id
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txTime: req.body.txTime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                User.findById(_id,(err,user)=>{
                    if(err){
                        return err
                    }
                    user.donationtillnow = user.donationtillnow + parseFloat(req.body.orderAmount)
                    user.thisMonthDonations=user.thisMonthDonations+parseFloat(req.body.orderAmount)
                    if(user.recentdonors.length===3){
                        user.recentdonors.pull({_id:user.recentdonors[0]._id})
                    }
                    const newDonor = {
                        donor : ses.name,
                        amount: req.body.orderAmount
                    }
                    user.recentdonors.push(newDonor)
                    user.save()
                })
                
                receiptno = receiptno + 1
                return res.status(200).render('receipt', { data: postData, task: ses, receiptno: receiptno });
            }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

                    doc.pipe(fs.createWriteStream('./public/uploads/'+postData.referenceId + '.pdf'));
                    doc.fontSize(20)
                    doc.text("Donor Name :" + " " + ses.name)
                    doc.fontSize(20)
                    doc.text("Receipt No. :" + " " + postData.referenceId)
                    doc.fontSize(20)
                    doc.text("Email :" + " " + ses.email)
                    doc.fontSize(20)
                    doc.text("Ph No. :" + " " + ses.phNum)
                    doc.fontSize(20)
                    doc.text("Amount :" + " " + postData.orderAmount)
                    doc.fontSize(20)
                    doc.text("Type of Donation :" + " " + postData.paymentMode)
                    doc.fontSize(20)
                    doc.text("Description :" + " " + "Donation to " + ses1.name)
                    doc.fontSize(20)
                    doc.text("NGO phone no. :" + " " + ses1.phno)

                    doc.end()
                    let transporter = nodemailer.createTransport({
                        service: 'gmail',
                        auth: {
                            user: 'examstet@gmail.com',
                            pass: '$t@t1234'
                        }
                    });
                    let mailOptions = {
                        from: 'examstet@gmail.com',
                        to: ses.email,
                        subject: 'Successfull Donation',
                        text: 'Dear Donor,\n\nGreetings of the day\n\nPlease find attached your 80G Tax benefit donation receipt. \n\n We thank you for your contribution and we look forward to your continued support and patronage.\n\nYou are a hero and today you have made a difference.\n\n Thanking You \n\n Team SHUDDHI NGO\n\n ',
                        attachments: [
                            {
                                filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                            }
                        ]
                    };
                    transporter.sendMail(mailOptions, function (err, data) {
                        if (err) {
                            console.log('Error Occurs');
                        } else {
                            console.log('Email Sent');


                        }

                    });
                    let newRec = new Rec();
                    newRec.name = ses.name;
                    newRec.email = ses.email;
                    newRec.receipt = postData.referenceId + '.pdf'
                    newRec.save(function (err) {
                        if (err) {
                            console.log(err, 'error')
                            return
                        }
                    });
               
                
                
                return res.status(200).render('receipt', { data: postData, task: ses, ngo: ses1});

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.post('/resultdonatemem', (req, res, next) => {
    console.log("merchantHosted result hit");
    var postData = {
        orderId: req.body.orderId,
        orderAmount: req.body.orderAmount,
        referenceId: req.body.referenceId,
        txtStatus: req.body.txtStatus,
        paymentMode: req.body.paymentMode,
        txMsg: req.body.txMsg,
        txTime: req.body.txTime,
    }
    const txnTypes = enums.transactionStatusEnum;
    try {
        switch (req.body.txStatus) {
            case txnTypes.cancelled: {
                //buisness logic if payment was cancelled
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "transaction was cancelled by user",
                    }
                });
            }
            case txnTypes.failed: {
                //buisness logic if payment failed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                return res.status(200).render('result', {
                    data: {
                        status: "failed",
                        message: "payment failure",
                    }
                });
            }
            case txnTypes.success: {
                //buisness logic if payments succeed
                const signature = req.body.signature;
                const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
                if (derivedSignature !== signature) {
                    throw { name: "signature missmatch", message: "there was a missmatch in signatures genereated and received" }
                }
                console.log("Success")
                // console.log(tostoreid)
                try{
                Volunteer.findById(tostoreid,(err,user)=>{
                    // console.log(user)
                    user.totalDonations = user.totalDonations + parseFloat( req.body.orderAmount)
                    user.thisMonthDonations = user.thisMonthDonations + parseFloat(req.body.orderAmount)
                    user.save()
                })
            }
            catch{
                try{
                Member.findById(tostoreid,(err,user)=>{
                    // console.log(user)
                    user.thisMonthDonations = user.thisMonthDonations + parseFloat(req.body.orderAmount)
                    user.totalDonations = user.totalDonations + parseFloat( req.body.orderAmount)
                    user.save()
                })
            }
            catch(e){
                return res.status(500).render('result', {
                    data: {
                        status: "error",
                        err: err,
                        name: err.name,
                        message: err.message,
                    }
                });
            }
            }
            console.log("*******")
            console.log(ses.name)
            console.log("*******")
                receiptno = receiptno + 1
                const doc = new pdfDocument();
                doc.pipe(fs.createWriteStream('./public/uploads/' + postData.referenceId + '.pdf'));
                doc.image('./public/images/rec.jpg',80,0, {
                    fit:[450,550],
                    align:'center',
                    valign:'center'
                     
               });
               doc.fontSize(5)
               doc.text(" " + postData.txTime,-75,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + vol.name,150,145,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + vol.address,140,155,{
                   align:'center'
               });
               doc.fontSize(5)
               doc.text(" " + postData.referenceId,300,117,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + vol.email,150,173,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + vol.phNum,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.orderAmount,{
                   align:'center'
               });
               doc.fontSize(7)
               doc.text(" " + vol.pan,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + postData.paymentMode,{
                   align:'center'
               });
               doc.fontSize(8)
               doc.text(" " + "Donation to SHUDDHI ",{
                   align:'center'
               });
               /*doc.fontSize(20)
               doc.text("NGO phone no. :" + " " + "9654815105",{
                   align:'center'
               });*/
                doc.end()
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: vol.email,
                    subject: 'Successfull Donation',
                    text: 'Dear Donor,\n\nGreetings of the day\n\nPlease find attached your 80G Tax benefit donation receipt. \n\n We thank you for your contribution and we look forward to your continued support and patronage.\n\nYou are a hero and today you have made a difference.\n\n Thanking You \n\n Team SHUDDHI NGO\n\n ',
                    attachments: [
                        {
                            filename: postData.referenceId + '.pdf', path: './public/uploads/' + postData.referenceId + '.pdf'
                        }
                    ]
                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                let newRec = new Rec();
                newRec.name = vol.name;
                newRec.email = vol.email;
                newRec.date = postData.txTime;
                newRec.receipt = postData.referenceId + '.pdf'
                newRec.save(function (err) {
                    if (err) {
                        console.log(err, 'error')
                        return
                    }
                });

                return res.status(200).render('receipt2', { data: postData, task: vol });
        }
        }
    }
    catch (err) {
        return res.status(500).render('result', {
            data: {
                status: "error",
                err: err,
                name: err.name,
                message: err.message,
            }
        });
    }

    const signature = req.body.signature;
    const derivedSignature = signatureVerification.signatureResponse1(req.body, config.secretKey);
    if (derivedSignature === signature) {
        console.log("works");
        return res.status(200).send({
            status: req.body.txStatus,
        })
    }
    else {
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
        return res.status(200).send({
            status: "error",
            message: "signature mismatch",
        })
    }
});
router.get('/login', (req, res) => {
    res.render('login')
})
router.get('/loginvolunteer', (req, res) => {
    res.render('login')
})
var w = " "
var v = " "
router.post('/login', urlencodedParser, (req, res) => {
    User.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if(req.body.email==="myadmin@gmail.com" && req.body.password==="1234567")
        {
            req.session.work = doc;
            res.redirect('/main/welcomeadmin')
            return
        }
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Gov.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                        if (err) {
                            console.log(err, 'error')
                            res.redirect('/')
                            return
                        }
                        if (_.isEmpty(doc)) {
                            Volunteer.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                                if (err) {
                                    console.log(err, 'error')
                                    res.redirect('/')
                                    return
                                }
                                if (_.isEmpty(doc)) {
                                    Donor.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                                        if (err) {
                                            console.log(err, 'error')
                                            res.redirect('/')
                                            return
                                        }
                                        if (_.isEmpty(doc)) {
                                            res.render('login', { message: "Please check email/password" })
                                        }
                                        else {
                                            req.session.work = doc
                                            w = doc
                                            res.redirect('/main/welcome')
                                        }
                                    })
                                }
                                else {
                                    req.session.work = doc
                                    v = doc
                                    res.redirect('/main/welcome')
                                }
                            })
                        }
                        else {
                            req.session.work = doc
                            res.redirect('/main/welcome')
                        }
                    })
                }
                else {
                    req.session.work = doc
                    res.redirect('/main/welcome')
                }
        
            })
        }
        else {
            req.session.work = doc
            res.redirect('/main/welcome')
        }
    })

})
var tocopyid = ''
var vol = " "
router.post('/loginvolunteer', urlencodedParser, (req, res) => {
    Volunteer.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            Member.findOne({ password: req.body.password, email: req.body.email }, function (err, doc) {
                if (err) {
                    console.log(err, 'error')
                    res.redirect('/')
                    return
                }
                if (_.isEmpty(doc)) {
                    res.render('login', { message: "Please check email/password" })
                }
                else {
                     tocopyid= doc._id
                    vol = doc
                    res.redirect('/main/cause')
                }
            })
        }
        else {
             tocopyid= doc._id
            vol = doc
            res.redirect('/main/cause')
        }
    })

})
const checkLogIn = (req, res, next) => {
    console.log(req.session);
    if (req.session.work) {
        next();
    } else {
        res.redirect('/404')
    }
}

router.get('/welcome', checkLogIn, (req, res, next) => {
    Work.find({ postedBy: req.session.work._id }, (err, docs) => {
        Rec.find({ email: req.session.work.email }, (err, docs1) => {
            res.render('user', { user: req.session.work, blogs: docs, recs: docs1 })

        })

    })
})

router.post('/welcome', urlencodedParser, checkLogIn, (req, res) => {
    let newWork = new Work()
    newWork.heading = req.body.heading
    newWork.content = req.body.content
    newWork.email = req.session.work.email
    newWork.name = req.session.work.name
    newWork.postedBy = req.session.work._id
    newWork.save(function (err) {
        if (err) {
            console.log(err, 'error')
            return
        }
        res.redirect('/main/welcome')

    });

})
router.get('/member', checkLogIn, (req, res) => {
    res.render('member')
})
router.post('/member', checkLogIn, urlencodedParser, singleupload, (req, res) => {
    Member.findOne({ email: w.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newMember = new Member();
            newMember.name = w.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = w.phNum;
            newMember.email = w.email;
            newMember.password = w.password;
            newMember.cnfrmpassword = w.password;
            newMember.cityName = req.body.cityname;
            newMember.address = w.address;
            // newMember.idNumber = req.body.aadhaar;
            newMember.interests = req.body.intrest;

            newMember.save()
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: w.email,
                subject: 'Successfull Registration',
                text: 'Dear Member,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
            res.render('checkoutmem', {
                postUrl: config.paths[config.enviornment].cashfreePayUrl, user: newMember
            });
            mem = newMember
        }
        else {
            res.render('member', { message: "User already Exists" })
        }
    })
})
router.get('/volunteer', checkLogIn, (req, res) => {
    res.render('volunteer')
})
router.post('/volunteer', urlencodedParser, singleupload, function (req, res) {
    Volunteer.findOne({ email: w.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            return
        }
        if (_.isEmpty(doc)) {

            let newMember = new Volunteer();
            newMember.name = w.name;
            newMember.educQual = req.body.vol;
            newMember.phNum = w.phNum;
            newMember.email = w.email;
            newMember.password = w.password;
            newMember.cityName = req.body.cityname;
            newMember.address = w.address;
            // newMember.idNumber = req.body.aadhaar;
            newMember.interests = req.body.intrest;
            newMember.cnfrmpassword = w.cnfrmpassword;
            newMember.role = req.body.role;
            newMember.save(function (err) {
                if (err) {
                    console.log(err, 'error')
                    return
                }
                let transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: 'ngo@shuddhi.org',
                        pass: 'shuddhi321'
                    }
                });
                let mailOptions = {
                    from: 'ngo@shuddhi.org',
                    to: w.email,
                    subject: 'Successfull Registration',
                    text: 'Dear Volunteer,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

                };
                transporter.sendMail(mailOptions, function (err, data) {
                    if (err) {
                        console.log('Error Occurs');
                    } else {
                        console.log('Email Sent');


                    }

                });
                res.render('volunteer', { message: "Registered Successfully" })

            });
        }
        else {
            res.render('volunteer', { message: "User already Exists" })
        }
    })
})
router.get('/mem',checkLogIn,(req,res)=>{
    res.render('mem')
})
router.post('/mem', checkLogIn, urlencodedParser, singleupload, (req, res) => {
    Member.findOne({ email: v.email }, function (err, doc) {
        if (err) {
            console.log(err, 'error')
            res.redirect('/')
            return
        }
        if (_.isEmpty(doc)) {
            let newMember = new Member();
            newMember.name = v.name;
            newMember.educQual = v.eduQual;
            newMember.phNum = v.phNum;
            newMember.email = v.email;
            newMember.password = v.password;
            newMember.cnfrmpassword = v.cnfrmpassword;
            newMember.cityName = v.cityname;
            newMember.address = v.address;
            // newMember.idNumber = v.idNumber;
            newMember.interests = v.interests;
            newMember.images = v.images;
            newMember.logo = v.logo;

            newMember.save()
            let transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'ngo@shuddhi.org',
                    pass: 'shuddhi321'
                }
            });
            let mailOptions = {
                from: 'ngo@shuddhi.org',
                to: v.email,
                subject: 'Successfull Registration',
                text: 'Dear Member,\n\n Thank you for your Registration. \n\nPlease visit the website for further updates.\n\nIt is an auto generated mail so please do not reply.\n\n-Regards, SHUDDHI',

            };
            transporter.sendMail(mailOptions, function (err, data) {
                if (err) {
                    console.log('Error Occurs');
                } else {
                    console.log('Email Sent');


                }

            });
            res.render('checkoutmem', {
                postUrl: config.paths[config.enviornment].cashfreePayUrl, user: newMember
            });
            mem = newMember
        }
        else {
            res.render('mem', { message: "User already Exists" })
        }
    })
})

router.get('/welcomeadmin', checkLogIn, (req, res, next) => {
    
            Volunteer.find({}, (err, docs2) => {
            res.render('useradmin', { user: req.session.work , Volunteer: docs2 })

})
});

router.post('/welcomeadmin', urlencodedParser, checkLogIn, (req, res) => {
    
        // res.redirect('/main/welcomeadmin')
        Volunteer.findOne({ email: req.body.email }, function (err, doc) {
            if (err) {
                console.log(err, 'error')
                res.redirect('/main/welcomeadmin')
                return
            }
            console.log("button hit");
            console.log(req.body.email);
            req.session.user = doc
            ses2 = doc
            var email = ses2.email
            console.log(email);
            res.redirect('/main/infovol')
        })
    });
router.get('/infovol',(req,res)=>
{
    console.log("render hit");
    Work.find({email:ses2.email},(err,docs)=>{
        res.render('infovol',{info:ses2,work:docs})
    })
})

router.get("/imageupload", checkLogIn, (req, res) => {
    res.render("upload")
})
router.post('/imageupload', uploadLogoHandler, uploadlogo , urlencodedParser, checkLogIn, (req, res) => {
    const userpath = req.files.logo[0].path.split("\\").splice(1).join("/");
    User.update({ email: req.session.work.email }, { logo: userpath }, function (err, writeOpResult) {
        if (err) {
            console.log(err.message, 'error')
            return
        }
        req.session.work.logo = userpath;
        res.redirect('/main/welcome');
    });
})
router.get("/manyimagesupload", checkLogIn, (req, res) => {
    res.render("manyimages")
})
router.post('/manyimagesupload', uploadImagesHandler, uploadimages , urlencodedParser, checkLogIn, (req, res) => {
    // console.log(req.files);
    let arr = req.session.work.images;
    let userpath = "";
    for(var i = 0 ; i < req.files.images.length ;i++)
    {

        userpath = req.files.images[0].path.split("\\").splice(1).join("/");
        
        arr.push(userpath);
    }
    User.update({ email: req.session.work.email }, {images:arr}, function (err, writeOpResult) {
        if (err) {
            console.log(err.message, 'error')
            return
        }
        
        res.redirect('/main/welcome')
    });
})
router.get('/loginadmin',(req,res)=>{
    res.render('login')
})

router.post('/loginadmin', urlencodedParser, singleupload,(req,res)=>{
    if(req.body.email==="myadmin@gmail.com" && req.body.password==="1234567"){
        res.redirect('/main/createcause')
       res.redirect('/');
    }
    
    else{
        res.render('login', { message: "Please check email/password" })
    }
})
router.get('/logout', (req, res) => {
    req.session.destroy
    res.redirect('/')
})
async function forgetPassword(req, res) {
    //   let { email } = req.body.email;
    var user;
      try {
          if(await User.findOne({ email: req.body.email })){
         user = await User.findOne({ email: req.body.email });
        }
        else if(await Gov.findOne({ email: req.body.email })){
             user = await Gov.findOne({ email: req.body.email })
        }
        else if(await Volunteer.findOne({ email: req.body.email })){
             user = await Volunteer.findOne({ email: req.body.email })
        }
        else if(await Member.findOne({ email: req.body.email })){
            user = await Member.findOne({ email: req.body.email })
        }
        else if(await Donor.findOne({ email: req.body.email })){
            user = await Donor.findOne({ email: req.body.email })
        }
    
        if (user) {
          // create token
          const resetToken = user.createResetToken();
          // confirm password
          await user.save({ validateBeforeSave: false });
          resetPath = "http://localhost:3000/main/resetpassword/" + resetToken;
            let useremail = req.body.email;
            
          // send Mail
    
        //   let html,subject;
        //   html="this is the link to reset password - "+resetPath;
        //   subject="Reset Password";
        //   let options = {
        //     to: user.email,
        //     html:html,
        //     subject:subject
        //   }
        //   await emailHelper(options);
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'ngo@shuddhi.org',
                pass: 'shuddhi321'
            }
        });
        let mailOptions = {
            from: 'ngo@shuddhi.org',
            to: req.body.email,
            subject: 'Forget Password',
            text: 'This is your link - ' +  resetPath,
           
        };
        transporter.sendMail(mailOptions, function (err, data) {
            if (err) {
                console.log('Error Occurs');
            } else {
                console.log('Email Sent');
    
    
            }
        });
    
        
        //    return res.status(200).json({
        //     resetPath,
        //     resetToken,
        //     useremail,
        //     status: "Token sent to your email",
        //   })
        } else {
        //   throw new Error("User not found");
        }
    
    
      } catch (err) {
        console.log(err.message);
        // res.status(400).json({
        //   err,
        //   status: "cannot reset password"
        // }
        // )
      }
    }
    async function resetPassword(req, res) {
      try {
        const token = req.params.token;
        console.log(token);
        const password = req.body.password;
        const confirmPassword = req.body.confirmPassword;
        var user;
        if(await User.findOne({
            resetToken: token,
            resetTokenExpires: { $gt: Date.now() }
          })){
         user = await User.findOne({
          resetToken: token,
          resetTokenExpires: { $gt: Date.now() }
        })
    }
    else if(await Gov.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      })){
     user = await Gov.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    })
    }
    else if(await Volunteer.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      })){
     user = await Volunteer.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    })
    }
    else if(await Member.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      })){
     user = await Member.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    })
    }
    else if(await Donor.findOne({
        resetToken: token,
        resetTokenExpires: { $gt: Date.now() }
      })){
     user = await Donor.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    })
    }
        if (user) {
          user.resetPasswordhandler(password, confirmPassword)
          
        // User.update(user,{
        //     password:newpassword,
        //     confirmPassword:newconfirmPassword
        // });
          // db save 
          await user.save();
          res.redirect('/');
        } else {
          throw new Error("Not a valid token");
        }
      } catch (err) {
        console.log(err);
        res.status(200).json({
          status: "Some error occurred",
          err
        })
      }
    }
    
    router.get('/forgotpassword',(req,res)=>
    {
        res.render("forget");
    })
    
    router.post('/forgotpassword', (req,res)=>{
        const backres = forgetPassword(req,res);
        res.redirect('/');
    })
    
    router.get("/resetPassword/:token",(req,res)=>{
        console.log("reset render is running");
        res.render("reset")
    })
    
    router.post("/resetPassword/:token", (req,res) => {
        console.log("reset is running");
        const backres = resetPassword(req,res);
    
    })
module.exports.CauseSchema = CauseSchema;
module.exports.Cause = mongoose.model('Cause', CauseSchema);
module.exports = router;