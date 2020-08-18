var projectSocket;  // project namespace

var dragging;  // list/ card dom element that is currently being dragged

var fileUploadBoxes = {};
/*
    {<fileUploadBox-id>: {
            <file-name>: string (binary data) | null (-> don't upload file)
            ... 
    } ...}
*/

const UPLOAD_FILE_MAX = 8;

var ignoreDisconnect = false;


/* on document load
============================================================================= */

window.addEventListener("load", () => {
    buildListsAndCards();
    setupMenuBar();
    if (currentUserIsOwner || currentUserIsCollaborator) {
        // installExtraGlobalSocketEventHandlersForProject is called from main.js
        projectSocket = io.connect("/project");
        installProjectSocketEventHandlers();
        if (currentUserRole == "owner" || currentUserRole == "admin") {
            setupListAndCardDragging();
            setupFileUploading();
        }
    }
});


/* before unload
============================================================================= */

window.addEventListener("beforeunload", () => ignoreDisconnect=true)


/* socketio event handlers
============================================================================= */

function installExtraGlobalSocketEventHandlersForProject() {  // (called from main.js)

    socket.on("removed_as_collab_of_project", (id) => {
        if (id == project.id) {
            location = "/";
        }
    }); 

    socket.on("force_reload", () => {
        location.reload(); 
    }); 

    socket.on("update_project_attributes", (data) => {
        if (data.projectId != project.id) {
            return;
        }
        
        project.name = data.name;
        project.ownerName = data.ownerName;
        project.projectDesc = data.projectDesc;

        document.title = "Taskstack | "+project.name;
        history.replaceState("", document.title, "/"+project.ownerName+"/"+project.name);
        document.getElementById("projectName").innerHTML = project.name;
        document.getElementById("projectDesc").innerHTML = renderText(project.projectDesc);
    });
}

function installProjectSocketEventHandlers() {

    projectSocket.on("connect", () => projectSocket.emit("join_project_room", project.id));

    projectSocket.on("disconnect", () => {
        setTimeout(() => {
            if (! ignoreDisconnect) {
                document.getElementById("disconnectModal").classList.add("active");
                document.getElementsByClassName("overlay")[0].classList.add("active");
            }
        }, 100);
    });

    projectSocket.on("edit_project_name_and_desc_successful", () => {
        projectNameAndDescSettingWin.stopLoadingAnim();
        projectNameAndDescSettingWin.close();
    });

    projectSocket.on("edit_project_name_and_desc_error_owner_has_already_project_with_that_name", () => {
        projectNameAndDescSettingWin.stopLoadingAnim();
        projectNameAndDescSettingWin.nameDuplicateError();
    });

    projectSocket.on("project_deleted", () => {
        Modal.hideAll();
        deactivateMenuBar();
        document.getElementById("content").innerHTML = '<div style="padding: 32px;"><p style="text-align: center;display: block;">'+ lex["This project has been deleted."] + '</p><a href="/" style="text-align: center;display: block;">'+ lex["Take me home"] + '</a></div>';
        document.getElementsByClassName("modals")[0].innerHTML = "";
        ignoreDisconnect = true;
        projectSocket.disconnect();
    });

    projectSocket.on("build_new_list", (data) => {
        for (let list_id in project.lists) {
            project.lists[list_id].pos += 1;
        }
        buildList(data)
    });

    projectSocket.on("build_new_card", (data) => buildCard(data));

    projectSocket.on("create_list_successful", () => {
        newListWin.stopLoadingAnim();
        newListWin.close();
    });

    projectSocket.on("create_card_successful", () => {
        newCardWin.stopLoadingAnim();
        newCardWin.close();
    });

    projectSocket.on("update_list", (data) => updateAList(data));

    projectSocket.on("update_card", (data) => updateACard(data));

    projectSocket.on("edit_list_successful", () => {
        editListWin.stopLoadingAnim();
        editListWin.close(true);
    });

    projectSocket.on("edit_card_successful", () => {
        editCardWin.stopLoadingAnim();
        editCardWin.close(true);
    });

    projectSocket.on("update_list_pos", (data) => updateListsPos(data));

    projectSocket.on("update_card_pos", (data) => updateCardsPos(data));

    projectSocket.on("remove_list", (data) => removeAList(data));

    projectSocket.on("remove_card", (data) => removeACard(data));

    projectSocket.on("delete_list_successful", () => {
        editListWin.stopLoadingAnim();
        editListWin.close();
    });

    projectSocket.on("delete_card_successful", () => {
        editCardWin.stopLoadingAnim();
        editCardWin.close();
    });

    projectSocket.on("new_project_collab", (collab_data) => {
        project.members[collab_data.id] = collab_data;
        if (collabsWin.isInited) {
            collabsWin.newCollab(collab_data);
        }
    }); 

    projectSocket.on("successfully_added_friend_to_project", () => {
        addFriendToProjectWin.stopLoadingAnim();
        addFriendToProjectWin.close();
    }); 

    projectSocket.on("add_friend_to_project_error_invalid_target", () => {
        addFriendToProjectWin.stopLoadingAnim();
        document.getElementById("addFriendToProjectInputErrorText").classList.add("active");
        document.getElementById("addFriendToProjectInputErrorText").innerHTML = lex["Failed to add a friend with this name/ email to this project"];
    }); 

    projectSocket.on("project_collab_removed", (data) => {
        delete project.members[data.id];
        for (let list_id in project.lists) {
            for (let card_id in project.lists[list_id].cards) {
                delete project.lists[list_id].cards[card_id].members[data.id];
            }
        }
        for (let user_repr of document.getElementsByClassName("user-"+data.id)) {
            user_repr.remove();
        }
    }); 

    projectSocket.on("successfully_removed_project_collab", () => {
        collabsWin.stopLoadingAnim();
    });

    projectSocket.on("successfully_changed_user_role", () => {
        collabsWin.stopLoadingAnim();
    });

    projectSocket.on("successfully_created_project_chat_group", () => {
        chatGroupSettingWin.stopLoadingAnim();
        project.chatGroupStatus = "activated";
        chatGroupSettingWin.open();
    });

    projectSocket.on("successfully_deleted_project_chat_group", () => {
        chatGroupSettingWin.stopLoadingAnim();
        project.chatGroupStatus = "deactivated";
        chatGroupSettingWin.open();
    });

    projectSocket.on("update_project_visibility", (visibility) => {
        project.visibility = visibility;
    });

    projectSocket.on("successfully_changed_project_visibility", () => {
        visibilitySettingWin.stopLoadingAnim();
    });
    
    projectSocket.on("change_project_owner_error_invalid_target", () => {
        changeOwnerWin.stopLoadingAnim();
        document.getElementById("changeOwnerInputErrorText").classList.add("active");
        document.getElementById("changeOwnerInputErrorText").innerHTML = lex["Failed to transfer the project to a collaborator with this name/ email"];
    }); 

    projectSocket.on("successfully_left_project", () => {
        leaveProjectWin.stopLoadingAnim();
    }); 
}


/* initial list and card rendering
============================================================================= */

function buildListsAndCards() {
    var lists = [];

    for (let listId of Object.keys(project.lists)) {

        var cards = [];

        for (let cardId of Object.keys(project.lists[listId].cards)) {
            cards.push([cardId, project.lists[listId].cards[cardId]]);
        }

        cards.sort((card1, card2) => card1[1].pos - card2[1].pos);

        lists.push([listId, project.lists[listId], cards]);
    }

    lists.sort((list1, list2) => list1[1].pos - list2[1].pos);

    for (let list of lists) {
        buildListDomEl({
            id: list[0],
            name: list[1].name
        });
        for (let card of list[2]) {
            buildCardDomEl({
                id: card[0],
                listId: list[0],
                name: card[1].name,
                attachedFiles: card[1].attachedFiles
            });
        }
    }
}


/* setup list and card dragging
============================================================================= */

