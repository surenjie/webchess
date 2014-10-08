<!--#include file="json.asp" -->
<!--#include file="conn.asp" -->
<%
	if(oRequest.name){
		// ½âÂë
		oRequest.name = decodeURIComponent(oRequest.name);
	}
	switch(oRequest.type){
		case "new":
			try{
				var oList = fUpdate("list");
				oList[oRequest.name] = "new";
				fUpdate("list" , oList);
				Session("name") = oRequest.name;
				Session("type") = "fight";
				oResponse.team = 0;
				oResponse.code = true;
			}catch(e){
				oResponse.info = e.description;
			}
			break;
		case "join":
			try{
				var sName  = oRequest.name;
				var aFight = fUpdate(sName);
				if(aFight){
					Session("type") = "look";
					Session("count")= aFight.length;
					oResponse.fight= aFight;
					oResponse.team = 2;
				}else{
					fUpdate(sName , []);
					Session("type") = "fight";
					oResponse.team = 1;
					var oList  = fUpdate("list");
					oList[sName] = "fight";
					fUpdate("list" , oList);
				}
				Session("name") = sName;
				oResponse.code = true;
			}catch(e){
				oResponse.info = e.description;
			}
			break;
		case "quit":
			try{
				(function(){
					var sType = Session("type");
					var sName = Session("name");
					if(sType == "fight"){
						var oList = fUpdate("list");
						delete oList[sName];
						fUpdate("list" , oList);
						fUpdate(sName , null);
					}
				})();
				Session("type") = null;
				Session("count")= 0;
				oResponse.code = true;
			}catch(e){
				oResponse.info = e.description;
			}
			break;
		case "list":
			try{
				oResponse.count= Application("count");
				oResponse.list = fUpdate("list");
				oResponse.code = true;
			}catch(e){
				oResponse.info = e.description;
			}
			break;
		default:
			Response.End();
			break;
	}
	fPrint(oResponse.toJSONString());
%>
