import express from 'express';
import session from 'express-session';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session middleware
// DISCLAIMER: Questo NON è assolutamente un modo sicuro per salvare le sessioni utente in produzione.
// L'ho utilizzato solamente per scopo didattico.
// Al posto di questo, si dovrebbe utilizzare un database per salvare le sessioni utente.
// Alla fine di questo file (tra commenti) è possibile visualizzare una versione di questo codice senza sessioni.
app.use(
    session({
      secret: 'SecretKey123',
      resave: false,
      saveUninitialized: true,
    })
);

app.get('/', (req, res) => {
    if (!req.session.todosPrinc) {
        req.session.todosPrinc = [];
    }
    res.render('index.ejs', { todosPrinc: req.session.todosPrinc });
});

app.get('/work', (req, res) => {
    if (!req.session.todosWork) {
        req.session.todosWork = [];
    }
    res.render('work.ejs', { todosWork: req.session.todosWork });
});

app.post('/create', (req, res) => {
    const todoPrinc = req.body.todoPrinc;
    if (!req.session.todosPrinc) {
        req.session.todosPrinc = [];
    }
    req.session.todosPrinc.push(todoPrinc);
    res.redirect('/');
});

app.post('/work/create', (req, res) => {
    const todoWork = req.body.todoWork;
    if (!req.session.todosWork) {
        req.session.todosWork = [];
    }
    req.session.todosWork.push(todoWork);
    res.redirect('/work');
});

app.get('/delete-all', (req, res) => {
    req.session.todosPrinc = [];
    res.redirect('/');
});

app.get('/work/delete-all', (req, res) => {
    req.session.todosWork = [];
    res.redirect('/work');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});


// --------------------------------------------------------------------------------------------------------------------

/* import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let todosPrinc = [];
let todosWork = [];

app.get('/', (req, res) => {
    res.render('index.ejs', { todosPrinc: todosPrinc });
});

app.get('/work', (req, res) => {
    res.render('work.ejs', { todosWork: todosWork });
});

app.post('/create', (req, res) => {
    todosPrinc.push(req.body.todoPrinc);
    res.redirect('/');
});

app.post('/work/create', (req, res) => {
    todosWork.push(req.body.todoWork);
    res.redirect('/work');
});

app.get('/delete-all', (req, res) => {
    todosPrinc = [];
    res.redirect('/');
});

app.get('/work/delete-all', (req, res) => {
    todosWork = [];
    res.redirect('/work');
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
}); */