import express from 'express';
import mongoose, { Types } from 'mongoose';
import ejs from 'ejs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.static('/public'));
app.use(express.urlencoded({ extended: false}));
app.set('view engine', 'ejs');

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI);

mongoose.connection.on('error', console.error.bind(console, 'connection error:'));
mongoose.connection.once('open', () => {
    console.log('-----> Database connected');
});

// Database Schema
const userSchema = new mongoose.Schema({
    email: {type: String, required: true },
    password: {type: String, required: true}
})
const User = new mongoose.model('User', userSchema);

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

        if (!email || !password) {
            return res.render('error', {message: 'All fields are required!'})
        }
        
        // Existing User Check
        User.findOne({email})
        .then((userExists) => {
            if (userExists) {
                console.log('--> User exists.');
                return res.render('error', {message: 'User already exists'})
            } else {
                const user = new User ({email, password});
                // user.save();
        
                User.insertOne(user)
                .then((data) => {console.log('--------> You have been registered!' + data)})
                .catch((err) => {console.log('--------> Error while registering! ' + err); res.send('You have not been registered! Try again.')})
                res.redirect('/login')
            }

        })
        .catch(err => {console.log(err); res.render('error', {message: 'An error has occurred while registering!'})})

    })
    // LOGIN ROUTE
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('error', {message: 'All fields are required!'})
        }
        
        const user = new User ({ email, password });
        console.log(user)
        
        User.findOne({ email: email})
        .then((userFind) => {
            if (!userFind) {
                return res.render('error', {message: 'You are not registered! Kindly register.'});
            } else if (userFind) {
                if (userFind.password === password) {
                    console.log('--------> Successful login!'); 
                    return res.redirect('/secrets');
                }
                return res.render('error', {message: 'Invalid email or password'});
            }
        })
        .catch((err) => {console.log('--------> Error while logging! ' + err); res.redirect('/error')})  
    })
app.get('/secrets', (req, res) => {
    res.render('secrets');
})
app.get('/error', (req, res) => {
    res.render('error', {message: '404 - The Page cannot be found'})
})

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
})