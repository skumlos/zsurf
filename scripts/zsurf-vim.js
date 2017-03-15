var hintNumStr = '';
var hintElems = [];
var hintOpenInNewTab = false;
var hintEnabled = false;
var hintKeys = ";asdfghjkl"
var textInputs = ['textarea','date', 'datetime-local', 'email', 'file', 'month','number', 'password', 'search', 'tel', 'text', 'url', 'week'];
var allowFocus = [];
var blockElems = [];
var highlights = [];
var findPointer = -1;
var bypassBlocker = false;
var zoomLevel = 1;

// Remove scrollbars
document.documentElement.style.overflow = 'hidden';

window.addEventListener("load", function(event) { 

	// Unfocus elements on page
	unfocus();
	
	// Add Google search bar to list of elements to block focus stealing.
	blockElems = blockElems.concat(Array.from(document.querySelectorAll("input.gsfi")));

	// Block everything in blockElems from stealing focus.
	for(i in blockElems){
		block = blockElems[i];
		block.onclick = function(e){allowFocus.push(this);};
		block.onfocus = function(e){
			if(!bypassBlocker){
			if(allowFocus.indexOf(this)==-1){
				this.blur();
				setTimeout(function(){
					if(allowFocus.indexOf(block) != -1) {
						console.log("allow focus");
						block.focus();
					}
					else {
						allowFocus.splice(i,1);
						console.log("block focus");
					}
				}, 1, block, i);
			} else
			{
				allowFocus.splice(i,1);
			}
			} else {
				bypassBlocker = false;	
			}
		}
	}
});

document.addEventListener( 'keydown', initKeyBind, true );

function toString(num){
	var strNum = '';
	for (var i = 0; i < num.toString().length; i++) {
		strNum += hintKeys.charAt(Number(num.toString().charAt(i)));	
	}
	return strNum;
}

function toNumber(str){
	var numStr = '';
	for (var i = 0; i < str.length; i++) {
		numStr += hintKeys.indexOf(str.charAt(i));
	}
	return Number(numStr);
}

function simulate(el, etype){
  if (el.fireEvent) {
    el.fireEvent('on' + etype);
  } else {
    var evObj = document.createEvent('Events');
    evObj.initEvent(etype, true, false);
    el.dispatchEvent(evObj);
  }
}

function hintMode(newtab){
    hintEnabled = true;
    if (newtab) {
        hintOpenInNewTab = true;
    } else {
        hintOpenInNewTab = false;
    }
    setHints();
    document.removeEventListener('keydown', initKeyBind, true);
    document.addEventListener('keydown', hintHandler, true);
    hintNumStr = '';
}

function hintHandler(e){
	e.preventDefault ? e.preventDefault() : e.returnValue = false;
    var pressedKey = getKey(e);
    if (pressedKey == 'Enter') {
        if (hintNumStr == '')
            hintNumStr = '1';
        judgeHintNum(toNumber(hintNumStr));

    } else if (hintKeys.indexOf(pressedKey) == -1) {
        removeHints();
    } else {
        hintNumStr += pressedKey;
        var hintNum = toNumber(hintNumStr);
        if (hintNum * 10 > hintElems.length + 1) {
            judgeHintNum(hintNum);
        } else {
            var hintElem = hintElems[hintNum - 1];
			
            if (hintElem != undefined && hintElem.tagName.toLowerCase() == 'a') {
                setHighlight(hintElem, true);
            }
        }
    }
}

function setHighlight(elem, isActive) {
    if (isActive) {
        var activeElem = document.body.querySelector('a[highlight=hint_active]');
        if (activeElem != undefined)
            activeElem.setAttribute('highlight', 'hint_elem');
        elem.setAttribute('highlight', 'hint_active');
    } else {
        elem.setAttribute('highlight', 'hint_elem');
    }
}

function setHintRules() {
    var ss = document.styleSheets[0];
	if(ss != undefined) {
    	ss.insertRule('a[highlight=hint_elem] {background-color: yellow !important}', 0);
    	ss.insertRule('a[highlight=hint_active] {background-color: lime !important;}', 0);
	}
}

