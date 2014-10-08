<!--#include file="json.asp" -->
<!--#include file="conn.asp" -->
<%
	var sName = Session("name");
	var sType = Session("type");
	var aFight= fUpdate(sName);
	var fLocation = function(aPosition , iTeam){
		if(iTeam){
			aPosition[0][0] = 9 - aPosition[0][0];
			aPosition[0][1] = 8 - aPosition[0][1];
			aPosition[1][0] = 9 - aPosition[1][0];
			aPosition[1][1] = 8 - aPosition[1][1];
		}
		return aPosition;
	};

	if(sType){
		switch(oRequest.type){
			case "wait":
				// �Ƿ��Ѵ�������
				if(aFight){
					oResponse.type = "start";
					oResponse.code = true;
				}
				break;
			case "next":
			case "look":
				// �Ƿ��ѹرշ���
				if(!aFight){
					oResponse.type = "quit";
					oResponse.code = true;
				}else{
					// ֻ�����������һ��
					if(aFight.length > Session("count")){
						oResponse.info = fLocation(aFight[aFight.length-1] , oRequest.team);
						oResponse.type = "go";
						Session("count") = aFight.length;
						oResponse.code = true;
					}else{
						// ����
						if(fUpdate("list")[sName] == "end"){
							oResponse.type = "end";
							oResponse.code = true;
						}
					}
				}
				break;
			case "go":
				try{
					if(aFight){
						// �������
						aFight.push(fLocation(oRequest.info , oRequest.team));
						fUpdate(sName , aFight);
						Session("count") = aFight.length;
						// ����
						if(oRequest.end){
							var oList  = fUpdate("list");
							oList[sName] = "end";
							fUpdate("list" , oList);
						}
						oResponse.code = true;
					}else{
						oResponse.type = "quit";
						oResponse.code = true;
					}
				}catch(e){
					oResponse.info = e.description;
				}
				break;
			default:
				Response.End();
				break;
		}
	}else{
		oResponse.info = "Session Lose";
	}
	fPrint(oResponse.toJSONString());
%>