function setupListAndCardDragging() {
    const listsContainer = document.getElementById("listsContainer");

    document.addEventListener("dragstart", (e) => {
        if (e.target.classList.contains("list") || e.target.classList.contains("card")) {
            dragging = e.target;
            e.target.classList.add("dragImg");
            setTimeout(() => {
                e.target.classList.remove("dragImg");
                e.target.classList.add("dragging");
            }
            , 0);
        }
    });

    document.addEventListener("dragend", (e) => {

        if (dragging && dragging.classList.contains("list")) {
            const list_dom_el = dragging;
            var pos;
            for (pos=0; pos < listsContainer.children.length; pos++) {
                if (listsContainer.children[pos].id == list_dom_el.id) {
                    break;
                }
            }
            var id = list_dom_el.id.substring(2);
            if (pos != project.lists[id].pos) {
                projectSocket.emit("move_list", {
                    projectId: project.id,
                    id: id,
                    pos: pos
                });
            }
            
        } 

        else if (dragging && dragging.classList.contains("card")) {
            const card_dom_el = dragging;
            const list_of_card_dom_el_cards = DomHelpers.getParent(card_dom_el, "cards");
            var pos;
            for (pos=0; pos < list_of_card_dom_el_cards.children.length; pos++) {
                if (list_of_card_dom_el_cards.children[pos].id == card_dom_el.id) {
                    break;
                }
            }
            var id = card_dom_el.id.substring(2);
            var card_oldListId = DomHelpers.getParent(card_dom_el, "list").id.substring(2);
            for (let listId in project.lists) {
                if (project.lists[listId].cards[id]) {
                    card_oldListId = listId;
                    break;
                }
            }
            var card_newListId = DomHelpers.getParent(card_dom_el, "list").id.substring(2);
            if ((pos != project.lists[card_oldListId].cards[id].pos) || (card_newListId != card_oldListId)) {
                projectSocket.emit("move_card", {
                    projectId: project.id,
                    id: id,
                    listId: card_newListId,
                    pos: pos
                });
            }
        } 
        
        else { return; }

        dragging.classList.remove("dragging");
        dragging = null;

    });

    document.addEventListener("dragover", (e) => {
        if (dragging) {

            if (dragging.classList.contains("list") && (e.target ===  listsContainer || listsContainer.contains(e.target))) {
                e.preventDefault();
                const list = dragging;
                const insert_before_pos = getInsertListBeforePos(e.clientX);
                if (insert_before_pos > listsContainer.children.length - 1) {
                    listsContainer.appendChild(list);
                } else {
                    listsContainer.insertBefore(list, listsContainer.children[insert_before_pos]);
                }
            }

            else if (dragging.classList.contains("card")) {
                var list = e.target;
                if (! list.classList.contains("list")) {
                    list = DomHelpers.getParent(e.target, "list");
                    if (! list) {
                        return;
                    }
                }
                e.preventDefault();
                const list_of_card_cards = list.getElementsByClassName("cards")[0].children
                const card = dragging;
                const insert_before_pos = getInsertCardBeforePos(list, e.clientY);
                if (insert_before_pos > list_of_card_cards.length - 1) {
                list.getElementsByClassName("cards")[0].appendChild(card);
                } else {
                    list.getElementsByClassName("cards")[0].insertBefore(card, list_of_card_cards[insert_before_pos]);
                }
            }
        }

    });
}


/* setup file uploading
============================================================================= */

function setupFileUploading() {
    for (let fileUploadBox of document.getElementsByClassName("fileUploadBox")) {
        fileUploadBoxes[fileUploadBox.id] = {};
    }
}


/* setup menu bar
============================================================================= */

function setupMenuBar() {
    function activateMenu(menu) {
        for (let _menu of document.getElementsByClassName("menu")) {
            _menu.classList.remove("active");
            _menu.classList.remove("reactToHover");
        }
        menu.classList.add("active");
        menu.classList.add("reactToHover");
    }

    function deactivateMenus() {
        for (let menu of document.getElementsByClassName("menu")) {
            menu.classList.remove("active");
            menu.classList.add("reactToHover");
            menu.classList.add("hidden");
        }
        deactivateSubMenus();
        setTimeout(() => {
            for (let menu of document.getElementsByClassName("menu")) {
                menu.classList.remove("hidden");
            }
        }, 10)
    }

    function activateSubMenu(subMenu) {
        for (let _subMenu of document.getElementsByClassName("subMenu")) {
            _subMenu.classList.remove("active");
            _subMenu.classList.remove("reactToHover");
        }
        for (let child_subMenu of subMenu.getElementsByClassName("subMenu")) {
            child_subMenu.classList.add("reactToHover");
        }
        const menu = DomHelpers.getParent(subMenu, "menu");
        if (! menu.classList.contains("active")) {
            activateMenu(menu);
        }
        for (let parent_subMenu of DomHelpers.getParents(subMenu, "subMenu")) {
            parent_subMenu.classList.add("active");
        }
        subMenu.classList.add("active");
        subMenu.classList.add("reactToHover");
    }

    function deactivateSubMenu(subMenu) {
        subMenu.classList.remove("active");
        subMenu.classList.add("reactToHover");
        for (let child_subMenu of subMenu.getElementsByClassName("subMenu")) {
            child_subMenu.classList.remove("active");
            child_subMenu.classList.add("reactToHover");
        }
    }

    function deactivateSubMenus() {
        for (let subMenu of document.getElementsByClassName("subMenu")) {
            subMenu.classList.remove("active");
            subMenu.classList.add("reactToHover");
        }
    }

    function menuBar_document_clicked_handler(e) {
        if (e.target.classList.contains("menu")) {
            if (e.target.classList.contains("active")) {
                setTimeout(deactivateMenus, 200);
            } 
            else {
                activateMenu(e.target);
            }
        }

        else if (e.target.classList.contains("subMenu") && ! e.target.classList.contains("disabled")) {
            if (e.target.classList.contains("active")) {
                deactivateSubMenu(e.target)
            } 
            else {
                activateSubMenu(e.target);
            }
        }

        else if (document.getElementById("menuBar").contains(e.target)) {
            if (! e.target.classList.contains("disabled")) {
                deactivateMenus();
            }
        }

        else {
            deactivateMenus(); 
        }
    }

    for (let menu of document.getElementsByClassName("menu")) {
        menu.classList.add("reactToHover");
    }

    for (let subMenu of document.getElementsByClassName("subMenu")) {
        subMenu.classList.add("reactToHover");
    }

    document.addEventListener("click", menuBar_document_clicked_handler);

    if (lang == "de") {
        document.addEventListener("keydown", (e) => {
            if (! e.altKey) {
                return;
            }
            const key_code = e.which || e.keyCode;
            switch (key_code) {
                case 80:
                    activateMenu(document.getElementById("projectMenu"));
                    break;
                case 65: 
                    activateMenu(document.getElementById("viewMenu"));
                    break;
                case 69:
                    activateMenu(document.getElementById("settingsMenu"));
                    break;
                case 86:
                    activateMenu(document.getElementById("historyMenu"));
                    break;
                case 72:
                    activateMenu(document.getElementById("helpMenu"));
                    break;
                default:
                    return;
            }
            e.preventDefault();
        }); 
    }
    else {
       document.addEventListener("keydown", (e) => {
            if (! e.altKey) {
                return;
            }
            const key_code = e.which || e.keyCode;
            switch (key_code) {
                case 80:
                    activateMenu(document.getElementById("projectMenu"));
                    break;
                case 86: 
                    activateMenu(document.getElementById("viewMenu"));
                    break;
                case 83:
                    activateMenu(document.getElementById("settingsMenu"));
                    break;
                case 73:
                    activateMenu(document.getElementById("historyMenu"));
                    break;
                case 72:
                    activateMenu(document.getElementById("helpMenu"));
                    break;
                default:
                    return;
            }
            e.preventDefault();
        }); 
    }
    
    // (de/)activate buttons
    
    if (currentUserIsOwner) {
        document.getElementById("addFriendButton").onclick = addFriendToProjectWin.open;
        document.getElementById("invitePeopleWithLinkButton").onclick = invitePeopleWithLinkWin.open;
        document.getElementById("editProjectNameAndDescButton").onclick = projectNameAndDescSettingWin.open;
        document.getElementById("deleteProjectButton").onclick = deleteProjectWin.open;
        document.getElementById("changeOwnerButton").onclick = changeOwnerWin.open;
        document.getElementById("visibilitySettingButton").onclick = visibilitySettingWin.open;
        document.getElementById("chatGroupSettingButton").onclick = chatGroupSettingWin.open;
    } else {
        document.getElementById("addFriendButton").classList.add("disabled");
        document.getElementById("invitePeopleWithLinkButton").classList.add("disabled");
        document.getElementById("editProjectNameAndDescButton").classList.add("disabled");
        document.getElementById("deleteProjectButton").classList.add("disabled");
        document.getElementById("changeOwnerButton").classList.add("disabled");
        document.getElementById("visibilitySettingButton").classList.add("disabled");
        document.getElementById("chatGroupSettingButton").classList.add("disabled");
    }
    if (currentUserRole == "owner" || currentUserRole == "admin") {
        document.getElementById("newListButton").onclick = newListWin.open;
    } else {
        document.getElementById("newListButton").classList.add("disabled");
    }
    if (currentUserIsCollaborator) {
        document.getElementById("leaveProjectButton").onclick = leaveProjectWin.open;
    } else {
        document.getElementById("leaveProjectButton").classList.add("disabled");
    }
    document.getElementById("collaboratorsButton").onclick = collabsWin.open;
}