function deleteHintRules() {
    var ss = document.styleSheets[0];

	if(ss != undefined) {
    	ss.deleteRule(0);
    	ss.deleteRule(0);
	}
}

function judgeHintNum(hintNum) {
    var hintElem = hintElems[hintNum - 1];
    if (hintElem != undefined) {
        execSelect(hintElem);
    } else {
        removeHints();
    }
}

function execSelect(elem) {
	
    var tagName = elem.tagName.toLowerCase();
    var type = elem.type ? elem.type.toLowerCase() : "";
	var tracking = elem.getAttribute('data-ui-tracking-context') ? elem.getAttribute('data-ui-tracking-context').toLowerCase(): "";
	console.log(tracking);
    if (tagName == 'a' && elem.href != '') {
        setHighlight(elem, true);
        // TODO: ajax, <select>
        if (hintOpenInNewTab)
            window.open(elem.href);
        else location.href=elem.href;

    } else if (tagName == 'input' && (type == "submit" || type == "button" || type == "reset" || tracking)) {
		simulate(elem, 'dblclick');
    } else if (tagName == 'input' && (type == "radio" || type == "checkbox")) {
        // TODO: toggle checkbox
        elem.checked = !elem.checked;
    } else if (tagName == 'input' || tagName == 'textarea') {
		simulate(elem, 'dblclick');
        elem.setSelectionRange(elem.value.length, elem.value.length);
    }
    removeHints();
}

function setHints() {
    setHintRules();
    var winTop = window.scrollY/zoomLevel;
    var winBottom = winTop + (window.innerHeight/zoomLevel);
    var winLeft = window.scrollX/zoomLevel;
    var winRight = winLeft + (window.innerWidth/zoomLevel);
    // TODO: <area>
    var elems = document.body.querySelectorAll('a, input:not([type=hidden]), [data=events], textarea, select, button, [onclick], [data-ui-tracking-context]');
    var div = document.createElement('div');
    div.setAttribute('highlight', 'hints');
    document.body.appendChild(div);
    for (var i = 0; i < elems.length; i++) {
        var elem = elems[i];
        if (!isHintDisplay(elem))
            continue;
        var pos = elem.getBoundingClientRect();
        var elemTop = winTop + pos.top;
        var elemBottom = winTop + pos.bottom;
        var elemLeft = winLeft + pos.left;
        var elemRight = winLeft + pos.left;
        if ( elemBottom >= winTop && elemTop <= winBottom) {
            hintElems.push(elem);
            setHighlight(elem, false);
            var span = document.createElement('span');
            span.style.cssText = [ 
                'left: ', elemLeft, 'px !important;',
                'top: ', elemTop, 'px !important;',
                'position: absolute !important;',
                'background-color: ' + (hintOpenInNewTab ? '#ff6600' : 'red') + ' !important;',
                'color: white !important;',
				'font-family: Arial, Helvetica, sans-serif !important;',
				'font-style: normal !important;',
                'font-size: 13px !important;',
                'font-weight: bold !important;',
                'padding: 0px 1px !important;',
				'margin: 0px !important;',
                'z-index: 2147483647 !important;',
				'text-transform: uppercase !important;',
                    ].join('');
            span.innerHTML = toString(hintElems.length);
            div.appendChild(span);
            if (elem.tagName.toLowerCase() == 'a') {
                if (hintElems.length == 1) {
                    setHighlight(elem, true);
                } else {
                    setHighlight(elem, false);
                }
            }
        }
    }
}

function isHintDisplay(elem) {
    var pos = elem.getBoundingClientRect();
    return (pos.height != 0 && pos.width != 0);
}

function removeHints() {
    if (!hintEnabled)
        return;
    hintEnabled = false;
    deleteHintRules();
    for (var i = 0; i < hintElems.length; i++) {
        hintElems[i].removeAttribute('highlight');
    }
    hintElems = [];
    hintNumStr = '';
    var div = document.body.querySelector('div[highlight=hints]');
    if (div != undefined) {
        document.body.removeChild(div);
    }
    document.removeEventListener('keydown', hintHandler, true);
    document.addEventListener('keydown', initKeyBind, true);
}

