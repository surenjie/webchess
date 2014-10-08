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
			// getFight���ı�type״̬��next
			oRequest.info = gChess.getFight();
			// ����
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
	// ����
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
			fAlert("������������ȫ�����Ա���Ե����´��ڣ�");
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
			<button id="btnNew">����</button>\
			<i id="objInfo"></i>\
			<b>����������<span id="objCount">&nbsp;</span></b>\
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
					return fAlert("ս��������Ϊ�ؼ��֣�");
				}
				if(!$A($("selList").options).all(function(o){return o.value != sName})){
					return fAlert("��ս�����ڶ�ս�б��У�");
				}
				fOpenChess("new" , sName);
			}else{
				fAlert("ս��������Ϊ�գ�");
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
	// �����Ҽ�
	Event.observe(document, 'contextmenu', r);
	// �����϶�
	Event.observe(document, 'selectstart', r);
	if(window.name){
		// ע��
		if(document.all){
			Event.observe(window, 'unload', f);
		}else{
			window.onunload = f;
		}
		// ����
		Event.observe(window, 'beforeunload', u);
		// ���μ���
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
							sInfo = "ս�ֶ�ս��...";
							break;
						case 2:
							sInfo = "ս���Թ���...";
							// �Թ������̿�ʼ
							gChess.startFight(oResponse.fight);
							break;
					}
					// ҳ��ر� callback����
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
