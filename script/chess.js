var Chess = Class.create();
Chess.grid = function(team , index){		// 格子
	this.team = team;						// 红黑
	this.index= index;						// 索引
	this.clear= function(){
		this.team = this.index = -1;
	};
	this.is = function(){
		return this.team != -1;
	};
	this.set = function(team,index){
		this.team = team;
		this.index= index;
	};
}
Chess.chessman = function(y , x){			// 棋子
	this.y = y;								// 行
	this.x = x;								// 列
}
Chess.prototype = {
	initialize: function(main,team) {
		this.main = $(main);
		this.current= null;					// 当前棋子
		// 旁观者 或者 等待
		this.type   = team == 2 ? "look" : "wait";
		// 旁观者team也为0 但其flag永为0
		this.team   = team != 2 ? team : 0;
		team = this.team;					// 重置
		this.flag   = 0;					// 0等待 1活动 2结束
		this.point	= [];					// 位置信息
		this.status = "";					// 提示文字
		this.win = window;					// 窗口
		this.doc = this.win.document;		// 文档
		this._squares = new Array(10);		// 棋盘行
		this._pieces  = new Array(2);		// 棋子方 红黑
		this._focus   = new Array(2);		// 焦点
		this._sound   = null;				// 播放
		this._interval= null;				// 定时器
		this._fight   = [];					// 棋谱
		this._info = {						// 提示信息
			"look" : "旁观战局......",
			"wait" : "正在等待对手......",
			"go"   : "正在发送棋谱......",
			"walk" : "请您下棋......",
			"next" : "等待对手下棋......",
			"quit" : "对方已经退出......",
			"exit" : "强行退出则自动放弃战斗！",
			"dead" : "成功将死对手，胜利了！",
			"over" : "被对手将死，失败了！",
			"end"  : "战局已分胜负，可以退出！"
		};
		// CSS类
		this.main.addClassName("Board Weak");
		// 空棋盘 10行*9列
		this._squares.each(
			(function(_ , i){
				this._squares[i] = new Array(9);
			}).bind(this)
		);
		// 棋盘数据填充
		this._squares.each(
			function(rows , y){
				rows.each(
					function(_ , x){
						var s = arrGrids[team ? y : 9-y][x];
						var a = s ? s.split(":") : [-1,-1];
						rows[x] = new Chess.grid(a[0] , a[1]);
					}
				);
			}
		);
		// 棋子数 帅 士士 相相 马马 车车 炮炮 兵兵兵兵兵
		this._pieces.each(
			(function(_ , i){
				this._pieces[i] = new Array(16);
			}).bind(this)
		);
		this.syncPieces();
		this.createPieces();
		this.attachEvent();
		this.setStatus(this._info[this.type]);
	},
	// 同步棋子
	syncPieces: function(){
		this._squares.each(
			(function(rows , y){
				rows.each(
					(function(o , x){
						if(o.is()){
							this._pieces[o.team][o.index] = new Chess.chessman(y , x);
						}
					}).bind(this)
				);
			}).bind(this)
		);
	},
	// 创建棋子
	createPieces: function(){
		var arr = [];
		this._pieces.each(
			function(teams , i){
				teams.each(
					function(o , index){
						var s = ["Chess C",i,index," P",o.y,o.x,o.y<5?" Hide":""].join("");
						arr.push('<span class="'+s+'"></span>');
					}
				);
			}
		);
		this.main.innerHTML = arr.join("");
	},
	// 绑定事件
	attachEvent: function(){
		// 所有棋子
		$A(this.main.childNodes).each(
			(function(o){
				o.getPosition = Chess.Event.getPosition.bind(o);
				o.setPosition = Chess.Event.setPosition.bind(o);
				o.getInfo = Chess.Event.getInfo.bind(o);
				this._pieces[o.getInfo("team")][o.getInfo("index")] = $(o);
			}).bind(this)
		);
		// 焦点元素
		var focus = this.doc.createElement("div");
		focus.className = "Focus P00";
		this._focus[0] = this.main.appendChild(focus);
		this._focus[1] = this.main.appendChild(focus.cloneNode(false));
		this._focus.each(
			function(o){
				o.setPosition = Chess.Event.setPosition.bind(o);
				$(o).hide();
			}
		);
		// 声音元素
		var sound = this.doc.createElement("embed");
		sound.type= "application/x-shockwave-flash";
		sound.src = "sound/sound.swf";
		sound.className = "Sound";
		sound.setAttribute("flashvars","t=begin");
		this._sound = this.main.appendChild(sound);
		// 整个棋盘
		Event.observe(this.main,"click",Chess.Event.selectBoard.bind(this));
		this.point.push(Position.cumulativeOffset(this.main));
	},
	winkPieces: function(obj){
		// 必须显示
		if(this.current){
			this.current.show();
		}
		// 清除定时
		clearInterval(this._interval);
		if(obj){
			this.current = obj;
			this._interval = setInterval(Chess.Event.togglePieces.bind(this),400);
		}else{
			this.current = null;
		}
		this.playSound("select");
	},
	goCheck: function(to){
		// 当前棋子
		var n , a , t = this.current;
		var team = t.getInfo("team");
		var index= t.getInfo("index");
		var from = t.getPosition();
		var go   = false;
		var minY = Math.min(from[0],to[0]);
		var maxY = Math.max(from[0],to[0]);
		var minX = Math.min(from[1],to[1]);
		var maxX = Math.max(from[1],to[1]);
		var y = maxY - minY;
		var x = maxX - minX;
		if(this.team == team){
			switch(index){
				case "0":			// 帅
					if(to[0] >= 7 && to[1] >= 3  && to[1] <= 5){
						if((x == 1 && y == 0) || (x == 0 && y == 1)){
							go = true;
						}
					}
					break;
				case "1":
				case "2":			// 士
					if(to[0] >= 7 && to[1] >= 3  && to[1] <= 5 && x == 1 && y == 1){
						go = true;
					}
					break;
				case "3":
				case "4":			// 相
					// 范围
					if(x == 2 && y == 2 && to[0] >= 5){
						// 相角
						if(!this._squares[(minY+maxY)/2][(minX+maxX)/2].is()){
							go = true;
						}
					}
					break;
				case "5":
				case "6":			// 马
					// 横跨
					if(x == 2 && y == 1){
						if(to[1] > from[1]){	// 右
							if(!this._squares[from[0]][minX+1].is()){
								go = true;
							}
						}else{					// 左
							if(!this._squares[from[0]][maxX-1].is()){
								go = true;
							}
						}
					}
					// 竖踩
					if(y == 2 && x == 1){
						if(to[0] > from[0]){	// 下
							if(!this._squares[minY+1][from[1]].is()){
								go = true;
							}
						}else{					// 上
							if(!this._squares[maxY-1][from[1]].is()){
								go = true;
							}
						}
					}
					break;
				case "7":
				case "8":			// 车
					// 横冲
					if(from[0] == to[0]){
						a = this._squares[to[0]];
						for(x=minX+1; x<=maxX-1; x++){
							if(a[x].is()){
								break;
							}
						}
						if(x == maxX){
							go = true;
						}
					}
					// 直闯
					if(from[1] == to[1]){
						a = this._squares;
						for(y=minY+1; y<=maxY-1; y++){
							if(a[y][to[1]].is()){
								break;
							}
						}
						if(y == maxY){
							go = true;
						}
					}
					break;
				case "9":
				case "10":			// 炮
					n = 2;
					// 目标
					a = this._squares[to[0]][to[1]];
					// 横轰
					if(from[0] == to[0]){
						n = 0;
						for(x=minX+1; x<=maxX-1; x++){
							if(this._squares[to[0]][x].is()){
								n++;
							}
						}
					}
					// 直炸
					if(from[1] == to[1]){
						n = 0;
						for(y=minY+1; y<=maxY-1; y++){
							if(this._squares[y][to[1]].is()){
								n++;
							}
						}
					}
					// 吃
					if(n == 1 && a.is()){
						go = true;
					}
					// 移
					if(n == 0 && !a.is()){
						go = true;
					}
					break;
				default:			// 兵
					// 前进
					if((from[0]-to[0]) == 1 && x == 0){
						go = true;
					}
					// 横行
					if(to[0] <= 4 && y == 0 && x == 1){
						go = true;
					}
					break;
			}
		}else{
			go = true;
		}
		// 状态更新
		if(go){
			go = "go";
			var grid = this._squares[to[0]][to[1]];
			if(grid.is()){			// 吃子
				go = "eat";
				// DOM删除
				this._pieces[grid.team][grid.index].remove();
				this._pieces[grid.team][grid.index] = new Chess.chessman(-1 , -1);
			}
			// 将军
			if(grid.index == 0){
				// 旁观
				if(this.type == "look"){
					go = "dead";
					this.setStatus(this._info["end"]);
				}else{
					// 被将
					if(this.team == grid.team){
						go = "over";
					}else{
						go = "dead";
					}
					this.setStatus(this._info[go]);
				}
				// 结束
				this.flag = 2;
			}
			// 原位置
			this._squares[from[0]][from[1]].clear();
			// 新位置
			grid.set(team , index);
		}
		return go;
	},
	goPieces: function(y , x){
		// 棋步判断
		var type = this.goCheck([y , x]);
		// 起点
		var from = this.current.getPosition();
		// 终点
		var to   = [y , x];
		// 符合规则
		if(type){
			this.setType("go");
			// 移动棋子
			this.current.setPosition(to);
			// 恢复闪烁  会清空current
			this.winkPieces(null);
			// 播放声音
			this.playSound(type);
			// 增加棋谱
			this.addFight(from , to);
		}
	},
	toPieces: function(from , to){
		// 设置活动棋子
		this.current = $$('span.P'+from[0]+from[1])[0];
		// 移动
		this.goPieces(to[0] , to[1]);
		this.setType("walk");
	},
	signFocus: function(source , target){
		this._focus.each(
			function(o , i){
				o.show();
				o.setPosition(i ? target : source);
			}
		);
	},
	playSound: function(type){
		try{
			this._sound.SetVariable("t",type);
		}catch(e){}
	},
	startFight: function(aFight){
		if(document.all){
			this.playSound("start");
		}else{
			this._sound.setAttribute("flashvars","t=start");
		}
		// 显示对手棋子
		$$('span.Hide').each(
			function(o){
				o.removeClassName("Hide");
			}
		);
		// 红先走 黑等待
		if(this.team){
			this.setType("next");
		}else{
			this.setType("walk")
		}
		this.main.removeClassName("Weak");
		// 旁观者预加棋谱
		if(aFight){
			setTimeout((function(){
				aFight.each(
					(function(a){
						this.toPieces.apply(this , a);
					}).bind(this)
				);
			}).bind(this) , 100);
		}
	},
	loseFight: function(){
		if(this.setType("quit")){
			this._info["exit"] = "对方已经先退出或已断线！";
			this.win.close();
			// IE close 非完全阻塞
			setTimeout(
				(function(){
					this._info["exit"] = "";
				}).bind(this)
			,0);
		}
	},
	endFight: function(){
		this.setType("quit");
		this._info["exit"] = this._info["end"];
		this.win.close();
		setTimeout(
			(function(){
				this._info["exit"] = "";
			}).bind(this)
		,0);
	},
	addFight: function(source , target){
		// 提示焦点
		this.signFocus(source , target);
		this._fight.push([source , target]);
	},
	getFight: function(){
		this.setType("next");
		return this._fight[this._fight.length - 1];
	},
	setType: function(sType){
		if(this.type == sType){
			return false;
		}
		// 旁观者限制
		if(this.type == "look" && sType != "quit"){
			return false;
		}
		// 非结束
		if(this.flag != 2){
			// 活动状态
			switch(sType){
				case "quit":
				case "next":
				case "go":
					this.flag = 0;
					break;
				case "walk":
					this.flag = 1;
					break;
				default:
					break;
			}
			this.setStatus(this._info[sType]);
		}
		this.type = sType;
		return true;
	},
	setStatus: function(sInfo){
		this.win.defaultStatus = this.win.status = this.status = sInfo;
	},
	getStatus: function(){
		// 非旁观非等待
		if(this.type == "look" || this.type == "wait"){
			return "";
		}
		return this._info["exit"];
	}
}

