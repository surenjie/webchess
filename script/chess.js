var Chess = Class.create();
Chess.grid = function(team , index){		// ����
	this.team = team;						// ���
	this.index= index;						// ����
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
Chess.chessman = function(y , x){			// ����
	this.y = y;								// ��
	this.x = x;								// ��
}
Chess.prototype = {
	initialize: function(main,team) {
		this.main = $(main);
		this.current= null;					// ��ǰ����
		// �Թ��� ���� �ȴ�
		this.type   = team == 2 ? "look" : "wait";
		// �Թ���teamҲΪ0 ����flag��Ϊ0
		this.team   = team != 2 ? team : 0;
		team = this.team;					// ����
		this.flag   = 0;					// 0�ȴ� 1� 2����
		this.point	= [];					// λ����Ϣ
		this.status = "";					// ��ʾ����
		this.win = window;					// ����
		this.doc = this.win.document;		// �ĵ�
		this._squares = new Array(10);		// ������
		this._pieces  = new Array(2);		// ���ӷ� ���
		this._focus   = new Array(2);		// ����
		this._sound   = null;				// ����
		this._interval= null;				// ��ʱ��
		this._fight   = [];					// ����
		this._info = {						// ��ʾ��Ϣ
			"look" : "�Թ�ս��......",
			"wait" : "���ڵȴ�����......",
			"go"   : "���ڷ�������......",
			"walk" : "��������......",
			"next" : "�ȴ���������......",
			"quit" : "�Է��Ѿ��˳�......",
			"exit" : "ǿ���˳����Զ�����ս����",
			"dead" : "�ɹ��������֣�ʤ���ˣ�",
			"over" : "�����ֽ�����ʧ���ˣ�",
			"end"  : "ս���ѷ�ʤ���������˳���"
		};
		// CSS��
		this.main.addClassName("Board Weak");
		// ������ 10��*9��
		this._squares.each(
			(function(_ , i){
				this._squares[i] = new Array(9);
			}).bind(this)
		);
		// �����������
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
		// ������ ˧ ʿʿ ���� ���� ���� ���� ����������
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
	// ͬ������
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
	// ��������
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
	// ���¼�
	attachEvent: function(){
		// ��������
		$A(this.main.childNodes).each(
			(function(o){
				o.getPosition = Chess.Event.getPosition.bind(o);
				o.setPosition = Chess.Event.setPosition.bind(o);
				o.getInfo = Chess.Event.getInfo.bind(o);
				this._pieces[o.getInfo("team")][o.getInfo("index")] = $(o);
			}).bind(this)
		);
		// ����Ԫ��
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
		// ����Ԫ��
		var sound = this.doc.createElement("embed");
		sound.type= "application/x-shockwave-flash";
		sound.src = "sound/sound.swf";
		sound.className = "Sound";
		sound.setAttribute("flashvars","t=begin");
		this._sound = this.main.appendChild(sound);
		// ��������
		Event.observe(this.main,"click",Chess.Event.selectBoard.bind(this));
		this.point.push(Position.cumulativeOffset(this.main));
	},
	winkPieces: function(obj){
		// ������ʾ
		if(this.current){
			this.current.show();
		}
		// �����ʱ
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
		// ��ǰ����
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
				case "0":			// ˧
					if(to[0] >= 7 && to[1] >= 3  && to[1] <= 5){
						if((x == 1 && y == 0) || (x == 0 && y == 1)){
							go = true;
						}
					}
					break;
				case "1":
				case "2":			// ʿ
					if(to[0] >= 7 && to[1] >= 3  && to[1] <= 5 && x == 1 && y == 1){
						go = true;
					}
					break;
				case "3":
				case "4":			// ��
					// ��Χ
					if(x == 2 && y == 2 && to[0] >= 5){
						// ���
						if(!this._squares[(minY+maxY)/2][(minX+maxX)/2].is()){
							go = true;
						}
					}
					break;
				case "5":
				case "6":			// ��
					// ���
					if(x == 2 && y == 1){
						if(to[1] > from[1]){	// ��
							if(!this._squares[from[0]][minX+1].is()){
								go = true;
							}
						}else{					// ��
							if(!this._squares[from[0]][maxX-1].is()){
								go = true;
							}
						}
					}
					// ����
					if(y == 2 && x == 1){
						if(to[0] > from[0]){	// ��
							if(!this._squares[minY+1][from[1]].is()){
								go = true;
							}
						}else{					// ��
							if(!this._squares[maxY-1][from[1]].is()){
								go = true;
							}
						}
					}
					break;
				case "7":
				case "8":			// ��
					// ���
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
					// ֱ��
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
				case "10":			// ��
					n = 2;
					// Ŀ��
					a = this._squares[to[0]][to[1]];
					// ���
					if(from[0] == to[0]){
						n = 0;
						for(x=minX+1; x<=maxX-1; x++){
							if(this._squares[to[0]][x].is()){
								n++;
							}
						}
					}
					// ֱը
					if(from[1] == to[1]){
						n = 0;
						for(y=minY+1; y<=maxY-1; y++){
							if(this._squares[y][to[1]].is()){
								n++;
							}
						}
					}
					// ��
					if(n == 1 && a.is()){
						go = true;
					}
					// ��
					if(n == 0 && !a.is()){
						go = true;
					}
					break;
				default:			// ��
					// ǰ��
					if((from[0]-to[0]) == 1 && x == 0){
						go = true;
					}
					// ����
					if(to[0] <= 4 && y == 0 && x == 1){
						go = true;
					}
					break;
			}
		}else{
			go = true;
		}
		// ״̬����
		if(go){
			go = "go";
			var grid = this._squares[to[0]][to[1]];
			if(grid.is()){			// ����
				go = "eat";
				// DOMɾ��
				this._pieces[grid.team][grid.index].remove();
				this._pieces[grid.team][grid.index] = new Chess.chessman(-1 , -1);
			}
			// ����
			if(grid.index == 0){
				// �Թ�
				if(this.type == "look"){
					go = "dead";
					this.setStatus(this._info["end"]);
				}else{
					// ����
					if(this.team == grid.team){
						go = "over";
					}else{
						go = "dead";
					}
					this.setStatus(this._info[go]);
				}
				// ����
				this.flag = 2;
			}
			// ԭλ��
			this._squares[from[0]][from[1]].clear();
			// ��λ��
			grid.set(team , index);
		}
		return go;
	},
	goPieces: function(y , x){
		// �岽�ж�
		var type = this.goCheck([y , x]);
		// ���
		var from = this.current.getPosition();
		// �յ�
		var to   = [y , x];
		// ���Ϲ���
		if(type){
			this.setType("go");
			// �ƶ�����
			this.current.setPosition(to);
			// �ָ���˸  �����current
			this.winkPieces(null);
			// ��������
			this.playSound(type);
			// ��������
			this.addFight(from , to);
		}
	},
	toPieces: function(from , to){
		// ���û����
		this.current = $$('span.P'+from[0]+from[1])[0];
		// �ƶ�
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
		// ��ʾ��������
		$$('span.Hide').each(
			function(o){
				o.removeClassName("Hide");
			}
		);
		// ������ �ڵȴ�
		if(this.team){
			this.setType("next");
		}else{
			this.setType("walk")
		}
		this.main.removeClassName("Weak");
		// �Թ���Ԥ������
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
			this._info["exit"] = "�Է��Ѿ����˳����Ѷ��ߣ�";
			this.win.close();
			// IE close ����ȫ����
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
		// ��ʾ����
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
		// �Թ�������
		if(this.type == "look" && sType != "quit"){
			return false;
		}
		// �ǽ���
		if(this.flag != 2){
			// �״̬
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
		// ���Թ۷ǵȴ�
		if(this.type == "look" || this.type == "wait"){
			return "";
		}
		return this._info["exit"];
	}
}

Chess.Event = {
	selectBoard: function(e){
		// �Ƿ�
		if(this.flag != 1){
			return;
		}
		// �������λ��
		this.point[1] = [Event.pointerX(e) - this.point[0][0] , Event.pointerY(e) - this.point[0][1]];
		// �������λ��
		this.point[2] = [this.point[1][0]-12 , this.point[1][1]-11];
		// ���Ӻ���1px
		if(this.point[2][1] >= 240){
			this.point[2][1]--;
		}
		// ��ȷ����
		var iX = this.point[2][0];
		var iY = this.point[2][1];
		// ��Χ
		if(0 <= iX && iX <=426 && 0 <= iY && iY <= 474){
			// ��׼����
			var sX = parseInt(iX / 48);
			var sY = parseInt(iY / 48);
			// �ų���϶
			if(iX <= sX*48+42 && iY <= sY*48+42){
				// Class
				var sClass = "P" + sY + sX;
				// Selector
				var oPieces= $$('span.'+sClass)[0];
				// ������
				if(oPieces){
					// �Լ�
					if(this.team == oPieces.getInfo("team")){
						this.winkPieces(this.current == oPieces ? null : oPieces);
					}else{
						if(this.current){
							// ����
							this.goPieces(sY , sX);
						}
					}
				}else{
					if(this.current){
						// ����
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
