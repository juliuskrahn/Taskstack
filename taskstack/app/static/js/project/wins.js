const listWin = {

    listId: null,

    open: function(e=null, _listId=null) {
        var list;
        var listId;
        if (_listId !== null) {
            list = project.lists[_listId];
            listId = _listId;
        } else if (e !== null) {
            let list_dom_el = DomHelpers.getParent(e.target, "list");
            list = project.lists[list_dom_el.id.substring(2)];
            listId = list_dom_el.id.substring(2);
        } else { return; }

        document.getElementById("listWinName").innerHTML = he.escape(list.name);
        document.getElementById("listWinDesc").innerHTML = renderText(list.listDesc);

        const listWinFiles = document.getElementById("listWinFiles");
        listWinFiles.innerHTML = "";
        if (Object.keys(list.attachedFiles).length >= 1) {
            document.getElementById("listWinFilesSection").classList.add("active");
            for (let file_name of Object.keys(list.attachedFiles)) {
                listWinFiles.innerHTML += FileAttachment.getHTML(file_name, list.attachedFiles[file_name]);
            }
        } else {
            document.getElementById("listWinFilesSection").classList.remove("active");
        }

        listWin.listId = listId;
        Modal.openSafelyById("w-listWin");
    },

    close: function() {
        listWin.listId = null;
        Modal.closeById("w-listWin");
    }
};