Chess.Event = {
	selectBoard: function(e){
		// 是否活动
		if(this.flag != 1){
			return;
		}
		// 棋盘相对位置
		this.point[1] = [Event.pointerX(e) - this.point[0][0] , Event.pointerY(e) - this.point[0][1]];
		// 棋子相对位置
		this.point[2] = [this.point[1][0]-12 , this.point[1][1]-11];
		// 楚河汉界1px
		if(this.point[2][1] >= 240){
			this.point[2][1]--;
		}
		// 精确坐标
		var iX = this.point[2][0];
		var iY = this.point[2][1];
		// 大范围
		if(0 <= iX && iX <=426 && 0 <= iY && iY <= 474){
			// 基准坐标
			var sX = parseInt(iX / 48);
			var sY = parseInt(iY / 48);
			// 排除空隙
			if(iX <= sX*48+42 && iY <= sY*48+42){
				// Class
				var sClass = "P" + sY + sX;
				// Selector
				var oPieces= $$('span.'+sClass)[0];
				// 有棋子
				if(oPieces){
					// 自己
					if(this.team == oPieces.getInfo("team")){
						this.winkPieces(this.current == oPieces ? null : oPieces);
					}else{
						if(this.current){
							// 吃子
							this.goPieces(sY , sX);
						}
					}
				}else{
					if(this.current){
						// 走子
						this.goPieces(sY , sX);
					}
				}
			}
		}
	},
	togglePieces: function(){
		this.current.toggle();
	},
	setPosition: function(a){
		this.className = this.className.replace(/P\d\d/,"P"+a[0]+a[1]);
	},
	getPosition: function(){
		return this.className.match(/P(\d)(\d)/).slice(1);
	},
	getInfo: function(type){
		return this.className.match(/C(\d)(\d{1,2})/).slice(1)[type=="team"?0:1];
	}
}
