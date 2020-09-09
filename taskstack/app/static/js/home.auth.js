/* on document load
============================================================================= */

window.addEventListener("load", () => {
    buildProjectsOnLoad();
    buildFriendsOnLoad();
    buildNotificationsOnLoad();
});


/* socketio event handlers (called from main.js)
============================================================================= */

function installGlobalSocketEventHandlersForHome() {
    socket.on("disconnect", EventCallback.socketDisconnected);
    
    socket.on("new_friend", (data) => {
        newFriendDomEl(data);
    });

    socket.on("friend_removed", (data) => {
        document.getElementById("f-"+data.id).remove();
    });

    socket.on("update_friend_name", (data) => {
        const friend_dom_el = document.getElementById("f-"+data.id);
        friend_dom_el.href = "/"+data.name;
        friend_dom_el.getElementsByTagName("p")[0].innerHTML = data.name;
    });

    socket.on("now_collab_of_project", (data) => {
        newProjectDomEl(data, "userIsCollab");
    });

    socket.on("removed_as_collab_of_project", (id) => {
        document.getElementById("p-"+id).remove();
    });

    socket.on("update_project_attributes", (data) => {
        const project_dom_el = document.getElementById("p-"+data.projectId);
        project_dom_el.href = "/"+data.ownerName+"/"+data.name;
        project_dom_el.getElementsByTagName("p")[0].innerHTML = data.ownerName+"/"+data.name;
    });

    socket.on("receive_msg", (n) => {
        n.type = "msg";
        newNotificationDomEl(n);
    });

    socket.on("receive_friendship_request", (n) => {
        n.type = "friendshipRequest";
        newNotificationDomEl(n);
    });

    socket.on("remove_friendship_request", (id) => {
        removeNotificationDomEl("freq-"+id);
    });
}


/* projects
============================================================================= */

/* 
{
    whereOwner: [
        {
            id: <: inst>,
            ownerName: <: str>,
            name: <: str>,
            goToUrl: <: str>
        }, ...  # has to be sorted
    ],
    whereCollab: [
        {
            id: <: inst>,
            ownerName: <: str>,
            name: <: str>,
            goToUrl: <: str>
        }, ...  # has to be sorted
    ]
}
(to build on load)
*/

function newProjectDomEl(project, user_is) {
    const html = '<a class="project" id="p-' + project.id + '" href="' + project.goToUrl + '"><i class="fas fa-tasks"></i><p>' + project.ownerName+"/"+project.name + '</p></a>';
    if (user_is == "userIsCollab") {
        document.getElementById("projectsWhereCollab").insertAdjacentHTML("afterbegin", html);
    } else {
        document.getElementById("projectsWhereOwner").insertAdjacentHTML("afterbegin", html);
    }
}

function buildProjectsOnLoad() {
    function sortFunc(p1, p2) {
        if (p1.ownerName + p1.name > p2.ownerName + p2.name) {
            return -1;
        }
        return 1;
    }
    projects.whereOwner.sort(sortFunc);
    projects.whereCollab.sort(sortFunc);
    
    for (let project of projects.whereOwner) {
        newProjectDomEl(project, "currentUserIsOwner");
    }

    for (let project of projects.whereCollab) {
        newProjectDomEl(project, "userIsCollab");
    }
}


/* friends
============================================================================= */

/* 
[
    {   
        id: <: inst>,
        name: <: str>,
        picUrl: <: str>,
        goToUrl: <: str>
    }, ...  # has to be sorted
]
(to build on load)
*/

function newFriendDomEl(friend) {
    document.getElementById("friends").insertAdjacentHTML("afterbegin", 
    '<a class="friend" id="f-' + friend.id + '" href="' + friend.goToUrl + '"><img src="' + friend.picUrl + '"  alt="img"></img><p>' + friend.name + '</p></a>'
    ); 
}

