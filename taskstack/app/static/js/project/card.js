const Card = {

    registerAndBuildDomEl: function(card_data) {
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
        const list_cards_section = document.querySelector("#l-"+card_data.listId+" .cards");

        var card_html = 
        '<div id="'+ "c-"+card_data.id +'" class="card">'+
        '<section class="head">'+
        '<h3>'+ card_data.name +'</h3>'+
        '</section><div class="bottom"><div class="actions">';
        if (currentUserRole == "owner" || currentUserRole == "admin") {
            card_html += 
            '<i class="fas fa-grip-vertical action cardDragHandle" onclick="moveCardsWin._open_by_card_click_event(event);"></i>';
        }
        card_html += 
        '<i class="action fas fa-external-link-alt" onclick="cardWin.open(event);"></i>'+
        '<i class="action fas fa-paperclip filesButton';
        
        if (!(Object.keys(card_data.attachedFiles).length > 0)) {
            card_html += ' hide';
        }

        card_html += '"></i>';

        card_html += '</div><div class="membersList">';

        for (let member_id in card_data.members) {
            card_html += '<img class="member user-'+member_id+'" src="'+project.members[member_id].picUrl+'">';
        }

        card_html += '</div></div><section class="cardDynamicPopUps hide"></section></div>';

        if (card_data.hasOwnProperty("pos") && card_data.pos >= 1) {
            list_cards_section.children[card_data.pos-1].insertAdjacentHTML("afterend", card_html);
        }
        else {
            list_cards_section.innerHTML += card_html;
        }

        setTimeout(() => {
            if (Object.keys(card_data.attachedFiles).length >= 1) {
                Card.FilesPopUp.createOrUpdate(card_data.id, card_data);
            } 

            if (Object.keys(card_data.members).length >= 1) {
                Card.MembersPopUps.create(card_data.id, project.lists[card_data.listId].cards[card_data.id]);
            }

            if (Object.keys(card_data.members).length > 3) {
                document.querySelector("#c-"+card_data.id+" .bottom").classList.add("membersListTooFull");
            }
        }, 500);
    },

    update: function(data) {
        project.lists[data.listId].cards[data.id].name = data.name;
        project.lists[data.listId].cards[data.id].cardDesc = data.cardDesc;

        const card_dom_el = document.getElementById("c-"+data.id);
        card_dom_el.getElementsByTagName("h3")[0].innerHTML = he.escape(data.name);

        for (let file of data.newAttachedFiles) {
            project.lists[data.listId].cards[data.id].attachedFiles[file[0]] = file[1];
        }

        for (let file_name of data.removedAttachedFiles) {
            delete project.lists[data.listId].cards[data.id].attachedFiles[file_name];
        }
        
        if (data.newAttachedFiles.length > 0 || data.removedAttachedFiles.length > 0) {
            Card.FilesPopUp.createOrUpdate(data.id, project.lists[data.listId].cards[data.id]);
        }

        if (Object.keys(project.lists[data.listId].cards[data.id].attachedFiles).length > 0) {
            card_dom_el.querySelector(".filesButton").classList.remove("hide");
        } else {
            card_dom_el.querySelector(".filesButton").classList.add("hide");
        }
        
        if (data.newMembers.length > 0 && !project.lists[data.listId].cards[data.id].memberPopUpsTippyInstances) {
            Card.MembersPopUps.create(data.id, project.lists[data.listId].cards[data.id]);
        }

        for (let card_member_id of data.newMembers) {
            project.lists[data.listId].cards[data.id].members[card_member_id] = 1;
            card_dom_el.querySelector(".membersList").insertAdjacentHTML("beforeend", '<img class="member user-'+card_member_id+'" src="'+project.members[card_member_id].picUrl+'">');
            setTimeout(() => {
                Card.MembersPopUps.addPopUpForMember(data.id, project.lists[data.listId].cards[data.id], card_member_id);
            }, 200);
        }
        
        for (let card_member_id of data.removedMembers) {
            delete project.lists[data.listId].cards[data.id].members[card_member_id];
            Card.MembersPopUps.removePopUpForMember(project.lists[data.listId].cards[data.id], card_member_id);
            card_dom_el.querySelector(".user-"+card_member_id).remove();
        }

        if (data.newMembers.length > 0 || data.removedMembers.length > 0) {
            setTimeout(() => {
                Card.MembersPopUps.update(project.lists[data.listId].cards[data.id]);
            }, 500);
        }

        if (Object.keys(project.lists[data.listId].cards[data.id].members).length > 3) {
            card_dom_el.querySelector(".bottom").classList.add("membersListTooFull");
        } else {
            card_dom_el.querySelector(".bottom").classList.remove("membersListTooFull");
        }

        if (cardWin.cardId == data.id) {
            setTimeout(() => {
                cardWin.update(data);
            }, 1000);
        }

        if (editCardWin.cardId == data.id) {
            setTimeout(() => {                
                editCardWin.update(data);
            }, 1000);
        }
    },

    remove: function(data) {
        Card.MembersPopUps.destroy(project.lists[data.listId].cards[data.id]);
        Card.FilesPopUp.destroy(project.lists[data.listId].cards[data.id]);

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
        for (let card_data of data.cards) {
            const card_list_cards = document.querySelector("#l-"+card_data.listId+" .cards");
            const card_dom_el = document.getElementById("c-"+card_data.id);
            if (card_list_cards.children[card_data.pos] != card_dom_el) {
                if (0 < card_list_cards.children.length && card_data.pos < card_list_cards.children.length) {
                    if (project.lists[card_data.prevListId].cards[card_data.id].pos > card_data.pos || card_data.prevListId != card_data.listId) {
                        card_list_cards.children[card_data.pos].insertAdjacentElement("beforebegin", card_dom_el);
                    }
                    else {
                        card_list_cards.children[card_data.pos].insertAdjacentElement("afterend", card_dom_el);
                    }
                } else {
                    card_list_cards.insertAdjacentElement("beforeend", card_dom_el);
                }
            }

            if (card_data.prevListId != card_data.listId) {
                project.lists[card_data.listId].cards[card_data.id] = project.lists[card_data.prevListId].cards[card_data.id];
                delete project.lists[card_data.prevListId].cards[card_data.id];
            }
            project.lists[card_data.listId].cards[card_data.id].pos = card_data.pos;
        }
        
        for (let card of data.otherCardsPosChanges) {
            project.lists[card[1]].cards[card[0]].pos += card[2];
        }
    },

    projectCollabRemoved: function(data) {
        for (var list of Object.values(project.lists)) {
            for (var card of Object.values(list.cards)) {
                var i = 0;
                var member_found = false;
                for (let member_id of Object.keys(card.members)) {
                    if (member_id == data.id) {
                        member_found = true;
                        break;
                    }
                    i++;
                }
                if (member_found) {
                    card.members.splice(i);
                    Card.MembersPopUps.removePopUpForMember(card, data.id);
                    Card.MembersPopUps.update(card);
                }
            }
        }
    },

    MembersPopUps: {

        create: function(cardId, card) {
            card.memberPopUpsTippyInstances = [];            

            for (let member_id in card.members) {
                card.memberPopUpsTippyInstances.push(
                    tippy("#c-"+cardId+" .user-"+member_id, {
                        content: '<a class="popUp" href="'+project.members[member_id].goToUrl+'">'+project.members[member_id].name+'</a>',
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer"),
                        placement: 'bottom'
                    })[0]
                );
            }
            
            card.memberPopUpsTippyInstancesSingleton = 
            tippy.createSingleton(card.memberPopUpsTippyInstances, {
                delay: 32,
                moveTransition: 'transform 0.2s ease-out',
                overrides: ['interactive', 'placement', 'theme', 'trigger', 'allowHTML', 'appendTo', 'interactiveBorder', 'interactiveDebounce', 'zIndex']
            });                
        },

        addPopUpForMember: function(cardId, card, member_id) {
            card.memberPopUpsTippyInstances.push(
                tippy("#c-"+cardId+" .user-"+member_id, {
                    content: '<a class="popUp" href="'+project.members[member_id].goToUrl+'">'+project.members[member_id].name+'</a>',
                    interactive: true,
                    appendTo: document.getElementById("tippyContainer"),
                    placement: 'bottom'
                })[0]
            );            
        },

        removePopUpForMember: function(card, member_id) {
            var i = 0;
            for (let tippyInstance of card.memberPopUpsTippyInstances) {
                if (tippyInstance.reference.classList.contains("user-"+member_id)) {
                    tippyInstance.destroy();
                    break;
                }
                i++;
            }
            card.memberPopUpsTippyInstances.splice(i, 1);
        },

        update: function(card) {
            card.memberPopUpsTippyInstancesSingleton.setInstances(card.memberPopUpsTippyInstances);
        },

        destroy: function(card) {
            if (card.memberPopUpsTippyInstances) {
                for (let tippyInstance of card.memberPopUpsTippyInstances) {
                    tippyInstance.destroy();
                }
                card.memberPopUpsTippyInstancesSingleton.destroy();
            }
        },
    },

    FilesPopUp: {
        
        createOrUpdate: function(cardId, card) {
            if (!card.filesPopUpTippyInstance) {
                card.filesPopUpTippyInstance = tippy(
                    "#c-"+cardId+" .filesButton",
                    {
                        content: Card.FilesPopUp.getHtml(card.attachedFiles),
                        interactive: true,
                        appendTo: document.getElementById("tippyContainer"),
                        placement: 'bottom',
                        arrow: false,
                        offset: [0, 6]
                    }
                )[0];
            } 
            else {
                card.filesPopUpTippyInstance.setContent(Card.FilesPopUp.getHtml(card.attachedFiles));                
            }
        },

        destroy: function(card) {
            if (card.filesPopUpTippyInstance) {
                card.filesPopUpTippyInstance.destroy();
            }
        },

        getHtml: function(files) {
            var filesPopUpHtml = '<div class="files">';
            for (let file_name of Object.keys(files)) {
                filesPopUpHtml += FileAttachment.getHTML(file_name, files[file_name]);
            }
            filesPopUpHtml += '</div>';
            return filesPopUpHtml;
        }
    }
}
