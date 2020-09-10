var socket;


/* on document load
============================================================================= */

window.addEventListener("load", () => {

  MainInit.setViewportForMobiles();

  MainInit.setupBannerMsgResponsiveness();

  for (let msg of msgsToFlash) {
    BannerMsg.set(msg);
  }

  if (!Cookie.get("cookie_msg_shown")) {
    const privacyMsg = BannerMsg.set(lex["cookie_msg"]);
    privacyMsg.getElementsByClassName("closer")[0].addEventListener("click", () => {
      Cookie.set("cookie_msg_shown", "true", 365)
    });
  }

  MainInit.setupLangSelect();

  MainInit.setupSDropMenus();

  MainInit.setupExclusiveCheckboxGroups();

  MainInit.setupSelects();

  MainInit.setupOverlays();

  if (Number(document.getElementById("notificationsCount").innerHTML) < 1) {
    document.getElementById("notificationsCount").classList.remove("active");
  }

  if (currentUserIsAuthenticated) {
    MainInit.setupGlobalSocket();
  }
});


const MainInit = {

  setViewportForMobiles: function(){
    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
      function do_setViewportForMobiles() {
        const ww = window.screen.width;
        const body_mw = getComputedStyle(document.body).minWidth;
        const mw = Number(body_mw.substring(0,body_mw.length-2));
        const ratio =  ww / mw;
        const viewport_meta_tag = document.getElementById('viewport');
        if( ww < mw){
          viewport_meta_tag.setAttribute('content', 'initial-scale=' + ratio + ', maximum-scale=' + ratio + ', minimum-scale=' + ratio + ', user-scalable=no, width=' + mw);
        }
      }
      do_setViewportForMobiles();
      window.addEventListener('resize', do_setViewportForMobiles);
    }
  },

  setupGlobalSocket: function() {
    socket = io.connect();
  
    if (pageUrl.pathname == "/") {
      installGlobalSocketEventHandlersForHome();
    }
    else if (pageUrl.pathname.startsWith("/chat")) {
      installGlobalSocketEventHandlersForChat();
    }
    else {
      MainInit.installDefaultGlobalSocketEventHandlers();
      if (typeof(project) !== 'undefined') {
        installExtraGlobalSocketEventHandlersForProject();
      }
    }
  },

  installDefaultGlobalSocketEventHandlers: function() {
    socket.on("disconnect", EventCallback.socketDisconnected);
    socket.on("receive_msg", (_) => NotificationsCount.increment());
    socket.on("receive_friendship_request", (_) => NotificationsCount.increment());
  },

  setupLangSelect: function() {
    document.getElementById("selectEn").addEventListener("click", () => {
      Cookie.set("lang", "en", 36500);
      location.reload();
    });

    document.getElementById("selectDe").addEventListener("click", () => {
      Cookie.set("lang", "de", 36500);
      location.reload();
    });
  },
  
  setupBannerMsgResponsiveness: function() {
    window.addEventListener("resize", () => {
      for (let bannerMsg of BannerMsg.list) {
        if (window.innerHeight < document.getElementsByTagName("body")[0].getBoundingClientRect().height) {
          bannerMsg.classList.add("atScreenBottom");
          bannerMsg.classList.remove("aboveFooter");
        }else {
          bannerMsg.classList.add("aboveFooter");
          bannerMsg.classList.remove("atScreenBottom");
        }
      }
    });
  
    addResizeListener(document.getElementById("content"), () => {
      for (let bannerMsg of BannerMsg.list) {
        if (window.innerHeight < document.getElementsByTagName("body")[0].getBoundingClientRect().height) {
          bannerMsg.classList.add("atScreenBottom");
          bannerMsg.classList.remove("aboveFooter");
        }else {
          bannerMsg.classList.add("aboveFooter");
          bannerMsg.classList.remove("atScreenBottom");
        }
      }
    });
  },
  
  setupSDropMenus: function() {
    for (let sDropMenu of document.getElementsByClassName("sDropMenu")) {
      sDropMenu.addEventListener("click", () => DomHelpers.activate(sDropMenu), {once: true});
    }
  },
  
  setupExclusiveCheckboxGroups: function() {
    for (let exclusiveCheckboxGroup of document.getElementsByClassName("exclusiveCheckboxGroup")) {
      for (let checkBoxInput of exclusiveCheckboxGroup.getElementsByClassName("checkBoxInput")) {
        checkBoxInput.addEventListener("change", (e) => {
          if (e.target.checked) {
            for (let _checkBoxInput of DomHelpers.getParent(e.target, "exclusiveCheckboxGroup").getElementsByClassName("checkBoxInput")) {
              if (_checkBoxInput != e.target) {
                _checkBoxInput.checked = false;
              }
            }
          } else {
            e.target.checked = true;
          }
        });
      }
    }
  },
  
  setupSelects: function() {
    for (let select of document.getElementsByClassName("select")) {
      MainInit.setupSelect(select);
    }
  },
  
  setupSelect: function(select) {
    select.addEventListener("click", () => DomHelpers.activate(select), {once: true});
    for (let option of select.getElementsByTagName("li")) {
      option.addEventListener("click", () => {
        if (option.dataset.checked == "true") {
          option.dataset.checked = "false";
          option.classList.remove("active");
        } else {
          option.dataset.checked = "true";
          if (!select.classList.contains("multiple")) {
            const actives = select.getElementsByClassName(".active");
            if (actives) {
              for (let active_option of actives) {
                active_option.classList.remove("active");
              }
            }
          }
          option.classList.add("active");
        }
      })
    }
  },
  
  setupOverlays: function() {
    for (let overlay of document.getElementsByClassName("overlay")) {
      overlay.addEventListener("click", () => {
        if (! Flag.ignoreOverlayClick) {
          Modal.hideAll();
        }
      });
    }

    for (let loadingOverlay of document.getElementsByClassName("loadingOverlay")) {
      loadingOverlay.addEventListener("click", () => {
        if (! Flag.ignoreOverlayClick) {
          LoadingAnim.stopAll();
        }
      });
    }
  
    document.body.addEventListener("wheel", (e) => {
      if (document.querySelector(".overlay.active")) {
        if (e.target.classList.contains("modal")) {
          if (e.target.scrollHeight > e.target.clientHeight && e.target.style.overflow != "hidden" && e.target.style.overflowY != "hidden") {
            return;
          }
        } 
        else if (DomHelpers.getParent(e.target, "modal")) {
          for (let dom_el of DomHelpers.getAllParentsUpTo(e.target, "modal")) {
            if (dom_el.scrollHeight > dom_el.clientHeight && dom_el.style.overflow != "hidden" && dom_el.style.overflowY != "hidden") {
              return;
            }
          }
        }
        e.preventDefault();
      }
    });
  }
}


