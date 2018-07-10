var ch = 0;
var domain = "";
var times = 0;
var hllock = false;

//监听消息 model + view
$(function() {

    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        // alert(window.location.href + window.location.hash);
        var base = new Base64();
        var cur_url = base.encode(window.location.href);

        // alert(window.location.href + window.location.hash);

        if (request.page == 1) {
            var p = "editor.html";
        } else {
            var p = "login.html";
        }
        var container = '<div id="coupertcontainer"  style=" position:fixed;font-size:15px;width:461px;position:fixed;top:15px;right:15px;height:621px;background-color:#fff;z-index:999999999999;box-shadow: rgba(0, 0, 0, 0.3) 1px 1px 6px;"></div>';
        var ifm = '<div class="myheader" style="cursor:move;height:5.5%;width:461px;background-color:rgb(12, 183, 84);"><div style="width:90px;height:100%;float:left;"><p style="color:white;margin-top:5px;margin-left:5px;">MMC Edit</p></div><div style="width:20px;height:100%;float:right;"><p style="margin-top:5px;font-size:19px;cursor:pointer;color:white;" id="myclose">X</p></div></div><div class="allbox" id="allboxcontainer" style="height:94.5%;margin-bottom:0px;"><input type="hidden" name="coupertfrmshow" id="coupertfrmshow" value="0"><iframe src="chrome-extension://' + getExtensionID() + '/' + p + '?tabid=' + request.tabid + '&domain=' + request.domain + '&cur_url=' + cur_url + '" id="frm" style="display:block;width:461px;height:583px;padding:0px;border:none;" frameborder="0" scrolling="no"></div>';
        if (request.action == 'popAdd') {

            ch = setInterval(function() {
                times++;

                if (times > 15) {
                    return false;
                }

                if ($("#coupertcontainer").length < 1) {


                    $('body').after(container);
                    $("#coupertcontainer").html(ifm);
                    clearInterval(ch);

                    $('#myclose').click(function() {
                        $("#coupertcontainer").hide();
                        $("#coupertfrmshow").val('1');
                    });
                    $('#coupertcontainer').Tdrag();
                    
                }

            }, 1000);
        }
        // console.log(hllock);
        // if(hllock === false){
            chrome.runtime.sendMessage({action:"getHllist"}, function(response){
                console.log(response);
                if(response.length > 0){

                    var kw_arr = response.data;
                    // if(kw_arr.length>0){
                        $(kw_arr).each(function(index, item) {
                            var pattern = '(\\b)' + item + '(\\b)';
                            $('body').highlightRegex(pattern);
                        });
                        hllock = true;
                    // }
                }
            });
        // }        
        if (request.action == 'showPop') {

            // console.log('starting...');
            // console.log('checking...');
            if ($("#coupertcontainer").length < 1) {

                $('body').after(container);
                $("#coupertcontainer").html(ifm);
                $('#myclose').click(function() {
                    $("#coupertcontainer").hide();
                    $("#coupertfrmshow").val('1');
                });
                $('#coupertcontainer').Tdrag();
            } else {
                if ($("#coupertfrmshow").val() == '1') {
                    $("#coupertcontainer").show();
                    $("#coupertfrmshow").val('0');
                } else {
                    $("#coupertcontainer").hide();
                    $("#coupertfrmshow").val('1');
                }
            }

        }



    });

    //for view
    chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {

        if (request.action == "refreshwd") {
            window.location.reload();
            return;
        }
        if (request.action == "refresurl") {

            // sendResponse({action:"refresurl",data:'ok....'});

        }
    });

    var timer;
    // $(function(){
    //     $(window).scroll(function(){
    //         console.log('position-top',$("#coupertcontainer").position().top);
    //         console.log('height',$("#coupertcontainer").height());
    //         console.log('offset-top',$("#coupertcontainer").offset().top);
    //         // clearInterval(timer);
    //         var topScroll = getScroll();
    //         // // var topDiv1 = $("#coupertcontainer").position().top;
    //         // // alert(topDiv1);
    //         // var topDiv = "30px";
    //         // //设置初始位置
    //         // var top= topScroll + parseInt(topDiv);
    //         timer = setInterval(function(){
    //                 $("#coupertcontainer").css("top", topScroll +"px");
    //                 $("#coupertcontainer").css("z-index", 999999999999);
    //                  // $("#coupertcontainer").animate({"top":top},100);
    //         },10)//设置时间
    //     })
    // })
    function getScroll(){
             var bodyTop = 0;  
             if (typeof window.pageYOffset != 'undefined') {  
                     bodyTop = window.pageYOffset;  
             } else if (typeof document.compatMode != 'undefined' && document.compatMode != 'BackCompat') {  
                     bodyTop = document.documentElement.scrollTop;  
             }  
             else if (typeof document.body != 'undefined') {  
                     bodyTop = document.body.scrollTop;  
             }  
             return bodyTop
    }


});




function getExtensionID() {
    return chrome.runtime && chrome.runtime.id ? chrome.runtime.id : chrome.i18n.getMessage("@@extension_id");
}


/* global SelectorGenerator */
let clickedElement;

function copyToClipboard(text) {
    const input = document.createElement("input");
    input.style.position = "fixed";
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand("Copy");
    document.body.removeChild(input);
}

function addClass(element, cls) {
    let classes = (element.className || "").split(" ");
    if (!classes.includes(cls)) {
        element.className = classes.concat([cls]).join(" ");
    }
}

function removeClass(element, cls) {
    let classes = (element.className || "").split(" ");
    if (classes.includes(cls)) {
        element.className = classes.filter(_ => _ !== cls).join(" ");
    }
}

function highlight(element) {
    if (!element) {
        return;
    }
    const higlightClass = "__copy-css-selector-highlighted";
    addClass(element, higlightClass);
    setTimeout(() => {
        removeClass(element, higlightClass);
    }, 2000);
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
document.addEventListener("mousedown", (event) => {
    clickedElement = event.target;
}, true);

chrome.runtime.onMessage.addListener((request) => {
    if (request && request.target === "copy") {
        let selectorGenerator = new SelectorGenerator({ querySelectorAll: window.document.querySelectorAll.bind(window.document) });
        let selector = selectorGenerator.getSelector(clickedElement);
        highlight(clickedElement);
        if ($(selector).text() == 'selector') {
            var text = " ";
        } else {
            var text = $(selector).text().replace(/\s+/g, ' ');
        }
        copyToClipboard(text);
    }
});