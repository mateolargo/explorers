var http = require('http'),
    url = require('url'),
    fs = require('fs'),
    io = require('socket.io');

var handlers = {
    handlers:{},
    add:function(path,handler){this.handlers[path]=handler;},
    get:function(path){return this.handlers[path]}
};

handlers.add('/', function(req, res) {
    fs.readFile("static/index.html", function(err, data) {
	res.writeHead(200, {'Content-Type': 'text/html'});
	res.end(data.toString());
    });
});

var server = http.createServer(function(req, res){ 
    var path = url.parse(req.url).pathname;
    
    if (path.indexOf('/static') == 0) {
	fs.readFile(path.substr(1), function(err, data) {
	    if (err) {
		res.writeHead(404, {});
		res.end();
	    } else {
		res.writeHead(200, {});
		res.end(data.toString());
	    }
	});
	return;
    }

    var handler = handlers.get(path);
    console.log(path, handler);
    if (handler) {
	handler(req, res);
    } else {
        res.writeHead(404, {});
	res.end();
    }
});
server.listen(8000);

var sHandlers = {
    commands: {},
    add: function(command,handler){this.commands[command]=handler;},
    get: function(command){return this.commands[command];}
};

sHandlers.add('get-game-state', function(data) {
	return {players:[{name:'Matt'},{name:'Tom'}]};
});

var socket = io.listen(server);
socket.on('connection', function(client){ 
    client.on('message', function(data){
	data = JSON.parse(data);
	var command = data.comm;
	var handler = sHandlers.get(command);

	var status = 0, result = null;
	if (handler) {
	    result = handler(data);
	} else {
	    status = 1;
	}

	client.send(JSON.stringify({id:data.id,status:status,result:result}));
    });
    client.on('disconnect', function(){});
});