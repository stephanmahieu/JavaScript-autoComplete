/*
    JavaScript autoComplete v1.0.4
    Copyright (c) 2014 Simon Steinberger / Pixabay
    GitHub: https://github.com/Pixabay/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php

    Forked by Stephan Mahieu
    Date: 13 oct 2017
    GitHub: https://github.com/stephanmahieu/JavaScript-autoComplete
*/

let autoComplete = (function(){
    // "use strict";
    function autoComplete(options){
        if (!document.querySelector) {
            return;
        }

        // helpers
        function addEvent(el, type, handler) {
            if (el.attachEvent) {
                el.attachEvent('on'+type, handler);
            } else {
                el.addEventListener(type, handler);
            }
        }
        function removeEvent(el, type, handler) {
            // if (el.removeEventListener) not working in IE11
            if (el.detachEvent) {
                el.detachEvent('on'+type, handler);
            } else {
                el.removeEventListener(type, handler);
            }
        }
        function live(elClass, event, cb, context){
            addEvent(context || document, event, function(e){
                let found, el = e.target || e.srcElement;
                while (el && !(found = el.classList.contains(elClass))) {
                    el = el.parentElement;
                }
                if (found) {
                    cb.call(el, e);
                }
            });
        }

        const defaultOptions = {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            offsetLeft: 0,
            offsetTop: 1,
            cache: 1,
            menuClass: '',
            renderItem: function (item, search){
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                const re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' + item.replace(re, "<b>$1</b>") + '</div>';
            },
            onSelect: function(e, term, item){}
        };
        for (let k in options) {
            if (options.hasOwnProperty(k)) defaultOptions[k] = options[k];
        }

        // init
        const elems = typeof defaultOptions.selector === 'object' ? [defaultOptions.selector] : document.querySelectorAll(defaultOptions.selector);
        for (let i=0; i<elems.length; i++) {
            let elem = elems[i];

            // create suggestions container "sc"
            elem.sc = document.createElement('div');
            elem.sc.classList.add('autocomplete-suggestions');
            if (defaultOptions.menuClass) {
                elem.sc.classList.add(defaultOptions.menuClass);
            }

            elem.autocompleteAttr = elem.getAttribute('autocomplete');
            elem.setAttribute('autocomplete', 'false');
            elem.cache = {};
            elem.last_val = '';

            elem.updateSC = function(resize, next){
                const rect = elem.getBoundingClientRect();
                elem.sc.style.left = Math.round(rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + defaultOptions.offsetLeft) + 'px';
                elem.sc.style.top = Math.round(rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + defaultOptions.offsetTop) + 'px';
                elem.sc.style.width = Math.round(rect.right - rect.left) + 'px'; // outerWidth
                if (!resize) {
                    elem.sc.style.display = 'block';
                    if (!elem.sc.maxHeight) {
                        elem.sc.maxHeight = parseInt((window.getComputedStyle ? getComputedStyle(elem.sc, null) : elem.sc.currentStyle).maxHeight);
                    }
                    if (!elem.sc.suggestionHeight) {
                        elem.sc.suggestionHeight = elem.sc.querySelector('.autocomplete-suggestion').offsetHeight;
                    }
                    if (elem.sc.suggestionHeight) {
                        if (!next) {
                            elem.sc.scrollTop = 0;
                        } else {
                            const scrTop = elem.sc.scrollTop, selTop = next.getBoundingClientRect().top - elem.sc.getBoundingClientRect().top;
                            if (selTop + elem.sc.suggestionHeight - elem.sc.maxHeight > 0) {
                                elem.sc.scrollTop = selTop + elem.sc.suggestionHeight + scrTop - elem.sc.maxHeight;
                            }
                            else if (selTop < 0) {
                                elem.sc.scrollTop = selTop + scrTop;
                            }
                        }
                    }
                }
            };
            addEvent(window, 'resize', elem.updateSC);
            document.body.appendChild(elem.sc);

            live('autocomplete-suggestion', 'mouseleave', function(/* e */) {
                const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) {
                    setTimeout(function(){ sel.classList.remove('selected'); }, 20);
                }
            }, elem.sc);

            live('autocomplete-suggestion', 'mouseover', function(/* e */) {
                const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                if (sel) {
                    sel.classList.remove('selected');
                }
                this.classList.add('selected');
            }, elem.sc);

            live('autocomplete-suggestion', 'mousedown', function(e) {
                if (this.classList.contains('autocomplete-suggestion')) { // else outside click
                    const v = this.getAttribute('data-val');
                    elem.value = v;
                    defaultOptions.onSelect(e, v, this);
                    elem.sc.style.display = 'none';
                }
            }, elem.sc);

            live('autocomplete-suggestion', 'touchstart', function(e){
                if (this.classList.contains('autocomplete-suggestion')) { // else outside touch
                    const v = this.getAttribute('data-val');
                    elem.value = v;
                    defaultOptions.onSelect(e, v, this);
                    elem.sc.style.display = 'none';
                }
            }, elem.sc);

            elem.blurHandler = function(){
                let over_sb;
                try {
                    over_sb = document.querySelector('.autocomplete-suggestions:hover');
                } catch(e) {
                    over_sb = 0;
                }
                if (!over_sb) {
                    elem.last_val = elem.value;
                    elem.sc.style.display = 'none';
                    setTimeout(function(){ elem.sc.style.display = 'none'; }, 350); // hide suggestions on fast input
                } else if (elem !== document.activeElement) {
                    setTimeout(function(){ elem.focus(); }, 20);
                }
            };
            addEvent(elem, 'blur', elem.blurHandler);

            const suggest = function(data){
                const val = elem.value;
                elem.cache[val] = data;
                if (data.length && val.length >= defaultOptions.minChars) {
                    let s = '';
                    for (let i=0;i<data.length;i++) {
                        s += defaultOptions.renderItem(data[i], val);
                    }
                    elem.sc.innerHTML = s;
                    elem.updateSC(0);
                }
                else {
                    elem.sc.style.display = 'none';
                }
            };

            elem.keydownHandler = function(e){
                const key = window.event ? e.keyCode : e.which;
                // down (40), up (38)
                if ((key === 40 || key === 38) && elem.sc.innerHTML) {
                    let next, sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                    if (!sel) {
                        next = (key === 40) ? elem.sc.querySelector('.autocomplete-suggestion') : elem.sc.childNodes[elem.sc.childNodes.length - 1]; // first : last
                        next.classList.add('selected');
                        elem.value = next.getAttribute('data-val');
                    } else {
                        next = (key === 40) ? sel.nextSibling : sel.previousSibling;
                        if (next) {
                            sel.classList.remove('selected');
                            next.classList.add('selected');
                            elem.value = next.getAttribute('data-val');
                        }
                        else {
                            sel.classList.remove('selected');
                            elem.value = elem.last_val; next = 0;
                        }
                    }
                    elem.updateSC(0, next);
                    return false;
                }
                // esc
                else if (key === 27) {
                    elem.value = elem.last_val;
                    elem.sc.style.display = 'none';
                }
                // enter
                else if (key === 13 || key === 9) {
                    const sel = elem.sc.querySelector('.autocomplete-suggestion.selected');
                    if (sel && elem.sc.style.display !== 'none') {
                        defaultOptions.onSelect(e, sel.getAttribute('data-val'), sel);
                        setTimeout(function(){ elem.sc.style.display = 'none'; }, 20);
                    }
                }
            };
            addEvent(elem, 'keydown', elem.keydownHandler);

            elem.keyupHandler = function(e){
                const key = window.event ? e.keyCode : e.which;
                if (!key || (key < 35 || key > 40) && key !== 13 && key !== 27) {
                    const val = elem.value;
                    if (val.length >= defaultOptions.minChars) {
                        if (val !== elem.last_val) {
                            elem.last_val = val;
                            clearTimeout(elem.timer);
                            if (defaultOptions.cache) {
                                if (val in elem.cache) {
                                    suggest(elem.cache[val]);
                                    return;
                                }
                                // no requests if previous suggestions were empty
                                for (let i=1; i<val.length-defaultOptions.minChars; i++) {
                                    let part = val.slice(0, val.length-i);
                                    if (part in elem.cache && !elem.cache[part].length) {
                                        suggest([]);
                                        return;
                                    }
                                }
                            }
                            elem.timer = setTimeout(function(){ defaultOptions.source(val, suggest) }, defaultOptions.delay);
                        }
                    } else {
                        elem.last_val = val;
                        elem.sc.style.display = 'none';
                    }
                }
            };
            addEvent(elem, 'keyup', elem.keyupHandler);

            elem.focusHandler = function(e){
                elem.last_val = '\n';
                elem.keyupHandler(e)
            };
            if (!defaultOptions.minChars) {
                addEvent(elem, 'focus', elem.focusHandler);
            }
        }

        // public destroy method
        this.destroy = function(){
            for (let i=0; i<elems.length; i++) {
                let that = elems[i];
                removeEvent(window, 'resize', that.updateSC);
                removeEvent(that, 'blur', that.blurHandler);
                removeEvent(that, 'focus', that.focusHandler);
                removeEvent(that, 'keydown', that.keydownHandler);
                removeEvent(that, 'keyup', that.keyupHandler);
                if (that.autocompleteAttr) {
                    that.setAttribute('autocomplete', that.autocompleteAttr);
                }
                else {
                    that.removeAttribute('autocomplete');
                }
                document.body.removeChild(that.sc);
                that = null;
            }
        };
    }
    return autoComplete;
})();

(function(){
    if (typeof define === 'function' && define.amd)
        define('autoComplete', function () { return autoComplete; });
    else if (typeof module !== 'undefined' && module.exports)
        module.exports = autoComplete;
    else
        window.autoComplete = autoComplete;
})();
