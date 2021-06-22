var express = require('express');
var app = express();

// Jade
app.set('views', __dirname+'/views');
app.set('view engine', 'jade');

app.get('/', function(req, res){
		res.render('home', {
			title: "Welcome to APP Home page",
			date: new Date()
		});
});

app.get('/about-us', function(req, res){
  res.render('about-us', {
    title: "Welcome to APP About us page",
    date: new Date()
  });
});

app.listen(3000,()=>{
  console.log('Server is running on port 3000');
});
