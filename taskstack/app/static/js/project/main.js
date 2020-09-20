var projectSocket;  // project namespace

var dragging;  // list/ card dom element that is currently being dragged


/* -> DOMContentLoaded
============================================================================= */

window.addEventListener("DOMContentLoaded", () => {
    MenuBar.setup();
    buildListAndCardDomEls();
    List.setupCardsSectionResponsiveness();
    if (currentUserIsOwner || currentUserIsCollaborator) {
        // installExtraGlobalSocketEventHandlersForProject is called from main.js
        projectSocket = io.connect("/project");
        installProjectSocketEventHandlers();
        if (currentUserRole == "owner" || currentUserRole == "admin") {
            if (!Flag.onMobileDevice) {
                List.setupListDraggingForAll();
            }
            FileAttachment.setupUploading();
        }
    }
    DomHelpers.preventScrolling(document.getElementById("top"));
});


/* socketio event handlers
============================================================================= */

function installExtraGlobalSocketEventHandlersForProject() {  // (called from main.js)

    socket.on("disconnect", () => EventCallback.socketDisconnected(socket));

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

    projectSocket.on("disconnect", () => EventCallback.socketDisconnected(projectSocket));

    projectSocket.on("edit_project_name_and_desc_successful", () => {
        projectNameAndDescSettingWin.stopLoadingAnim();
        projectNameAndDescSettingWin.close();
    });

    projectSocket.on("edit_project_name_and_desc_error_owner_has_already_project_with_that_name", () => {
        projectNameAndDescSettingWin.stopLoadingAnim();
        projectNameAndDescSettingWin.nameDuplicateError();
    });

    projectSocket.on("project_deleted", () => {
        Modal.closeAll();
        MenuBar.deactivate();
        document.getElementById("content").innerHTML = '<div style="padding: 32px;"><p style="text-align: center;display: block;">'+ lex["This project has been deleted."] + '</p><a href="/" style="text-align: center;display: block;">'+ lex["Take me home"] + '</a></div>';
        document.getElementsByClassName("modals")[0].innerHTML = "";
        Flag.ignoreSocketDisconnect = true;
        projectSocket.disconnect();
    });

    projectSocket.on("build_new_list", (data) => {
        for (let list_id in project.lists) {
            project.lists[list_id].pos += 1;
        }
        List.registerAndBuildDomEl(data);

        if (historyWin.isInited) {
            var attachedFilesNames = "";
            for (let file_name in data.attachedFiles) {
                attachedFilesNames += file_name+", ";
            }
            if (attachedFilesNames.length > 2) {
                attachedFilesNames = attachedFilesNames.substring(0, attachedFilesNames.length-2);
            }
            historyWin.update.historyListCreated_event({
                id: data.id,
                name: data.name,
                listDesc: data.listDesc,
                attachedFilesNames: attachedFilesNames,
                datetime: new Date()
            });
        }
    });

    projectSocket.on("build_new_card", (data) => {
        Card.registerAndBuildDomEl(data);

        if (historyWin.isInited) {
            var attachedFilesNames = "";
            for (let file_name in data.attachedFiles) {
                attachedFilesNames += file_name+", ";
            }
            var membersNames = "";
            for (let member_id in data.members) {
                membersNames += project.members[member_id].name+", ";
            }
            if (attachedFilesNames.length > 2) {
                attachedFilesNames = attachedFilesNames.substring(0, attachedFilesNames.length-2);
            }
            if (membersNames.length > 2) {
                membersNames = membersNames.substring(0, membersNames.length-2);
            }
            historyWin.update.historyCardCreated_event({
                id: data.id,
                name: data.name,
                listName: project.lists[data.listId].name,
                cardDesc: data.cardDesc,
                attachedFilesNames: attachedFilesNames,
                membersNames: membersNames,
                datetime: new Date()
            });
        }
    });

    projectSocket.on("create_list_successful", () => {
        newListWin.stopLoadingAnim();
        newListWin.close();
    });

    projectSocket.on("create_card_successful", () => {
        newCardWin.stopLoadingAnim();
        newCardWin.close();
    });

    projectSocket.on("update_list", (data) => List.update(data));

    projectSocket.on("update_card", (data) => Card.update(data));

    projectSocket.on("edit_list_successful", () => {
        editListWin.stopLoadingAnim();
        editListWin.close(true);
    });

    projectSocket.on("edit_card_successful", () => {
        editCardWin.stopLoadingAnim();
        editCardWin.close(true);
    });

    projectSocket.on("update_list_pos", (data) => List.updatePositions(data));

    projectSocket.on("update_cards_pos", (data) => {
        Card.updatePositions(data);
        
        if (historyWin.isInited) {
            for (let card_data of data.cards) {
                if (card_data.listId != card_data.prevListId) {
                    historyWin.update.historyCardChangedList_event({
                        id: card_data.id,
                        name: project.lists[card_data.listId].cards[card_data.id].name,
                        oldListName: project.lists[card_data.prevListId].name,
                        newListName: project.lists[card_data.listId].name,
                        datetime: new Date()
                    });
                }
            }
        }
    });

    projectSocket.on("remove_list", (data) => {
        if (listWin.listId == data.id) {
            listWin.close();
        }
        if (editListWin.listId == data.id) {
            editListWin.close();
        }
        if (newCardWin.addCardTo == data.id) {
            newCardWin.close();
        }

        if (historyWin.isInited) {
            var attachedFilesNames = "";
            for (let file_name in project.lists[data.id].attachedFiles) {
                attachedFilesNames += file_name+", ";
            }
            if (attachedFilesNames.length > 2) {
                attachedFilesNames = attachedFilesNames.substring(0, attachedFilesNames.length-2);
            }
            historyWin.update.historyListDeleted_event({
                id: data.id,
                name: project.lists[data.id].name,
                listDesc: project.lists[data.id].listDesc,
                attachedFilesNames: attachedFilesNames,
                datetime: new Date()
            });
        }

        List.remove(data);
    });

    projectSocket.on("remove_card", (data) => {
        if (cardWin.cardId == data.id) {
            cardWin.close();
        }
        if (editCardWin.cardId == data.id) {
            editCardWin.close();
        }

        if (historyWin.isInited) {
            var attachedFilesNames = "";
            for (let file_name in project.lists[data.listId].cards[data.id].attachedFiles) {
                attachedFilesNames += file_name+", ";
            }
            var membersNames = "";
            for (let member_id in project.lists[data.listId].cards[data.id].members) {
                membersNames += project.members[member_id].name+", ";
            }
            if (attachedFilesNames.length > 2) {
                attachedFilesNames = attachedFilesNames.substring(0, attachedFilesNames.length-2);
            }
            if (membersNames.length > 2) {
                membersNames = membersNames.substring(0, membersNames.length-2);
            }
            historyWin.update.historyCardDeleted_event({
                id: data.id,
                name: project.lists[data.listId].cards[data.id].name,
                listName: project.lists[data.listId].name,
                cardDesc: project.lists[data.listId].cards[data.id].cardDesc,
                attachedFilesNames: attachedFilesNames,
                membersNames: membersNames,
                datetime: new Date()
            });
        }

        Card.remove(data);
    });

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
        if (newCardWin.addCardTo) {
            newCardWin.newProjectCollab(collab_data);
        }
        if (editCardWin.cardId) {
            editCardWin.newProjectCollab(collab_data);
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

        card.projectCollabRemoved(data);

        if (newCardWin.addCardTo) {
            newCardWin.projectCollabRemoved(data);
        }
        if (cardWin.cardId) {
            cardWin.projectCollabRemoved(data);
        }
        if (editCardWin.cardId) {
            editCardWin.projectCollabRemoved(data);
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

    projectSocket.on("move_list_successful", () => {
        moveListWin.stopLoadingAnim();
    });
    
    projectSocket.on("move_cards_successful", () => {
        moveCardsWin.stopLoadingAnim();
    });
}


/* initial list and card dom elements building
============================================================================= */

function buildListAndCardDomEls() {
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
        List.buildDomEl({
            id: list[0],
            name: list[1].name,
            pos: list[1].pos
        });
        for (let card of list[2]) {
            Card.buildDomEl({
                id: card[0],
                listId: list[0],
                name: card[1].name,
                attachedFiles: card[1].attachedFiles,
                members: card[1].members
            });
        }
    }        
}