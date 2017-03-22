var express = require('express');
var app = express();
var port = 8080;


app.use(function(req,res,next){
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

app.use(express.static('public'));
app.listen(port, function(){
	console.log('Server running on '+port);	
});