function addKeyBind( key, func, eve ){
    var pressedKey = getKey(eve);
    if( pressedKey == key ){
        eve.preventDefault();
        func();
    }
}

function openUrl(url, newTab){
	var urlTokens = url.split("/");
	if(newTab == false){
		if(urlTokens[0].indexOf(":") != -1){
			window.location.href = url;
		} else {
			window.location.href = 'http://' + url;
		}
	} else
	{
		if(urlTokens[0].indexOf(":") != -1){
			window.open(url);
		} else {
			window.open('http://' + url);
		}
	}
}

function find(word, node)
{
	if (!node)
		node = document.body;

	for (node=node.firstChild; node; node=node.nextSibling)
	{
		if (node.nodeType == 3)
		{
			var n = node;
			var match_pos = 0;
			match_pos = n.nodeValue.toLowerCase().indexOf(word.toLowerCase());	
			if (match_pos != -1)
			{
				var before = n.nodeValue.substr(0, match_pos);
				var middle = n.nodeValue.substr(match_pos, word.length);
				var after = document.createTextNode(n.nodeValue.substr(match_pos+word.length));
				var highlight_span = document.createElement("span");

				highlight_span.style.cssText = [ 
                'background-color: yellow !important;',
                'z-index: 2147483647 !important;',
                ].join('');
				
				highlight_span.appendChild(document.createTextNode(middle));
				n.nodeValue = before;
				n.parentNode.insertBefore(after, n.nextSibling);
				n.parentNode.insertBefore(highlight_span, n.nextSibling);
				highlights.push(highlight_span);
				highlight_span.id = "highlight_span"+highlights.length;
				node=node.nextSibling;
			}
		} else
		{
			if (node.nodeType == 1 && node.nodeName.match(/textarea/i) && !getStyle(node, "display").match(/none/i)) 
			{
				textarea2pre(node);
			} else
			{
				if (node.nodeType == 1 && !getStyle(node, "visibility").match(/hidden/i) &&
					node.nodeType == 1 && !getStyle(node, "display").match(/none/i))
				{
					find(word, node);
				}
			}
		}
	}
}

function findNext()
{
	var current_find;
	
	if (findPointer != -1)
	{
		current_find = highlights[findPointer];

		current_find.style.cssText = [ 
			'background-color: yellow !important;',
			'z-index: 2147483647 !important;',
		].join('');
	}	
	
	findPointer++;
	
	if (findPointer >= highlights.length)
			findPointer = 0;
	
	var display_find = findPointer+1;
	
	current_find = highlights[findPointer];
	
	current_find.style.cssText = [ 
		'background-color: orange !important;',
		'z-index: 2147483647 !important;',
	].join('');
			
	scrollToPosition(highlights[findPointer]);
	
}

function findPrev()
{
	var current_find;
	
	if (highlights.length < 1) return;
	
	if (findPointer != -1)
	{
		current_find = highlights[findPointer];
		
		current_find.style.cssText = [ 
			'background-color: yellow !important;',
			'z-index: 2147483647 !important;',
		].join('');
	}	
	
	findPointer--;
	
	if (findPointer < 0)
			findPointer = highlights.length-1;
	
	var display_find = findPointer+1;
	
	current_find = highlights[findPointer];
	
	current_find.style.cssText = [ 
		'background-color: orange !important;',
		'z-index: 2147483647 !important;',
	].join('');
				
	scrollToPosition(highlights[findPointer]);
}

function scrollToPosition(field)
{ 
	var scrollLeft = document.body.scrollLeft || document.documentElement.scrollLeft;
	var scrollTop = document.body.scrollTop || document.documentElement.scrollTop;
	var scrollBottom = (window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight) + scrollTop;
	var scrollRight = (window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth) + scrollLeft;

   if (field)
   {
	   var theElement = field;  
	   var elemPosX = theElement.offsetLeft;  
	   var elemPosY = theElement.offsetTop;  
	   theElement = theElement.offsetParent;  
	   	while(theElement != null)
	   	{  
			elemPosX += theElement.offsetLeft   
			elemPosY += theElement.offsetTop;  
			theElement = theElement.offsetParent; 
		} 
		if (elemPosX < scrollLeft || elemPosX > scrollRight ||
			elemPosY < scrollTop || elemPosY > scrollBottom) 
		field.scrollIntoView();
	}
}

