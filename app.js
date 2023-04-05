const express=require('express');
const app=express();
const session=require('express-session');
const flash=require('connect-flash')
const ejsmate=require('ejs-mate');
const path = require("path");
const wrapAsync=require('./Utilities/wrapAsync');
const User=require('./models/users');
const passport=require('passport');
const passportLocal=require('passport-local')
//session flash
const sessionConfig ={
    secret:'thisisasecret',
    resave:false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        expires:Date.now()+1000*60*60*24*7, //date.mow returns date in mili second and we r setting the expired date after 1 week from the day of creation
        maxAge:1000*60*60*24*7
    }
}
app.use(session(sessionConfig));
app.use(flash()); 
//Authentication
app.use(passport.initialize());//Initialize passport
app.use(passport.session());//Save Passport
passport.use(new passportLocal(User.authenticate()));//Adding Strategy
passport.serializeUser(User.serializeUser());//To store user in Session
passport.deserializeUser(User.deserializeUser());//To take out user from session
app.use((req,res,next)=>{
    res.locals.success=req.flash('success');
    res.locals.error=req.flash('error');
    next(); 
})
//Creating database
const mongoose=require('mongoose');
mongoose.connect('mongodb://127.0.0.1:27017/mini-project')
    .then(()=>{
        console.log("Database Connected")
    }).catch((e)=>{
        console.log("oops error")
    });
    // const userModel = new mongoose.Schema({
    //     name: {
    //         type: String,
    //         required: true
    //     },
    //     email:{
    //         type: String,
    //         unique: true,
    //         required: true
    //     },
    //     password:{
    //         type: String,
    //         required: true,
    //         minLength: 8
    //     },
    //     dp:{
    //         type:String
    //     }
    // });
    // const User= mongoose.model('User',userModel);
app.engine('ejs',ejsmate)//style sheet k liye(LAYOUT WALA)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(__dirname + '/public'));//to access public folder
app.use(express.urlencoded({extended:true}))//for reading form data;

//routes
app.get('/',(req,res)=>{
    res.render('home.ejs', {messages:req.flash('success')})
});
app.get('/signup',(req,res)=>{
    res.render("signup.ejs")
});
app.get('/login',(req,res)=>{
    res.render("login.ejs");
});

app.post('/signup',wrapAsync (async(req, res)=>{
    try{
        const {username,email,password}=req.body;
        const domain="@smit.smu.edu.in";
        if(email.search(domain)!=-1){

    const user = new User({email,username});
    const registeredUser=await User.register(user,password);
    req.login(registeredUser,(err)=>{
        if(err)
            return next(err);
        else
        {
            req.flash('success','Welcome to helping hand');
            res.redirect('/profile');
        }
    }
)}
else
{
    req.flash('error',"Not a Smit domain email");
    res.redirect('/signup');
}

}catch(e)
{
    req.flash('error',e.message);
    res.redirect('/signup');
}
}));
app.post('/login',passport.authenticate('local',{failureFlash:true,failureRedirect:'/login'}),wrapAsync(async(req, res)=>{
//     const {name, password} = req.body;
//     const user =await  User.findOne({name});
//    console.log(user);
//    if(user!=null && user.password===password){
//         req.flash('success','Login Successful');
//         res.redirect('/');
//    } 
//    else
//    {
//     req.flash('error','Invalid password or username');
//     res.redirect('/login');
//    }
req.flash('success','Welcome Back!');
const goto=req.session.returnTo || '/profile'
res.redirect(goto);
}))
//Route to show all the users
app.get('/users',wrapAsync(async(req,res)=>{
    const users = await User.find({});
    res.render('allusers.ejs', {users});
}))
app.get('/:id',async(req, res)=>{
    const user = User.findOne({_id: req.params.id});
    const users = await User.find({});
    res.render('profile.ejs', {users});
})
//Sending dynamic error status and message
app.use((err,req,res,next)=>{
    const{status=500}=err;
    if(!err.message)
    err.message="Uff error"
    res.status(status).render("error.ejs",{err});
});

app.listen(8080,(req,res)=>{
    console.log("At port 8080")
});
