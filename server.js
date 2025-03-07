import express from 'express';
import mongoose, { Types } from 'mongoose';
import ejs from 'ejs';
import 'dotenv/config';
import session from 'express-session';
import passport from 'passport';
import passportLocalMongoose from 'passport-local-mongoose';

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('/public'));
app.use(express.urlencoded({ extended: true}));
app.use(express.json());
app.set('view engine', 'ejs');
// Express session middleware --------- [1]
app.use(session({
    secret: process.env.SECRET_SECRET,
    resave: false,
    saveUninitialized: false
}))
// Passport middleware ---------------- [2]
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log('-----> Database connected');
});

// Database Schema
const userSchema = new mongoose.Schema({
    email: {type: String, required: true }
    // password: {type: String, required: true}
})
// (Hashing and salting password) ---------- [3]
userSchema.plugin(passportLocalMongoose, {usernameField: 'email'});

const User = new mongoose.model('User', userSchema);

// Passport Local Configuration ----------- [4]
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// -------> ROUTES
app.get('/', (req, res) => {
    res.render('home');
})
// REGISTRATION ROUTE
app.route('/register')
    .get((req, res) => {
        res.render('register');
    })
    .post((req, res) => {
        const { email, password} = req.body;
        console.log(`${email} :::: ${password}`)

        User.register(({email: email}), password, function(err, user) {
            if (err) { console.log('-----> Error: ' + err); return res.redirect('/')}
            else {
                passport.authenticate('local')(req, res, () => {
                    res.redirect('/secrets')
                })
            }
        })
    })
    // LOGIN ROUTE
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const { email, password} = req.body;
        const user = new User({
            email: email,
            password: password
        })

        req.login(user, function(err) {
            if (err) { return next(err); }
            return res.redirect('/secrets');
        });
    })
app.get('/secrets', (req, res) => {
    if (req.isAuthenticated()) { res.render('secrets');}
    else {console.log('User not authenticated'); res.redirect('/login')} 
})
app.get('/logout', (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
    });
})
app.get('/error', (req, res) => {
    res.render('error', {message: '404 - The Page cannot be found', page: 'Go To Homepage', pageRoute: '/'})
})

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
})