var socket;


/* -> DOMContentLoaded
============================================================================= */

window.addEventListener("DOMContentLoaded", () => {

  if( /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ) {
    Flag.onMobileDevice = true;
    MainInit.setViewportForMobiles();
    document.body.classList.add("onMobileDevice");
  }

  Flag.onLight = document.getElementById("content").classList.contains("light");

  if (!Flag.onLight) {
    DomHelpers.preventScrolling(document.getElementsByTagName("header")[0]);

    BannerMsg.setupResponsiveness();

    for (let msg of msgsToFlash) {
      BannerMsg.new(msg);
    }

    if (!Cookie.get("cookie_msg_shown")) {
      const privacyMsg = BannerMsg.new(lex["cookie_msg"]);
      privacyMsg.getElementsByClassName("closer")[0].addEventListener("click", () => {
        Cookie.set("cookie_msg_shown", "true", 365)
      });
    }

    if (Number(document.getElementById("notificationsCount").innerHTML) < 1) {
      document.getElementById("notificationsCount").classList.remove("active");
    }
  }

  MainInit.setupSDropMenus();

  MainInit.setupExclusiveCheckboxGroups();

  LoadingAnim.setupOverlays();

  if (!Flag.onLight) {
    if (currentUserIsAuthenticated) {
      MainInit.setupGlobalSocket();
      MainInit.setupAccountActions();
    }
  
    MainInit.setupLangMenu();
  }

  MainInit.setupTippy();
});


