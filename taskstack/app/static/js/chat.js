/* chats data
============================================================================= */

/* 
{
    userToUser: {
        <id (id of user to chat with): int>: {
            id: <: int>, (id of user to chat with)
            type: <: str>,
            name: <: str>,
            unreadCount: <: int>,  # not being updated
            lastMsg: {    # not being updated
                content: <: str>,
                datetime: <: str>
            },
            picUrl: <: str>,
            goToUrl: <: str>,
            msgs: [
                {}, ...  # sorted by datetime
            ] | undefined
        }, ...
    },
    chatGroup: {
        <id>: int>: {
            id: <: int>,
            type: <: str>,
            name: <: str>,
            unreadCount: <: int>,  # not being updated
            lastMsg: {    # not being updated
                content: <: str>,
                datetime: <: str>
            },
            picUrl: <: str>,
            roleOfCurrentUser: <: str>,
            members: {
                <id: int>: {
                    id: <: int>,
                    name: <: int>,
                    picUrl: <: str>,
                    goToUrl: <: str>
                }, ...
            }
            msgs: [
                {}, ...  # sorted by datetime
            ] | undefined
        }, ...
    },
    projectChatGroup: {
        <id>: int>: {
            id: <: int>,
            type: <: str>,
            name: <: str>,
            unreadCount: <: int>,  # not being updated
            lastMsg: {    # not being updated
                content: <: str>,
                datetime: <: str>
            },
            picUrl: <: str>,
            roleOfCurrentUser: <: str>,
            members: {
                <id: int>: {
                    id: <: int>,
                    name: <: int>,
                    picUrl: <: str>,
                    goToUrl: <: str>
                }, ...
            }
            msgs: [
                {}, ...  # sorted by datetime
            ] | undefined
        }, ...
    }
}
*/


/* on document load
============================================================================= */

window.addEventListener("load", () => {
    history.replaceState({open: "contactsWin"}, "Taskstack | Chat", "/chat");
    contactsWin.init();
    if (chatToOpen) {
        chatWin.open(chatToOpen.id, chatToOpen.type);
    } else {
        contactsWin.open(dontPushState=true);
    }
});



/* on pop state
============================================================================= */

window.addEventListener('popstate', (e) => {
    const data = e.state;
    if (data.open == "contactsWin") {
        chatWin.close();
        contactsWin.open(dontPushState=true);
    }
    else {
        contactsWin.close();
        chatWin.open(data.chatId, data.chatType, dontPushState=true);
    }
});


/* socketio event handlers (called from main.js)
============================================================================= */

