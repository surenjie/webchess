<%
	Response.Expires = 0;
	Response.ContentType = "text/plain";
	Response.Charset = "gb2312";
	var oRequest = (""+Request.Form).parseJSON();
	var oResponse= {code:false};
	var i , t , o;
	var fDebug = function(s){
		Response.Write(s);
		Response.end();
	};
	var fPrint = function(s){
		Response.Write(s);
		Response.flush();
	};
	var fUpdate = function(){
		if(arguments.length == 2){
			Application.Lock();
			Application(arguments[0]) = arguments[1] ? arguments[1].toJSONString() : null;
			Application.Unlock();
		}else{
			return Application(arguments[0]) ? Application(arguments[0]).parseJSON() : null;
		}
	};
%>
