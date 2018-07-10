var domain = "";
var tabid = "";
var hllock = false;
var base = new Base64();
//浏览器加载完成
chrome.tabs.onUpdated.addListener(onUpdated);

function onUpdated(tabId, details, tab) {
    if ('loading' == (details || {}).status || 'complete' == (details || {}).status) {
        var url = tab.url;

        if(url.indexOf('action=doadd')!=-1 && 'complete' == (details || {}).status){
            setTimeout(function(){
                chrome.tabs.remove(tabId,function(){});
            },1000);
            return;
        }

        domain = get_domain_from_url(url);
        if (checkCache()) {
            clearCache();
        }
        getDomainMMC(tabId, domain).then(function(resp) {
            if ((resp.code == 0 && resp.data.length > 0) || resp.code == -2) {
                setTimeout(function() {
                    chrome.tabs.sendMessage(tabId, { action: "popAdd", tabid: tabId, domain: domain, page: localTokenCheck() }, function(response) {});

                }, 1000);
            } else {
                console.log('not support domain...');
            }

        });
    }

}


let onCopy = function(info, tab) {
    chrome.tabs.sendMessage(tab.id, { target: "copy" });
};

chrome.contextMenus.create({
    id: "copy",
    title: "Copy Current Text",
    contexts: ["all"],
    "onclick": onCopy
});

function checkCache() {
    var cacheList = cacheWorker('get', 'allkeys');
    if (cacheList) {
        cache_arr = JSON.parse(cacheList);
        if (cache_arr.length > 50) {
            return true;
        }
    }
    return false;
}

function localTokenCheck() {
    if (cacheWorker('get', 'user') && cacheWorker('get', 'token')) {
        return 1;
    } else {
        return 2;
    }
}

function clearCache() {
    var cacheList = cacheWorker('get', 'allkeys');
    cache_arr = JSON.parse(cacheList);
    $(cache_arr).each(function(index, item) {
        if (item) {
            cacheWorker('del', item);
        }
    });
    cacheWorker('del', 'allkeys');
}

function openBcWindow(url) {
    chrome.tabs.create({ url: url, active: true });
}

function sleepAndDoing(time, value = 1) {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve(value);
        }, time);
    })
}


//图标点击事件
chrome.browserAction.onClicked.addListener(onClicked);

