//构建http模块
var http = require('http');
var server = http.createServer(function(req,res){
	//响应头信息
	res.writeHead(200,{
		'Content-Type' : 'text/html'
	});
	//响应文本
	res.write('<h1>今天日子真好啊</h1>');
	//响应结束，与服务器断开连接
	res.end();
});

//server.listen(4000,function(){
//	console.log("哈哈，请求成功了");
//});

//用express请求页面
//构建express模块
var express = require('express');
//创建一个app实例
var app = express();
//把http服务和app实例连接起来
var server = require('http').createServer(app);
//引入socket.io模块,并与server建立联系
var io = require('socket.io').listen(server);
//保存所有的用户昵称
var users = [];
//指定请求某一位置的html文件
app.use('/', express.static(__dirname + '/www'));
//监听80端口
server.listen(8080);



//socket接收消息
io.on('connection',function(socket){
	//接收并处理客户端发送的login事件
	socket.on('login',function(nickName){
		if(users.indexOf(nickName)>-1){
			//存在，发送事件到客户端（表示，昵称已占用）
			socket.emit('nickExisted');
		}else{
			//不存在
			//把该昵称的索引和本身都挂载到socket的属性上去
			socket.userIndex = users.length;
			socket.nickName = nickName;
			//将昵称保存进数组中
			users.push(nickName);
			//并且发送一个登陆成功的事件
			socket.emit('loginSuccess');
			//向所有连接到服务器的客户端发送当前登陆用户的昵称(事件)
			io.sockets.emit('system',nickName,users.length,'login');
		};
	});
	
	//用户断开连接事件
	socket.on('disconnect',function(){
		//将此用户从用户列表中删除(按索引删除)
		users.splice(socket.userIndex,1);
		//通知除自己以外所有的用户
		socket.broadcast.emit('system',socket.nickName,users.length,'logout');
	});
	
	
	//接收用户发送的消息
	socket.on('postMsg',function(msg,color){
		//将消息同步给除自己以外的其他用户(需要一个名字，还有消息)
		socket.broadcast.emit('newMsg',socket.nickName,msg,color);
	});
	
	//接收用户发来的图片
	socket.on('img',function(imgData,color){
		//通过一个newImg事件分发到除自己外的每个用户
    	socket.broadcast.emit('newImg', socket.nickName,imgData,color);
	});
	
});

