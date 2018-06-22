var domain = "";
var tabid = "";

//浏览器加载完成
chrome.tabs.onUpdated.addListener(onUpdated);
function onUpdated(tabId, details, tab) {
    if ('loading' == (details || {}).status  || 'complete' == (details || {}).status){
    	var url = tab.url;
    	domain = get_domain_from_url(url);
    	if(checkCache()){
    		clearCache();
    	}
    	getDomainMMC(tabId,domain).then(function(resp){
    		if( (resp.code==0 && resp.data.length >0) || resp.code ==-2 ){
    			setTimeout(function(){
		    		chrome.tabs.sendMessage(tabId, {action:"popAdd",tabid:tabId,domain:domain,page:localTokenCheck()},function(response) {
		                  });

		    	},1000);
    		}else{
    			console.log('not support domain...');
    		}

    	});

        return;
    }

}


let onCopy = function (info, tab) {
    chrome.tabs.sendMessage(tab.id, {target: "copy"});
};

chrome.contextMenus.create({
    id: "copy",
    title: "Copy Current Text",
    contexts: ["all"],
    "onclick": onCopy
});

function checkCache(){
	var cacheList = cacheWorker('get','allkeys');
	if(cacheList){
		cache_arr = JSON.parse(cacheList);
		if(cache_arr.length>50){
			return true;
		}
	}
	return false;
}

function localTokenCheck(){
	if(cacheWorker('get','user') && cacheWorker('get','token')){
		return 1;
	}else{
		return 2;
	}
}

function clearCache(){
	var cacheList = cacheWorker('get','allkeys');
	cache_arr = JSON.parse(cacheList);
	$(cache_arr).each(function(index,item){
		if(item){
			cacheWorker('del',item);
		}
	});
	cacheWorker('del','allkeys');
}

function openBcWindow(url){
	chrome.tabs.create({url: url,active:true});
}

function sleepAndDoing(time,value=1){
	return new Promise(function(resolve,reject){
		setTimeout(function(){
			resolve(value);
		},time);
    })
}


//图标点击事件
chrome.browserAction.onClicked.addListener(onClicked);
function onClicked(tabId){
    chrome.tabs.query(
        {active: true, currentWindow: true}, 
        function(tabId) {
        	chrome.tabs.sendMessage(tabId[0].id, {action:"showPop",tabid:tabId,domain:domain,page:localTokenCheck()}, function(response) {});
     });
}


function get_domain_from_url(url) {
    try {
        if (url == null)
            return '';
        var host = url.split('/');
        if (host.length < 3)
            return '';
        var domain = host[2];
        if (domain.indexOf("www.") == 0)
            domain = domain.substr(4);
        return domain;

    } catch (e) {
        return '';
    }
}


//监听 controller view 消息
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){

	if(request.action=='needpopAdd'){
		// chrome.tabs.sendMessage(tabId, {action:"popAdd"},function(response) {
                  //});
		// console.log("消息调用:",'controller needdata');
	    sendResponse({action:"popAdd",data:'from model'});
	}

	if(request.action=='test'){
		sendResponse({action:"testcallback",data:'from model'});
	}

});


//Login
function Login(user,pass){
	var apiurl = "https://go.soarinfotech.com/api.php?action=loginCheck";
	return ajaxApi(apiurl,'',{user:user,password:pass});
}


//getDomainMMC
function getDomainMMC(tabid,domain){
	var apiurl = "https://go.soarinfotech.com/api.php?action=getDomainMMC&domain="+domain;
	return ajaxApi(apiurl,"merchant_base_info_"+tabid.toString()+"_"+domain);
}

//getMerchantCode
function getMerchantCode(merchantid,site){
	var apiurl = "https://go.soarinfotech.com/api.php?action=getMerchantCoupons&merchantid="+merchantid+"&site="+site;
	return ajaxApi(apiurl);
}

function checkCodeInfo(merchantid, site, code){
	var apiurl = "http://task.soarinfotech.com/editor/coupon_search.php?action=rsynch-chk-couponcode&couponcode="+ encodeURI(code) +"&merchantid=" + merchantid + "&site=" + site;
	return ajaxApi(apiurl, '', null, 'text');
}

function checkLpInfo(merchantid, site, lpurl){
	var apiurl = "http://autopublish:autopublish123456@task.soarinfotech.com/editor/promo.php?site="+ site +"&action=checkMerchantPromotionUnique&type=deal&merchant=" + merchantid;
	return ajaxApi(apiurl, '', {promotion_url:lpurl});
}

function appnedsource(sourceid, cur_mer_id, source, couponid, cur_site){
	var apiurl = "http://task.soarinfotech.com/editor/coupon_search.php?action=rsynch-append-source" + "&sourceid="+ sourceid +"&source=" + source + "&merchantid=" + cur_mer_id + "&site=" + cur_site + '&couponid=' + couponid;
	return ajaxApi(apiurl, '', null, 'text');
}
function ajaxApi(url,cache_name='',params=null, returntype='json'){
	return new Promise(function(resolve,reject){
		if(cache_name && cacheWorker('get',cache_name)){
			resolve(JSON.parse(cacheWorker('get',cache_name)));
		}else{
			var type = params?'post':'get';
			$.ajax({
				type:type,
				url:url+addedParams(),
				data:params,
				dataType: returntype,
				success:function(resp){
					console.log(type);
					if(type=='get' && resp.code==0 && resp.data.length >0){
						cacheWorker('set',cache_name,JSON.stringify(resp));
						var keys = cacheWorker('get','allkeys');
						if(cache_name){
							if(keys!=null){
								var keys_arr = JSON.parse(keys);
								keys_arr.push(cache_name);
								cacheWorker('set','allkeys',JSON.stringify(keys_arr));
							}else{
								var tmp = [];
								tmp.push(cache_name);
								cacheWorker('set','allkeys',JSON.stringify(tmp));
							}
						}
					}
					resolve(resp);
				}
			});
		}
	});
}


function addedParams(){
	var token = localStorage.getItem('token');
	var user = localStorage.getItem('user');
	var str = "&token="+token+"&user="+user;
	return str;
}


function cacheWorker(type,key,value=''){
	if(type=='set'){
		localStorage.setItem(key,value);
	}else if(type =='get'){
		return localStorage.getItem(key);
	}else if(type == 'del'){
		localStorage.removeItem(key);
	}
}