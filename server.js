const express = require('express');
const morgan = require('morgan');
const path = require('path');
const index = require('./routes/index');

const app = express();

app.use(morgan('dev'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.get('/', index);

app.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`hello-kube running on port ${port}.`));