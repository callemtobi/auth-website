import express from 'express';
import mongoose, { Types } from 'mongoose';
import ejs from 'ejs';
import 'dotenv/config';
import encrypt from 'mongoose-encryption';
import md5 from 'md5';
import bcrypt from 'bcrypt';

const app = express();
const PORT = process.env.PORT || 8000;
const saltRounds = 10;

app.use(express.static('/public'));
app.use(express.urlencoded({ extended: false}));
app.use(express.json());
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

// Mongoose-encryption plugin  --------> Remove for md5
// const secret = process.env.SECRET_SECRET;
// userSchema.plugin(encrypt, {secret: secret, excludeFromEncryption: ['email']});  

const User = new mongoose.model('User', userSchema);

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

        if (!email || !password) {
            return res.render('error', {message: 'All fields are required!', page: 'Try again', pageRoute: '/register'})
        }
        
        // Existing User Check
        User.findOne({email})
        .then((userExists) => {
            if (userExists) {
                console.log('--> User exists.');
                return res.render('error', {message: 'User already exists', page: 'Try again', pageRoute: '/register'})
            } else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    const user = new User ({
                        email: email,
                        password: hash
                    });
                    User.insertOne(user)
                    .then((data) => {console.log('--------> You have been registered!' + data)})
                    .catch((err) => {console.log('--------> Error while registering! ' + err); res.send('You have not been registered! Try again.')})
                    res.redirect('/login')
                })
            }
        })
        .catch(err => {console.log(err); res.redirect('/error')})

    })
    // LOGIN ROUTE
app.route('/login')
    .get((req, res) => {
        res.render('login');
    })
    .post((req, res) => {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.render('error', {message: 'All fields are required!', page: 'Try again', pageRoute: '/login'})
        }
        
        User.findOne({email: email})
        .then((userFind) => {
            if (!userFind) {
                return res.render('error', {message: 'You are not registered.', page: 'Register', pageRoute: '/register'});
            } else if (userFind) {
                bcrypt.compare(password, hash, function(err, hash) {
                    console.log('DB password: ' + userFind.password)
                    console.log('Input password: ' + hash)
    
                    if (userFind.password === hash) {
                        console.log(`Hash + Salt password: ${hash}`)
                        console.log('--------> Successful login!'); 
                        return res.redirect('/secrets');
                    }
                    return res.render('error', {message: 'Invalid password', page: 'Try again', pageRoute: '/login'});
                })
            }
        })
        .catch((err) => {console.log('--------> Error while logging! ' + err); res.redirect('/error')})  
    })
app.get('/secrets', (req, res) => {
    res.render('secrets');
})
app.get('/error', (req, res) => {
    res.render('error', {message: '404 - The Page cannot be found', page: 'Go To Homepage', pageRoute: '/'})
})

app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
})