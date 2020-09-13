const Card = {

    build: function(card_data) {
        project.lists[card_data.listId].cards[card_data.id] = {
            name: card_data.name,
            cardDesc: card_data.cardDesc,
            pos: card_data.pos,
            attachedFiles: card_data.attachedFiles,
            members: card_data.members
        };
    
        Card.buildDomEl(card_data);
    },

    buildDomEl: function(card_data) {
        const list_cards_section = document.getElementById("l-"+card_data.listId).getElementsByClassName("cards")[0];

        var card_html = 
        '<div id="'+ "c-"+card_data.id +'" class="card">'+
        '<h3>'+ card_data.name +'</h3><section class="actions">'+
        '<i class="action fas fa-align-left" onclick="cardWin.open(event);"></i>'+
        '<i class="action fas fa-paperclip filesButton';
        
        if (Object.keys(card_data.attachedFiles).length >= 1) {
            setTimeout(() => {
                project.lists[card_data.listId].cards[card_data.id].filesPopUpTippyInstance = tippy(
                    "#c-"+card_data.id+" .filesButton",
                    {
                        content: Card.Helpers.getHtmlForFilesPopUp(card_data.attachedFiles),
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer"),
                        placement: 'bottom'
                    }
                )[0];
            }, 250);
        } 
        else {
            card_html += ' hide';
        }

        card_html += '"></i>';

        card_html += '</section><div class="addedUsersList">';

        if (Object.keys(card_data.members).length >= 1) {
            for (let member_id in card_data.members) {
                card_html += '<div class="addedUser user-'+member_id+'"><img src="'+project.members[member_id].picUrl+'"></div>';
            }
        }

        card_html += '</div></div>';

        if (card_data.hasOwnProperty("pos") && card_data.pos >= 1) {
            list_cards_section.children[card_data.pos-1].insertAdjacentHTML("afterend", card_html);
        }
        else {
            list_cards_section.innerHTML += card_html;
        }

        if (Object.keys(card_data.members).length >= 1) {
            setTimeout(() => {
                project.lists[card_data.listId].cards[card_data.id].memberPopUpsTippyInstances = [];

                for (let member_id in card_data.members) {
                    project.lists[card_data.listId].cards[card_data.id].memberPopUpsTippyInstances.push(
                        tippy("#c-"+card_data.id+" .user-"+member_id, {
                            content: '<a href="'+project.members[member_id].goToUrl+'">'+project.members[member_id].name+'</a>',
                            interactive: true,
                            appendTo: document.getElementById("tippyContainer"),
                            placement: 'bottom'
                        })[0]
                    );
                }
                
                project.lists[card_data.listId].cards[card_data.id].memberPopUpsTippyInstancesSingleton = 
                tippy.createSingleton(project.lists[card_data.listId].cards[card_data.id].memberPopUpsTippyInstances, {
                    delay: 64,
                    moveTransition: 'transform 0.2s ease-out',
                    overrides: ['interactive', 'placement', 'theme', 'trigger', 'allowHTML', 'appendTo', 'interactiveBorder', 'interactiveDebounce', 'zIndex']
                });
            }, 250);
        }

        if (!(currentUserRole == "owner" || currentUserRole == "admin")) {
            return;
        }
        
        document.getElementById("c-"+card_data.id).setAttribute("draggable", "true");
    },

    update: function(data) {
        project.lists[data.listId].cards[data.id].name = data.name;
        project.lists[data.listId].cards[data.id].cardDesc = data.cardDesc;

        const card_dom_el = document.getElementById("c-"+data.id);
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

            if (cardWin.cardId == data.id) {
                let cardWinFiles = document.getElementById("cardWinFiles");
                cardWinFiles.classList.add("active");
                cardWinFiles.innerHTML += FileAttachment.getHTML(file);
            }

            if (editCardWin.cardId == data.id) {
                FileAttachment.uploadBoxAddFile("editCardFileUploadBox", file[0], null);
            }
        }

        for (let file_name of data.removedAttachedFiles) {
            delete project.lists[data.listId].cards[data.id].attachedFiles[file_name];

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
                        FileAttachment.uploadBoxRemoveFile(null, _file);
                    } 
                }
            }
        }
        
        if (Object.keys(project.lists[data.listId].cards[data.id].attachedFiles).length > 0) {
            card_dom_el.getElementsByClassName("filesButton")[0].classList.remove("hide");

            if (! project.lists[data.listId].cards[data.id].filesPopUpTippyInstance) {
                project.lists[data.listId].cards[data.id].filesPopUpTippyInstance = tippy(
                    "#c-"+data.id+" .filesButton",
                    {
                        content: Card.Helpers.getHtmlForFilesPopUp(project.lists[data.listId].cards[data.id].attachedFiles),
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer"),
                        placement: 'bottom'
                    }
                )[0];
            } 
            else {
                project.lists[data.listId].cards[data.id].filesPopUpTippyInstance.setContent(
                    Card.Helpers.getHtmlForFilesPopUp(project.lists[data.listId].cards[data.id].attachedFiles)
                );                
            }
        } 

        else {
            card_dom_el.getElementsByClassName("filesButton")[0].classList.add("hide");
        }
        
        if (data.newAddedUsers.length > 0 || data.removedAddedUsers.length > 0) {
            if (project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances) {
                setTimeout(() => {
                    project.lists[data.listId].cards[data.id].memberPopUpsTippyInstancesSingleton.setInstances(project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances);
                }, 500);
            }
            else {
                project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances = [];
                setTimeout(() => {
                    project.lists[data.listId].cards[data.id].memberPopUpsTippyInstancesSingleton = 
                    tippy.createSingleton(project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances, {
                        delay: 64,
                        moveTransition: 'transform 0.2s ease-out',
                        overrides: ['interactive', 'placement', 'theme', 'trigger', 'allowHTML', 'appendTo', 'interactiveBorder', 'interactiveDebounce', 'zIndex']
                    });                
                }, 500);
            }
        }

        for (let card_member_id of data.newAddedUsers) {
            project.lists[data.listId].cards[data.id].members[card_member_id] = 1;

            card_dom_el.getElementsByClassName("addedUsersList")[0].insertAdjacentHTML("beforeend", '<div class="addedUser user-'+card_member_id+'"><img src="'+project.members[card_member_id].picUrl+'"></div>');

            setTimeout(() => {
                project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances.push(
                    tippy("#c-"+data.id+" .user-"+card_member_id, {
                        content: '<a href="'+project.members[card_member_id].goToUrl+'">'+project.members[card_member_id].name+'</a>',
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer"),
                        placement: 'bottom'
                    })[0]
                );
            }, 250);

            if (cardWin.cardId == data.id) {
                document.getElementById("cardWinAddedUsersList").innerHTML += '<div class="addedUser user-'+card_member_id+'"><img src="'+project.members[card_member_id].picUrl+'"></div>';
                document.getElementById("cardWinAddedUsersSection").classList.add("active");
                setTimeout(() => {
                    cardWin.memberPopUpsTippyInstances.push(
                        tippy("#w-cardWin .user-"+card_member_id, {
                            content: '<a href="'+project.members[card_member_id].goToUrl+'">'+project.members[card_member_id].name+'</a>',
                            interactive: true,
                            appendTo: document.getElementById("tippyContainer")
                        })[0]
                    );
                }, 250);
            }
        }
        
        for (let card_member_id of data.removedAddedUsers) {
            delete project.lists[data.listId].cards[data.id].members[card_member_id];
            const  card_member_dom_el = document.querySelector("#"+card_dom_el.id+" .user-"+card_member_id);

            var i = 0;
            for (let tippyInstance of project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances) {
                if (tippyInstance.reference == card_member_dom_el) {
                    tippyInstance.destroy();
                    break;
                }
                i++;
            }
            project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances.splice(i, 1);

            card_member_dom_el.remove();

            if (cardWin.cardId == data.id) {
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
        }

        if (cardWin.cardId == data.id) {
            setTimeout(() => {
                cardWin.memberPopUpsTippyInstancesSingleton.setInstances(cardWin.memberPopUpsTippyInstances);
            }, 500);            
        }
    },

    remove: function(data) {
        if (project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances) {
            for (let tippyInstance of project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances) {
                tippyInstance.destroy();
            }
            project.lists[data.listId].cards[data.id].memberPopUpsTippyInstancesSingleton.destroy();
        }
        if (project.lists[data.listId].cards[data.id].filesPopUpTippyInstance) {
            project.lists[data.listId].cards[data.id].filesPopUpTippyInstance.destroy();
        }

        delete project.lists[data.listId].cards[data.id];

        document.getElementById("c-"+data.id).remove();

        for (let card of data.cardsPosChanges) {
            project.lists[data.listId].cards[card[0]].pos += card[1];
        }

        if (cardWin.cardId == data.id) {
            cardWin.close();
        }
        if (editCardWin.cardId == data.id) {
            editCardWin.close();
        }
    },

    updatePositions: function(data) {
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
        if (data.prevListId != data.listId) {
            project.lists[data.listId].cards[data.id] = project.lists[data.prevListId].cards[data.id];
            delete project.lists[data.prevListId].cards[data.id];
        }
        project.lists[data.listId].cards[data.id].pos = data.pos;
        for (let card of data.otherCardsPosChanges) {
            project.lists[card[1]].cards[card[0]].pos += card[2];
        }
    },

    activateAttachedFilesPopUp: function(e) {
        const filesToolTip_files = e.target.parentElement.children[1];
        DomHelpers.activate(filesToolTip_files);
    },

    Helpers: {

        getInsertBeforePos: function(list, y) {
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
        },

        getHtmlForFilesPopUp: function(card_files) {
            var filesPopUpHtml = '<div class="files">';
            for (let file_name of Object.keys(card_files)) {
                filesPopUpHtml += FileAttachment.getHTML(file_name, card_files[file_name]);
            }
            filesPopUpHtml += '</div>';
            return filesPopUpHtml;
        }
    }
}