/* on document unload
============================================================================= */

window.addEventListener("beforeunload", () => Flag.pageIsUnloading=true);


/* flags
============================================================================= */

const Flag = {
  
  pageIsUnloading: false,

  ignoreSocketDisconnect: false,

  ignoreOverlayClick: false
}


/* event callbacks
============================================================================= */

const EventCallback = {
  socketDisconnected: function() {
    setTimeout(() => {
      if (! Flag.pageIsUnloading && ! Flag.ignoreSocketDisconnect) {
          Modal.hideAll();
          Flag.ignoreOverlayClick = true;
          document.getElementById("disconnectModal").classList.add("active");
          document.getElementsByClassName("overlay")[0].classList.add("active");
      }
    }, 100);
  }
}


/* banner msg
============================================================================= */

const BannerMsg = {
  list: [],
  
  set: function(txt) {
    const bannerMsg_id = uuidv4();
    
    document.getElementById("bannerMsgs").innerHTML +=
    '<div id="' + bannerMsg_id + '" class="bannerMsg">' +
      '<div class="container">' +
        '<div class="txt">' +
          '<p>' + txt + '</p>' +
        '</div>' +
        '<div class="btnGroup">' +
          '<div class="closeIconParent closer">' +
            '<svg class="closeIcon" viewBox="0 0 18 18"><path d="M15 4.41L13.59 3 9 7.59 4.41 3 3 4.41 7.59 9 3 13.59 4.41 15 9 10.41 13.59 15 15 13.59 10.41 9 15 4.41z"></path></svg>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';

    const bannerMsg = document.getElementById(bannerMsg_id);

    BannerMsg.list.push(bannerMsg);
    BannerMsg.showTop();

    return bannerMsg;
  },
  
  showTop: function() {
    const el = BannerMsg.list[BannerMsg.list.length - 1];

    if (BannerMsg.list.length >= 2) {
      const prev = document.getElementById(BannerMsg.list[BannerMsg.list.length - 2].id);
      prev.classList.remove("active");
    }
    el.classList.add("active");

    if (BannerMsg.list.length > 1) {
      el.style.zIndex = String(Number(BannerMsg.list[BannerMsg.list.length-2].style.zIndex)+1);
      el.classList.add("slideIn");
      el.onanimationend = () => {
        el.classList.remove("slideIn");
      };
    }else {
      el.style.zIndex = "1000";
    }

    if (window.innerHeight < document.getElementsByTagName("body")[0].getBoundingClientRect().height) {
      el.classList.add("atScreenBottom");
    }else {
      el.classList.add("aboveFooter");
    }

    el.getElementsByClassName("closer")[0].addEventListener("click", () => BannerMsg.close(el));
  },

  close: function(el) {
    function closeNow() {
      BannerMsg.list.splice(-1,1);
      el.remove();
      if (BannerMsg.list.length) {
        const next = document.getElementById(BannerMsg.list[BannerMsg.list.length - 1].id);
        next.classList.add("active");
        next.getElementsByClassName("closer")[0].addEventListener("click", () => BannerMsg.close(next));
      }
    }
  
    if (BannerMsg.list.length > 1) {
      el.classList.add("slideOut");
      el.onanimationend = closeNow;
    }else {
      closeNow();
    }
  }
}


