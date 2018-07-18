$(function(){
	$("#clearinput").click(function(){
		$("#username").val('');
		$("#password").val('');
	});

	$("#login").click(function(){
		if($("#username").val()!="" && $("#password").val()!=""){
			chrome.extension.getBackgroundPage().Login($("#username").val(),$("#password").val()).then(function(resp){
				if(resp.code==0){
					var token = resp.data.token;
					// alert(token);
					var user = $("#username").val();
					chrome.extension.getBackgroundPage().cacheWorker('set','user',user);
					chrome.extension.getBackgroundPage().cacheWorker('set','token',token);
					alert('login success');
					sendToController('refreshwd',function(resp){});
				}else{
					if(resp.data != ''){
						alert(resp.data);
					}
				}
			});
		}else{
			alert('username or password is emtpy!');
		}
	});

});


//发送消息 控制器
function sendToController(action,callback){
	//发送消息并且回调
	chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendRequest(tab.id, {action: action},
        function(response) {
        	callback(response);
        });
    });
}