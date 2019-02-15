
var tabid = getQueryString('tabid');
var domain = getQueryString('domain');
var base = new Base64(); 
var cur_url = base.decode(getQueryString('cur_url'));
var data = null;
var cur_mer = null;
var all_site = [];
var cur_mer_id = null;
var cur_site = null;

$(function(){
	chrome.extension.getBackgroundPage().getDomainMMC(tabid,domain).then(function(resp){

		if(resp.code == 0){
			data = resp.data;
			cur_mer = data[0];
			cur_mer_id = cur_mer.ID;
			cur_site = cur_mer.Site;
			var sl_str = "";
			$(data).each(function(index,item){
				all_site.push(item.Site);
				sl_str += "<option value='"+item.Site+'-'+item.ID+"'>"+item.Site.toUpperCase()+'-'+item.Name+"</option>";
			});
			if(data.length>1){
				$('#sitetitle').html("Site" + "&nbsp;&nbsp;<span style='color:red'>(Multi)</span>")
			}
			$("#site_list").html(sl_str);
			selectMerchant(cur_mer_id,cur_site);

		}

		if(resp.code==-2){
			chrome.extension.getBackgroundPage().cacheWorker('del','user');
			chrome.extension.getBackgroundPage().cacheWorker('del','token');
			alert('login expired!');
			sendToController('refreshwd',function(resp){});
		}

	});

	$("#site_list").change(function(){
		var merchantinfo = $(this).val().split('-');
		var site = merchantinfo[0];
		var mid = merchantinfo[1];
		$(data).each(function(index,item){
			if(item.Site == site && item.ID == mid){
				cur_mer = item;
				return false;
			}
		});
		cur_mer_id = cur_mer.ID;
		cur_site = cur_mer.Site;
		selectMerchant(cur_mer_id,cur_site);
	});

	$("#clearinput").click(function(){
		$("#title").val('');
		$("#code").val('');
		$("#desc").val('');
		$("#end_time").val('');
	});

	
	$("#addcoupon").click(function(){
		chrome.extension.getBackgroundPage().openBcWindow(generateUrl('coupon'));
	});

	$("#adddeal").click(function(){
		chrome.extension.getBackgroundPage().openBcWindow(generateUrl('deal'));
	});

	$("#clearcache").click(function(){
		chrome.extension.getBackgroundPage().clearCache();
	}); 

	$("#code").focusout(function(){
		var code = $(this).val();
		$('#checkcouponcode').html('');
		if(code != ''){
			chrome.extension.getBackgroundPage().checkCodeInfo(cur_mer_id,cur_site,code).then(function(response){

				$('#checkcouponcode').html(response);
				$('#code').after('');
				if($('#append_source').length>0){
					if($('#appendbutton').length>0){
						append = '';
					}else{
						var couponid = $('#append_source').next().attr('data-couponid');
						var append = "<button class='append' id='appendbutton' data-id='"+ couponid +"'>Append</button>";
					}
					$('#code').after(append);
				}else{
					$('#appendbutton').remove();
				}

				$('#checkcouponcode a').each(function() {
					var orgurl = 'http://task.soarinfotech.com' + $(this).attr('href');
					$(this).attr('href', '');
					$(this).attr('data-href', orgurl);
					$(this).addClass('jumpbc');
				});

				$('.jumpbc').click(function() {
					var url = $(this).attr('data-href');
					opennewtab(url);
				});
				
				$(".append").click(function() {
					var couponid = $(this).attr('data-id');
					var source = 'mmc|Merchant';
					var sourceid = '';
					var r = confirm('Are you sure to append '+ source +'?');
					if(r == false){
						return false;
					}else{
						if(cur_site != '' && couponid != '' && cur_mer_id != ''){
							chrome.extension.getBackgroundPage().appnedsource(sourceid, cur_mer_id, source, couponid, cur_site).then(function(response){
								if(response == 'success'){
									alert('append ' + source + ' to ' + cur_site + '|' + couponid);
								}
							});
						}
					}
				});
			});
		}
	});
	// title check
	$("#title").focusout(function(){
		var title = $(this).val();
		if(title != ''){
			//title unique check
			chrome.extension.getBackgroundPage().checkTitleInfo(cur_mer_id,cur_site, title).then(function(response){
				if(response.error == 0) {
					var title = response.data[0]['Title'];
					var coupon_id = response.data[0]['ID'];
					var merchant_url = '/editor/coupon_list.php?site='+ cur_site + '&search_query=' +coupon_id;

					merchant_url = 'http://task.soarinfotech.com' + merchant_url;

					$('#title_hidden').html('Current Title is already exist ;The title is &nbsp;<a class="jumpbc" data-href="'+ merchant_url +'">'+ title +'</a><br/>');
				}else {
					$('#title_hidden').html('');
				}
				$('.jumpbc').click(function() {
					var url = $(this).attr('data-href');
					opennewtab(url);
				});
			});
			// bk check
			chrome.extension.getBackgroundPage().checkBlackKeyWord(title, cur_site, cur_mer_id).then(function(result){
				if(result.status == 'success') {
					$("#blackmsg").show();
					$("#blackmsg").html(result.rectedCode);
				}else{
					$("#blackmsg").hide();
				}
			});
		}
	});

	//landing page check
	$("#landing_page").focusout(function(){
		var checkLpInfo = $(this).val();

		if(checkLpInfo.indexOf('?orderby=price') !== -1 || checkLpInfo.indexOf('?sortOrder=lowToHigh') !== -1){
			checkLpInfo = checkLpInfo.replace('?orderby=price', '');
			checkLpInfo = checkLpInfo.replace('?sortOrder=lowToHigh', '');
		}
		if(checkLpInfo != '' && $("#code").val() == ''){
			chrome.extension.getBackgroundPage().checkLpInfo(cur_mer_id,cur_site, checkLpInfo).then(function(response){
				if(response.error == 0) {
					var title = response.data[0]['Title'];
					var coupon_id = response.data[0]['ID'];
					$('#merchant_url_hidden').html('<span style="color:red;">【Duplicated with Serving-请确认促销是否重复】<br>'+ title +'</span>');
					$('#expire_flag_hidden').val(0);
				}else {
					$('#merchant_url_hidden').html('<span></span>');
					$('#expire_flag_hidden').val(1);
					return false;
				}
			});
		}
	});

	$("#orgprice").keyup(function() {
		var orginalPrice  = parseFloat($('#orgprice').val());
		var curPrice  = parseFloat($('#curprice').val());

		if (orginalPrice > 0 && curPrice > 0) {
			var num = Math.round(((orginalPrice-curPrice)/orginalPrice) * 100).toFixed(0);
			$("#percent").val(num);
		} else {
			// alert('please check input');
		}
	});

	$("#curprice").keyup(function() {
		var orginalPrice  = parseFloat($('#orgprice').val());
		var curPrice  = parseFloat($('#curprice').val());

		if (orginalPrice > 0 && curPrice > 0) {
			var num = Math.round(((orginalPrice-curPrice)/orginalPrice) * 100).toFixed(0);
			$("#percent").val(num);
		} else {
			// alert('please check input');
		}
	});
});