function buildFriendsOnLoad() {
    friends.sort((f1, f2) => {
        if (f1.name > f2.name) {
            return -1;
        }
        return 1;
    });
    
    for (let friend of friends) {
        newFriendDomEl(friend);
    }
}


/* notifications
============================================================================= */

/*

*/

function newNotificationDomEl(n) {
    document.getElementById("nothingHere").classList.remove("active");

    const notifications_dom_el = document.getElementById("notifications");
    const datetime = new Date(n.datetime);
    const dateBlockId = "d-" + datetime.getDate() + "_" + (datetime.getMonth() + 1) + "_" + datetime.getFullYear();
    var dateBlock_dom_el = document.getElementById(dateBlockId);

    if (! dateBlock_dom_el) {
        notifications_dom_el.insertAdjacentHTML("afterbegin", 
        '<section class="dateSection"><div class="dateBlock" id="' + dateBlockId +'"><p>' + DatetimeToLocalizedString.datetimeV3(datetime) + '</p></div></section>'
        );
        dateBlock_dom_el = document.getElementById(dateBlockId);
    }

    if (n.type == "msg") {
        dateBlock_dom_el.insertAdjacentHTML("afterend", 
        '<div class="message" id="' + "msg-"+n.chatType+"-"+n.id + '" onclick="window.location=\'' + n.goToChatUrl + '\';">' +
            '<a href="' + n.goToUrl + '" class="picLink"><img class="fromPic" src="' + n.picUrl + '"  alt="img"></a>' +
            '<div class="text">' +
                '<p>' + n.content + '</p>' +
            '</div>' +
            '<div class="time">' +
                '<p>' + DatetimeToLocalizedString.time(datetime) + '</p>' +
            '</div>' +
            '<div class="markAsRead"><a onclick="markMsgAsRead(event, ' + n.id + ', \''+ n.chatType + '\');">' + lex["Mark as read"] + '</a></div>' +
        '</div>'
        );
    }

    else {
        dateBlock_dom_el.insertAdjacentHTML("afterend", 
        '<div class="request" id="' + "freq-"+n.id + '">' +
            '<a href="' + n.goToUrl + '" class="picLink"><img class="fromPic" src="' + n.picUrl + '"  alt="img"></a>' +
            '<div class="text">' +
                '<p>'+lex["Friendship request"]+'</p>' +
            '</div>' +
            '<div class="time">' +
                '<p>' + DatetimeToLocalizedString.time(datetime) + '</p>' +
            '</div>' +
            '<div class="btns">' +
                '<i class="fas fa-window-close dontAcceptBtn" onclick="dontAcceptFReq(' + n.id + ');"></i><i class="fas fa-check-square acceptBtn" onclick="acceptFReq(' + n.id + ');"></i>' +
            '</div>' +
        '</div>'
        );
    }
}

function removeNotificationDomEl(n_dom_el_id) {
    const n_dom_el = document.getElementById(n_dom_el_id);
    const date_section_dom_el = DomHelpers.getParent(n_dom_el, "dateSection");
    n_dom_el.remove();
    if (date_section_dom_el.children.length <= 1) {
        date_section_dom_el.remove();
    }

    if (document.getElementById("notifications").children.length == 0) {
        document.getElementById("nothingHere").classList.add("active");
    }
}

function buildNotificationsOnLoad() {
    notifications.sort((n1, n2) => {
        const n1_datetime = new Date(n1.datetime);
        const n2_datetime = new Date(n2.datetime);
        return n1_datetime.getTime() - n2_datetime.getTime();
    });

    for (let n of notifications) {
        newNotificationDomEl(n);
    }
}

function markMsgAsRead(e, id, chat_type) {
    e.stopPropagation();
    socket.emit("mark_msg_as_read", {"id": id, "chatType": chat_type});
    removeNotificationDomEl("msg-"+chat_type+"-"+id);
}

function acceptFReq(id) {
    socket.emit("accept_freq", {"id": id});
}

function dontAcceptFReq(id) {
    socket.emit("dont_accept_freq", {"id": id});
}
