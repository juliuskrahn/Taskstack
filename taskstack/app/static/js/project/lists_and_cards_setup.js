const ListsAndCardsSetup = {

    buildDomEls: function() {
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
                name: list[1].name
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
    },

    prepareDragging: function() {
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
                    const insert_before_pos = List.Helpers.getInsertBeforePos(e.clientX);
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
                    const insert_before_pos = Card.Helpers.getInsertBeforePos(list, e.clientY);
                    if (insert_before_pos > list_of_card_cards.length - 1) {
                    list.getElementsByClassName("cards")[0].appendChild(card);
                    } else {
                        list.getElementsByClassName("cards")[0].insertBefore(card, list_of_card_cards[insert_before_pos]);
                    }
                }
            }
    
        });
    },

    setupListCardsSectionResponsiveness: function() {
        List.Helpers.setCardsSectionMaxHeight();
        addResizeListener(document.getElementById("content"), List.Helpers.setCardsSectionMaxHeight);
    }
}
