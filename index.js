import express from 'express';

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
});