Date.prototype.format = function(format) { 
       var date = { 
              "M+": this.getMonth() + 1, 
              "d+": this.getDate(), 
              "h+": this.getHours(), 
              "m+": this.getMinutes(), 
              "s+": this.getSeconds(), 
              "q+": Math.floor((this.getMonth() + 3) / 3), 
              "S+": this.getMilliseconds() 
       }; 
       if (/(y+)/i.test(format)) { 
              format = format.replace(RegExp.$1, (this.getFullYear() + '').substr(4 - RegExp.$1.length)); 
       } 
       for (var k in date) { 
              if (new RegExp("(" + k + ")").test(format)) { 
                     format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? date[k] : ("00" + date[k]).substr(("" + date[k]).length)); 
              } 
       } 
       return format; 
} 


function generateUrl(type){
	var url = "http://task.soarinfotech.com/editor/promo.php?"
			+"site="+cur_site+"&"
			+"action=add&"
			+"promotiondetail="+ $("#percent").val().toString() +"&"
			+"type="+type+"&"
			+"select_source=mmc|Merchant&"
			+"title="+ encodeURIComponent($("#title").val().toString())+"&"
			+"couponCode="+encodeURIComponent($("#code").val().toString())+"&"
			+"merchant="+cur_mer_id+"&"
			+"fill=&";
		if($("#end_time").val()!=""){
			url += "expire_type=Fixed&expireDate="+encodeURI($("#end_time").val())+"&";
		}else{
			url += "showmerlist=-1&from=couponlist&expire_type=Unknown&";
		}
		url	+= "description=" + encodeURIComponent($("#desc").val())+"&c_dst_url="+ escape($("#landing_page").val());
	return url;
}