const MainInit = {

  setViewportForMobiles: function(){
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
    socket.on("disconnect", () => EventCallback.socketDisconnected(socket));
    socket.on("receive_msg", (_) => NotificationsCount.increment());
    socket.on("receive_friendship_request", (_) => NotificationsCount.increment());
  },

  setupAccountActions: function() {
    if (typeof(project) !== 'undefined') {
      document.getElementById("currentUserProfilePic").addEventListener("click", () => {
        Modal.openSafelyById('accountActions', 
        {
          without_overlay: true,
          on_open: function() {
            document.getElementById("togglePageHead").classList.add("hide");
          },
          on_close: function() {
            document.getElementById("togglePageHead").classList.remove("hide");
          }
        });
      });
    } 
    else {
      document.getElementById("currentUserProfilePic").addEventListener("click", () => Modal.openSafelyById('accountActions', {without_overlay: true}));
    }
  },

  setupLangMenu: function() {
    document.getElementById("selectEn").addEventListener("click", () => {
      Cookie.set("lang", "en", 36500);
      location.reload();
    });

    document.getElementById("selectDe").addEventListener("click", () => {
      Cookie.set("lang", "de", 36500);
      location.reload();
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

  setupTippy: function() {
    if (typeof tippy === 'undefined') { return; }

    var trigger = 'mouseenter click';
    if (Flag.onMobileDevice) {
      trigger = 'click'
    }

    tippy.setDefaultProps({
      theme: "light-border",
      trigger: trigger,
      allowHTML: true,
      appendTo: "parent",
      interactiveBorder: 2,
      interactiveDebounce: 0,
      duration: 200,
      maxWidth: 512,
      zIndex: 2000,
      maxWidth: 280
    });
  }
}


/* on document unload
============================================================================= */

window.addEventListener("beforeunload", () => Flag.pageIsUnloading=true);


/* flags
============================================================================= */

const Flag = {

  onLight: undefined,

  onMobileDevice: false,

  pageIsUnloading: false,

  ignoreSocketDisconnect: false
}


/* event callbacks
============================================================================= */

const EventCallback = {
  socketDisconnected: function(_socket) {
    setTimeout(() => {
      if (_socket.disconnected && !Flag.ignoreSocketDisconnect || !Flag.pageIsUnloading) {
          LoadingAnim.stopAll();  
          Modal.closeAll();
          Modal.openSafelyById("disconnectModal", {not_away_clickable: true});
      }
    }, 1500);
  }
}


/* banner msg
============================================================================= */

const BannerMsg = {
  list: [],
  
  new: function(txt) {
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
  },

  setupResponsiveness: function() {
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
  list: [],

  open: function(modal, 
    props={
    without_overlay: false, 
    overlay_trasnsparent: false, 
    not_away_clickable: false, 
    on_open: undefined, 
    on_close: undefined}) {

    var modal_is_active = false;
    for (let modal_entry of Modal.list) {
      if (modal_entry.id == modal.id) {
        modal_is_active = true;
      }
    }
    if (modal_is_active) {
      return;
    }
    
    modal.classList.add("active");

    if (!props.without_overlay) {
      var overlay;
      if (props.overlay_trasnsparent) {
        overlay = document.getElementsByClassName("overlay transparent")[0];
      } else {
        overlay = document.getElementsByClassName("overlay")[0];
      }
      overlay.classList.add("active");
    }

    if (!props.not_away_clickable) {
      setTimeout(() => {
        document.addEventListener("click", (e) => Modal._click_away_listener(e, modal), {once: true});
      }, 800);
    }

    Modal.list.push({id: modal.id, props: props});

    if (props.on_open) {
      props.on_open();
    }
  },

  openSafely(modal, props) {
    setTimeout(()=> {
      Modal.open(modal, props);
    }, 200);
  },

  openById: function(id, props) {
    Modal.open(document.getElementById(id), props);
  },

  openSafelyById: function(id, props) {
    Modal.openSafely(document.getElementById(id), props);
  },

  close: function(modal) {
    var props;
    for (var i = 0; i < Modal.list.length; i++) {
      if (Modal.list[i].id == modal.id) {
        props = Modal.list[i].props;
        break;
      }
    }
    if (!props) {
      return;
    }

    Modal.list.splice(i, 1);

    modal.classList.remove("active");

    if (props.on_close) {
      props.on_close();
    }

    if (!props.without_overlay) {
      for (let modal_entry of Modal.list) {
        if (modal_entry.props.without_overlay == props.without_overlay 
        && modal_entry.props.overlay_trasnsparent == props.overlay_trasnsparent) {
            return;
        }
      }

      if (props.overlay_trasnsparent) {
        document.querySelectorAll(".overlay:not(.transparent)").forEach((el) => {
          el.classList.remove("active");
        });
      } else {
        document.querySelectorAll(".overlay").forEach((el) => {
          el.classList.remove("active");
        });
      }
    }
  },

  closeById: function(id) {
    Modal.close(document.getElementById(id));
  },

  closeAll: function() {
    Modal.list = [];
    document.querySelectorAll(".modal").forEach((el) => {
      el.classList.remove("active");
    });
    document.querySelectorAll(".overlay").forEach((el) => {
      el.classList.remove("active");
    });
  },

  _click_away_listener: function(e, modal) {
    var modal_is_active = false;
    for (let modal_entry of Modal.list) {
      if (modal_entry.id == modal.id) {
        modal_is_active = true;
        break;
      }
    }

    if (! modal_is_active) {
      return;
    }
    
    if ((e.target != modal) 
    && (! modal.contains(e.target)) 
    && (! DomHelpers.getParent(e.target, "popUp")) 
    && (! e.target.classList.contains("modals"))) {
      Modal.close(modal);
    } 
    else {
      setTimeout(() => {
        document.addEventListener("click", (e) => Modal._click_away_listener(e, modal), {once: true});
      }, 200);
    }
  }
}


/* loading animation
============================================================================= */

const LoadingAnim = {
  start: function(loadingBarBox_id) {
    document.getElementById(loadingBarBox_id).classList.add("active");
    document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
  },

  stopAll: function() {
    document.querySelectorAll(".loadingOverlay").forEach((el) => {
      el.classList.remove("active");
    });
    document.querySelectorAll(".loadingBarBox").forEach((el) => {
      el.classList.remove("active");
    });
  },

  setupOverlays: function() {
    for (let loadingOverlay of document.getElementsByClassName("loadingOverlay")) {
      loadingOverlay.addEventListener("click", () => {
        LoadingAnim.stopAll();
      });
    }
  }
}


/* select
============================================================================= */

const Select = {
  instances: {},

  create: function(id, selectBaseBox, selectOptions=[], callbacks={}, configs={}) {
    /*
    id: unique id of the select,
    selectBaseBox: dom element,
    selectOptions: {id: unique id, content: html content, selected: boolean},
    callbacks: {optionSelectedCallback: function (-> selectOptions entry), optionUnSelectedCallback: function (-> selectOptions entry)}
    */

    Select.instances[id] = {
      tippyInstance: 
        tippy(
          selectBaseBox, 
          {
            content: "",
            interactive: true,
            appendTo: document.getElementById("tippyContainer"),
            placement: 'bottom',
            arrow: false,
            trigger: "click",
            theme: "select",
            offset: [0, 2]
          }
        ),
      selectBaseBox: selectBaseBox,
      options: selectOptions,
      optionSelectedCallback: callbacks.optionSelectedCallback,
      optionUnSelectedCallback: callbacks.optionUnSelectedCallback,
      configs: configs
    };
    Select._setTippyInstanceContent(id);
  },

  update: function(id, newOptions=[], removedOptions_id_list=[]) {
    for (let removedOption_id of removedOptions_id_list) {
      var i=0;
      for (let option_entry of Select.instances[id].options) {
        if (option_entry.id == removedOption_id) {
          option_entry;
          break;
        }
        i++;
      }
      Select.instances[id].options.splice(i, 1);
    }
    for (let newOption of newOptions) {
      Select.instances[id].options.push(newOption);
    }
    Select._setTippyInstanceContent(id);
  },

  clear: function(id) {
    Select.instances[id].options = [];
    Select.instances[id].tippyInstance.setContent("");
  },

  set: function(id, selectOptions=[]) {
    Select.instances[id].options = selectOptions;
    Select._setTippyInstanceContent(id);
  },

  remove: function(id) {
    Select.instances[id].tippyInstance.destroy();
    delete Select.instances[id];
  },

  getOptions: function(id) {
    return Select.instances[id].options;
  },

  exists: function(id) {
    if (Select.instances[id]) {
      return true;
    }
    return false;
  },

  _setTippyInstanceContent: function(id) {
    var content = '<div class="select popUp" id="select-'+id+'">';
    for (let selectOption of Select.instances[id].options) {
      content += '<div class="option';
      if (selectOption.selected) {
        content += " selected";
      }
      content +='" id="option-'+selectOption.id+'" onclick="Select._optionClickedHandler(event, \''+id+'\');">'+selectOption.content+"</div>";
    }
    content += "</div>";
    Select.instances[id].tippyInstance.setContent(content);
  },

  selectOptionManually: function(select_id, option_id) {
    for (var option_entry of Select.instances[select_id].options) {
      if (option_entry.id == option_id) {
        option_entry.selected = true;
        break;
      }
    }
    Select._setTippyInstanceContent(select_id);
  },

  unselectOptionManually: function(select_id, option_id) {
    for (var option_entry of Select.instances[select_id].options) {
      if (option_entry.id == option_id) {
        option_entry.selected = false;
        break;
      }
    }
    Select._setTippyInstanceContent(select_id);
  },

  _optionClickedHandler: function(e, id) {
    var option_dom_el = e.target;
    if (!option_dom_el.classList.contains("option")) {
      option_dom_el = DomHelpers.getParent(e.target, "option");
    }
    if (!option_dom_el) {
      return;
    }

    if (Select.instances[id].configs.exclusive) {
      for (var option_entry of Select.instances[id].options) {
        if (option_entry.id == option_dom_el.id.substring(7)) {
          option_entry.selected = !option_entry.selected;
        } else {
          option_entry.selected = false;
        }
      }
    } 
    else {
      for (var option_entry of Select.instances[id].options) {
        if (option_entry.id == option_dom_el.id.substring(7)) {
          option_entry.selected = !option_entry.selected;
          break;
        }
      }
    }

    Select._setTippyInstanceContent(id);

    if (option_entry.selected == true) {
      if (Select.instances[id].optionSelectedCallback) {
        Select.instances[id].optionSelectedCallback(option_entry);
      }
    } else {
      if (Select.instances[id].optionUnSelectedCallback) {
        Select.instances[id].optionUnSelectedCallback(option_entry);
      }
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
  /*onExist: function(selector) {

  },*/

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
  },

  preventScrolling: function(el) {
    el.addEventListener("wheel", (e) => {
      e.preventDefault();
    }, {passive: false});
    el.addEventListener("touchmove", (e) => {
        e.preventDefault();
    }, {passive: false});
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