function deactivateMenuBar() {
    for (let menu of document.getElementById("menuBar").children) {
        for (let action of menu.children[1].children) {
            if (action.id != "exitButton") {
                action.classList.add("disabled");
                action.onclick = "";
            }
        }
    }
}


/* wins (id prefix "w-")
============================================================================= */

const listWin = {

    listId: null,

    open: function(e=null, _listId=null) {
        var list;
        if (_listId !== null) {
            list = project.lists[_listId];
            listWin.listId = _listId;
        } else if (e !== null) {
            let list_dom_el = DomHelpers.getParent(e.target, "list");
            list = project.lists[list_dom_el.id.substring(2)];
            listWin.listId = list_dom_el.id.substring(2);
        } else { return; }

        document.getElementById("listWinName").innerHTML = he.escape(list.name);
        document.getElementById("listWinDesc").innerHTML = renderText(list.listDesc);

        const listWinFiles = document.getElementById("listWinFiles");
        listWinFiles.innerHTML = "";
        if (Object.keys(list.attachedFiles).length >= 1) {
            document.getElementById("listWinFilesSection").classList.add("active");
            for (let file_name of Object.keys(list.attachedFiles)) {
                listWinFiles.innerHTML += getFileHTML(file_name, list.attachedFiles[file_name]);
            }
        } else {
            document.getElementById("listWinFilesSection").classList.remove("active");
        }

        document.getElementById("w-listWin").classList.add("active");
        document.getElementsByClassName("overlay")[0].classList.add("active");
    },

    close: function() {
        Modal.hideAll();
    }
};

const cardWin = {

    cardId: null,

    open: function(e=null, _cardId=null) {
        var card;
        if (_cardId !== null) {
            const card_dom_el = document.getElementById("c-"+_cardId);
            const parent_list_dom_el = DomHelpers.getParent(card_dom_el, "list");
            const parent_list = project.lists[parent_list_dom_el.id.substring(2)];
            card = parent_list.cards[card_dom_el.id.substring(2)];
            cardWin.cardId = card_dom_el.id.substring(2);
        } else if (e !== null) {
            const card_dom_el = DomHelpers.getParent(e.target, "card");
            const parent_list_dom_el = DomHelpers.getParent(e.target, "list");
            const parent_list = project.lists[parent_list_dom_el.id.substring(2)];
            card = parent_list.cards[card_dom_el.id.substring(2)];
            cardWin.cardId = card_dom_el.id.substring(2);
        } else { return; }

        document.getElementById("cardWinName").innerHTML = he.escape(card.name);
        document.getElementById("cardWinDesc").innerHTML = renderText(card.cardDesc);

        const cardWinFiles = document.getElementById("cardWinFiles");
        cardWinFiles.innerHTML = "";
        if (Object.keys(card.attachedFiles).length >= 1) {
            document.getElementById("cardWinFilesSection").classList.add("active");
            for (let file_name of Object.keys(card.attachedFiles)) {
                cardWinFiles.innerHTML += getFileHTML(file_name, card.attachedFiles[file_name]);
            }
        } else {
            document.getElementById("cardWinFilesSection").classList.remove("active");
        }
        
        const cardWinAddedUsersList = document.getElementById("cardWinAddedUsersList");
        cardWinAddedUsersList.innerHTML = "";
        var hide_cardWinAddedUsersSection = true;
        for (let member_id in card.members) {
            cardWinAddedUsersList.innerHTML += '<div class="addedUser user-'+member_id+'" id="'+"card-win-added-user-"+member_id+'" onclick="cardWin.activateAddedUserName(\''+member_id+'\');"><img src="'+project.members[member_id].picUrl+'"><a class="name" href="'+project.members[member_id].goToUrl+'">'+ project.members[member_id].name + '</a></div>';
            hide_cardWinAddedUsersSection = false;
        }
        if (hide_cardWinAddedUsersSection) {
            document.getElementById("cardWinAddedUsersSection").classList.remove("active");
        } else {
            document.getElementById("cardWinAddedUsersSection").classList.add("active");
        }

        document.getElementById("w-cardWin").classList.add("active");
        document.getElementsByClassName("overlay")[0].classList.add("active");
    },

    activateAddedUserName: function(id) {
        DomHelpers.activate(document.getElementById("card-win-added-user-"+id).getElementsByClassName("name")[0]);
    },

    close: function() {
        Modal.hideAll();
    }
};