/* notifications count
============================================================================= */

const NotificationsCount = {
  increment: function() {
    const notificationsCount_dom_el = document.getElementById("notificationsCount");
    notificationsCount_dom_el.classList.add("active");
    const count = Number(notificationsCount_dom_el.innerHTML) + 1;
    if (0 < count < 100) {
      notificationsCount_dom_el.innerHTML = String(count);
    }
  }
}


/* modal
============================================================================= */

const Modal = {
  show: function(el) {  // from dom dom element dataset
    var modal = document.getElementById(el.dataset.modalTarget);
    modal.classList.add("active");
    document.getElementsByClassName("overlay")[0].classList.add("active");
  },

  hideAll: function() {
    var modals = document.getElementsByClassName("modal");
    for (var modal of modals) {
      modal.classList.remove("active");
    }
    for (let overlay of document.getElementsByClassName("overlay")) {
      overlay.classList.remove("active");
    }
  }
}


/* loading animation
============================================================================= */

const LoadingAnim = {
  stopAll: function() {
    for (let loadingOverlay of document.getElementsByClassName("loadingOverlay")) {
      loadingOverlay.classList.remove("active");
    }
    for (let loadingBarBox of document.getElementsByClassName("loadingBarBox")) {
      loadingBarBox.classList.remove("active");
    }
  }
}


/* cookies
============================================================================= */

const Cookie = {
  get: function(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return null;
  },

  set: function(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/;SameSite=Strict";
  }
}


/* page url
============================================================================= */

const pageUrl = new URL(window.location.href);

pageUrl.getQueryVariable = function(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if(pair[0] == variable){return pair[1];}
  }
  return(false);
};


/* dom helpers
============================================================================= */