function installGlobalSocketEventHandlersForChat() {

    socket.on("disconnect", EventCallback.socketDisconnected);

    socket.on("successfully_sent_msg", (msg_data) => {
        const chat_meta_data = getMsgChatMetaData(msg_data);

        if (chats[chat_meta_data.type][chat_meta_data.id].msgs != undefined) {
            chats[chat_meta_data.type][chat_meta_data.id].msgs.push(msg_data);
        }
        
        chats[chat_meta_data.type][chat_meta_data.id].lastMsg = {"content": msg_data.content, "datetime": msg_data.datetime};

        contactsWin.newMsg(msg_data);

        if (chatWin.chatId == chat_meta_data.id && chatWin.chatType == chat_meta_data.type) {
            chatWin.newMsg(msg_data);
        }
    });

    socket.on("receive_msg", (msg_data) => {
        const chat_meta_data = getMsgChatMetaData(msg_data);

        if (chats[chat_meta_data.type][chat_meta_data.id].msgs != undefined) {
            chats[chat_meta_data.type][chat_meta_data.id].msgs.push(msg_data);
        }
        
        chats[chat_meta_data.type][chat_meta_data.id].lastMsg = {"content": msg_data.content, "datetime": msg_data.datetime};

        contactsWin.newMsg(msg_data);

        if (chatWin.chatId == chat_meta_data.id && chatWin.chatType == chat_meta_data.type) {
            chatWin.newMsg(msg_data);
            if (chatWin.isOpen) {
                socket.emit("mark_msg_as_read", {"chatType": chat_meta_data.type, "id": msg_data.id});
            }
        } 
        if (chatWin.isOpen == false || (chatWin.chatId != chat_meta_data.id || chatWin.chatType != chat_meta_data.type)) {
            contactsWin.incrementUnreadCount(contactsWin.idPrefix(chat_meta_data.type)+chat_meta_data.id);
        } 
    });

    socket.on("new_friend", (friend_data) => {
        chats.userToUser[friend_data.id] = friend_data;
        contactsWin.newChat(friend_data);
    });

    socket.on("friend_removed", (friend_data) => {
        if (chatWin.isOpen && chatWin.chatId == friend_data.id && chatWin.chatType == "userToUser") {
            chatWin.close();
        }
        document.getElementById("contact-user-"+friend_data.id).remove();
        delete chats.userToUser[friend_data.id];
    });

    socket.on("update_friend_name", (friend_data) => {
        chats["userToUser"][friend_data.id].name = friend_data.name;
        chats["userToUser"][friend_data.id].goToUrl = "/"+friend_data.name;

        const contact_dom_el = document.getElementById("contact-user-"+friend_data.id);
        contact_dom_el.getElementsByClassName("name")[0].innerHTML = friend_data.name;
        contact_dom_el.getElementsByTagName("a")[0].href = "/"+friend_data.name;

        if (chatWin.chatId == friend_data.id && chatWin.chatType == "userToUser") {
            document.title = "Taskstack | Chat | "+friend_data.name;
            document.getElementById("currentContactName").innerHTML = friend_data.name;
            document.getElementById("currentContactLink").href = "/"+friend_data.name;
            history.replaceState({open: "chatWin", chatId: chatWin.chatId, chatType: chatWin.chatType}, "Taskstack | Chat | "+friend_data.name, "/chat?with="+friend_data.name);
        }
    });

    socket.on("update_chat_group_name", (data) => {
        chats[data.type][data.id].name = data.newName;
        if (chatWin.chatId == data.id && chatWin.chatType == data.type) {
            document.getElementById("currentContactName").innerHTML = data.newName;
        }
        document.getElementById(contactsWin.idPrefix(data.type)+data.id).getElementsByClassName("name")[0].innerHTML = data.newName;
        if (groupWin.chatGroupType == data.type && groupWin.chatGroupId == data.id) {
            document.getElementById("groupWinTitle").innerHTML = data.newName;
        }
        if (editGroupWin.chatGroupType == data.type && editGroupWin.chatGroupId == data.id) {
            document.getElementById("editGroupWinTitle").innerHTML = data.newName;
        }
        if (addFriendToGroupWin.chatGroupType = data.type && addFriendToGroupWin.chatGroupId == data.id) {
            document.getElementById("addFriendToGroupWinTitle").innerHTML = lex["Add a friend to: "]+data.newName;
        }
    });

    socket.on("successfully_created_chat_group", () => {
        newGroupWin.stopLoadingAnim();
        newGroupWin.close();
    });

    socket.on("new_chat_group", (chat_group_data) => {
        chats[chat_group_data.type][chat_group_data.id] = chat_group_data;
        contactsWin.newChat(chat_group_data);
    });

    socket.on("chat_group_removed", (chat_group_data) => {
        if (chatWin.isOpen && chatWin.chatId == chat_group_data.id && chatWin.chatType == chat_group_data.type) {
            chatWin.close();
            chatWin.chatId = null;
            chatWin.chatType = null;
            contactsWin.open();
        }

        document.getElementById(contactsWin.idPrefix(chat_group_data.type)+chat_group_data.id).remove();

        const groupWin_dom_el = document.getElementById("w-groupWin");
        const editGroupWin_dom_el = document.getElementById("w-editGroupWin");
        const addFriendToGroupWin_dom_el = document.getElementById("w-addFriendToGroupWin");
        if ((groupWin.chatGroupId == chat_group_data.id && groupWin.chatGroupType == chat_group_data.type && groupWin_dom_el.classList.contains("active")) ||
                (editGroupWin.chatGroupId == chat_group_data.id && editGroupWin.chatGroupType == chat_group_data.type && editGroupWin_dom_el.classList.contains("active")) ||
                (addFriendToGroupWin.chatGroupId == chat_group_data.id && addFriendToGroupWin.chatGroupType == chat_group_data.type && addFriendToGroupWin_dom_el.classList.contains("active")))
            {
            Modal.closeById("w-groupWin");
            groupWin.stopLoadingAnim();
            Modal.closeById("w-editGroupWin");
            editGroupWin.stopLoadingAnim();
            Modal.closeById("w-addFriendToGroupWin");
            addFriendToGroupWin.stopLoadingAnim();
        }

        delete chats[chat_group_data.type][chat_group_data.id];
    });

    socket.on("new_chat_group_member", (data) => {
        chats[data.chatGroupType][data.chatGroupId].members[data.member.id] = data.member;
        
        if (groupWin.chatGroupId == data.chatGroupId && groupWin.chatGroupType == data.chatGroupType) {
            groupWin.newMember(data.member);
        }
    });

    socket.on("chat_group_member_removed", (data) => {
        delete chats[data.chatGroupType][data.chatGroupId].members[data.userId];
        
        if (groupWin.chatGroupId == data.chatGroupId && groupWin.chatGroupType == data.chatGroupType) {
            document.getElementById("member-"+data.userId).remove();
        }
    });

    socket.on("update_chat_group_member_role", (data) => {
        chats[data.chatGroupType][data.chatGroupId].members[data.id].role = data.newRole;

        if (data.id == currentUserId) {
            chats[data.chatGroupType][data.chatGroupId].roleOfCurrentUser = data.newRole;
        } 
        if (groupWin.chatGroupId == data.chatGroupId && groupWin.chatGroupType == data.chatGroupType) {
            groupWin.open(data.chatGroupId, data.chatGroupType, true)
        }
    });

    socket.on("successfully_deleted_chat_group", () => {
        Modal.closeById("w-editGroupWin");
        editGroupWin.stopLoadingAnim();
    });

    socket.on("successfully_edited_chat_group_name", () => {
        editGroupWin.stopLoadingAnim();
        editGroupWin.closeAndOpenGroupWin();
    });

    socket.on("successfully_added_friend_to_chat_group", () => {
        addFriendToGroupWin.stopLoadingAnim();
        addFriendToGroupWin.closeAndOpenGroupWin();
    });

    socket.on("successfully_removed_user_from_chat_group", () => {
        groupWin.stopLoadingAnim();
    });

    socket.on("add_friend_to_chat_group_error_invalid_target", () => {
        const error_text = document.getElementById("addUserToGroupNameOrEmailInputErrorText");
        error_text.classList.add("active");
        error_text.innerHTML = lex["Failed to add a user with this name/ email to this group"];
        addFriendToGroupWin.stopLoadingAnim();
    });

    socket.on("successfully_changed_chat_group_member_role", () => {
        groupWin.stopLoadingAnim();
    });
}


