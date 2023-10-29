import express from 'express';
import session from 'express-session';
import flash from 'express-flash';
import mongoose, { mongo } from 'mongoose';
import bcrypt from 'bcrypt';
import passport from 'passport';
import LocalStrategy from 'passport-local';

const app = express();
const port = process.env.PORT || 3000;
const URI = process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@clustertest.jfiko18.mongodb.net/todolistDB?retryWrites=true&w=majority';

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(flash());

app.use(session({
    secret: 'casual-secret-key-123456',
    resave: false,
    saveUninitialized: false
}));

// Passport.js middlewares for authentication
app.use(passport.initialize());
app.use(passport.session());

// Passport.js local configuration
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
}, async (email, password, done) => {
    try {
        const user = await User.findOne({ email: email });
        // If user not found show error message
        if (!user) {
            return done(null, false, { message: 'User not found.' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        // If password is incorrect show error message
        if (!validPassword) {
            return done(null, false, { message: 'Incorrect password.' });
        }
        return done(null, user);
    } catch (error) {
        return done(error);
    }
}));

// Passport.js user serialization and deserialization (save user id in session)
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        return done(null, user);
    } catch (error) {
        return done(error);
    }
});

// Connect to database
connectDB();

// Database schemas
const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minLength: 6
    }
});

const todoSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
});

// Password hashing
userSchema.pre('save', async function (next) {
    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(this.password, salt);
        this.password = hashedPassword;
        next();
    } catch (error) {
        next(error);
    }
});

const User = mongoose.model('User', userSchema);
const TodoHome = mongoose.model('TodoHome', todoSchema);
const TodoWork = mongoose.model('TodoWork', todoSchema);

// Start page
app.get('/', (req, res) => {
    res.render('index.ejs');
});

// Login page
app.get('/login', (req, res) => {
    res.render('login.ejs');
});

// Register page
app.get('/register', (req, res) => {
    res.render('signup.ejs');
});

// Register a new user
app.post('/register', async (req, res) => {
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password
    });

    try {
        const savedUser = await User.findOne({ email: newUser.email });
        // Check if user already exists
        if (savedUser) {
            req.flash('error', 'User already registered.');
            res.redirect('/register');
        } else {
            await newUser.save();
            // Immediately login user after registration
            req.login(newUser, (err) => {
                if (err) {
                    req.flash('error', err.message);
                    res.redirect('/register');
                }
                return res.redirect('/home');
            });
        }
    } catch (error) {
        req.flash('error', error.message);
        res.redirect('/register');
    }
});

// Login a user
app.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true
}));

// Home page
app.get('/home', async (req, res) => {
    if (req.isAuthenticated()) {
        const userTodos = await TodoHome.find({ userId: req.user._id });
        res.render('home.ejs', { user: req.user, todos: userTodos });
    } else {
        res.redirect('/login');
    }
});

// Work page
app.get('/work', async (req, res) => {
    if (req.isAuthenticated()) {
        const userTodos = await TodoWork.find({ userId: req.user._id });
        res.render('work.ejs', { user: req.user, todos: userTodos });
    } else {
        res.redirect('/login');
    }
});

// Create a new todo - home
app.post('/home/create', async (req, res) => {
    if (req.isAuthenticated()) {
        const newTodo = new TodoHome({
            text: req.body.todo,
            userId: req.user._id
        });
    
        try {
            await newTodo.save();
            res.redirect('/home');
        } catch (error) {
            res.render('error.ejs', { error: error.message });
        }
    } else {
        res.redirect('/login');
    }
});

// Create a new todo - work
app.post('/work/create', async (req, res) => {
    if (req.isAuthenticated()) {
        const newTodo = new TodoWork({
            text: req.body.todo,
            userId: req.user._id
        });
    
        try {
            await newTodo.save();
            res.redirect('/work');
        } catch (error) {
            res.render('error.ejs', { error: error.message });
        }
    } else {
        res.redirect('/login');
    }
});

// Delete a todo - home
app.post('/home/delete', async (req, res) => {
    if (req.isAuthenticated()) {
        const todoDelete = req.body.id;

        try {
            await TodoHome.findByIdAndDelete(todoDelete);
            res.redirect('/home');
        } catch (error) {
            req.flash('error', error.message);
        }
    }
});

// Delete a todo - work
app.post('/work/delete', async (req, res) => {
    if (req.isAuthenticated()) {
        const todoDelete = req.body.id;

        try {
            await TodoWork.findByIdAndDelete(todoDelete);
            res.redirect('/work');
        } catch (error) {
            req.flash('error', error.message);
        }
    }
});

// Delete all todos - home
app.post('/home/deleteAll', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await TodoHome.deleteMany({ userId: req.user._id });
            res.redirect('/home');
        } catch (error) {
            req.flash('error', error.message);
        }
    }
});

// Delete all todos - work
app.post('/work/deleteAll', async (req, res) => {
    if (req.isAuthenticated()) {
        try {
            await TodoWork.deleteMany({ userId: req.user._id });
            res.redirect('/work');
        } catch (error) {
            req.flash('error', error.message);
        }
    }
});

// Logout a user
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.redirect('/');
        }
        res.redirect('/');
    });
});

// Listen to port
app.listen(port, '192.168.1.33', () => {
    console.log(`Example app listening at port: ${port}`);
});

async function connectDB() {
    try {
        await mongoose.connect(URI, { useNewUrlParser: true });
        console.log('Database connected!');
    } catch (error) {
        console.log(error);
    }
}