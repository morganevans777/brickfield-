//App requirments

var express = require('express');
var app = express();
var database = require('./firebase.js')
var bodyParser = require('body-parser')
var session = require('express-session')
var multer = require('multer')
var fs = require('file-system');


var path = require("path");


var handlebars = require('express3-handlebars')
.create({defaultLayout: 'main'});

app.use(session({
    secret: 'keyboar cat',
    resave: false,
    saveUninitialized: true,
}))

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json 
app.use(bodyParser.json())


app.use(function(req, res, next){
    var path = req.path.split('/')[1];
    if(!req.session.user){
        if(path == 'settings'){
            res.redirect('/login');
        } else if(path == 'add'){
            res.redirect('/login');
        } else if (path == 'edit'){
            res.redirect('/login');
        } else if(path == 'remove'){
            res.redirect('/login');
        }
    }
    next();
})

app.get('/', function(req, res) {
    database.fetchData('all',function(data) {
        var values = {events: [], blog: [], user: req.session.user}
        data.forEach(function(item){
            if(item.category === 'events'){
                values.events.push(item);
            } else if(item.category === 'blog'){
                values.blog.push(item);
            }
        })
        res.render('home', values);
    });
}); 

app.get('/disclaimer', function(req, res) {
    res.render('disclaimer')
})

app.get('/about', function(req, res) {
    res.render('about', {user: req.session.user})
});

app.get('/login', function(req, res) {
        res.render('login');       
})

app.get('/logOut', function(req, res) {
    database.logOut(function(response, error){
        if(error === undefined){
            delete req.session.user; 
            res.redirect('/')
        } else {
            console.log(error)
        }
    })  
})

app.post('/login', function(req, res) {
    database.login(req.body.email, req.body.password, function(response, error){
        if(response !== undefined){
            req.session.user = response;
            res.redirect('/settings')
        } else if(error !== undefined) {
            console.log('error')
            res.redirect('/login')
        }
    })
})

app.get('/settings', function(req, res) {
    database.fetchData('all',function(data) {
        var values = {events: [], blog: [], user: req.session.user}
        data.forEach(function(item){
            if(item.category === 'events'){
                values.events.push(item);
            } else if(item.category === 'blog'){
                values.blog.push(item);
            }
        })
        res.render('settings', values);
    });
})

//added code for location category here

app.get('/edit/:category/:id', function(req, res) {
    database.fetchDataById(req.params.category, req.params.id, function(data){
        res.render('edit', {description: data.description, location: data.location, title: data.title , category: req.params.category, id: req.params.id, user: req.session.user})
    })
})

app.post('/edit/:category/:id', function(req, res){
    var data = {title: req.body.title, description: req.body.description, location: req.body.location};
    database.update(req.params.category, req.params.id,data );
    res.redirect('/settings')
})

//location code

app.get('/add/:category', function(req, res){
    switch(req.params.category){
        case 'events':
         res.render('add-events', {category: req.params.category, user: req.session.user});
        break;
        case 'blog':
         res.render('add-blog',{category: req.params.category, user: req.session.user});
        break;
    }
}) 

app.post('/add/:category',multer({ dest: './public/uploads/'}).single('img'), function(req, res){
    var data = req.body;
  
    if (req.file) {
        var path = (req.file.path).replace("public/", '');
        data.img = path;
    } 

    database.writeData(req.params.category, data, function(response, error){
        if(error === undefined){
            console.log(data.img, 'image')
            res.redirect('/settings');
        } else {
            console.log(error)
        }
    });
})

//Node.js .unlink function

// fs.unlink("./uploads/"+req.file.id, (err) => {
//     if (err) {
//         console.log("failed to delete local image:"+err);
//     } else {
//         console.log('successfully deleted local image');                                
//     }
// });

app.get('/remove/:category/:id', function(req, res) {
    database.remove(req.params.category, req.params.id, function(error) {
        if (error = undefined) {
            res.redirect('/settings')
        } else {
            console.log(error)
        }
    })
    res.redirect('/settings')
})

app.get('/rates', function(req, res) {
        res.render('rates', {user: req.session.user});

})

app.get('/view/:category/:id', function(req, res){

    var category = req.params.category;
    if(category === 'events'){
        category = category.substring(0, category.length - 1);        
    }
    var template = category;
    database.fetchDataById(req.params.category, req.params.id, function(data){
        console.log(data)
        res.render(template, {description: data.description, location: data.location, title: data.title , category: req.params.category, id: req.params.id, user: req.session.user, img: data.img})
    })
})

app.get('/workspaces', function(req, res) {
        res.render('workspaces', { user: req.session.user});
})

app.get('/facilities', function(req, res) {
    res.render('facilities', {user: req.session.user});
})

app.listen(3000);