const cardWin = {

    cardId: null,

    memberPopUpsTippyInstances: [],

    memberPopUpsTippyInstancesSingleton: tippy.createSingleton([], 
        {
            delay: 64,
            moveTransition: 'transform 0.2s ease-out',
            overrides: ['interactive', 'placement', 'theme', 'trigger', 'allowHTML', 'appendTo', 'interactiveBorder', 'interactiveDebounce', 'zIndex']
        }),

    open: function(e=null, _cardId=null) {
        var card;
        var cardId;
        if (_cardId !== null) {
            const card_dom_el = document.getElementById("c-"+_cardId);
            const parent_list_dom_el = DomHelpers.getParent(card_dom_el, "list");
            const parent_list = project.lists[parent_list_dom_el.id.substring(2)];
            card = parent_list.cards[card_dom_el.id.substring(2)];
            cardId = card_dom_el.id.substring(2);
        } else if (e !== null) {
            const card_dom_el = DomHelpers.getParent(e.target, "card");
            const parent_list_dom_el = DomHelpers.getParent(e.target, "list");
            const parent_list = project.lists[parent_list_dom_el.id.substring(2)];
            card = parent_list.cards[card_dom_el.id.substring(2)];
            cardId = card_dom_el.id.substring(2);
        } else { return; }

        document.getElementById("cardWinName").innerHTML = he.escape(card.name);
        document.getElementById("cardWinDesc").innerHTML = renderText(card.cardDesc);

        const cardWinFiles = document.getElementById("cardWinFiles");
        cardWinFiles.innerHTML = "";
        if (Object.keys(card.attachedFiles).length >= 1) {
            document.getElementById("cardWinFilesSection").classList.add("active");
            for (let file_name of Object.keys(card.attachedFiles)) {
                cardWinFiles.innerHTML += FileAttachment.getHTML(file_name, card.attachedFiles[file_name]);
            }
        } else {
            document.getElementById("cardWinFilesSection").classList.remove("active");
        }
        
        cardWin.memberPopUpsTippyInstances = [];
        const cardWinAddedUsersList = document.getElementById("cardWinAddedUsersList");
        cardWinAddedUsersList.innerHTML = "";
        var hide_cardWinAddedUsersSection = true;
        for (let member_id in card.members) {
            cardWinAddedUsersList.innerHTML += '<div class="addedUser user-'+member_id+'"><img src="'+project.members[member_id].picUrl+'"></div>';
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstances.push(
                    tippy("#w-cardWin .user-"+member_id, {
                        content: '<a href="'+project.members[member_id].goToUrl+'">'+project.members[member_id].name+'</a>',
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer")
                    })[0]
                );
            }, 250);
            hide_cardWinAddedUsersSection = false;
        }
        if (hide_cardWinAddedUsersSection) {
            document.getElementById("cardWinAddedUsersSection").classList.remove("active");
        } else {
            document.getElementById("cardWinAddedUsersSection").classList.add("active");
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstancesSingleton.setInstances(cardWin.memberPopUpsTippyInstances);
            }, 500);
        }
        
        cardWin.cardId = cardId;
        Modal.openSafelyById("w-cardWin");
    },

    close: function() {
        cardWin.cardId = null;
        Modal.closeById("w-cardWin");
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
        for (let file_name of Object.keys(FileAttachment.uploadBoxes.editListFileUploadBox)) {
            if (FileAttachment.uploadBoxes.editListFileUploadBox[file_name] != null) {
                if (project.lists[this.listId].attachedFiles.hasOwnProperty(file_name)) {
                    replacedAttachedFiles[file_name] = FileAttachment.uploadBoxes.editListFileUploadBox[file_name];
                } else {
                    newAttachedFiles[file_name] = FileAttachment.uploadBoxes.editListFileUploadBox[file_name];
                }
            }
        }
        for (let file_name of Object.keys(project.lists[this.listId].attachedFiles)) {
            if (! FileAttachment.uploadBoxes.editListFileUploadBox.hasOwnProperty(file_name)) {
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

    open: function(id) {
        document.getElementById("w-listWin").classList.remove("active");
        document.getElementById("editListWinName").innerHTML = he.escape(project.lists[id].name);
        document.getElementById("editListNameInput").value = project.lists[id].name;
        document.getElementById("editListDescInput").value = project.lists[id].listDesc;
        document.getElementById("editListNameInputErrorText").classList.remove("active");
        document.getElementById("editListDescInputErrorText").classList.remove("active");
        
        FileAttachment.clearUploadBox("editListFileUploadBox");
        for (let file_name of Object.keys(project.lists[id].attachedFiles)) {
            FileAttachment.uploadBoxAddFile("editListFileUploadBox", file_name, null);
        }

        editListWin.listId = id;
        Modal.openSafelyById("w-editListWin");
    },
    
    close: function(open_listWin=false) {
        Modal.closeById("w-editListWin");
        if (open_listWin) {
            listWin.open(null, editListWin.listId);
        }
        editListWin.listId = null;
    }, 

    startLoadingAnim: function() {
        LoadingAnim.start("editListLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        for (let file_name of Object.keys(FileAttachment.uploadBoxes.editCardFileUploadBox)) {
            if (FileAttachment.uploadBoxes.editCardFileUploadBox[file_name] != null) {
                if (project.lists[listId].cards[this.cardId].attachedFiles.hasOwnProperty(file_name)) {
                    replacedAttachedFiles[file_name] = FileAttachment.uploadBoxes.editCardFileUploadBox[file_name];
                } else {
                    newAttachedFiles[file_name] = FileAttachment.uploadBoxes.editCardFileUploadBox[file_name];
                }
            }
        }
        for (let file_name of Object.keys(project.lists[listId].cards[this.cardId].attachedFiles)) {
            if (! FileAttachment.uploadBoxes.editCardFileUploadBox.hasOwnProperty(file_name)) {
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

    open: function(id) {
        const listId = DomHelpers.getParent(document.getElementById("c-"+id), "list").id.substring(2);
        document.getElementById("editCardWinName").innerHTML = he.escape(project.lists[listId].cards[id].name);
        document.getElementById("editCardNameInput").value = project.lists[listId].cards[id].name;
        document.getElementById("editCardDescInput").value = project.lists[listId].cards[id].cardDesc;
        document.getElementById("editCardNameInputErrorText").classList.remove("active");
        document.getElementById("editCardDescInputErrorText").classList.remove("active");

        FileAttachment.clearUploadBox("editCardFileUploadBox");
        for (let file_name of Object.keys(project.lists[listId].cards[id].attachedFiles)) {
            FileAttachment.uploadBoxAddFile("editCardFileUploadBox", file_name, null);
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
            if (project.lists[listId].cards[id].members[user_id]) {
                document.getElementById("editCardWinAddedUsersList").innerHTML += '<div class="addedUser user-'+user_id+'" id="'+"edit-card-win-added-user-"+user_id+'"><img src="'+project.members[user_id].picUrl+'"></div>';
                html += ' active" data-checked="true"';
            } else {
                html += '"';
            }
            html += ' onclick="editCardWin.toggleAddUser('+user_id+');"><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></li>';
            editCardWinAddUserSelectList.innerHTML += html;
        }

        Select.setup(editCardWinAddUserSelect);

        editCardWin.cardId = id;
        Modal.openSafelyById("w-editCardWin");
    },

    close: function(open_cardWin=false) {
        Modal.closeById("w-editCardWin");
        if (open_cardWin) {
            cardWin.open(null, editCardWin.cardId);
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
        LoadingAnim.start("editCardLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
            attachedFiles: FileAttachment.uploadBoxes["newListFileUploadBox"]
        });
        this.startLoadingAnim();
    },

    open: function() {
        document.getElementById("newListNameInput").value = "";
        document.getElementById("newListDescInput").value = "";
        document.getElementById("newListNameInputErrorText").classList.remove("active");
        document.getElementById("newListDescInputErrorText").classList.remove("active");
        FileAttachment.clearUploadBox("newListFileUploadBox");

        Modal.openSafelyById("w-newListWin");
    },

    close: function() {
        Modal.closeById("w-newListWin");
    }, 

    startLoadingAnim: function() {
        LoadingAnim.start("newListLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    }
};

const newCardWin = {

    addedUsers: [],

    addCardTo: null,

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
            attachedFiles: FileAttachment.uploadBoxes["newCardFileUploadBox"],
            addedUsers: newCardWin.addedUsers
        });
        this.startLoadingAnim();
    },

    open: function(e) {
        newCardWin.addedUsers = [];
        newCardWin.addCardTo = DomHelpers.getParent(e.target, "list").id.substring(2);

        document.getElementById("newCardNameInput").value = "";
        document.getElementById("newCardDescInput").value = "";
        document.getElementById("newCardNameInputErrorText").classList.remove("active");
        document.getElementById("newCardDescInputErrorText").classList.remove("active");
        document.getElementById("newCardWinAddedUsersList").innerHTML = "";
        FileAttachment.clearUploadBox("newCardFileUploadBox");

        const newCardWinAddUserSelect = document.getElementById("newCardWinAddUserSelect");
        const newCardWinAddUserSelectList = newCardWinAddUserSelect.getElementsByTagName("ul")[0];
        newCardWinAddUserSelectList.innerHTML = "";
        for (let user_id in project.members) {
            newCardWinAddUserSelectList.innerHTML += '<li class="user-'+user_id+'" onclick="newCardWin.toggleAddUser('+user_id+');"><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></li>';
        }

        Select.setup(newCardWinAddUserSelect);

        Modal.openSafelyById("w-newCardWin");
    },

    toggleAddUser: function(id) {
        const dom_el = document.getElementById("new-card-win-added-user-"+id);
        if (! dom_el) {
            document.getElementById("newCardWinAddedUsersList").innerHTML += '<a class="addedUser user-'+id+'" id="'+"new-card-win-added-user-"+id+'"><img src="'+project.members[id].picUrl+'"></a>';
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
        
        Modal.closeById("w-newCardWin");
    }, 

    startLoadingAnim: function() {
        LoadingAnim.start("newCardLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        document.getElementById("projectNameInputErrorText").classList.remove("active")
        Modal.openSafelyById("w-projectNameAndDescSettingWin");
    },

    close: function() {
        Modal.closeById("w-projectNameAndDescSettingWin");
    },
    
    startLoadingAnim: function() {
        LoadingAnim.start("projectNameAndDescSettingLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        Modal.openSafelyById("w-addFriendToProjectWin");
    },

    close: function() {
        Modal.closeById("w-addFriendToProjectWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("addFriendToProjectLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    }
}

const invitePeopleWithLinkWin = {

    open: function() {
        Modal.openSafelyById("w-invitePeopleWithLinkWin");
    },

    close: function() {
        Modal.closeById("w-invitePeopleWithLinkWin");
    }
}

const collabsWin = {

    isInited: false,

    open: function() {
        if (! collabsWin.isInited) {
            collabsWin.init();
        }

        Modal.openSafelyById("w-collabsWin");
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
        Modal.closeById("w-collabsWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("collabsWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        Modal.openSafelyById("w-changeOwnerWin");
    },

    close: function()  {
        Modal.closeById("w-changeOwnerWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("changeOwnerLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        Modal.openSafelyById("w-visibilitySettingWin");
    },

    close: function()  {
        Modal.closeById("w-visibilitySettingWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("visibilitySettingLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
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
        Modal.openSafelyById("w-chatGroupSettingWin");
    },

    close: function()  {
        Modal.closeById("w-chatGroupSettingWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("chatGroupSettingLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    }
}

const deleteProjectWin = {

    submit: function() {
        projectSocket.emit("delete_project", {id: project.id});
        this.startLoadingAnim();
    },

    open: function() {
        Modal.openSafelyById("w-deleteProjectWin");
    },

    close: function() {
        Modal.closeById("w-deleteProjectWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("deleteProjectLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    }
};

const leaveProjectWin = {

    submit: function() {
        projectSocket.emit("remove_user_from_project", {"userId": currentUserId, "projectId": project.id});
        this.startLoadingAnim();
    },

    open: function() {
        Modal.openSafelyById("w-leaveProjectWin");
    },

    close: function() {
        Modal.closeById("w-leaveProjectWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("leaveProjectLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    }
};


const filterCardsWin = {
    
    open: function() {
        Modal.openSafelyById("w-filterCardsWin", {without_overlay: true, not_away_clickable: true});
    },

    close: function() {
        Modal.closeById("w-filterCardsWin");
    }
}
