//普通的写法
window.onload = function(){
	//初始化程序
	init();
	
	//发送与获得消息
	fnsend();
	fnget();
	
	//用户选择发送图片
    fnsendImage();
    
    //表情
    fnExpression();
    
}

function init(){
	var that = this;
	//建立到服务器的socket连接
    socket = io.connect();
    //监听socket的connect事件，此事件表示连接已经建立
    socket.on('connect', function() {
        //连接到服务器后，显示昵称输入框
        document.getElementById('info').textContent = 'get yourself a nickname :)';
        document.getElementById('nickWrapper').style.display = 'block';
        document.getElementById('nicknameInput').focus();
    });
    
    //键盘行为
    Code_message();
    
    //设置昵称
    document.getElementById('loginBtn').addEventListener('click',function(){
    	var nickName = document.getElementById('nicknameInput').value;
    	//检查此时昵称的情况，是否为空
    	if(!nickName){
    		//为空，让输入框为焦点状态，提醒用户输入
    		document.getElementById('nicknameInput').focus();
    	}else{
    		//不为空，通过socket.emit发起一个事件到服务端,数据为昵称
    		socket.emit('login',nickName);
    	}
    },false);
    
    //昵称已存在
    socket.on('nickExisted',function(){
    	document.getElementById('info').textContent  = '你所输入的昵称已被占用，请重新输入';
    });
    
    //昵称可以使用，登陆成功
    socket.on('loginSuccess',function(){
    	document.title = 'hichat |'+document.getElementById('nicknameInput').value;
    	//移除遮罩
    	document.getElementById('loginWrapper').style.display='none';
    	//让下方聊天输入框获得焦点
    	document.getElementById('messageInput').focus();
    });
    
    //系统事件
    socket.on('system',function(nickName,userCount,type){
    	//参数分别为名字，用户人数，登陆还是退出
    	//判断类型，并且显示出来
    	var msg = ( type == 'login'?'欢迎 '+nickName+' 进入聊天室':nickName+' 退出了聊天室');
    	
    	//指定系统消息为红色，区别于普通消息
    	get_sendMessage('system',msg,'red');
    	
    	//将在线人数显示到界面的顶部
    	document.getElementById('status').textContent  = userCount +(userCount>1?' 人':' 人')+' 在线';
    });
    
    //添加所有表情
    fnAddExpress();
    

};

//消息
function get_sendMessage(user,msg,color){
	
	var container = document.getElementById('historyMsg');
	var msgToDisplay = document.createElement('p');
	//时间，转变为字符串 并且只截取前8位
	var data = new Date().toTimeString().substr(0,8);
	
	//处理带表情的消息
	msg = showEmojiImg(msg);
	
	//没有指定颜色，就默认黑色
	msgToDisplay.style.color = color || '#000';
	//形式
	if(user=='system'){
		msgToDisplay.innerHTML = user + '<span class="timespan">(' +data+ '):</span>'+msg;
	}else{
		msgToDisplay.innerHTML = user + '<span class="timespan">(' +data+ '):</span>'+'<br>'+msg;
	}
	
	container.appendChild(msgToDisplay);
	container.scrollTop = container.scrollHeight;

}

//图片
function get_sendImage(user,imgData,color){
	var container = document.getElementById('historyMsg');
	var msgToDisplay = document.createElement('p');
	//改变颜色
	msgToDisplay.style.color = color || '#000';
	//时间，转变为字符串 并且只截取前8位
	var data = new Date().toTimeString().substr(0,8);
	msgToDisplay.innerHTML = user + '<span class="timespan">(' + data + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
	container.appendChild(msgToDisplay);
	container.scrollTop = container.scrollHeight;
}

//表情
function fnExpression(){
	var emojiContainer = document.getElementById("emojiWrapper");
	//创建一个虚拟节点
	var docFragment = document.createDocumentFragment();
	//循环添加数据
	for(var i=40;i>0;i--){
		var emojiItem = document.createElement('img');
		emojiItem.src='../content/emoji/' + i + '.gif';
		emojiItem.title = i;
		//把图片添加到虚拟列表中
		docFragment.appendChild(emojiItem);
	}
	emojiContainer.appendChild(docFragment);
}