/* fetching
============================================================================= */

function getMsgsInChat(id, type) {
    return fetch("/msgs?chat-type="+type+"&chat-id="+id, {
        method: 'GET',
        credentials: "include"
    })
      .then(response => {
        if (response.status == 200) {
            return response.json().then(chat => {
                return chat;
            })
        }
        else {
          window.alert("Error");
          return undefined;
        }
      })
}


/* contacts win
============================================================================= */

const contactsWin = {

    isOpen: false,

    init: function() {
        var chats_sorted = [];
        for (let id in chats.userToUser) {
            chats_sorted.push(chats.userToUser[id]);
        }
        for (let id in chats.chatGroup) {
            chats_sorted.push(chats.chatGroup[id]);
        }
        for (let id in chats.projectChatGroup) {
            chats_sorted.push(chats.projectChatGroup[id]);
        }
        chats_sorted.sort((chat1, chat2) => {
            if (chat1.lastMsg == "None" && chat2.lastMsg == "None") {
                if (chat1.name > chat2.name) {
                    return -1;
                }
                return 1;
            }
            else if (chat1.lastMsg == "None") {
                return -1;
            } else if (chat2.lastMsg == "None") {
                return 1;
            }
            const chat1_last_msg_datetime = new Date(chat1.lastMsg.datetime);
            const chat2_last_msg_datetime = new Date(chat2.lastMsg.datetime);
            return chat1_last_msg_datetime.getTime() - chat2_last_msg_datetime.getTime();
        });

        for (let chat of chats_sorted) {
            this.newChat(chat);
        }
    },

    open: function(dontPushState=false) {
        if (pageUrl.getQueryVariable("with") && ! dontPushState) {
            history.pushState({open: "contactsWin"}, "Taskstack | Chat", "/chat");
        }
        document.title = "Taskstack | Chat"

        contactsWin.isOpen = true;
        const dom_el = this.getDomEl();
        dom_el.classList.remove("closed");
        dom_el.classList.add("open");
    },

    close: function() {
        contactsWin.isOpen = false;
        const dom_el = this.getDomEl();
        dom_el.classList.remove("open");
        dom_el.classList.add("closed");
    },

    newChat: function(chat) {
        const dom_el_id = contactsWin.idPrefix(chat.type) + chat.id;

        var html = 
            '<div id="' + dom_el_id + '"class="contact" onclick="contactsWin.contactClickHandler(\''+ chat.id + '\', \'' + chat.type + '\', event);">' +
                '<div class="left">'; 
                
        if (chat.type == "userToUser") {
            html += '<a href="' + chat.goToUrl + '">';
        } else {
            html += '<a onclick="groupWin.open(\''+ chat.id + '\', \'' + chat.type + '\');">';
        }

        html += 
                    '<img src="' + chat.picUrl + '" alt="img"></a>' + 
                '</div>' +
                '<div class="right">' +
                    '<div class="top">' +
                        '<p class="name">' + chat.name + '</p>' +
                        '<p class="lastMsgWhen">';

        if (chat.lastMsg != "None") {
            html += DatetimeToLocalizedString.datetimeV2(new Date(chat.lastMsg.datetime));
        }

        html +=
                        '</p>' +
                    '</div>' +
                    '<div class="bottom">' +
                        '<p class="lastMsg">';

        if (chat.lastMsg != "None") {
            html += he.escape(chat.lastMsg.content);
        }

        html +=
                        '</p>' +
                        '<div class="unreadCount"></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.getElementById("contactsList").insertAdjacentHTML("afterbegin", html);

        this.incrementUnreadCount(dom_el_id, chat.unreadCount);
    },

    newMsg: function(msg) {
        const chat_meta_data = getMsgChatMetaData(msg);
        
        const contact = document.getElementById(contactsWin.idPrefix(chat_meta_data.type)+chat_meta_data.id);
        const contactsList_dom_el = document.getElementById("contactsList");
        contactsList_dom_el.insertBefore(contact, contactsList_dom_el.firstChild);
        
        contact.getElementsByClassName("lastMsg")[0].innerHTML = msg.content;
        contact.getElementsByClassName("lastMsgWhen")[0].innerHTML = DatetimeToLocalizedString.datetimeV2(new Date(msg.datetime));
    },

    incrementUnreadCount: function(contact_dom_el_id, n=1) {
        if (n < 1) {
            return;
        }
        
        const unreadCount_dom_el = document.getElementById(contact_dom_el_id).getElementsByClassName("unreadCount")[0];
        unreadCount_dom_el.classList.add("active");
        
        if (unreadCount_dom_el.innerHTML.length == 0) {
            if (n <= 99) { 
                unreadCount_dom_el.innerHTML = String(n);
            } else {
                unreadCount_dom_el.innerHTML = "99";
            }
        } 
        else {
            const prev = Number(unreadCount_dom_el.innerHTML);
            if (prev + n <= 99) { 
                unreadCount_dom_el.innerHTML = String(prev + n);
            } else {
                unreadCount_dom_el.innerHTML = "99";
            }
        }
    },

    contactClickHandler: function(id, type, event) {
        if (event.target.tagName != "IMG") {
            contactsWin.close();
            chatWin.open(id, type);
        }
    },

    getDomEl: function() {
        return document.getElementById("contacts");
    },

    idPrefix: function(type) {
        switch (type) {
            case "userToUser":
                return "contact-user-"
            case "chatGroup":
                return "contact-group-"
            case "projectChatGroup":
                return "contact-project-group-"
        }
    }
}


