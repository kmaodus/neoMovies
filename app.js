var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
const neo4j = require('neo4j-driver');

var app = express();

//View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname, 'public')));

var driver = neo4j.driver('bolt://localhost:7687', neo4j.auth.basic('neo4j', '12345'));
var session = driver.session();

app.get('/', function(req, res){
    session
            .run('MATCH(n:Movie) RETURN n ')
            .then(function(result){
               var movieArray = [];
                result.records.forEach(function(record){
                    movieArray.push({
                        id: record._fields[0].identity.low,
                        title: record._fields[0].properties.title,
                        year: record._fields[0].properties.year
                    });
                });

                session
                    .run('MATCH(n:Person) RETURN n')
                    .then(function(result2){
                        var actorArr = [];
                        result2.records.forEach(function(record){
                            actorArr.push({
                                id: record._fields[0].identity.low,
                                name: record._fields[0].properties.name
                            });
                        });
                        res.render('index', {
                            movies: movieArray,
                            actors: actorArr
                        });
                    })
                    .catch(function(err){
                        console.log(err);
                    });
           })
           .catch(function(err){
               console.log(err);
           });
    });
        
app.post('/movie/add', function(req, res){
    var title = req.body.title;
    var year = req.body.year;

    session
        .run('CREATE(n:Movie {title: $titleParam, year: $yearParam }) RETURN n.title', {titleParam:title, yearParam:year})
        .then(function(result){
            res.redirect('/');

            session.close();
        })
        .catch(function(err){
            console.log(err);
        });

    // console.log(title);
    res.redirect('/');
});


app.post('/person/add', function(req, res){
    var name = req.body.name;

    session
        .run('CREATE(n:Person {name: $nameParam}) RETURN n.name', {nameParam:name})
        .then(function(result){
            res.redirect('/');

            session.close();
        })
        .catch(function(err){
            console.log(err);
        });

    // console.log(title);
    res.redirect('/');
});


app.post('/movie/person/add', function(req, res){
    var title = req.body.title;
    var name = req.body.name;

    session
        .run('MATCH(a:Person {name: $nameParam}), (b:Movie {title: $titleParam}) MERGE(a)-[r:ACTED_IN]-(b) RETURN a,b', {nameParam:name, titleParam:title})
        .then(function(result){
            res.redirect('/');

            session.close();
        })
        .catch(function(err){
            console.log(err);
        });

    // console.log(title);
    res.redirect('/');
});


app.listen(3000);
console.log('Server started on port 3000');
        
module.exports = app;
//res.send('It works');