function getQueryString(name) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = window.location.search.substr(1).match(reg);
    if (r != null) {
        return unescape(r[2]);
    }
    return null;
}


function selectMerchant(cur_mer_id,cur_site){

	$("#merchant_name").html(cur_mer.Name);
	var stats_str = '';
	if(cur_mer.Status[0].AllowCoupon == 'NO'){
		stats_str += "AllowCoupon:"+cur_mer.Status[0].AllowCoupon+"<br/>";
	}
	if(cur_mer.Status[0].AllowNonAffPromo == 'NO'){
		stats_str += "AllowNonAffPromo:"+cur_mer.Status[0].AllowNonAffPromo+"<br/>";
	}
	if(cur_mer.Status[0].AllowNonAffCoupon == 'NO'){
		stats_str += "AllowNonAffCoupon:"+cur_mer.Status[0].AllowNonAffCoupon+"<br/>";
	}
	if(stats_str == ''){
		stats_str += "<span><b>No Result</b></span>";
		$('#merchant_status').parent().parent().remove();		
	}
	$("#merchant_status").html(stats_str);
	if(cur_mer.tips == ''){
		$('#merchant_tips').parent().parent().remove();
		// $("#merchant_tips").html('<span><b>No Result</b></span>');
	}else{
		$("#merchant_tips").html(cur_mer.tips);
	}
	$("#merchant_domain").html(cur_mer.OriginalUrl);
	$("#landing_page").val(decodeURI(cur_url));


	chrome.extension.getBackgroundPage().getMerchantCode(cur_mer_id,cur_site).then(function(resp){
		if(resp.code==0 && resp.data.length >0 ){
			var tb1_str="";
			var tb2_str="";
			var tb3_str="";
			var tb4_str="";

			$(resp.data).each(function(index,item){
				if(item.Code.toString().length>0){
					if(item.Source.toString() == 'cpq|COMPETITOR'){
						var buttonstr = '<button class="append" data-id='+ item.ID +'>+</button>';
					}else{
						var buttonstr = '';
					}
					var code = "【<span style='color:red;'>"+item.Code.toString()+"</span>】"+ buttonstr +"-";
				}else{
					var code = "";
				}
				if(item.ExpireTime == '0000-00-00 00:00:00'){
					var ExpireTimeType = 'Remind Date';
					item.ExpireTime = item.RemindDate;
				}else{
					var ExpireTimeType = 'Expire Time';
				}
				item.ExpireTime = new Date(item.ExpireTime).format('yyyy-MM-dd'); 
				if(item.ExpireTime == 'NaN-aN-aN'){
					item.ExpireTime = '0000-00-00';
				}

				if(item.Type == 1){
					var type = 'coupon';
					tb2_str += "<p>"+ code +"【<span style='color:red;' class='showtitle' data-type='"+ type +"' data-id='"+ item.ID +"'>" + item.Title.toString() + "</a></span>】-【"+ ExpireTimeType +": <span style='color:red;'>"+item.ExpireTime.toString() +"</span>】";
				}else{
					var type = 'deal';
					tb3_str += "<p>"+ code +"【<span style='color:red;' class='showtitle' data-type='"+ type +"' data-id='"+ item.ID +"'>" + item.Title.toString() + "</a></span>】-【"+ ExpireTimeType +": <span style='color:red;'>"+item.ExpireTime.toString() + "</span>】</p>";
				}

				if(item.type_2.indexOf('shipping')!=-1){
					tb4_str += "<p>"+ code +"【<span style='color:red;' class='showtitle' data-type='"+ type +"' data-id='"+ item.ID +"'>" + item.Title.toString() + "</a></span>】-【"+ ExpireTimeType +": <span style='color:red;'>"+item.ExpireTime.toString() + "</span>】</p>";
				}

				tb1_str += "<p>"+ code +"【<span style='color:red;' class='showtitle' data-type='"+ type +"' data-id='"+ item.ID +"'>" + item.Title.toString() + "</a></span>】-【"+ ExpireTimeType +": <span style='color:red;'>"+item.ExpireTime.toString() + "</span>】</p>";
				//console.log(tb1_str);
			});

			$("#block1").html(tb1_str);
			$("#block2").html(tb2_str);
			$("#block3").html(tb3_str);
			$("#block4").html(tb4_str);

			$(".showtitle").click(function() {
				var couponid = $(this).attr('data-id');
				var type = $(this).attr('data-type');
				var url = "http://task.soarinfotech.com/editor/promo.php?site="+ cur_site +"&action=edit&type="+ type +"&showmerlist=-1&couponid=" + couponid;
				// var url = "http://task.soarinfotech.com/editor/coupon_list.php?site="+ cur_site +"&merchant="+ cur_mer_id +"&filterbystatus=servingnotstarted&search_type=couponid&search_query=" + couponid;
				opennewtab(url);
			});
			$(".append").click(function() {
				var couponid = $(this).attr('data-id');
				var source = 'mmc|Merchant';
				var sourceid = '';
				var r = confirm('Are you sure to append '+ source +'?');
				if(r == false){
					return false;
				}else{
					if(cur_site != '' && couponid != '' && cur_mer_id != ''){
						chrome.extension.getBackgroundPage().appnedsource(sourceid, cur_mer_id, source, couponid, cur_site).then(function(response){
							if(response == 'success'){
								alert('append ' + source + ' to ' + cur_site + '|' + couponid);
							}
						});
					}
				}
			});
		}
	});

}
/**
*
*  Base64 encode / decode
*
*  @author haitao.tu
*  @date   2010-04-26
*  @email  tuhaitao@foxmail.com
*
*/
 