function getStyle(el,styleProp)
{
	var x = (document.getElementById(el)) ? document.getElementById(el) : el;
	if (x.currentStyle) // IE
		var y = x.currentStyle[styleProp];
	else if (window.getComputedStyle)  // FF
		var y = document.defaultView.getComputedStyle(x,null).getPropertyValue(styleProp);
	return y;
}

function parseCommand(e){
	if(e.keyCode == 13) {
		var input = document.getElementById('zsurf-console');

		var commandTokens = input.value.split(' ');

		if( commandTokens[0] === ':open' ){
			commandTokens.shift();
			var url = commandTokens.join(' ');
			openUrl(url, false);
			input.remove();
			return;
		} else if( commandTokens[0] === ':search' ){
			commandTokens.shift();
			var search = commandTokens.join(' ');
			find(search);
			input.remove();
			return;
		} else if( commandTokens[0] === ':openTab' ){
			commandTokens.shift();
			var url = commandTokens.join(' ');
			openUrl(url, true);
			input.remove();
			return;
		} else if( commandTokens[0] === ':q' ){
			window.close();
			input.remove();
			return;
		}

	} else if(e.keyCode == 8) {
		var input = document.getElementById('zsurf-console');

		if(input.value.length == 1){
			input.remove();
			return;
		}
	}
} 

function inputText(command){
    var input = document.createElement('input');
	input.id = "zsurf-console";
	input.type = "text";
	input.addEventListener('keydown', parseCommand);
    input.style.cssText = [ 
		'left: 0px !important;',
		'bottom: 0px !important;',
		'width: 100% !important;',
		'height: 30px !important;',
		'position: fixed !important;',
		'background-color: black !important;',
		'color: white !important;',
		'font-family: Arial, Helvetica, sans-serif !important;',
		'font-style: normal !important;',
        'font-size: 13px !important;',
        'font-weight: bold !important;',
		'border: 0 !important;',
        'z-index: 2147483647 !important;',
		'margin: 0 !important;',
		'padding: 0 !important;',
    ].join('');

	input.value = command;

    document.body.appendChild(input);
	input.focus();
}

function unfocus(){
	removeHints()
	if(document.activeElement != null){
		if(document.activeElement.id.indexOf('zsurf-console') == -1){
				setTimeout(function(){
					document.activeElement.blur();
				}, 1);
			
		} else {
			document.activeElement.remove();
		}
	}
}

function setClipboard(text){
    var input = document.createElement('input');
	input.style.position = "fixed";
	input.style.top = 0;
	input.type = "text";
    document.body.appendChild(input);
	input.value = window.location;
	input.focus();
	input.select();
	document.execCommand('copy', false, text);
	input.remove();
}

function getClipboard(text){
	return 0;
}

function zoom(step){
	zoomLevel = Math.min(Math.max(zoomLevel + step, 0.2), 5);
	document.body.style.zoom = zoomLevel;
}

function initKeyBind(e){

    var t = e.target;
    if( t.nodeType == 1){
		if( textInputs.indexOf(document.activeElement.type) == -1 &&
			document.activeElement.contentEditable != true
			){
			addKeyBind( 'f', function(){hintMode();}, e );
			addKeyBind( 'F', function(){hintMode(true);}, e );
			addKeyBind( 'o', function(){inputText(":open ");}, e );
			addKeyBind( 't', function(){inputText(":openTab ");}, e );
			addKeyBind( 'r', function(){window.location.reload();}, e );
			addKeyBind( ':', function(){inputText(":");}, e );
			addKeyBind( 'y', function(){setClipboard(window.location);}, e );

			addKeyBind( 'j', function(){window.scrollBy(0,50);}, e );
			addKeyBind( 'k', function(){window.scrollBy(0,-50);}, e );
			addKeyBind( 'h', function(){window.scrollBy(-50,0);}, e );
			addKeyBind( 'l', function(){window.scrollBy(50,0);}, e );

			addKeyBind( 'H', function(){window.history.back();}, e );
			addKeyBind( 'L', function(){window.history.forward();}, e );

			addKeyBind( 'g', function(){window.scrollTo(0,0);}, e );
			addKeyBind( 'G', function(){window.scrollTo(0,document.body.scrollHeight);}, e );

			addKeyBind( 'U', function(){window.scrollBy(0,-window.innerHeight);}, e );
			addKeyBind( 'D', function(){window.scrollBy(0,window.innerHeight);}, e );

			addKeyBind( 'I', function(){zoom(0.1);}, e );
			addKeyBind( 'O', function(){zoom(-0.1);}, e );

			addKeyBind( 'Divide', function(){inputText(":search ");}, e );
			addKeyBind( 'p', function(){findPrev();}, e );
			addKeyBind( 'n', function(){findNext();}, e );

		} else{
			addKeyBind( 'Esc', function(){unfocus();}, e );
		}
    }
}

