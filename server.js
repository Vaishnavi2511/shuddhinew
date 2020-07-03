const express = require('express');
const parser = require('body-parser');
const ip = require('ip');
const config = require('./config.json');
const helpers = require('./helpers/signatureCreation');
const enums = require('./helpers/enums');
const server = require('http').createServer();
const main = require('./main');
const merchantHosted = require('./merchantHosted');
// import Cause from './main';

//const notifyUrl = "http://" + ipAdr + ":" + port + "/notify";
//const notifyUrl = "https://webhook.site/e39bbfdd-6b34-421e-8379-1a2dc9a13238"
const notifyUrl = "";
const path = require('path');


const app = express();

app.locals.ipAdr = "https://hishuddhi.herokuapp.com";
const port = process.env.PORT || 3000;
// app.locals.port = port;
//const returnUrlCheckOut = "http://" + app.locals.ipAdr + ":" + app.locals.port + "/result";
const { CauseSchema, Cause } = require('./main.js');
// const CauseSchema = require('./main.js').model('Cause').schema;
// const Cause = require('./main.js').model(Cause);
app.set('views' , path.join(__dirname,'views'));
app.set('view engine','ejs');
app.set('view options', {layout: 'layout.ejs'});

//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));
app.use(parser.urlencoded({extended: false}));
app.use(parser.json());

app.use('/main',main);
app.use('/merchantHosted',merchantHosted);
const nodemailer = require('nodemailer');
var bodyParser = require("body-parser");
var urlencodedParser = bodyParser.urlencoded({extended:false})



app.post('/calculateSecretKey', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = app.locals.ipAdr + "/main/result";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                paymentData:formObj,
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});
app.post('/calculateSecretKeymemberregister', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = app.locals.ipAdr + "/main/resultmember";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                paymentData:formObj,
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});
app.post('/calculateSecretKeymember', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = app.locals.ipAdr + "/main/resultdonatemem";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                paymentData:formObj,
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});
app.post('/calculateSecretKeyvolunteer', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = app.locals.ipAdr + "/main/resultdonatevol";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                paymentData:formObj,
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});
app.post('/calculateSecretKeyshu', (req, res, next)=>{
    const {paymentType} = req.body;
    var {formObj} = req.body;
    
    const secretKey = config.secretKey;

    switch(paymentType){
        case enums.paymentTypeEnum.checkout: {
            const returnUrl = app.locals.ipAdr + "/main/resultshu";
            formObj.returnUrl = returnUrl;
            formObj.notifyUrl = "";
            formObj.appId = config.appId;
            const signature = helpers.signatureRequest1(formObj, secretKey);
            additionalFields = {
                returnUrl,
                notifyUrl,
                signature,
                appId: config.appId,
            };
            return res.status(200).send({
                status:"success",
                paymentData:formObj,
                additionalFields,
            });
        }
        case enums.paymentTypeEnum.merchantHosted: {
            var { formObj } = req.body;
            formObj.appId = config.appId;
            formObj.returnUrl = "";
            formObj.notifyUrl = notifyUrl;
            formObj.paymentToken = helpers.signatureRequest2(formObj, config.secretKey);
            return res.status(200).send({
                status: "success",
                paymentData: formObj,
            });
        }

        default: {
            console.log("incorrect payment option recieved");
            console.log("paymentOption:", paymentType);
            return res.status(200).send({
                status:"error",
                message:"incorrect payment type sent"
            });
        }
    }
});
// Cause.find({},function(err,docs){
//     console.log(docs);
// })
app.get("/aboutus",function(req,res){
    res.render('aboutus');
})
app.get("/home",function(req,res){
    res.render('index');
})

app.get("/ourpartner",function(req,res){
    res.render('ourpartner');
})

// app.get("/causes",function(req,res){
//     res.render('causesfinal');
// })

// app.get("/gallery",function(req,res){
//     res.render('gallery');
// })

app.get("/contactus",function(req,res){
    res.render('contacts');
})
app.post('/contactus',urlencodedParser,function(req,res){
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ngo@shuddhi.org',
            pass: 'shuddhi321'
        }
    });
    let mailOptions = {
        from: 'ngo@shuddhi.org',
        to: 'ngo@shuddhi.org',
        subject: 'Queries',
        text: req.body.name + "\n" + req.body.email + "\n" + req.body.phone + "\n" + req.body.message,
       
    };
    transporter.sendMail(mailOptions, function (err, data) {
        if (err) {
            console.log('Error Occurs');
        } else {
            console.log('Email Sent');


        }

    });
    res.render('contacts',{ message: "Thank you for your query.We will get back to you very soon."})
})
app.get("/donate",function(req,res){
    res.render('donate');
})
/*app.post('/result', (req,res,next)=>{
    //will have to make generic/payment type based
    console.log("result hit");
    console.log(req.body);
    const signature = req.body.signature;
    const derivedSignature = helpers.signatureResponse1(req.body, config.secretKey);
    if(derivedSignature === signature){
        console.log("works");
    }
    else{
        console.log("signature gotten: ", signature);
        console.log("signature derived: ", derivedSignature);
    }
    return res.status(200).send({
        body: req.body
    });
});*/



//below will not be hit as server is not on https://
app.post('/notify', (req, res, next)=>{
    console.log("notify hit");
    console.log(req.body);
    return res.status(200).send({
        status: "success",
    })
});

app.get('/',(req, res, next)=>{
    console.log("landing page hit");
    /*return res.send({
        status: "success",
        message: "work in progress"
    })*/
    // Cause.find({},(err,docs)=>{
    return res.status(200).render("index");
    // })
});

app.use((err, req , res , next)=>{
    console.log("error caught");
    console.log(err);
    res.status(500).send({
        status:"fail",
        err: err.message,
    });
})
// const port = process.env.PORT || 8080;
app.listen(port , ()=>{
    console.log("server running");
   // console.log("config is", config);
})

