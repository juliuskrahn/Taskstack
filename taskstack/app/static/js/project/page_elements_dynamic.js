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

    update: function(data) {
        document.getElementById("listWinName").innerHTML = he.escape(data.name);
        document.getElementById("listWinDesc").innerHTML = renderText(data.listDesc);

        for (let file of data.newAttachedFiles) {
            let listWinFiles = document.getElementById("listWinFiles");
            listWinFiles.classList.add("active");
            listWinFiles.innerHTML += FileAttachment.getHTML(file[0], file[1]);
        }

        for (let file_name of data.removedAttachedFiles) {
            document.querySelector('#listWinFiles .file[data-name="'+file_name+'"]').remove();       
        }

        if (document.getElementById("listWinFiles").children.length == 0) {
            document.getElementById("listWinFiles").classList.remove("active");
        }

        if (document.getElementById("listWinFiles").firstChild) {
            document.getElementById("listWinFilesSection").classList.add("active");
        } else {
            document.getElementById("listWinFilesSection").classList.remove("active");
        }
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
            delay: 32,
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
        
        for (let tippyInstance of cardWin.memberPopUpsTippyInstances) { 
            tippyInstance.destroy();
        }
        cardWin.memberPopUpsTippyInstances = [];
        
        const cardWinMembersList = document.getElementById("cardWinMembersList");
        cardWinMembersList.innerHTML = "";
        var hide_cardWinMembersSection = true;
        for (let member_id in card.members) {
            cardWinMembersList.innerHTML += '<img class="member user-'+member_id+'" src="'+project.members[member_id].picUrl+'">';
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstances.push(
                    tippy("#w-cardWin .user-"+member_id, {
                        content: '<a class="popUp" href="'+project.members[member_id].goToUrl+'">'+project.members[member_id].name+'</a>',
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer")
                    })[0]
                );
            }, 200);
            hide_cardWinMembersSection = false;
        }
        if (hide_cardWinMembersSection) {
            document.getElementById("cardWinMembersSection").classList.remove("active");
        } else {
            document.getElementById("cardWinMembersSection").classList.add("active");
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstancesSingleton.setInstances(cardWin.memberPopUpsTippyInstances);
            }, 500);
        }
        
        cardWin.cardId = cardId;
        Modal.openSafelyById("w-cardWin");
    },

    update: function(data) {
        document.getElementById("cardWinName").innerHTML = he.escape(data.name);
        document.getElementById("cardWinDesc").innerHTML = renderText(data.cardDesc);

        const cardWinFiles = document.getElementById("cardWinFiles");
        const cardWinMembersList = document.getElementById("cardWinMembersList");

        for (let file of data.newAttachedFiles) {
            cardWinFiles.innerHTML += FileAttachment.getHTML(file[0]);
        }

        for (let file_name of data.removedAttachedFiles) {
            document.querySelector('#cardWinFiles .file[data-name="'+file_name+'"]').remove();
        }

        for (let card_member_id of data.newMembers) {
            cardWinMembersList.insertAdjacentHTML("beforeend", '<img class="member user-'+card_member_id+'" src="'+project.members[card_member_id].picUrl+'">');
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstances.push(
                    tippy("#w-cardWin .user-"+card_member_id, {
                        content: '<a href="'+project.members[card_member_id].goToUrl+'">'+project.members[card_member_id].name+'</a>',
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer")
                    })[0]
                );
            }, 200);      
        }
        
        for (let card_member_id of data.removedMembers) {
            const cardWin_member_dom_el = document.querySelector("#w-cardWin .user-"+card_member_id);
            var i = 0;
            for (let tippyInstance of cardWin.memberPopUpsTippyInstances) {
                if (tippyInstance.reference == cardWin_member_dom_el) {
                    tippyInstance.destroy();
                    break;
                }
                i++;
            }
            cardWin.memberPopUpsTippyInstances.splice(i, 1);
            cardWin_member_dom_el.remove();            
        }

        setTimeout(() => {
            cardWin.memberPopUpsTippyInstancesSingleton.setInstances(cardWin.memberPopUpsTippyInstances);
            if (cardWinFiles.firstChild) {
                cardWinFiles.classList.add("active");
            } else {
                cardWinFiles.classList.remove("active");
            }
            if (cardWinMembersList.firstChild) {
                document.getElementById("cardWinMembersSection").classList.add("active");
            } else {
                document.getElementById("cardWinMembersSection").classList.remove("active");
            }
        }, 500);
    },

    projectCollabRemoved: function(data) {
        const cardWin_member_dom_el = document.querySelector("#w-cardWin .user-"+data.id);
        var i = 0;
        for (let tippyInstance of cardWin.memberPopUpsTippyInstances) {
            if (tippyInstance.reference == cardWin_member_dom_el) {
                tippyInstance.destroy();
                break;
            }
            i++;
        }
        cardWin.memberPopUpsTippyInstances.splice(i, 1); 

        cardWin.memberPopUpsTippyInstancesSingleton.setInstances(cardWin.memberPopUpsTippyInstances);

        if (document.getElementById("cardWinMembersList").firstChild) {
            document.getElementById("cardWinMembersSection").classList.add("active");
        } else {
            document.getElementById("cardWinMembersSection").classList.remove("active");
        }
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
        if (document.getElementById("editListNameInput").value.length < 1 || document.getElementById("editListNameInput").value.length > 64) {
            document.getElementById("editListNameInputErrorText").innerHTML = lex["The list name must be 1 - 64 characters long."];
            document.getElementById("editListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editListNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("editListDescInput").value.length > 2048) {
            document.getElementById("editListDescInputErrorText").innerHTML = lex["The list description may only be 2048 characters long."];
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

    update: function(data) {
        document.getElementById("editListWinName").innerHTML = he.escape(data.name);
        
        for (let file of data.newAttachedFiles) {
            FileAttachment.uploadBoxAddFile("editListFileUploadBox", file[0], null);
        }

        for (let file_name of data.removedAttachedFiles) {
            FileAttachment.uploadBoxRemoveFile(null, document.querySelector('#editListFileUploadBox .file[data-name="'+file_name+'"]'));
        }
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

    newMembers: [],

    removedMembers: [],

    submit: function() {
        var invalid = false;
        if (document.getElementById("editCardNameInput").value.length < 1 || document.getElementById("editCardNameInput").value.length > 64) {
            document.getElementById("editCardNameInputErrorText").innerHTML = lex["The card name must be 1 - 64 characters long."];
            document.getElementById("editCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("editCardNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("editCardDescInput").value.length > 2048) {
            document.getElementById("editCardDescInputErrorText").innerHTML = lex["The card description may only be 2048 characters long."];
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
            newMembers: editCardWin.newMembers,
            removedMembers: editCardWin.removedMembers
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

        const editCardWinMembersList = document.getElementById("editCardWinMembersList");
        editCardWinMembersList.innerHTML = "";

        editCardWin.newMembers = [];
        editCardWin.removedMembers = [];
        
        var options = [];
        for (let user_id in project.members) {
            var selected = false;
            if (project.lists[listId].cards[id].members[user_id]) {
                selected = true;
                editCardWinMembersList.innerHTML += '<img class="member user-'+user_id+'" src="'+project.members[user_id].picUrl+'">';
            }
            options.push({
                id: user_id, 
                selected: selected, 
                content: '<div><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></div>'
            });
        }

        if (Select.exists("editCardWinMembersSelect")) {
            Select.set("editCardWinMembersSelect", options);
        } else {
            Select.create("editCardWinMembersSelect", 
                document.getElementById("editCardWinMembersSelectBaseBox"), 
                options, 
                {
                    optionSelectedCallback: editCardWin._addMember,
                    optionUnSelectedCallback: editCardWin._removeMember 
                }
            );
        }

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

    update: function(data) {
        document.getElementById("editCardWinName").innerHTML = he.escape(data.name);

        for (let file of data.newAttachedFiles) {
            FileAttachment.uploadBoxAddFile("editCardFileUploadBox", file[0], null);
        }

        for (let file_name of data.removedAttachedFiles) {
            FileAttachment.uploadBoxRemoveFile(null, document.querySelector('#editCardFileUploadBox .file[data-name="'+file_name+'"]'));
        }

        for (let member_id of data.newMembers) {
            editCardWin._addMember({id: member_id}, true);
        }
        
        for (let member_id of data.removedMembers) {
            editCardWin._removeMember({id: member_id}, true);
        }
    },

    _addMember: function(member_data, on_win_update=false) {
        const listId = DomHelpers.getParent(document.getElementById("c-"+editCardWin.cardId), "list").id.substring(2);
        document.getElementById("editCardWinMembersList").innerHTML += '<img class="member user-'+member_data.id+'" src="'+project.members[member_data.id].picUrl+'">';
        if (!project.lists[listId].cards[editCardWin.cardId].members[member_data.id] && !on_win_update) {
            editCardWin.newMembers.push(member_data.id);
            let i = editCardWin.removedMembers.indexOf(member_data.id);
            if (i >= 0) {
                editCardWin.removedMembers.splice(i, 1);
            } 
        }
        if (on_win_update) {
            Select.selectOptionManually("editCardWinMembersSelect", 
                {
                    id: member_data.id, 
                    selected: true, 
                    content: '<div><img src="'+project.members[member_data.id].picUrl+'"><p>'+project.members[member_data.id].name+'</p></div>'
                }
            );
        }
    },

    _removeMember: function(member_data, on_win_update=false) {
        const listId = DomHelpers.getParent(document.getElementById("c-"+editCardWin.cardId), "list").id.substring(2);
        document.querySelector("#editCardWinMembersList .user-"+member_data.id).remove();
        if (on_win_update) {
            Select.unselectOptionManually("editCardWinMembersSelect", member_data.id);
        }
        let i = editCardWin.newMembers.indexOf(member_data.id);
        if (i >= 0) {
            editCardWin.newMembers.splice(i, 1);
        } 
        if (project.lists[listId].cards[editCardWin.cardId].members[member_data.id]) { 
            editCardWin.removedMembers.push(member_data.id);
        }
    },

    newProjectCollab: function(data) {
        Select.update("editCardWinMembersSelect", 
            [{
                id: data.id, 
                selected: false, 
                content: '<div><img src="'+project.members[data.id].picUrl+'"><p>'+project.members[data.id].name+'</p></div>'
            }]
        );
    },

    projectCollabRemoved: function(data) {
        Select.update("editCardWinMembersSelect", [], [data.id]);
    },

    startLoadingAnim: function() {
        LoadingAnim.start("editCardLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },

    _delete: function() {
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
        if (document.getElementById("newListNameInput").value.length < 1 || document.getElementById("newListNameInput").value.length > 64) {
            document.getElementById("newListNameInputErrorText").innerHTML = lex["The list name must be 1 - 64 characters long."];
            document.getElementById("newListNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newListNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("newListDescInput").value.length > 2048) {
            document.getElementById("newListDescInputErrorText").innerHTML = lex["The list description may only be 2048 characters long."];
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

    members: [],

    addCardTo: null,

    submit: function() {
        var invalid = false;

        if (document.getElementById("newCardNameInput").value.length < 1 || document.getElementById("newCardNameInput").value.length > 64) {
            document.getElementById("newCardNameInputErrorText").innerHTML = lex["The card name must be 1 - 64 characters long."];
            document.getElementById("newCardNameInputErrorText").classList.add("active");
            invalid = true;
        } else {
            document.getElementById("newCardNameInputErrorText").classList.remove("active");
        }
        if (document.getElementById("newCardDescInput").value.length > 2048) {
            document.getElementById("newCardDescInputErrorText").innerHTML = lex["The card description may only be 2048 characters long."];
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
            members: newCardWin.members
        });

        newCardWin.startLoadingAnim();
    },

    open: function(e) {
        document.getElementById("newCardNameInput").value = "";
        document.getElementById("newCardDescInput").value = "";
        document.getElementById("newCardNameInputErrorText").classList.remove("active");
        document.getElementById("newCardDescInputErrorText").classList.remove("active");
        document.getElementById("newCardWinMembersList").innerHTML = "";
        FileAttachment.clearUploadBox("newCardFileUploadBox");
        newCardWin.members = [];
        
        var options = [];
        for (let user_id in project.members) {
            options.push({
                id: user_id, 
                selected: false, 
                content: '<div><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></div>'
            });
        }

        if (Select.exists("newCardWinMembersSelect")) {
            Select.set("newCardWinMembersSelect", options);
        } else {
            Select.create("newCardWinMembersSelect", 
                document.getElementById("newCardWinMembersSelectBaseBox"), 
                options, 
                {
                    optionSelectedCallback: newCardWin._addMember,
                    optionUnSelectedCallback: newCardWin._removeMember 
                }
            );
        }

        newCardWin.addCardTo = DomHelpers.getParent(e.target, "list").id.substring(2);
        Modal.openSafelyById("w-newCardWin");
    },

    _addMember: function(member_data) {
        document.getElementById("newCardWinMembersList").innerHTML += '<img class="member user-'+member_data.id+'" src="'+project.members[member_data.id].picUrl+'">';
        newCardWin.members.push(member_data.id);
    },

    _removeMember: function(member_data) {
        document.querySelector("#newCardWinMembersList .user-"+member_data.id).remove();
        let i = newCardWin.members.indexOf(member_data.id);
        if (i >= 0) {
            newCardWin.members.splice(i, 1);
        }
    },

    newProjectCollab: function(data) {
        Select.update("newCardWinMembersSelect", 
            [{
                id: data.id, 
                selected: false, 
                content: '<div><img src="'+project.members[data.id].picUrl+'"><p>'+project.members[data.id].name+'</p></div>'
            }]
        );
    },

    projectCollabRemoved: function(data) {
        Select.update("newCardWinMembersSelect", [], [data.id]);
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
        var html = '<div class="collab user-'+member.id+'"><div class="ellipsisOptions"><i class="fas fa-ellipsis-v" onclick="DomHelpers.activate(this.parentElement);"></i><div class="popUp">';
        if (currentUserIsOwner && member.id != currentUserId) {
            html += '<div onclick="collabsWin.removeUserFromProject(\''+ member.id + '\');" data-modal_click_away_listener_ignore="true">' + lex["Remove from project"] + '</div>';
            if (member.role == "admin") {
                html += '<div onclick="collabsWin.changeUserRole(\''+ member.id + '\', \'access-only\');" data-modal_click_away_listener_ignore="true">' + lex["Dismiss as admin"] + '</div>';
            } else if (member.role == "access-only") {
                html += '<div onclick="collabsWin.changeUserRole(\''+ member.id + '\', \'admin\');" data-modal_click_away_listener_ignore="true">' + lex["Make admin"] + '</div>';
            }
        }
        html += '</div></div><a href="' + member.goToUrl + '"><img src="' + member.picUrl + '"  alt="img"></img><div><p>' + member.name + '</p><label class="'+member.role+'">'+lex[member.role]+'</label></div></a></div>'

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

        var html = '<div onclick="collabsWin.removeUserFromProject(\''+ id + '\');">' + lex["Remove from project"] + '</div>';
        const role_label = document.querySelector(".collab.user-"+id+" label");
        if (new_role == "admin") {
            html += '<div onclick="collabsWin.changeUserRole(\''+ id + '\', \'access-only\');" data-modal_click_away_listener_ignore="true">' + lex["Dismiss as admin"] + '</div>';
            role_label.innerHTML = lex["admin"];
            role_label.classList.remove("access-only");
            role_label.classList.add("admin");
        } else if (new_role == "access-only") {
            html += '<div onclick="collabsWin.changeUserRole(\''+ id + '\', \'admin\');" data-modal_click_away_listener_ignore="true">' + lex["Make admin"] + '</div>';
            role_label.innerHTML = lex["access-only"];
            role_label.classList.remove("admin");
            role_label.classList.add("access-only");
        }
        document.querySelector(".collab.user-"+id+" .ellipsisOptions .popUp").innerHTML = html;
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

        var assigned_to_select_options = [{id:"*", content: "*", selected: true}];
        for (let user_id in project.members) {
            assigned_to_select_options.push({
                id: user_id,
                content: '<div><img src="'+project.members[user_id].picUrl+'"><p>'+project.members[user_id].name+'</p></div>',
                selected: false
            });
        }

        if (Select.exists("filterCardsWinAssignedToSelect")) {
            Select.set("filterCardsWinAssignedToSelect", assigned_to_select_options);
        } else {
            Select.create("filterCardsWinAssignedToSelect", 
                document.getElementById("filterCardsWinAssignedToSelectBaseBox"), 
                assigned_to_select_options
            );
        }

        document.getElementById("filterCardsWinNameInput").value = "";

        Modal.openSafelyById("w-filterCardsWin", {without_overlay: true});
    },

    applyFilter: function() {
        const assigned_to_select_options = Select.getOptions("filterCardsWinAssignedToSelect");
        var assigned_to_catch_all = false;
        for (let assigned_to_select_option of assigned_to_select_options) {
            if (assigned_to_select_option.id == "*") {
                if (assigned_to_select_option.selected) {
                    assigned_to_catch_all = true;
                }
                break;
            }
        }
        var name = document.getElementById("filterCardsWinNameInput").value;

        for (var list_id in project.lists) {
            for (var card_id in project.lists[list_id].cards) {

                var filter_out = false;

                if (!assigned_to_catch_all) {
                    for (let assigned_to_select_option of assigned_to_select_options) {
                        if (assigned_to_select_option.selected 
                                && !project.lists[list_id].cards[card_id].members[assigned_to_select_option.id]) {
                            filter_out = true;
                            break;
                        }
                    }
                }

                if (name != "") {
                    if (!project.lists[list_id].cards[card_id].name.includes(name)) {
                        filter_out = true;
                    }
                }
                
                const card_dom_el = document.getElementById("c-"+card_id);
                if (filter_out) {
                    card_dom_el.classList.add("hide");
                } else {
                    card_dom_el.classList.remove("hide");
                }
            }
        }
    },

    reset: function() {

    },

    newProjectCollab: function(data) {
        Select.update("filterCardsWinAssignedToSelect", 
            [{
                id: data.id, 
                selected: false, 
                content: '<div><img src="'+project.members[data.id].picUrl+'"><p>'+project.members[data.id].name+'</p></div>'
            }]
        );
    },

    projectCollabRemoved: function(data) {
        Select.update("filterCardsWinAssignedToSelect", [], [data.id]);
    },

    close: function() {
        Modal.closeById("w-filterCardsWin");
    }
}

const moveListWin = {

    submit: function() {
        const list_options = Select.getOptions("moveListWinListSelect");

        var insert_pos = Number(document.getElementById("insertListAtPosInput").value);
        
        var list_id;
        for (let list_option of list_options) {
            if (list_option.selected) {
                list_id = list_option.id;
                break;
            }
        }

        if (isNaN(insert_pos) || list_id === undefined) {
            return;
        }

        if (insert_pos > Object.keys(project.lists).length) {
            insert_pos = Object.keys(project.lists).length-1;
            document.getElementById("insertListAtPosInput").value = insert_pos;
        } 
        if (insert_pos < 0 || insert_pos == "") {
            insert_pos = 0;
            document.getElementById("insertListAtPosInput").value = insert_pos;
        }
        
        moveListWin.startLoadingAnim();
        projectSocket.emit("move_list", {projectId: project.id,
            id: list_id, 
            pos: insert_pos
        });
    },

    open: function(init_selected_lists_ids=[], init_insert_pos=0) {
        var list_select_options = [];

        for (var listId in project.lists) {
            var selected = false;
            if (init_selected_lists_ids.length >= 0 && init_selected_lists_ids.indexOf(listId) >= 0) {
                selected = true;
            }
            list_select_options.push(
                {
                    id: listId,
                    selected: selected,
                    content: project.lists[listId].name
                }
            );
        }

        if (Select.exists("moveListWinListSelect")) {
            Select.set("moveListWinListSelect", list_select_options);
        } else {
            Select.create("moveListWinListSelect", 
                document.getElementById("moveListWinListSelectBaseBox"), 
                list_select_options,
                undefined,
                {exclusive: true}
            );
        }

        document.getElementById("insertListAtPosInput").value = init_insert_pos;

        Modal.openById("w-moveListWin", {without_overlay: true});
    },

    newList: function(data) {
        Select.update("moveListWinListSelect", [{id: data.id, content: data.name, selected: false}]);
    },

    listRemoved: function(data) {
        Select.update("moveListWinListSelect", undefined, [data.id]);
    },

    close: function() {
        Modal.closeById("w-moveListWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("moveListWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },

    _open_by_list_click_event: function(e) {
        const list_dom_el = DomHelpers.getParent(e.target, "list");
        const list = project.lists[list_dom_el.id.substring(2)];
        const listId = list_dom_el.id.substring(2);

        setTimeout(() => {
            if (!list_dom_el.classList.contains("draggingGhost")) {
                moveListWin.open([listId], list.pos);
            }
        }, 200);
    }
}

const moveCardsWin = {

    submit: function() {
        const cards_options = Select.getOptions("moveCardsWinCardsSelect");
        const list_options = Select.getOptions("moveCardsWinListSelect");

        var insert_pos = Number(document.getElementById("insertCardsAtPosInput").value);

        const cards_to_move_ids = [];
        for (let card_option of cards_options) {
            if (card_option.selected) {
                cards_to_move_ids.push(card_option.id);
            }
        }

        var to_list_id;
        for (let list_option of list_options) {
            if (list_option.selected) {
                to_list_id = list_option.id;
                break;
            }
        }

        if (isNaN(insert_pos) || cards_to_move_ids.length < 1 || to_list_id === undefined) {
            return;
        }

        if (insert_pos > Object.keys(project.lists[to_list_id].cards).length) {
            insert_pos = Object.keys(project.lists[to_list_id].cards).length-1;
            document.getElementById("insertCardsAtPosInput").value = insert_pos;
        } 
        if (insert_pos < 0 || insert_pos == "") {
            insert_pos = 0;
            document.getElementById("insertCardsAtPosInput").value = insert_pos;
        }

        moveCardsWin.startLoadingAnim();
        projectSocket.emit("move_cards", {projectId: project.id, 
            ids: cards_to_move_ids, 
            listId: to_list_id, 
            pos: insert_pos
        });
    },

    open: function(init_selected_cards_ids=[], init_selected_lists_ids=[], init_insert_pos=0) {
        var cards_select_options = [];
        var list_select_options = [];

        for (var listId in project.lists) {

            for (let cardId in project.lists[listId].cards) {
                var selected = false;
                if (init_selected_cards_ids.length >= 0 && init_selected_cards_ids.indexOf(cardId) >= 0) {
                    selected = true;
                }
                cards_select_options.push(
                    {
                        id: cardId,
                        selected: selected,
                        content: project.lists[listId].cards[cardId].name
                    }
                );
            }

            var selected = false;
            if (init_selected_lists_ids.length >= 0 && init_selected_lists_ids.indexOf(listId) >= 0) {
                selected = true;
            }
            list_select_options.push(
                {
                    id: listId,
                    selected: selected,
                    content: project.lists[listId].name
                }
            );
        }

        if (Select.exists("moveCardsWinCardsSelect")) {
            Select.set("moveCardsWinCardsSelect", cards_select_options);
        } else {
            Select.create("moveCardsWinCardsSelect", 
                document.getElementById("moveCardsWinCardsSelectBaseBox"), 
                cards_select_options
            );
        }

        if (Select.exists("moveCardsWinListSelect")) {
            Select.set("moveCardsWinListSelect", list_select_options);
        } else {
            Select.create("moveCardsWinListSelect", 
                document.getElementById("moveCardsWinListSelectBaseBox"), 
                list_select_options,
                undefined,
                {exclusive: true}
            );
        }

        document.getElementById("insertCardsAtPosInput").value = init_insert_pos;

        Modal.openById("w-moveCardsWin", {without_overlay: true});
    },

    newList: function(data) {
        Select.update("moveCardsWinListSelect", [{id: data.id, content: data.name, selected: false}]);
    },

    newCard: function(data) {
        Select.update("moveCardsWinCardsSelect", [{id: data.id, content: data.name, selected: false}]);
    },

    listRemoved: function(data) {
        Select.update("moveCardsWinListSelect", undefined, [data.id]);
    },

    cardRemoved: function(data) {
        Select.update("moveCardsWinCardsSelect", undefined, [data.id]);
    },

    close: function() {
        Modal.closeById("w-moveCardsWin");
    },

    startLoadingAnim: function() {
        LoadingAnim.start("moveCardsWinLoadingBarBox");
    },

    stopLoadingAnim: function() {
        LoadingAnim.stopAll();
    },

    _open_by_card_click_event: function(e) {
        const card_dom_el = DomHelpers.getParent(e.target, "card");
        const parent_list_dom_el = DomHelpers.getParent(card_dom_el, "list");
        const parent_list_id = parent_list_dom_el.id.substring(2);
        const parent_list = project.lists[parent_list_id];
        const card = parent_list.cards[card_dom_el.id.substring(2)];
        const cardId = card_dom_el.id.substring(2);

        setTimeout(() => {
            if (!card_dom_el.classList.contains("draggingGhost")) {
                moveCardsWin.open([cardId], [parent_list_id], card.pos);
            }
        }, 200);
    }
}

const historyWin = {

    isInited: false,

    open: function() {
        if (!historyWin.isInited) {
            historyWin.init();
        }

        Modal.openById("w-historyWin");
    },

    init: async function() {
        project.history = await historyWin.getHistory();

        project.history.sort((event1, event2) => {
            const event1_datetime = new Date(event1.datetime);
            const event2_datetime = new Date(event2.datetime);
            return event1_datetime.getTime() - event2_datetime.getTime();
        });

        var html = "";

        for (let history_event of project.history) {
            switch (history_event.type) {
                case "historyListCreated_event":
                    html += historyWin.html.forHistoryListCreated_event(history_event);
                    break;
                case "historyListDeleted_event":
                    html += historyWin.html.forHistoryListDeleted_event(history_event);
                    break;
                case "historyCardCreated_event":
                    html += historyWin.html.forHistoryCardCreated_event(history_event);
                    break;
                case "historyCardDeleted_event":
                    html += historyWin.html.forHistoryCardDeleted_event(history_event);
                    break;     
                case "historyCardChangedList_event":
                    html += historyWin.html.forHistoryCardChangedList_event(history_event);
                    break;                       
                default:
                    break;
            }
        }

        document.getElementById("historyWinHistory").innerHTML += html;

        historyWin.isInited = true;
    },

    getHistory: async function() {
        const response = await fetch(pageUrl+"/history", {
            method: 'GET',
            credentials: "include"
        });
        if (response.status == 200) {
            return response.json().then(history => {
                return history;
            });
        }
        else {
            window.alert("Error");
            return undefined;
        }
    },

    html: {

        forHistoryListCreated_event: function(history_event) {
            return '<tr>'+
            '<td>'+DatetimeToLocalizedString.datetimeV1(new Date(history_event.datetime))+'</td>'+
            '<td>'+lex["Created list"]+": "+he.escape(history_event.name)+
             '<ul><li>'+lex["Description"]+": "+he.escape(history_event.listDesc)+'</li>'+
                '<li>'+lex["Attached files"]+": "+he.escape(history_event.attachedFilesNames)+'</li>'+
                '</ul></td>'+
            '</tr>';
        },

        forHistoryListDeleted_event: function(history_event) {
            return '<tr>'+
            '<td>'+DatetimeToLocalizedString.datetimeV1(new Date(history_event.datetime))+'</td>'+
            '<td>'+lex["Deleted list"]+": "+he.escape(history_event.name)+
             '<ul><li>'+lex["Description"]+": "+he.escape(history_event.listDesc)+'</li>'+
                '<li>'+lex["Attached files"]+": "+he.escape(history_event.attachedFilesNames)+'</li>'+
                '</ul></td>'+
            '</tr>';
        },

        forHistoryCardCreated_event: function(history_event) {
            return '<tr>'+
            '<td>'+DatetimeToLocalizedString.datetimeV1(new Date(history_event.datetime))+'</td>'+
            '<td>'+lex["Created card"]+": "+he.escape(history_event.name)+
             '<ul><li>'+lex["Description"]+": "+he.escape(history_event.cardDesc)+'</li>'+
                '<li>'+lex["Attached files"]+": "+he.escape(history_event.attachedFilesNames)+'</li>'+
                '<li>'+lex["Assigned members"]+": "+history_event.membersNames+'</li>'+
                '<li>'+lex["In list"]+": "+he.escape(history_event.listName)+'</li>'+
                '</ul></td>'+
            '</tr>';
        },

        forHistoryCardDeleted_event: function(history_event) {
            return '<tr>'+
            '<td>'+DatetimeToLocalizedString.datetimeV1(new Date(history_event.datetime))+'</td>'+
            '<td>'+lex["Deleted card"]+": "+he.escape(history_event.name)+
             '<ul><li>'+lex["Description"]+": "+he.escape(history_event.cardDesc)+'</li>'+
                '<li>'+lex["Attached files"]+": "+he.escape(history_event.attachedFilesNames)+'</li>'+
                '<li>'+lex["Assigned members"]+": "+history_event.membersNames+'</li>'+
                '<li>'+lex["In list"]+": "+he.escape(history_event.listName)+'</li>'+
                '</ul></td>'+
            '</tr>';
        },

        forHistoryCardChangedList_event: function(history_event) {
            return '<tr>'+
            '<td>'+DatetimeToLocalizedString.datetimeV1(new Date(history_event.datetime))+'</td>'+
            '<td>'+lex["Moved card"]+": "+he.escape(history_event.name)+
             '<ul><li>'+lex["Old list"]+": "+he.escape(history_event.oldListName)+'</li>'+
                '<li>'+lex["New list"]+": "+he.escape(history_event.newListName)+'</li>'+
                '</ul></td>'+
            '</tr>';
        }
    },

    update: {

        historyListCreated_event: function(history_event) {
            document.getElementById("historyWinHistory").innerHTML += historyWin.html.forHistoryListCreated_event(history_event);
        },

        historyListDeleted_event: function(history_event) {
            document.getElementById("historyWinHistory").innerHTML += historyWin.html.forHistoryListDeleted_event(history_event);
        },

        historyCardCreated_event: function(history_event) {
            document.getElementById("historyWinHistory").innerHTML += historyWin.html.forHistoryCardCreated_event(history_event);
        },

        historyCardDeleted_event: function(history_event) {
            document.getElementById("historyWinHistory").innerHTML += historyWin.html.forHistoryCardDeleted_event(history_event);
        },

        historyCardChangedList_event: function(history_event) {
            document.getElementById("historyWinHistory").innerHTML += historyWin.html.forHistoryCardChangedList_event(history_event);
        }
    },

    close: function() {
        Modal.closeById("w-historyWin");
    }
}