var keyId = {
    "U+0008" : "BackSpace",
    "U+0009" : "Tab",
    "U+0018" : "Cancel",
    "U+001B" : "Esc",
    "U+0020" : "Space",
    "U+007F" : "Delete",
    "U+20AC" : "€",
    "U+0021" : "!",
    "U+0022" : "\"",
    "U+0023" : "#",
    "U+0024" : "$",
    "U+0026" : "&",
    "U+0027" : "'",
    "U+0028" : "(",
    "U+0029" : ")",
    "U+002A" : "*",
    "U+002B" : "+",
    "U+002C" : ",",
    "U+002D" : "-",
    "U+002E" : ".",
    "U+002F" : "/",
    "U+0030" : "0",
    "U+0031" : "1",
    "U+0032" : "2",
    "U+0033" : "3",
    "U+0034" : "4",
    "U+0035" : "5",
    "U+0036" : "6",
    "U+0037" : "7",
    "U+0038" : "8",
    "U+0039" : "9",
    "U+003A" : ":",
    "U+003B" : ";",
    "U+003C" : "<",
    "U+003D" : "=",
    "U+003E" : ">",
    "U+003F" : "?",
    "U+0040" : "@",
    "U+0041" : "a",
    "U+0042" : "b",
    "U+0043" : "c",
    "U+0044" : "d",
    "U+0045" : "e",
    "U+0046" : "f",
    "U+0047" : "g",
    "U+0048" : "h",
    "U+0049" : "i",
    "U+004A" : "j",
    "U+004B" : "k",
    "U+004C" : "l",
    "U+004D" : "m",
    "U+004E" : "n",
    "U+004F" : "o",
    "U+0050" : "p",
    "U+0051" : "q",
    "U+0052" : "r",
    "U+0053" : "s",
    "U+0054" : "t",
    "U+0055" : "u",
    "U+0056" : "v",
    "U+0057" : "w",
    "U+0058" : "x",
    "U+0059" : "y",
    "U+005A" : "z",
    "U+00DB" : "[",
    "U+00DC" : "\\",
    "U+00DD" : "]",
    "U+005E" : "^",
    "U+005F" : "_",
    "U+0060" : "`",
    "U+007B" : "{",
    "U+007C" : "|",
    "U+007D" : "}",
    "U+00A1" : "¡",
}

function getKey(evt){
    var key = keyId[evt.keyIdentifier] || evt.keyIdentifier,
        ctrl = evt.ctrlKey ? 'C-' : '',
        meta = (evt.metaKey || evt.altKey) ? 'M-' : '',
        shift = evt.shiftKey ? 'S-' : '';
    if (evt.shiftKey){
        if (/^[a-z]$/.test(key)) 
            return ctrl+meta+key.toUpperCase();
        if (/^[0-9]$/.test(key)) {
            switch(key) {
                // TODO
                case "4":
                    key = "$";
                break;
            };
            return key;
        }
        if (/^(Enter|Space|BackSpace|Tab|Esc|Home|End|Left|Right|Up|Down|PageUp|PageDown|F(\d\d?))$/.test(key)) 
            return ctrl+meta+shift+key;
    }
    return ctrl+meta+key;
}