const DomHelpers = {
  getParent: function(el, parent_cls) {
    while ((el = el.parentElement) && !el.classList.contains(parent_cls));
    return el;
  },

  getParents: function(el, parent_cls) {
    var parents = [];
    while ((el = el.parentElement) && (!el.classList.contains(parent_cls)));
    if (el) {
      parents.push(el);
      parents = parents.concat(DomHelpers.getParents(el, parent_cls));
    }
    return parents;
  },

  getAllParentsUpTo: function(el, final_cls) {
    var els = [];
    if (el) {
      els.push(el);
      if (!el.classList.contains(final_cls)) {
        els = els.concat(DomHelpers.getAllParentsUpTo(el.parentElement, final_cls));
      }
    }
    return els;
  },

  activate: function(el) {
    if (!el.classList.contains("active")) {
      el.classList.add("active");
      setTimeout(() => {
        document.addEventListener("click", () => DomHelpers.deactivate(el), {once: true});
      }
      , 10);
    }
  },
  
  deactivate: function(el) {
    setTimeout(() => {
      el.classList.remove("active");
      el.addEventListener("click", () => DomHelpers.activate(el), {once: true});
    }
    , 200);
  }
}


/* uuidv4
============================================================================= */

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}


/* datetime to localized string
============================================================================= */

const DatetimeToLocalizedString = {
  time: function(date) {
    return DatetimeToLocalizedString._numToStringAndAppend0BeforeIfSmallerThan10(date.getHours()) + ":" + DatetimeToLocalizedString._numToStringAndAppend0BeforeIfSmallerThan10(date.getMinutes());
  },
  
  datetimeV1: function(date) {
    const hours = DatetimeToLocalizedString._numToStringAndAppend0BeforeIfSmallerThan10(date.getHours());
    const minutes = DatetimeToLocalizedString._numToStringAndAppend0BeforeIfSmallerThan10(date.getMinutes());
    if (lang == "de") {
      return date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear() + " " + hours + ":" + minutes;
    }
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    return date.getDate() + " " + months[date.getMonth()] + " " + date.getFullYear() + " " + hours + ":" + minutes;
  },
  
  datetimeV2: function(date) {
    var date_copy = new Date(date.getTime());
    date_copy.setHours(0);
    date_copy.setMinutes(0);
    date_copy.setMilliseconds(0);
    const current = new Date();
    current.setHours(0);
    current.setMinutes(0);
    current.setMilliseconds(0);
    var diff_in_days = Math.round((date_copy.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    switch (diff_in_days) {
      case 0:
        return DatetimeToLocalizedString.time(date);
      case -1:
        return lex["yesterday"];
      case 1:
        return lex["tomorrow"];
      case -2:
        return lex["2 days ago"];
      case 2:
        return lex["in 2 days"];
      case -3:
        return lex["3 days ago"];
      case 3:
        return lex["in 3 days"];
      case -4:
        return lex["4 days ago"];
      case 4:
        return lex["in 4 days"];
      default:
        if (lang == "de") {
          return date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
        }
        return date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
    }
  },
  
  datetimeV3: function(date) {
    var date_copy = new Date(date.getTime());
    date_copy.setHours(0);
    date_copy.setMinutes(0);
    date_copy.setMilliseconds(0);
    const current = new Date();
    current.setHours(0);
    current.setMinutes(0);
    current.setMilliseconds(0);
    var diff_in_days = Math.round((date_copy.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    switch (diff_in_days) {
      case 0:
        return lex["today"];
      case -1:
        return lex["yesterday"];
      case 1:
        return lex["tomorrow"];
      case -2:
        return lex["2 days ago"];
      case 2:
        return lex["in 2 days"];
      case -3:
        return lex["3 days ago"];
      case 3:
        return lex["in 3 days"];
      case -4:
        return lex["4 days ago"];
      case 4:
        return lex["in 4 days"];
      default:
        if (lang == "de") {
          return date.getDate() + "." + (date.getMonth()+1) + "." + date.getFullYear();
        }
        return date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear();
    }
  },

  _numToStringAndAppend0BeforeIfSmallerThan10: function(num) {
    if (num < 10) {
      num = "0"+num;
    } else {
      num = String(num);
    }
    return num;
  }
}


/* shorthands
============================================================================= */

function renderText(text) {
  return anchorme({input: he.escape(text), options: {attributes: {target: "_blank"}}}).replace(/\n/g, "</br>");
}


/* polyfills
============================================================================= */

(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('remove')) {
      return;
    }
    Object.defineProperty(item, 'remove', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function remove() {
        if (this.parentNode === null) {
          return;
        }
        this.parentNode.removeChild(this);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
