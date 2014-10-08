function fPreloadImages(){
	var img , obj = arguments.callee;
	if(!obj.arr){
		obj.arr = [];
	}
	$A(arguments).each(
		function(s){
			img = new Image();
			img.src = s;
			obj.arr.push(img);
		}
	);
}

function fAjaxRequest(oData , fCall){
	new Ajax.Request(
		gBase + "script/room.asp",
		{
			postBody: oData.toJSONString(),
			onComplete: function(oReq){
				try{
					if(fCall){
						fCall(oReq.responseText.parseJSON());
					}
				}catch(e){}
			}
		}
	);
}

function fAjaxPoll(){
	var oRequest = {type:gChess.type};
	switch(oRequest.type){
		case "go":
			// getFight后会改变type状态至next
			oRequest.info = gChess.getFight();
			// 结束
			if(gChess.flag == 2){
				oRequest.end = true;
			}
		case "next":
		case "look":
			oRequest.team = gChess.team;
		case "wait":
			gAjax = new Ajax.Request(
				gBase + "script/action.asp",
				{
					postBody : oRequest.toJSONString(),
					onComplete : fAjaxResponse
				}
			);
		default:
			break;
	}
}

function fAjaxResponse(oReq){
	var oResponse;
	try{
		oResponse = oReq.responseText.parseJSON();
		switch(oResponse.type){
			case "start":
				gChess.startFight();
				break;
			case "quit":
				gChess.loseFight();
				break;
			case "end":
				gChess.endFight();
				break;
			case "go":
				gChess.toPieces.apply(gChess , oResponse.info);
				if(gChess.flag == 2){
					gChess.endFight();
				}
				break;
			default:
				break;
		}
	}catch(e){}
}

function fOpenChess(sType , sName){
	// 编码
	sName = encodeURIComponent(sName);
	var aFeature = [
		"location=0",
		"menubar=0",
		"resizable=0",
		"scrollbars=0",
		"status=0",
		"titlebar=0",
		"toolbar=0",
		"modal=1",
		"width=448",
		"height=498",
		"left="+(screen.availWidth-448-10)/2,
		"top="+(screen.availHeight-498-58)/2
	];
	if(!gChess){
		try{
			gChess = window.open(gBase+"Default.htm" , "chess"+(new Date()).valueOf() , aFeature.join(","));
		}catch(e){}
		if(gChess){
			var f = function(){
				try{
					gChess.focus();
				}catch(e){}
			};
			f();
			if(!document.all){
				// Event.observe(window, 'focus', f);
			}
			window.gInfo = {type:sType , name:sName};
		}else{
			fAlert("请调整浏览器安全设置以便可以弹出新窗口！");
		}
	}
}

function fAlert(sInfo){
	sInfo = sInfo || "";
	$("objInfo").innerHTML = sInfo;
	return false;
}

function fContentLoad(){
	var s = '\
		<table><tr><td><div class="Main">\
			<select size="8" id="selList"></select>\
			<input type="text" id="objRoom" maxlength="8" name="test">\
			<button id="btnNew">开局</button>\
			<i id="objInfo"></i>\
			<b>在线人数：<span id="objCount">&nbsp;</span></b>\
		<div></td></tr></table>\
	';
	document.body.innerHTML = s;
	Event.observe(
		$("btnNew") , 'click', 
		(function(){
			var sName = this.value.trim();
			this.value = "";
			if(sName){
				if(sName == "list" || sName == "count"){
					return fAlert("战局名不能为关键字！");
				}
				if(!$A($("selList").options).all(function(o){return o.value != sName})){
					return fAlert("该战局已在对战列表中！");
				}
				fOpenChess("new" , sName);
			}else{
				fAlert("战局名不能为空！");
			}
		}).bind($("objRoom"))
	);
	Event.observe(
		$("selList") , 'dblclick',
		function(){
			if(this.value){
				fOpenChess("join" , this.value);
			}
		}.bind($("selList"))
	);
	fContentPoll();
}

function fContentPoll(){
	fAjaxRequest(
		{type:"list"} , 
		function(oResponse){
			if(oResponse.code){
				$("objCount").innerHTML = oResponse.count;
				$("selList").options.length = 0;
				$H(oResponse.list).each(
					function(pair){
						var o = new Option(pair.key , pair.key);
						o.className = pair.value;
						this.options.add(o);
					}.bind($("selList"))
				);
			}
			setTimeout("fContentPoll()" , 1000);
		}
	);
}

function fContentInit(){
	var f = function(){
		try{
			gMain.gChess = null;
			gMain.fAjaxRequest({type:"quit"});
			gMain.fAlert();
		}catch(e){}
	};
	var r = function(e){
		if(e.keyCode){
			try{
				e.keyCode = 0;
			}catch(e){}
		}
		Event.stop(e);
		return false;
	};
	var u = function(e){
		try{
			var s = gChess.getStatus();
			if(s){
				e.returnValue = s;
			}
		}catch(e){}
	};
	// 屏蔽右键
	Event.observe(document, 'contextmenu', r);
	// 屏蔽拖动
	Event.observe(document, 'selectstart', r);
	if(window.name){
		// 注销
		if(document.all){
			Event.observe(window, 'unload', f);
		}else{
			window.onunload = f;
		}
		// 提醒
		Event.observe(window, 'beforeunload', u);
		// 屏蔽键盘
		Event.observe(document, 'keydown', r);
		gMain = window.opener;
		fAjaxRequest(gMain.gInfo ,
			function(oResponse){
				var sInfo = "";
				if(oResponse.code){
					gChess = new Chess(document.body.appendChild(document.createElement("div")) , oResponse.team);
					switch(oResponse.team){
						case 0:
						case 1:
							sInfo = "战局对战中...";
							break;
						case 2:
							sInfo = "战局旁观中...";
							// 旁观者立刻开始
							gChess.startFight(oResponse.fight);
							break;
					}
					// 页面关闭 callback出错
					setInterval(fAjaxPoll , 1000);
				}else{
					sInfo = oResponse.info;
				}
				gMain.fAlert(sInfo);
			}
		);
		fPreloadImages.apply(null , gPreload.slice(1));
	}else{
		fContentLoad();
		fPreloadImages.apply(null , gPreload);
	}
}

if(window.addEventListener){
	window.addEventListener("DOMContentLoaded" , fContentInit , false);
}

var gBase = location.href.replace(/[^\/]*$/,"");
var gChess , gMain , gAjax;
var gPreload = ['sound/sound.swf','image/board.jpg','image/chess.gif','image/focus.gif'];