/* chat win
============================================================================= */

const chatWin = {

    isOpen: false,

    chatId: null,

    chatType: null,

    open: async function(id, type, dontPushState=false) {
        document.title = "Taskstack | Chat | "+chats[type][id].name;

        const chat_already_build = (chatWin.chatId == id && chatWin.chatType == type);
        
        if (! chatWin.isOpen || ! chat_already_build) {
            if (! dontPushState) {
                var url_path;
                if (type == "userToUser") {
                    url_path = "/chat?with="+chats[type][id].name;
                } else {
                    url_path = "/chat";
                }
                history.pushState({open: "chatWin", chatId: id, chatType: type}, "Taskstack | Chat | "+chats[type][id].name, url_path);
            }
            socket.emit("mark_msgs_as_read", {"chatType": type, "chatId": id});
            chatWin.close();
        } 
        else if (chatWin.isOpen && chat_already_build) {
            return;
        }

        chatWin.chatId = id;
        chatWin.chatType = type;
        
        const dom_el = this.getDomEl();
        dom_el.classList.remove("closed");
        dom_el.classList.add("open");

        const contact_dom_el = document.getElementById(contactsWin.idPrefix(type)+id);
        contact_dom_el.classList.add("active");

        chatWin.isOpen = true;

        const unreadCount_dom_el = contact_dom_el.getElementsByClassName("unreadCount")[0];
        unreadCount_dom_el.classList.remove("active");
        unreadCount_dom_el.innerHTML = "";

        document.getElementsByTagName("header")[0].classList.add("chatOpen");

        if (chat_already_build) {
            return;
        }

        const msgs_dom_el = document.getElementById("msgs");
        msgs_dom_el.innerHTML = "";

        if (chats[type][id].goToUrl != undefined) {
            document.getElementById("currentContactLink").href = chats[type][id].goToUrl;
        } 
        else {
            document.getElementById("currentContactLink").href = "javascript: void(0);";
            document.getElementById("currentContactLink").onclick = (event) => {
                event.stopPropagation();
                chatWin.close();
                contactsWin.open();
                groupWin.open(id, type);
            };
        }
        
        document.getElementById("currentContactName").innerHTML = chats[type][id].name;
        document.getElementById("currentContactImg").src = chats[type][id].picUrl;

        if (! chats[type][id].msgs) { 
            chats[type][id].msgs = await getMsgsInChat(id, type);
        }

        for (let msg of chats[type][id].msgs) {
            msgs_dom_el.innerHTML += this.getMsgHtml(msg);
        }

        chats[type][id].unreadCount = 0;

        msgs_dom_el.scrollTop = msgs_dom_el.scrollHeight;
    },

    close: function() {
        chatWin.isOpen = false;
        if (chatWin.chatId != null) {
            document.getElementById(contactsWin.idPrefix(chatWin.chatType)+chatWin.chatId).classList.remove("active");
        }
        const dom_el = this.getDomEl();
        dom_el.classList.remove("open");
        dom_el.classList.add("closed");
        document.getElementsByTagName("header")[0].classList.remove("chatOpen");
    },

    send: function() {
        input_dom_el = document.getElementById("input");
        const text = input_dom_el.value;
        if (text.length < 1 || 2048 < text.length) {
            return;
        }
        socket.emit("send_msg", {"chatType": chatWin.chatType, "chatId": chatWin.chatId, "content": text});
        input_dom_el.value = "";
    },

    newMsg: function(msg) {
        document.getElementById("msgs").innerHTML += this.getMsgHtml(msg);
        const msgs_dom_el = document.getElementById("msgs");
        msgs_dom_el.scrollTop = msgs_dom_el.scrollHeight;
    },

    enlargeInput: function() {
        this.getDomEl().classList.add("bigInput");
    },

    shrinkInput: function() {
        setTimeout(() => this.getDomEl().classList.remove("bigInput"), 200);
    },

    getDomEl: function() {
        return document.getElementById("chat");
    },

    getMsgHtml: function(msg) {
        const datetime = new Date(msg.datetime);
        var msg_html = '<div class="msg ';
        if (msg.fromId == currentUserId) {
            msg_html += 'sent">'
        } 
        else {
            msg_html += 'received">';
        }
        msg_html += '<div class="box"><p class="from"><a href="/' + msg.fromName + '">' + msg.fromName +  '</a></p><p class="when">' + DatetimeToLocalizedString.datetimeV1(datetime) +  '</p><p class="text">' + renderText(msg.content) + '</p></div>';
        return msg_html;
    }
}


