<!--#include file="script/json.asp" -->
<%
	var iCount = Application("count");
	var sList  = Application("list");
	var oList  = sList.parseJSON();
%>
Count:<%=iCount%><br>
List :<%=sList%><br>
<%
	var sName , sValue;
	for(sName in oList){
		if(typeof oList[sName] == "string"){
			sValue = Application(sName);
%>
			<%=sName%>:<%=sValue%><br>
<%
		}
	}
%>
