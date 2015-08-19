var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var flash = require('connect-flash');
var validator = require('validator');

var monk = require('monk');
var db = monk('localhost:27017/bravito');


var routes = require('./routes/index');
var users = require('./routes/users');
var ads = require('./routes/ads');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(flash());


app.use(function(req, res, next) {
    req.session.locale = (req.session.locale == undefined) ? 'ru' : req.session.locale;
    var locale = req.session.locale
    var i18n = function(word) {
        var t = {

            ru: {
                search: 'Поиск',
                newad: 'cоздать объявление',
                findad: 'Найти объявление',
                login: 'Войти',
                pass: 'Пароль',
                signup: 'Регистрация',
                need: 'Нужен аккаунт?',
                have: 'Есть аккаунт?',
                emailErr: 'Не верный email',
                passErr: 'Для пароля нужно не меньше 8 символов',
                name:'Имя',
                tel:'Телефон',
                category:'Категория',
                title: 'Название',
                description: 'Описание',
                price: 'Цена',
                photo: 'Фото',
                save: 'Сохранить',
                categoryErr: 'Вы не выбрали категорию',
                titleErr: 'Вы не ввели название',
                captchaErr: 'Вы не ввели код',
                del: 'удалить',
                Del: 'Удалить',
                edit: 'Изменить',
                changePass: 'Поменять пароль',
                newPass: 'новый пароль',
                againPass: 'новый пароль еще раз',
                logout: 'Выйти',
                noCaptcha: 'Не верный код',
                noCategory: 'Такой категории не существует',
                noAds: 'Ничего не найдено',
                notLogin: 'Пожалуйста, авторизуйтесь',
                check: 'Проверьте ваш электронный ящик',
                exist: 'Этот email уже зарегистрирован',
                wrong: 'Не верный пароль или email',
                advert: 'Здесь могла бы быть ваша реклама',
                select: 'выберите категорию',
                inactiveUserAccount: 'Необходимо активировать аккаунт', //  When user tries to log in with inactive email
                userPasswordsNotIdentical: 'Пароли отличаются', // When user tries to change password in profile
                forgot: 'Забыли пароль?',
                recovery: 'Восстановление пароля',
                enterEmail: 'Пожалуйста, введите email, который вы использовали для входа на сайт',
                next: 'Далее'
                },

            en: {
                search: 'Search',
                newad: 'new ad',
                findad: 'Find ad',
                login: 'Log in',
                pass: 'Password',
                signup: 'Sign up',
                need: 'Need an account?',
                have: 'Have an account?',
                emailErr: 'Email is incorrect',
                passErr: 'Password has to be minimum 8 characters',
                name:'Name',
                tel:'Telephone',
                category:'Category',
                title: 'Title',
                description: 'Description',
                price: 'Price',
                photo: 'Photos',
                save: 'Save',
                categoryErr: 'You didn\'t select category',
                titleErr: 'You didn\'t enter title',
                captchaErr: 'You didn\'t enter code',
                del: 'delete',
                Del: 'Delete',
                edit: 'Edit',
                changePass: 'Change password',
                newPass: 'new password',
                againPass: 'new password again',
                logout: 'Log out',
                noCaptcha: 'Code is incorrect',
                noCategory: 'There is no such category',
                noAds: 'Nothing was founded',
                notLogin: 'Please log in',
                check: 'Check your email',
                exist: 'That email is already taken',
                wrong: 'Email or password is wrong',
                advert: 'There would be your advertisement',
                select: 'select category',
                inactiveUserAccount: 'Your account not activated yet',
                userPasswordsNotIdentical: 'Passwords are not identical',
                forgot: 'Forgot password?',
                recovery: 'Password recovery',
                enterEmail: 'Please enter the email that you used to log on to the site',
                next: 'Next'
                }
        };

      return t[locale][word];

    };
    req.app.locals.i18n = i18n;
    next()
});



app.use(function(req, res, next) {
  db.get('categories').find({}, function(err, categories) {
    res.locals.categories = categories;
    next();
  });
});

app.use(function(req, res, next){
  res.locals.session = req.session;
  next();
});

app.use(function(req,res,next){
  req.db = db;
  next();
});

app.use('/', routes);
app.use('/users', users);
app.use('/ads', ads);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;