/* new group win
============================================================================= */

const newGroupWin = {

    isOpen: false,

    open: function() {
        newGroupWin.isOpen = true;
        Modal.openSafelyById("w-newGroupWin");
    },

    submit: function() {
        const name_input = document.getElementById("newGroupNameInput");
        const newGroupNameInputErrorText = document.getElementById("newGroupNameInputErrorText");
        
        if (1 <= name_input.value.length && name_input.value.length <= 32) {
            newGroupNameInputErrorText.classList.remove("active");
            socket.emit("create_chat_group", name_input.value);
            this.startLoadingAnim();
            name_input.value = "";
        } 
        else {
            newGroupNameInputErrorText.classList.add("active");
            newGroupNameInputErrorText.innerHTML = lex["Enter a group name (1 - 32 characters long)"];
        }
    },

    close: function() {
        newGroupWin.isOpen = false;
        Modal.closeById("w-newGroupWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("newGroupWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },
}


/* group win
============================================================================= */

const groupWin = {

    chatGroupId: null,

    chatGroupType: null,

    open: function(id=groupWin.chatGroupId, type=chatGroupType.type, re_open=false) {
        Modal.openSafelyById("w-groupWin");

        if (groupWin.chatGroupId == id && groupWin.chatGroupType == type && ! re_open) {
            return;
        }

        groupWin.chatGroupId = id;
        groupWin.chatGroupType = type;

        document.getElementById("groupWinTitle").innerHTML = chats[type][id].name;

        if (chats[type][id].roleOfCurrentUser != "admin") {
            document.getElementById("groupWinAddFriendButton").classList.add("disabled");
            document.getElementById("groupWinEditButton").classList.add("disabled");
        } else {
            document.getElementById("groupWinAddFriendButton").classList.remove("disabled");
            document.getElementById("groupWinEditButton").classList.remove("disabled");
        }

        if (type == "chatGroup") {
            document.getElementById("groupWinLeaveButton").classList.remove("disabled");
        } else {
            document.getElementById("groupWinLeaveButton").classList.add("disabled");
        }

        var members_sorted = [];
        for (let member_id in chats[type][id].members) {
            members_sorted.push(chats[type][id].members[member_id]);
        }
        members_sorted.sort((member1, member2) => {
            if (member1.name > member2.name) {
                return -1;
            }
            return 1;
        });

        document.getElementById("groupWinMembersSection").innerHTML = "";

        for (let member of members_sorted) {
            this.newMember(member);
        }
    },

    close: function() {
        Modal.closeById("w-groupWin");
    },

    newMember: function(member) {
        var html = '<div class="member" id="member-' + member.id + '"><div class="ellipsisOptions"><i class="fas fa-ellipsis-v" onclick="DomHelpers.activate(this.parentElement);"></i><ul>';
        if (chats[groupWin.chatGroupType][groupWin.chatGroupId].roleOfCurrentUser == "admin" && member.id != currentUserId) {
            html += '<li onclick=groupWin.removeUserFromGroup(\''+ member.id + '\');>' + lex["Remove from group"] + '</li>';
            if (member.role == "admin") {
                html += '<li onclick=groupWin.dismissUserAsAdmin(\''+ member.id + '\');>' + lex["Dismiss as admin"] + '</li>';
            } else {
                html += '<li onclick=groupWin.makeUserAdmin(\''+ member.id + '\');>' + lex["Make admin"] + '</li>';
            }
        }
        html += '</ul></div><a href="' + member.goToUrl + '"><img src="' + member.picUrl + '"  alt="img"></img><p>' + member.name + '</p></a></div>'

        document.getElementById("groupWinMembersSection").insertAdjacentHTML("afterbegin", html);
    },

    removeUserFromGroup: function(id) {
        socket.emit("remove_user_from_chat_group", {"userId": id, "chatGroupId": groupWin.chatGroupId});
        this.startLoadingAnim();
    },

    leaveGroup: function() {
        socket.emit("remove_user_from_chat_group", {"userId": currentUserId, "chatGroupId": groupWin.chatGroupId, "removeMyself": "True"});
        this.startLoadingAnim();
    },

    makeUserAdmin: function(id) {
        socket.emit("change_chat_group_member_role", {"chatGroupId": groupWin.chatGroupId, "id": id, "newRole": "admin"});
        this.startLoadingAnim();
    },

    dismissUserAsAdmin: function(id) {
        socket.emit("change_chat_group_member_role", {"chatGroupId": groupWin.chatGroupId, "id": id, "newRole": "default"});
        this.startLoadingAnim();
    },

    startLoadingAnim: function() {
        LoadingAnim.start("groupWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },
}


/* edit group win
============================================================================= */

const editGroupWin = {

    chatGroupId: null,

    chatGroupType: null,

    openAndCloseGroupWin: function(id, type) {
        groupWin.close();
        editGroupWin.chatGroupId = id;
        editGroupWin.chatGroupType = type;
        Modal.openSafelyById("w-editGroupWin");
        document.getElementById("editGroupWinTitle").innerHTML = chats[type][id].name;
        document.getElementById("groupNameInput").value = chats[type][id].name;
    },

    submit: function() {
        const name_input = document.getElementById("groupNameInput");
        const errorText = document.getElementById("groupNameInputErrorText");
        errorText.classList.remove("active");

        if (1 <= name_input.value.length && name_input.value.length <= 32) {
            errorText.classList.remove("active");
            socket.emit("edit_chat_group_name", {"chatGroupId": editGroupWin.chatGroupId, "newName": name_input.value});
            this.startLoadingAnim();
        } 
        else {
            errorText.classList.add("active");
            errorText.innerHTML = lex["Enter a group name (1 - 32 characters long)"];
        }
    },

    deleteGroup: function() {
        socket.emit("delete_chat_group", editGroupWin.chatGroupId);
    },

    closeAndOpenGroupWin: function() {
        Modal.closeById("w-editGroupWin");
        groupWin.open(editGroupWin.chatGroupId, editGroupWin.chatGroupType);
    },

    startLoadingAnim: function() {
        LoadingAnim.start("editGroupWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },
}


/* add user to group win
============================================================================= */

const addFriendToGroupWin = {

    chatGroupId: null,

    chatGroupType: null,

    openAndCloseGroupWin: function(id, type) {
        groupWin.close();
        addFriendToGroupWin.chatGroupId = id;
        addFriendToGroupWin.chatGroupType = type;
        Modal.openSafelyById("w-addFriendToGroupWin");
        document.getElementById("addFriendToGroupWinTitle").innerHTML = lex["Add a friend to: "]+chats[type][id].name;
        document.getElementById("addUserToGroupNameOrEmailInput").value = "";
    },

    submit: function() {
        const name_or_email_input = document.getElementById("addUserToGroupNameOrEmailInput");
        const errorText = document.getElementById("addUserToGroupNameOrEmailInputErrorText");
        errorText.classList.remove("active");

        if (name_or_email_input.value.length >= 1) {
            errorText.classList.remove("active");
            socket.emit("add_friend_to_chat_group", {"friendNameOrEmail": name_or_email_input.value, "chatGroupId": addFriendToGroupWin.chatGroupId});
            this.startLoadingAnim();
        } 
        else {
            errorText.classList.add("active");
            errorText.innerHTML = lex["Enter a name or an email address"];
        }
    },

    closeAndOpenGroupWin: function() {
        Modal.closeById("w-addFriendToGroupWin");
        groupWin.open(addFriendToGroupWin.chatGroupId, addFriendToGroupWin.chatGroupType);
    },

    startLoadingAnim: function() {
        LoadingAnim.start("addFriendToGroupWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },
}


/* helpers
============================================================================= */

function getMsgChatMetaData(msg) {
    var id;
    var type;
    if (msg.chatGroupId) {
        id = msg.chatGroupId;
        type = "chatGroup";
    } else if (msg.projectChatGroupId) {
        id = msg.projectChatGroupId;
        type = "projectChatGroup";
    } else {
        type = "userToUser";
        if (msg.fromId == currentUserId)  {
            id = msg.toId;
        } else {
            id = msg.fromId;
        }
    }
    return {id: id, type: type};
}