const editListWin = {

    listId: null,

    submit: function() {
        var invalid = false;
        if (document.getElementById("editListNameInput").value.length < 1 || document.getElementById("editListNameInput").value.length > 32) {
            document.getElementById("editListNameInputErrorText").innerHTML = lex["The list name must be 1 - 32 characters long."];
            document.getElementById("editListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editListNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("editListDescInput").value.length > 1024) {
            document.getElementById("editListDescInputErrorText").innerHTML = lex["The list description may only be 1024 characters long."];
            document.getElementById("editListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editListDescInputErrorText").classList.remove("active");
        }
        if (invalid) {
            return;
        }
        var newAttachedFiles = {};
        var replacedAttachedFiles = {};
        var removedAttachedFiles = [];
        for (let file_name of Object.keys(fileUploadBoxes.editListFileUploadBox)) {
            if (fileUploadBoxes.editListFileUploadBox[file_name] != null) {
                if (project.lists[this.listId].attachedFiles.hasOwnProperty(file_name)) {
                    replacedAttachedFiles[file_name] = fileUploadBoxes.editListFileUploadBox[file_name];
                } else {
                    newAttachedFiles[file_name] = fileUploadBoxes.editListFileUploadBox[file_name];
                }
            }
        }
        for (let file_name of Object.keys(project.lists[this.listId].attachedFiles)) {
            if (! fileUploadBoxes.editListFileUploadBox.hasOwnProperty(file_name)) {
                removedAttachedFiles.push(file_name);
            }
        }
        projectSocket.emit("edit_list", {
            projectId: project.id,
            id: this.listId,
            name: document.getElementById("editListNameInput").value,
            listDesc: document.getElementById("editListDescInput").value,
            newAttachedFiles: newAttachedFiles,
            replacedAttachedFiles: replacedAttachedFiles,
            removedAttachedFiles: removedAttachedFiles
        });
        this.startLoadingAnim();
    },

    open: function() {
        editListWin.listId = listWin.listId;
        document.getElementById("w-listWin").classList.remove("active");
        document.getElementById("editListWinName").innerHTML = he.escape(project.lists[this.listId].name);
        document.getElementById("editListNameInput").value = project.lists[this.listId].name;
        document.getElementById("editListDescInput").value = project.lists[this.listId].listDesc;
        for (let file_name of Object.keys(project.lists[this.listId].attachedFiles)) {
            fileUploadBoxAddFile("editListFileUploadBox", file_name, null);
        }
        document.getElementById("w-editListWin").classList.add("active");
    },
    
    close: function(open_listWin=false) {
        document.getElementById("editListNameInput").value = "";
        document.getElementById("editListDescInput").value = "";
        document.getElementById("editListNameInputErrorText").classList.remove("active");
        document.getElementById("editListDescInputErrorText").classList.remove("active");
        clearFileUploadBox("editListFileUploadBox");
        Modal.hideAll();
        if (open_listWin) {
            listWin.open(null, this.listId);
        }
        editListWin.listId = null;
    }, 

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("editListLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("editListLoadingBarBox").classList.remove("active");
    },

    delete: function() {
        projectSocket.emit("delete_list", {
            projectId: project.id,
            id: this.listId
        });
        this.startLoadingAnim();
    }
};

const editCardWin = {

    cardId: null,

    newAddedUsers: [],

    removedAddedUsers: [],

    submit: function() {
        var invalid = false;
        if (document.getElementById("editCardNameInput").value.length < 1 || document.getElementById("editCardNameInput").value.length > 32) {
            document.getElementById("editCardNameInputErrorText").innerHTML = lex["The card name must be 1 - 32 characters long."];
            document.getElementById("editCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editCardNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("editCardDescInput").value.length > 1024) {
            document.getElementById("editCardDescInputErrorText").innerHTML = lex["The card description may only be 1024 characters long."];
            document.getElementById("editCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editCardDescInputErrorText").classList.remove("active");
        }
        if (invalid) {
            return;
        }
        var newAttachedFiles = {};
        var replacedAttachedFiles = {};
        var removedAttachedFiles = [];
        const listId = DomHelpers.getParent(document.getElementById("c-"+this.cardId), "list").id.substring(2);
        for (let file_name of Object.keys(fileUploadBoxes.editCardFileUploadBox)) {
            if (fileUploadBoxes.editCardFileUploadBox[file_name] != null) {
                if (project.lists[listId].cards[this.cardId].attachedFiles.hasOwnProperty(file_name)) {
                    replacedAttachedFiles[file_name] = fileUploadBoxes.editCardFileUploadBox[file_name];
                } else {
                    newAttachedFiles[file_name] = fileUploadBoxes.editCardFileUploadBox[file_name];
                }
            }
        }
        for (let file_name of Object.keys(project.lists[listId].cards[this.cardId].attachedFiles)) {
            if (! fileUploadBoxes.editCardFileUploadBox.hasOwnProperty(file_name)) {
                removedAttachedFiles.push(file_name);
            }
        }

        projectSocket.emit("edit_card", {
            projectId: project.id,
            id: this.cardId,
            listId: listId,
            name: document.getElementById("editCardNameInput").value,
            cardDesc: document.getElementById("editCardDescInput").value,
            newAttachedFiles: newAttachedFiles,
            replacedAttachedFiles: replacedAttachedFiles,
            removedAttachedFiles: removedAttachedFiles,
            newAddedUsers: editCardWin.newAddedUsers,
            removedAddedUsers: editCardWin.removedAddedUsers
        });
        this.startLoadingAnim();
    },

    open: function() {
        editCardWin.cardId = cardWin.cardId;
        const listId = DomHelpers.getParent(document.getElementById("c-"+this.cardId), "list").id.substring(2);
        document.getElementById("w-cardWin").classList.remove("active");
        document.getElementById("editCardWinName").innerHTML = he.escape(project.lists[listId].cards[this.cardId].name);
        document.getElementById("editCardNameInput").value = project.lists[listId].cards[this.cardId].name;
        document.getElementById("editCardDescInput").value = project.lists[listId].cards[this.cardId].cardDesc;

        for (let file_name of Object.keys(project.lists[listId].cards[this.cardId].attachedFiles)) {
            fileUploadBoxAddFile("editCardFileUploadBox", file_name, null);
        }

        const editCardWinAddUserSelect = document.getElementById("editCardWinAddUserSelect");
        const editCardWinAddUserSelectList = editCardWinAddUserSelect.getElementsByTagName("ul")[0];
        
        editCardWinAddUserSelectList.innerHTML = "";

        const editCardWinAddedUsersList = document.getElementById("editCardWinAddedUsersList");
        editCardWinAddedUsersList.innerHTML = "";

        editCardWin.newAddedUsers = [];
        editCardWin.removedAddedUsers = [];
        
        for (let user_id in project.members) {
            var html = '<li class="user-'+user_id;
            if (project.lists[listId].cards[this.cardId].members[user_id]) {
                document.getElementById("editCardWinAddedUsersList").innerHTML += '<div class="addedUser user-'+user_id+'" id="'+"edit-card-win-added-user-"+user_id+'"><img src="'+project.members[user_id].picUrl+'"></div>';
                html += ' active" data-checked="true"';
            } else {
                html += '"';
            }
            html += ' onclick="editCardWin.toggleAddUser('+user_id+');"><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></li>';
            editCardWinAddUserSelectList.innerHTML += html;
        }

        MainInit.setupSelect(editCardWinAddUserSelect);

        document.getElementById("w-editCardWin").classList.add("active");
    },

    close: function(open_cardWin=false) {
        document.getElementById("editCardNameInput").value = "";
        document.getElementById("editCardDescInput").value = "";
        document.getElementById("editCardNameInputErrorText").classList.remove("active");
        document.getElementById("editCardDescInputErrorText").classList.remove("active");
        clearFileUploadBox("editCardFileUploadBox");
        Modal.hideAll();
        if (open_cardWin) {
            cardWin.open(null, this.cardId);
        }
        editCardWin.cardId = null;
    }, 

    toggleAddUser: function(id) {
        const listId = DomHelpers.getParent(document.getElementById("c-"+this.cardId), "list").id.substring(2);
        const dom_el = document.getElementById("edit-card-win-added-user-"+id);
        if (! dom_el) {
            document.getElementById("editCardWinAddedUsersList").innerHTML += '<div class="addedUser user-'+id+'" id="'+"edit-card-win-added-user-"+id+'"><img src="'+project.members[id].picUrl+'"></div>';
            if (!project.lists[listId].cards[this.cardId].members[id]) {
                editCardWin.newAddedUsers.push(id);
                let i = editCardWin.removedAddedUsers.indexOf(id);
                if (i > -1) {
                    editCardWin.removedAddedUsers.splice(i, 1);
                } 
            }
            
        } else {
            dom_el.remove();
            let i = editCardWin.newAddedUsers.indexOf(id);
            if (i > -1) {
                editCardWin.newAddedUsers.splice(i, 1);
            } 
            if (project.lists[listId].cards[this.cardId].members[id]) { 
                editCardWin.removedAddedUsers.push(id);
            }
        }
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("editCardLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("editCardLoadingBarBox").classList.remove("active");
    },

    delete: function() {
        projectSocket.emit("delete_card", {
            projectId: project.id,
            id: this.cardId,
            listId: DomHelpers.getParent(document.getElementById("c-"+this.cardId), "list").id.substring(2)
        });
        this.startLoadingAnim();
    }
};

const newListWin = {

    submit: function() {
        var invalid = false;
        if (document.getElementById("newListNameInput").value.length < 1 || document.getElementById("newListNameInput").value.length > 32) {
            document.getElementById("newListNameInputErrorText").innerHTML = lex["The list name must be 1 - 32 characters long."];
            document.getElementById("newListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newListNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("newListDescInput").value.length > 1024) {
            document.getElementById("newListDescInputErrorText").innerHTML = lex["The list description may only be 1024 characters long."];
            document.getElementById("newListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newListDescInputErrorText").classList.remove("active");
        }
        if (invalid) {
            return;
        }
        projectSocket.emit("create_list", {
            projectId: project.id,
            name: document.getElementById("newListNameInput").value,
            listDesc: document.getElementById("newListDescInput").value,
            attachedFiles: fileUploadBoxes["newListFileUploadBox"]
        });
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementById("w-newListWin").classList.add("active");
        document.getElementsByClassName("overlay")[0].classList.add("active");
    },

    close: function() {
        document.getElementById("newListNameInput").value = "";
        document.getElementById("newListDescInput").value = "";
        document.getElementById("newListNameInputErrorText").classList.remove("active");
        document.getElementById("newListDescInputErrorText").classList.remove("active");
        clearFileUploadBox("newListFileUploadBox");
        Modal.hideAll();
    }, 

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("newListLoadingBarBox").classList.add("active");     
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("newListLoadingBarBox").classList.remove("active");     
    }
};

const newCardWin = {

    addedUsers: [],

    addCardTo: undefined,

    submit: function() {
        var invalid = false;
        if (document.getElementById("newCardNameInput").value.length < 1 || document.getElementById("newCardNameInput").value.length > 32) {
            document.getElementById("newCardNameInputErrorText").innerHTML = lex["The card name must be 1 - 32 characters long."];
            document.getElementById("newCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newCardNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("newCardDescInput").value.length > 1024) {
            document.getElementById("newCardDescInputErrorText").innerHTML = lex["The card description may only be 1024 characters long."];
            document.getElementById("newCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newCardDescInputErrorText").classList.remove("active");
        }
        if (invalid) {
            return;
        }
        projectSocket.emit("create_card", {
            projectId: project.id,
            listId: newCardWin.addCardTo,
            name: document.getElementById("newCardNameInput").value,
            cardDesc: document.getElementById("newCardDescInput").value,
            attachedFiles: fileUploadBoxes["newCardFileUploadBox"],
            addedUsers: newCardWin.addedUsers
        });
        this.startLoadingAnim();
    },

    open: function(e) {
        newCardWin.addedUsers = [];
        newCardWin.addCardTo = DomHelpers.getParent(e.target, "list").id.substring(2);

        document.getElementById("newCardWinAddedUsersList").innerHTML = "";

        const newCardWinAddUserSelect = document.getElementById("newCardWinAddUserSelect");
        const newCardWinAddUserSelectList = newCardWinAddUserSelect.getElementsByTagName("ul")[0];
        
        newCardWinAddUserSelectList.innerHTML = "";
        document.getElementById("newCardWinAddedUsersList").innerHTML = "";
        
        for (let user_id in project.members) {
            newCardWinAddUserSelectList.innerHTML += '<li class="user-'+user_id+'" onclick="newCardWin.toggleAddUser('+user_id+');"><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></li>';
        }

        MainInit.setupSelect(newCardWinAddUserSelect);

        document.getElementById("w-newCardWin").classList.add("active");
        document.getElementsByClassName("overlay")[0].classList.add("active");
    },

    toggleAddUser: function(id) {
        const dom_el = document.getElementById("new-card-win-added-user-"+id);
        if (! dom_el) {
            document.getElementById("newCardWinAddedUsersList").innerHTML += '<a class"user-'+id+'" id="'+"new-card-win-added-user-"+id+'"><img src="'+project.members[id].picUrl+'"></a>';
            newCardWin.addedUsers.push(id);
        } else {
            dom_el.remove();
            const i = newCardWin.addedUsers.indexOf(id);
            if (i > -1) {
                newCardWin.addedUsers.splice(i, 1);
            } 
        }
    },

    close: function() {
        addCardTo = null;
        document.getElementById("newCardNameInput").value = "";
        document.getElementById("newCardDescInput").value = "";
        document.getElementById("newCardNameInputErrorText").classList.remove("active");
        document.getElementById("newCardDescInputErrorText").classList.remove("active");
        clearFileUploadBox("newCardFileUploadBox");
        Modal.hideAll();
    }, 

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("newCardLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("newCardLoadingBarBox").classList.remove("active");
    }
};

const projectNameAndDescSettingWin = {

    submit: function () {
        var invalid = false;
        const name = document.getElementById("projectNameInput").value;
        const desc = document.getElementById("projectDescInput").value;
        const projectNameInputErrorText = document.getElementById("projectNameInputErrorText");
        const projectDescInputErrorText = document.getElementById("projectDescInputErrorText");
        const name_validation = validProjectName(name);
        const desc_validation = validProjectDesc(desc);
        if (name_validation == "too_long" || name_validation=="too_short") {
            projectNameInputErrorText.innerHTML = lex["The project name must be 3 - 32 characters long"];
            projectNameInputErrorText.classList.add("active");
            invalid = true;
        } else if (name_validation == "invalid") {
            projectNameInputErrorText.innerHTML = lex["Invalid project name"];
            projectNameInputErrorText.classList.add("active");
            invalid = true;
        } else {
            projectNameInputErrorText.classList.remove("active");
        }
        if (desc_validation == "too_long") {
            projectDescInputErrorText.innerHTML = lex["The project description may only be 128 characters long"];
            projectDescInputErrorText.classList.add("active");
            invalid = true;
        } else {
            projectDescInputErrorText.classList.remove("active");
        }
        if (invalid) {
            return;
        }
        projectSocket.emit("edit_project_name_and_desc", {
            id: project.id,
            name: name,
            projectDesc: desc
        });
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementById("projectNameInput").value = project.name;
        document.getElementById("projectDescInput").value = project.projectDesc;
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-projectNameAndDescSettingWin").classList.add("active");
    },

    close: function() {
        document.getElementById("projectNameInput").value = project.name;
        document.getElementById("projectDescInput").value = project.projectDesc;
        Modal.hideAll();
    },
    
    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("projectNameAndDescSettingLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("projectNameAndDescSettingLoadingBarBox").classList.remove("active");
    }, 

    nameDuplicateError: function() {
        document.getElementById("projectNameInputErrorText").innerHTML = lex["Owner already has a project with this name"];
        document.getElementById("projectNameInputErrorText").classList.add("active");
    }
};

const addFriendToProjectWin = {

    submit: function() {
        const name_input = document.getElementById("addFriendToProjectInput");
        const error_text = document.getElementById("addFriendToProjectInputErrorText");
        if (1 <= name_input.value.length) {
            error_text.classList.remove("active");
            this.startLoadingAnim();
            var role;
            if (document.getElementById("addFriendToProjectWithAdminRoleButton").checked) {
                role = "admin";
            } else {
                role = "access-only";
            }
            projectSocket.emit("add_friend_to_project", 
                {"projectId": project.id, 
                "friendNameOrEmail": name_input.value,
                "role": role}
            );
        } else {
            error_text.classList.add("active");
            error_text.innerHTML = lex["Enter a name or an email address"];
        }
    },

    open: function() {
        document.getElementById("addFriendToProjectInput").value = "";
        document.getElementById("addFriendToProjectWithAccessOnlyRoleButton").checked = true;
        document.getElementById("addFriendToProjectWithAdminRoleButton").checked = false;
        document.getElementById("addFriendToProjectInputErrorText").classList.remove("active");
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-addFriendToProjectWin").classList.add("active");
    },

    close: function() {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("addFriendToProjectLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("addFriendToProjectLoadingBarBox").classList.remove("active");
    }
}

const invitePeopleWithLinkWin = {

    open: function() {
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-invitePeopleWithLinkWin").classList.add("active");
    },

    close: function() {
        Modal.hideAll();
    }
}

const collabsWin = {

    isInited: false,

    open: function() {
        if (! collabsWin.isInited) {
            collabsWin.init();
        }

        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-collabsWin").classList.add("active");
    },

    init: function() {
        var members_sorted = [];
        for (let member_id in project.members) {
            members_sorted.push(project.members[member_id]);
        }
        members_sorted.sort((member1, member2) => {
            if (member1.name > member2.name) {
                return -1;
            }
            return 1;
        });
        for (member of members_sorted) {
            this.newCollab(member);
        }
        collabsWin.isInited = true;
    },

    newCollab: function(member) {
        var html = '<div class="collab user-'+member.id+'"><div class="ellipsisOptions"><i class="fas fa-ellipsis-v" onclick="DomHelpers.activate(this.parentElement);"></i><ul>';
        if (currentUserIsOwner && member.id != currentUserId) {
            html += '<li onclick="collabsWin.removeUserFromProject(\''+ member.id + '\');">' + lex["Remove from project"] + '</li>';
            if (member.role == "admin") {
                html += '<li onclick="collabsWin.changeUserRole(\''+ member.id + '\', \'access-only\');">' + lex["Dismiss as admin"] + '</li>';
            } else if (member.role == "access-only") {
                html += '<li onclick="collabsWin.changeUserRole(\''+ member.id + '\', \'admin\');">' + lex["Make admin"] + '</li>';
            }
        }
        html += '</ul></div><a href="' + member.goToUrl + '"><img src="' + member.picUrl + '"  alt="img"></img><p>' + member.name + '</p></a></div>'

        document.getElementById("collabsSection").insertAdjacentHTML("afterbegin", html);
    },

    removeUserFromProject: function(id) {
        projectSocket.emit("remove_user_from_project", {"projectId": project.id, "userId": id});
        this.startLoadingAnim();
    },

    changeUserRole: function(id, new_role) {
        projectSocket.emit("change_user_role", {"projectId": project.id, "userId": id, "newRole": new_role});

        project.members[id].role = new_role;

        this.startLoadingAnim();

        var html = '<li onclick="collabsWin.removeUserFromProject(\''+ id + '\');">' + lex["Remove from project"] + '</li>';
        if (new_role == "admin") {
            html += '<li onclick="collabsWin.changeUserRole(\''+ id + '\', \'access-only\');">' + lex["Dismiss as admin"] + '</li>';
        } else if (new_role == "access-only") {
            html += '<li onclick="collabsWin.changeUserRole(\''+ id + '\', \'admin\');">' + lex["Make admin"] + '</li>';
        }
        document.getElementsByClassName("collab user-"+id)[0].getElementsByTagName("ul")[0].innerHTML = html;
    },

    close: function()  {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("collabsWinLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("collabsWinLoadingBarBox").classList.remove("active");
    }
}

const changeOwnerWin = {

    submit: function() {
        const name_or_email_input = document.getElementById("changeOwnerInput");
        const errorText = document.getElementById("changeOwnerInputErrorText");
        errorText.classList.remove("active");

        if (name_or_email_input.value.length >= 1) {
            errorText.classList.remove("active");
            projectSocket.emit("change_project_owner", {"nameOrEmail": name_or_email_input.value, "projectId": project.id});
            this.startLoadingAnim();
        } 
        else {
            errorText.classList.add("active");
            errorText.innerHTML = lex["Enter a name or an email address"];
        }
    },

    open: function() {
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-changeOwnerWin").classList.add("active");
    },

    close: function()  {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("changeOwnerLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("changeOwnerLoadingBarBox").classList.remove("active");
    }
}

const visibilitySettingWin = {

    submit: function() {
        if (document.getElementById("visibilitySettingEveryoneButton").checked) {
            projectSocket.emit("change_project_visibility", {"projectId": project.id, "value": "public"});
        } else if (document.getElementById("visibilitySettingFriendsButton").checked) {
            projectSocket.emit("change_project_visibility", {"projectId": project.id, "value": "friends"});
        } else {
            projectSocket.emit("change_project_visibility", {"projectId": project.id, "value": "private"});
        }
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementById("visibilitySettingEveryoneButton").checked = false;
        document.getElementById("visibilitySettingFriendsButton").checked = false;
        document.getElementById("visibilitySettingPrivateButton").checked = false;
        switch (project.visibility) {
            case "public":
                document.getElementById("visibilitySettingEveryoneButton").checked = true;
                break;
            case "friends":
                document.getElementById("visibilitySettingFriendsButton").checked = true;
                break;
            default:
                document.getElementById("visibilitySettingPrivateButton").checked = true;
                break;
        }
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-visibilitySettingWin").classList.add("active");
    },

    close: function()  {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("visibilitySettingLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("visibilitySettingLoadingBarBox").classList.remove("active");
    }
}

const chatGroupSettingWin = {

    submit: function(action) {
        if (action == "activate") {
            projectSocket.emit("create_project_chat_group", {"projectId": project.id});
        } else {
            projectSocket.emit("delete_project_chat_group", {"projectId": project.id});
        }
        this.startLoadingAnim();
    },

    open: function() {
        if (project.chatGroupStatus == "activated") {
            document.getElementById("activateChatGroupButton").classList.add("disabled");
            document.getElementById("deactivateChatGroupButton").classList.remove("disabled");
        } else {
            document.getElementById("deactivateChatGroupButton").classList.add("disabled");
            document.getElementById("activateChatGroupButton").classList.remove("disabled");
        }
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-chatGroupSettingWin").classList.add("active");
    },

    close: function()  {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("chatGroupSettingLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("chatGroupSettingLoadingBarBox").classList.remove("active");
    }
}

const deleteProjectWin = {

    submit: function() {
        projectSocket.emit("delete_project", {id: project.id});
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-deleteProjectWin").classList.add("active");
    },

    close: function() {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("deleteProjectLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("deleteProjectLoadingBarBox").classList.remove("active");
    }
};

const leaveProjectWin = {

    submit: function() {
        projectSocket.emit("remove_user_from_project", {"userId": currentUserId, "projectId": project.id});
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementsByClassName("overlay")[0].classList.add("active");
        document.getElementById("w-leaveProjectWin").classList.add("active");
    },

    close: function() {
        Modal.hideAll();
    },

    startLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.add("active");
        document.getElementById("leaveProjectLoadingBarBox").classList.add("active");
    },

    stopLoadingAnim: function() {
        document.getElementsByClassName("loadingOverlay")[0].classList.remove("active");
        document.getElementById("leaveProjectLoadingBarBox").classList.remove("active");
    }
};


/* list
============================================================================= */

function buildList(list_data) {
    project.lists[list_data.id] = {
        name: list_data.name,
        listDesc: list_data.listDesc,
        pos: list_data.pos,
        attachedFiles: list_data.attachedFiles,
        cards: {}
    };

    buildListDomEl(list_data);
}

function buildListDomEl(list_data) {
    var list_html = 
    '<div id='+ "l-"+list_data.id +' class="list">'+
    '<section class="head">'+
    '<h2>'+ list_data.name +'</h2>'+
    '<i class="fas fa-ellipsis-h ecclipseIcon" onclick="listWin.open(event);"></i>'+
    '</section>'+
    '<section class="cards">'+
    '</section>'
    if (currentUserRole == "owner" || currentUserRole == "admin") {
        list_html += 
        '<div class="btnGroup centerH">'+
        '<button class="new" onclick="newCardWin.open(event);">' + lex["Add card"] + '</button>'+
        '</div>';
    }
    list_html += '</div>';

    if (list_data.hasOwnProperty("pos") && list_data.pos >= 1) {
        document.getElementById("listsContainer").children[list_data.pos-1].insertAdjacentHTML("afterend", list_html);
    }
    else if (list_data.hasOwnProperty("pos") && list_data.pos == 0) {
        document.getElementById("listsContainer").insertAdjacentHTML("afterbegin", list_html);
    }
    else {
        document.getElementById("listsContainer").innerHTML += list_html;
    }

    if (!(currentUserRole == "owner" || currentUserRole == "admin")) {
        return;
    }
    
    document.getElementById("l-"+list_data.id).setAttribute("draggable", "true");
}

function updateListsPos(data) {
    const listsContainer = document.getElementById("listsContainer");
    const list_dom_el = document.getElementById("l-"+data.id);
    if (listsContainer.children[data.pos] != list_dom_el) {
        if (data.pos >= 1 && listsContainer.children.length > 1) {
            if (project.lists[data.id].pos > data.pos) {
                listsContainer.children[data.pos].insertAdjacentElement("beforebegin", document.getElementById("l-"+data.id));
            }
            else {
                listsContainer.children[data.pos].insertAdjacentElement("afterend", document.getElementById("l-"+data.id));
            }
        } else {
            listsContainer.insertAdjacentElement("afterbegin", document.getElementById("l-"+data.id));
        }
    }
    project.lists[data.id].pos = data.pos;
    for (let list of data.otherListsPosChanges) {
        project.lists[list[0]].pos += list[1];
    }
}

function removeAList(data) {
    delete project.lists[data.id];
    document.getElementById("l-"+data.id).remove();
    for (let list of data.listsPosChanges) {
        project.lists[list[0]].pos += list[1];
    }
    if (listWin.listId == data.id) {
        Modal.hideAll();
    }
    if (editListWin.listId == data.id) {
        editListWin.close();
    }
}

function updateAList(data) {
    project.lists[data.id].name = data.name;
    project.lists[data.id].listDesc = data.listDesc;
    document.getElementById("l-"+data.id).getElementsByTagName("h2")[0].innerHTML = he.escape(data.name);
    if (listWin.listId == data.id) {
        document.getElementById("listWinName").innerHTML = he.escape(data.name);
        document.getElementById("listWinDesc").innerHTML = renderText(data.listDesc);
    }
    if (listWin.listId == data.id) {
        document.getElementById("editListWinName").innerHTML = he.escape(data.name);
        document.getElementById("editListNameInput").value = data.name;
        document.getElementById("editListDescInput").value = data.listDesc;
    }
    for (let file of data.newAttachedFiles) {
        project.lists[data.id].attachedFiles[file[0]] = file[1];
        if (listWin.listId == data.id) {
            let listWinFiles = document.getElementById("listWinFiles");
            listWinFiles.classList.add("active");
            listWinFiles.innerHTML += getFileHTML(file[0], file[1]);
        }
        if (listWin.listId == data.id) {
            fileUploadBoxAddFile("editListFileUploadBox", file[0], null);
        }
    }
    for (let file_name of data.removedAttachedFiles) {
        delete project.lists[data.id].attachedFiles[file_name];
        if (listWin.listId == data.id) {
            for (let _file of document.getElementById("listWinFiles").children) {
                if (_file.name == file_name) {
                    _file.remove()
                }
            }
        }
        if (document.getElementById("listWinFiles").children.length == 0) {
            document.getElementById("listWinFiles").classList.remove("active");
        }
        if (listWin.listId == data.id) {
            for (_file of document.getElementById("editListFileUploadBox").getElementsByClassName("file")) {
                if (_file.dataset.name == file_name) {
                    fileUploadBoxRemoveFile(null, _file);
                } 
            }
        }
    }
}


/* card
============================================================================= */

function buildCard(card_data) {
    project.lists[card_data.listId].cards[card_data.id] = {
        name: card_data.name,
        cardDesc: card_data.cardDesc,
        pos: card_data.pos,
        attachedFiles: card_data.attachedFiles,
        members: card_data.members
    };

    buildCardDomEl(card_data);
}

function buildCardDomEl(card_data) {
    const list_cards_section = document.getElementById("l-"+card_data.listId).getElementsByClassName("cards")[0];

    var card_html = 
    '<div id="'+ "c-"+card_data.id +'" class="card">'+
    '<h3>'+ card_data.name +'</h3>'+
    '<i class="fas fa-align-left" onclick="cardWin.open(event);"></i>';

    if (Object.keys(card_data.attachedFiles).length >= 1) {
        card_html += 
        '<section class="filesToolTip">'+
        '<i class="fas fa-paperclip paperclipIcon" onclick="activateCardFileToolTip(event);"></i>'+
        '<div class="container files">';

        for (let file_name of Object.keys(card_data.attachedFiles)) {
            card_html += getFileHTML(file_name, card_data.attachedFiles[file_name]);
        }

        card_html += 
        '</div>'+
        '</section>';
    }

    card_html += '</div>';

    if (card_data.hasOwnProperty("pos") && card_data.pos >= 1) {
        list_cards_section.children[card_data.pos-1].insertAdjacentHTML("afterend", card_html);
    }
    else {
        list_cards_section.innerHTML += card_html;
    }

    if (!(currentUserRole == "owner" || currentUserRole == "admin")) {
        return;
    }
    
    document.getElementById("c-"+card_data.id).setAttribute("draggable", "true");
}

function updateCardsPos(data) {
    const card_list_cards = document.getElementById("l-"+data.listId).getElementsByClassName("cards")[0];
    const card_dom_el = document.getElementById("c-"+data.id);
    if (card_list_cards.children[data.pos] != card_dom_el) {
        if (0 < card_list_cards.children.length && data.pos < card_list_cards.children.length) {
            if (project.lists[data.prevListId].cards[data.id].pos > data.pos || data.prevListId != data.listId) {
                card_list_cards.children[data.pos].insertAdjacentElement("beforebegin", card_dom_el);
            }
            else {
                card_list_cards.children[data.pos].insertAdjacentElement("afterend", card_dom_el);
            }
        } else {
            card_list_cards.insertAdjacentElement("beforeend", card_dom_el);
        }
    }
    const card_copy = JSON.parse(JSON.stringify(project.lists[data.prevListId].cards[data.id]));
    delete project.lists[data.prevListId].cards[data.id];
    project.lists[data.listId].cards[data.id] = card_copy;
    project.lists[data.listId].cards[data.id].pos = data.pos;
    for (let card of data.otherCardsPosChanges) {
        project.lists[card[1]].cards[card[0]].pos += card[2];
    }
}

function removeACard(data) {
    delete project.lists[data.listId].cards[data.id];
    document.getElementById("c-"+data.id).remove();
    for (let card of data.cardsPosChanges) {
        project.lists[data.listId].cards[card[0]].pos += card[1];
    }
    if (cardWin.cardId == data.id) {
        Modal.hideAll();
    }
    if (editCardWin.cardId == data.id) {
        editCardWin.close();
    }
}

function updateACard(data) {
    const card_dom_el = document.getElementById("c-"+data.id);
    project.lists[data.listId].cards[data.id].name = data.name;
    project.lists[data.listId].cards[data.id].cardDesc = data.cardDesc;
    card_dom_el.getElementsByTagName("h3")[0].innerHTML = he.escape(data.name);
    if (cardWin.cardId == data.id) {
        document.getElementById("cardWinName").innerHTML = he.escape(data.name);
        document.getElementById("cardWinDesc").innerHTML = renderText(data.cardDesc);
    }
    if (editCardWin.cardId == data.id) {
        document.getElementById("editCardWinName").innerHTML = he.escape(data.name);
        document.getElementById("editCardNameInput").value = data.name;
        document.getElementById("editCardDescInput").value = data.cardDesc;
    }

    for (let file of data.newAttachedFiles) {
        project.lists[data.listId].cards[data.id].attachedFiles[file[0]] = file[1];
        const file_html = getFileHTML(file[0], file[1]);
        if (card_dom_el.getElementsByClassName("files")[0]) {
            card_dom_el.getElementsByClassName("files")[0].innerHTML += file_html;
        } else {
            card_dom_el.innerHTML += 
            '<section class="filesToolTip">'+
            '<i class="fas fa-paperclip paperclipIcon" onclick="activateCardFileToolTip(event);"></i>'+
            '<div class="container files">'+
            file_html+
            '</div>'+
            '</section>';
        }
        if (cardWin.cardId == data.id) {
            let cardWinFiles = document.getElementById("cardWinFiles");
            cardWinFiles.classList.add("active");
            cardWinFiles.innerHTML += file_html;
        }
        if (editCardWin.cardId == data.id) {
            fileUploadBoxAddFile("editCardFileUploadBox", file[0], null);
        }
    }
    for (let file_name of data.removedAttachedFiles) {
        delete project.lists[data.listId].cards[data.id].attachedFiles[file_name];
        for (let _file of card_dom_el.getElementsByClassName("file")) {
            if (_file.name == file_name) {
                _file.remove();
            }
        }
        if (card_dom_el.getElementsByClassName("file").length == 0) {
            card_dom_el.getElementsByClassName("filesToolTip")[0].remove()
        }
        if (cardWin.cardId == data.id) {
            for (let _file of document.getElementById("cardWinFiles").children) {
                if (_file.name == file_name) {
                    _file.remove();
                }
            }
        }
        if (document.getElementById("cardWinFiles").children.length == 0) {
            document.getElementById("cardWinFiles").classList.remove("active");
        }
        if (editCardWin.cardId == data.id) {
            for (_file of document.getElementById("editCardFileUploadBox").getElementsByClassName("file")) {
                if (_file.dataset.name == file_name) {
                    fileUploadBoxRemoveFile(null, _file);
                } 
            }
        }
    }

    for (let card_member_id of data.newAddedUsers) {
        project.lists[data.listId].cards[data.id].members[card_member_id] = 1;
        if (cardWin.cardId == data.id) {
            document.getElementById("cardWinAddedUsersList").innerHTML += '<a class="user-'+card_member_id+'" id="card-win-added-user-'+card_member_id+'" href="'+project.members[card_member_id].goToUrl+'"><img src="'+project.members[card_member_id].picUrl+'"></a>';
            document.getElementById("cardWinAddedUsersSection").classList.add("active");
        }
    }
    for (let card_member_id of data.removedAddedUsers) {
        delete project.lists[data.listId].cards[data.id].members[card_member_id];
        if (cardWin.cardId == data.id) {
            document.getElementById("card-win-added-user-"+card_member_id).remove();
        }
    }
}

function activateCardFileToolTip(e) {
    const filesToolTip_files = e.target.parentElement.children[1];
    DomHelpers.activate(filesToolTip_files);
}


/* list/ card - helpers
============================================================================= */

function getInsertCardBeforePos(list, y) {
    const list_cards = [...list.getElementsByClassName("card")];
    var i = -1;
    return list_cards.reduce((closest, child) => {
        i++;
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child, pos: i };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, pos: Number.POSITIVE_INFINITY }).pos;
}

function getInsertListBeforePos(x) {
    const lists = [...document.getElementsByClassName("list")];
    var i = -1;
    return lists.reduce((closest, child) => {
        i++;
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child, pos: i };
        } else {
        return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY, pos: Number.POSITIVE_INFINITY }).pos;
}

function getFileHTML(file_name, file_url) {
    return '<a name="'+ he.escape(file_name) +'" class="file" href="'+ file_url +'" download>'+
    '<i class="fas fa-file fileIcon"></i>'+
    '<p>'+ he.escape(file_name) +'</p>'+
    '</a>';
}


/* file uploading
============================================================================= */

function fileUploadBoxDragOverHandler(e) {
    e.preventDefault();

    var fileUploadBox;
    if (e.target.classList.contains("fileUploadBox")) {
        fileUploadBox = e.target;
    } else {
        fileUploadBox = DomHelpers.getParent(e.target, "fileUploadBox");
    }
    fileUploadBox.classList.add("dragover");

    e.target.addEventListener("dragleave", ()=> {
        fileUploadBox.classList.remove("dragover");
    }, {once:true});
}

async function processFileUploadBoxDropInput(e) {
    e.preventDefault();

    var fileUploadBox;
    var fileUploadBox_files;
    if (e.target.classList.contains("fileUploadBox")) {
        fileUploadBox = e.target;
        fileUploadBox_files = e.target.getElementsByClassName("files")[0];
    } else {
        fileUploadBox = DomHelpers.getParent(e.target, "fileUploadBox");
        fileUploadBox_files = DomHelpers.getParent(e.target, "fileUploadBox").getElementsByClassName("files")[0];
    }

    if (! fileUploadBox || ! fileUploadBox_files) { 
        return; 
    }

    fileUploadBox.classList.remove("dragover");

    const fileUploadBoxErrorText = fileUploadBox.parentElement.getElementsByClassName("fileUploadBoxErrorText")[0];

    for (let file of e.dataTransfer.files) {
        if (file.size > 8388608) {
            fileUploadBoxErrorText.innerHTML = lex["The file must not be larger than 8 MB."];
        }
        else if (fileUploadBoxes[fileUploadBox.id][file.name] !== undefined) {
            fileUploadBoxErrorText.innerHTML = lex["A file with this name has already been selected."];
        }
        else if (Object.keys(fileUploadBoxes[fileUploadBox.id]).length >= UPLOAD_FILE_MAX) {
            fileUploadBoxErrorText.innerHTML = "Max. " + UPLOAD_FILE_MAX + " " + lex["files"];
        }
        else {
            fileUploadBoxes[fileUploadBox.id][file.name] = file;
            fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file.name) + '" class="file" onclick="showRemoveFileIcon(event);">' + 
            '<i class="fas fa-window-close cancelIcon" onclick="fileUploadBoxRemoveFile(event);"></i>' +
            '<i class="fas fa-file fileIcon"></i>' +
            '<p>' + he.escape(file.name) + '</p>' +
            '</div>';
            fileUploadBoxErrorText.innerHTML = "";
        }
    }
}

async function processFileUploadBoxInput(e) {
    const fileUploadBox = DomHelpers.getParent(e.target, "fileUploadBox");
    const fileUploadBox_files = fileUploadBox.getElementsByClassName("files")[0];
    const fileUploadBoxErrorText = fileUploadBox.parentElement.getElementsByClassName("fileUploadBoxErrorText")[0];

    for (let file of e.target.files) {
        if (file.size > 8388608) {
            fileUploadBoxErrorText.innerHTML = lex["The file must not be larger than 8 MB."];
        }
        else if (fileUploadBoxes[fileUploadBox.id][file.name]) {
            fileUploadBoxErrorText.innerHTML = lex["A file with this name has already been selected."];
        }
        else if (Object.keys(fileUploadBoxes[fileUploadBox.id]).length >= UPLOAD_FILE_MAX) {
            fileUploadBoxErrorText.innerHTML = "A maximum of " + UPLOAD_FILE_MAX + " files can be attached.";
        }
        else {
            fileUploadBoxes[fileUploadBox.id][file.name] = file;
            fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file.name) + '" class="file" onclick="showRemoveFileIcon(event);">' + 
            '<i class="fas fa-window-close cancelIcon" onclick="fileUploadBoxRemoveFile(event);"></i>' +
            '<i class="fas fa-file fileIcon"></i>' +
            '<p>' + he.escape(file.name) + '</p>' +
            '</div>';
            fileUploadBoxErrorText.innerHTML = "";
        }
    }

    e.target.value = "";
}

function fileUploadBoxRemoveFile(e=null, file_dom_el=null) {
    if (file_dom_el === null) {
        file_dom_el = DomHelpers.getParent(e.target, "file");
    }
    const fileUploadBox = DomHelpers.getParent(file_dom_el, "fileUploadBox");
    delete fileUploadBoxes[fileUploadBox.id][file_dom_el.dataset.name];
    file_dom_el.remove();
}

function clearFileUploadBox(fileUploadBox_id) {
    const fileUploadBox = document.getElementById(fileUploadBox_id);
    for (let file in fileUploadBoxes[fileUploadBox_id]) {
        delete fileUploadBoxes[fileUploadBox_id][file];
    }
    fileUploadBox.getElementsByClassName("files")[0].innerHTML = "";
    fileUploadBox.parentElement.getElementsByClassName("fileUploadBoxErrorText")[0].innerHTML = "";
}

function fileUploadBoxAddFile(fileUploadBox_id, file_name, file_data) {  // programmatically
    fileUploadBoxes[fileUploadBox_id][file_name] = file_data;
    const fileUploadBox_files = document.getElementById(fileUploadBox_id).getElementsByClassName("files")[0];
    fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file_name) + '" class="file" onclick="showRemoveFileIcon(event);">' + 
    '<i class="fas fa-window-close cancelIcon" onclick="fileUploadBoxRemoveFile(event);"></i>' +
    '<i class="fas fa-file fileIcon"></i>' +
    '<p>' + he.escape(file_name) + '</p>' +
    '</div>'; 
}

function showRemoveFileIcon(e) {
    var file = e.target;
    if (! file.classList.contains("file")) {
        file = DomHelpers.getParent(e.target, "file");
    }
    const icon = file.getElementsByClassName("cancelIcon")[0];
    if (icon.classList.contains("active")) { return; }
    icon.classList.add("active");
    setTimeout(() => {
        document.addEventListener("click", (_e) => {
            setTimeout(() => icon.classList.remove("active"), 50);
        }, {once: true});
    }, 1);
} 


/* toggle page-head
============================================================================= */

function hidePageHead() {
    document.getElementById("pageHead").classList.add("hidden");
    document.getElementById("content").classList.add("pageHeadHidden");
    document.getElementById("hideIcon").classList.remove("active");
    document.getElementById("showIcon").classList.add("active");
}

function showPageHead() {
    document.getElementById("pageHead").classList.remove("hidden");
    document.getElementById("content").classList.remove("pageHeadHidden");
    document.getElementById("hideIcon").classList.add("active");
    document.getElementById("showIcon").classList.remove("active");
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