//用户发送消息
function fnsend(){
	document.getElementById('sendBtn').addEventListener('click',function(){
		var messageInput = document.getElementById('messageInput');
		var msg = messageInput.value;
		
		//获取颜色值
		var color = document.getElementById('colorStyle').value;
		//清空输入框
		messageInput.value = '';
		//聚焦
		messageInput.focus();
		//判断是否输入了消息
		if( msg.trim().length!=0){
			//发送消息到服务端
			socket.emit('postMsg',msg,color);
			//把消息显示到自己的窗口中
			get_sendMessage('me',msg,color);
		}
	});
}

//其他用户接收消息
function fnget(){
	socket.on('newMsg',function(user,msg,color){
		get_sendMessage(user,msg,color);
	});
}

//用户选择发送图片
function fnsendImage(){
	var oSendImage = document.getElementById('sendImage')
	
	
	oSendImage.addEventListener('change',function(){
		
		//获取颜色值
		var color = document.getElementById('colorStyle').value;
		
		alert(color);
		
		//检查是否选择了图片，没有则不作处理
		if(oSendImage.files.length!=0 ){
//			alert(1);
			//获取文件并用FileReader进行读取
			var file = oSendImage.files[0];
			//用来读取文件数据
			var reader = new FileReader();
			
			if(!reader){
				get_sendMessage('system','!你的浏览器不支持','red');
				this.value='';
				return false;
			}
			//读取成功
			reader.onload=function(e){
				//清空当前值
				this.value = '';
				//发送到服务器
				socket.emit('img',e.target.result,color);
				//显示在本机上
				get_sendImage('me',e.target.result,color);
			}
			
			reader.readAsDataURL(file);
			
		};
	},false);
	
	//接收显示图片
	socket.on('newImg',function(user,img,color){
		get_sendImage(user,img,color);
	});
};

//用户选择添加表情
function fnAddExpress(){
	document.getElementById('emoji').addEventListener('click',function(e){
		document.getElementById('emojiWrapper').style.display = 'block';
		//阻止冒泡
		e.stopPropagation();
	});
	
	document.body.addEventListener('click',function(e){
		var emojiwrapper = document.getElementById("emojiWrapper");
		//看当前点击元素是否是表情按钮，不是的话，执行下面事件
		if(e.target != emojiwrapper){
			emojiwrapper.style.display = 'none';
		}
		
	});
	
	document.getElementById('emojiWrapper').addEventListener('click',function(e){
		//获取被点击的表情
		var targetExp = e.target;
		//查看是否是图片类型
		if( targetExp.nodeName.toLowerCase()=='img' ){
			var messageInput = document.getElementById('messageInput');
			messageInput.focus();
			messageInput.value = messageInput.value + '[emoji:'+targetExp.title+']';
		}
	},false);
	
}

//将用户发送消息中的表情符号变化成真正的表情
function showEmojiImg(msg){
	var match;
	var result = msg;
	var reg = /\[emoji:\d+\]/g;
	var emojiIndex;
	var totalEmojiNum = document.getElementById('emojiWrapper').children.length;
	//当匹配正则，也就是消息中有符号的时候
	while( match = reg.exec(msg) ){
		emojiIndex = match[0].slice(7,-1);
		if(emojiIndex > totalEmojiNum){
			result = result.replace(match[0],'[X]');
		}else{
			result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');
		}
	};
	
	return result;
}


//实现按键盘enter键发送消息和创建用户名
function Code_message(){
	document.getElementById('nicknameInput').addEventListener('keyup',function(ev){
		var ev = ev || window.event;
		if(ev.keyCode==13){
			var nickName = document.getElementById('nicknameInput').value;
	    	//检查此时昵称的情况，是否为空
	    	if(!nickName){
	    		//为空，让输入框为焦点状态，提醒用户输入
	    		document.getElementById('nicknameInput').focus();
	    	}else{
	    		//不为空，通过socket.emit发起一个事件到服务端,数据为昵称
	    		socket.emit('login',nickName);
	    	}
		}
	},false);
	
	document.getElementById('messageInput').addEventListener('keyup',function(ev){
		var ev = ev || window.event;
		var messageInput = document.getElementById('messageInput');
		var msg = messageInput.value;
		//获取颜色值
		var color = document.getElementById('colorStyle').value;

		//判断是否输入了消息
		if( ev.keyCode==13 && msg.trim().length!=0 ){
			//清空输入框
			messageInput.value = '';
			//发送消息到服务端
			socket.emit('postMsg',msg,color);
			//把消息显示到自己的窗口中
			get_sendMessage('me',msg,color);
		}
		
	},false);
	
}