function Base64() {
 
	// private property
	_keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 
	// public method for encoding
	this.encode = function (input) {
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		input = _utf8_encode(input);
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			} else if (isNaN(chr3)) {
				enc4 = 64;
			}
			output = output +
			_keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
			_keyStr.charAt(enc3) + _keyStr.charAt(enc4);
		}
		return output;
	}
 
	// public method for decoding
	this.decode = function (input) {
		var output = "";
		var chr1, chr2, chr3;
		var enc1, enc2, enc3, enc4;
		var i = 0;
		input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
		while (i < input.length) {
			enc1 = _keyStr.indexOf(input.charAt(i++));
			enc2 = _keyStr.indexOf(input.charAt(i++));
			enc3 = _keyStr.indexOf(input.charAt(i++));
			enc4 = _keyStr.indexOf(input.charAt(i++));
			chr1 = (enc1 << 2) | (enc2 >> 4);
			chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
			chr3 = ((enc3 & 3) << 6) | enc4;
			output = output + String.fromCharCode(chr1);
			if (enc3 != 64) {
				output = output + String.fromCharCode(chr2);
			}
			if (enc4 != 64) {
				output = output + String.fromCharCode(chr3);
			}
		}
		output = _utf8_decode(output);
		return output;
	}
 
	// private method for UTF-8 encoding
	_utf8_encode = function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			} else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			} else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
 
		}
		return utftext;
	}
 
	// private method for UTF-8 decoding
	_utf8_decode = function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;
		while ( i < utftext.length ) {
			c = utftext.charCodeAt(i);
			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			} else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			} else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}
		}
		return string;
	}
}

function opennewtab(url){
	chrome.extension.getBackgroundPage().openBcWindow(url);
}

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