function onClicked(tabId) {
    chrome.tabs.query({ active: true, currentWindow: true },
        function(tabId) {
            chrome.tabs.sendMessage(tabId[0].id, { action: "showPop", tabid: tabId, domain: domain, page: localTokenCheck() }, function(response) {});
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
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

    if (request.action == 'needpopAdd') {
        // chrome.tabs.sendMessage(tabId, {action:"popAdd"},function(response) {
        //});
        // console.log("消息调用:",'controller needdata');
        sendResponse({ action: "popAdd", data: 'from model' });
    }

    if (request.action == 'getHllist') {
        if(hllock === false){
            console.log(hllock);
            getHighLight('mmc').then(function(res){
                if(res.code == 0){
                    sendResponse({data: res.data});
                    hllock = true;
                }else{
                    console.log('no hightlight words');
                }
            });
            return true;
        }
    }
});


//Login
function Login(user, pass) {
    var apiurl = "https://go.soarinfotech.com/api.php?action=loginCheck";
    return ajaxApi(apiurl, '', { user: user, password: pass });
}


//getDomainMMC
function getDomainMMC(tabid, domain) {
    var apiurl = "https://go.soarinfotech.com/api.php?action=getDomainMMC&domain=" + domain;
    return ajaxApi(apiurl, "merchant_base_info_" + tabid.toString() + "_" + domain);
}

//getHighLightWords
function getHighLight(applyfor) {
    var apiurl = "https://go.soarinfotech.com/api.php?action=getHighWords&applyfor" + applyfor;
    return ajaxApi(apiurl);
}

//getMerchantCode
function getMerchantCode(merchantid, site) {
    var apiurl = "https://go.soarinfotech.com/api.php?action=getMerchantCoupons&merchantid=" + merchantid + "&site=" + site;
    return ajaxApi(apiurl);
}

function checkCodeInfo(merchantid, site, code) {
    var username = cacheWorker('get', 'user');
    var token = base.decode(cacheWorker('get', 'token'));
    var apiurl = "http://" + encodeURIComponent(username) + ":" + encodeURIComponent(token) + "@task.soarinfotech.com/editor/coupon_search.php?action=rsynch-chk-couponcode&couponcode=" + encodeURI(code) + "&merchantid=" + merchantid + "&site=" + site;
    return ajaxApi(apiurl, '', null, 'text');
}

function checkLpInfo(merchantid, site, lpurl) {
    var username = cacheWorker('get', 'user');
    var token = base.decode(cacheWorker('get', 'token'));
    var apiurl = "http://" + encodeURIComponent(username) + ":" + encodeURIComponent(token) + "@task.soarinfotech.com/editor/promo.php?site=" + site + "&action=checkMerchantPromotionUnique&type=deal&merchant=" + merchantid;
    return ajaxApi(apiurl, '', { promotion_url: lpurl });
}

function checkTitleInfo(merchantid, site, title) {
    var apiurl = "http://task.soarinfotech.com/editor/promo.php?site=" + site + "&action=checkMerchantTitleUnique&type=deal&merchant=" + merchantid;
    return ajaxApi(apiurl, '', { title: title });
}

function checkBlackKeyWord(title, cur_site, cur_mer_id) {
    var apiurl = "http://task.soarinfotech.com/editor/coupon_search.php?action=rsynch-chk-couponblackkeyword&checkstr=" + encodeURI(title) + "&merchantid=" + cur_mer_id + "&checktype=title&sitename=" + cur_site;
    return ajaxApi(apiurl, '', { title: title });
}

function appnedsource(sourceid, cur_mer_id, source, couponid, cur_site) {
    var apiurl = "http://task.soarinfotech.com/editor/coupon_search.php?action=rsynch-append-source" + "&sourceid=" + sourceid + "&source=" + source + "&merchantid=" + cur_mer_id + "&site=" + cur_site + '&couponid=' + couponid;
    return ajaxApi(apiurl, '', null, 'text');
}

function ajaxApi(url, cache_name = '', params = null, returntype = 'json') {
    return new Promise(function(resolve, reject) {
        if (cache_name && cacheWorker('get', cache_name)) {
            resolve(JSON.parse(cacheWorker('get', cache_name)));
        } else {
            var type = params ? 'post' : 'get';
            $.ajax({
                type: type,
                url: url + addedParams(),
                data: params,
                dataType: returntype,
                success: function(resp) {
                    if (type == 'get' && resp.code == 0 && resp.data.length > 0) {
                        cacheWorker('set', cache_name, JSON.stringify(resp));
                        var keys = cacheWorker('get', 'allkeys');
                        if (cache_name) {
                            if (keys != null) {
                                var keys_arr = JSON.parse(keys);
                                keys_arr.push(cache_name);
                                cacheWorker('set', 'allkeys', JSON.stringify(keys_arr));
                            } else {
                                var tmp = [];
                                tmp.push(cache_name);
                                cacheWorker('set', 'allkeys', JSON.stringify(tmp));
                            }
                        }
                    }
                    resolve(resp);
                }
            });
        }
    });
}

function Base64() {

    // private property
    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

    // public method for encoding
    this.encode = function(input) {
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
    this.decode = function(input) {
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
    _utf8_encode = function(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
            var c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
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
    _utf8_decode = function(utftext) {
        var string = "";
        var i = 0;
        var c = c1 = c2 = 0;
        while (i < utftext.length) {
            c = utftext.charCodeAt(i);
            if (c < 128) {
                string += String.fromCharCode(c);
                i++;
            } else if ((c > 191) && (c < 224)) {
                c2 = utftext.charCodeAt(i + 1);
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                i += 2;
            } else {
                c2 = utftext.charCodeAt(i + 1);
                c3 = utftext.charCodeAt(i + 2);
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                i += 3;
            }
        }
        return string;
    }
}

function addedParams() {
    var token = localStorage.getItem('token');
    var user = localStorage.getItem('user');
    var str = "&token=" + token + "&user=" + user;
    return str;
}


function cacheWorker(type, key, value = '') {
    if (type == 'set') {
        localStorage.setItem(key, value);
    } else if (type == 'get') {
        return localStorage.getItem(key);
    } else if (type == 'del') {
        localStorage.removeItem(key);
    }
}