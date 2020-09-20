const List = {
     
    registerAndBuildDomEl: function(list_data) {
        project.lists[list_data.id] = {
            name: list_data.name,
            listDesc: list_data.listDesc,
            pos: list_data.pos,
            attachedFiles: list_data.attachedFiles,
            cards: {}
        };
    
        List.buildDomEl(list_data);
    },

    buildDomEl: function(list_data) {
        var list_html = 
        '<div id='+ "l-"+list_data.id+' class="list">'+
        '<section class="head">'+
        '<h2>'+ list_data.name +'</h2>'+
        '<div class="actions">'+
        '<i class="fas fa-external-link-alt action" onclick="listWin.open(event);"></i>';
        if (currentUserRole == "owner" || currentUserRole == "admin") {
            list_html += 
            '<i class="fas fa-plus action" onclick="newCardWin.open(event);"></i>'+
            '<i class="fas fa-grip-vertical action listDragHandle" onclick="moveListWin._open_by_list_click_event(event);"></i>';
        }
        list_html += 
        '</div></section>'+
        '<section class="cards">'+
        '</section><section class="listDynamicPopUps hide"></section></div>';
        
        if (list_data.pos >= 1) {
            document.getElementById("listsContainer").children[list_data.pos-1].insertAdjacentHTML("afterend", list_html);
        }
        else if (list_data.pos == 0) {
            document.getElementById("listsContainer").insertAdjacentHTML("afterbegin", list_html);
        }
        else {
            document.getElementById("listsContainer").innerHTML += list_html;
        }
        
        if (!Flag.onMobileDevice) {
            setTimeout(() => {
                project.lists[list_data.id].cardsSortable = new Sortable(document.querySelector("#l-"+list_data.id+" .cards"), {
                    group: "cardsSortables",
                    handle: ".cardDragHandle",
                    draggable: ".card",
                    ghostClass: "draggingGhost",
                    chosenClass: "chosen",
                    dragClass: "dragging",
                    direction: 'vertical',
                    animation: 200,
                    easing: "ease-in-out",
                    scroll: true,
                    scrollSensitivity: 50,
                    scrollSpeed: 10,
                    emptyInsertThreshold: 8,
                
                    onEnd: function (e) {
                        const card_id = e.item.id.substring(2);
                        const to_list_id = DomHelpers.getParent(e.to, "list").id.substring(2);
                        const from_list_id = DomHelpers.getParent(e.from, "list").id.substring(2);
                        if (to_list_id != from_list_id || project.lists[from_list_id].cards[card_id].pos != e.newDraggableIndex) {
                            projectSocket.emit("move_card", {
                                projectId: project.id,
                                id: card_id,
                                listId: to_list_id,
                                pos: e.newDraggableIndex
                            });                        
                        }
                    }
                });
            }, 500);
        }
    },

    update: function(data) {
        project.lists[data.id].name = data.name;
        project.lists[data.id].listDesc = data.listDesc;
        document.getElementById("l-"+data.id).getElementsByTagName("h2")[0].innerHTML = he.escape(data.name);

        for (let file of data.newAttachedFiles) {
            project.lists[data.id].attachedFiles[file[0]] = file[1];
        }

        for (let file_name of data.removedAttachedFiles) {
            delete project.lists[data.id].attachedFiles[file_name];
        }

        if (listWin.listId == data.id) {
            listWin.update(data);
        }

        if (editListWin.listId == data.id) {
            editListWin.update(data);
        }
    },

    remove: function(data) {
        for (let cardId in project.lists[data.id]) {
            if (project.lists[data.id].cards[cardId].filesPopUpTippyInstance) {
                project.lists[data.id].cards[cardId].filesPopUpTippyInstance.destroy();
            }
            if (project.lists[data.id].cards[cardId].memberPopUpsTippyInstances) {
                for (let tippyInstance of project.lists[data.id].cards[cardId].memberPopUpsTippyInstances) {
                    tippyInstance.destroy();
                }
                project.lists[data.id].cards[cardId].memberPopUpsTippyInstancesSingleton.destroy();
            }
            if (cardWin.cardId == cardId) {
                cardWin.close();
            }
            if (editCardWin.cardId == cardId) {
                editCardWin.close();
            }
        }

        delete project.lists[data.id];

        document.getElementById("l-"+data.id).remove();

        for (let list of data.listsPosChanges) {
            project.lists[list[0]].pos += list[1];
        }

        if (listWin.listId == data.id) {
            listWin.close();
        }
        if (editListWin.listId == data.id) {
            editListWin.close();
        }
    },

    updatePositions: function(data) {
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
    },

    setupListDraggingForAll: function() {
        project.listsSortable = new Sortable(document.getElementById("listsContainer"), {
            handle: ".listDragHandle",
            draggable: ".list",
            ghostClass: "draggingGhost",
            chosenClass: "chosen",
            dragClass: "dragging",
            filter: ".buffer",
            direction: 'horizontal',
            animation: 200,
            easing: "ease-in-out",
            scroll: true,
            scrollSensitivity: 50,
            scrollSpeed: 10,
        
            onEnd: function (e) {
                const list_id = e.item.id.substring(2);
                if (project.lists[list_id].pos != e.newDraggableIndex) {
                    projectSocket.emit("move_list", {
                        projectId: project.id,
                        id: list_id,
                        pos: e.newDraggableIndex
                    });                    
                }
                
            }
        });
    },

    setupCardsSectionResponsiveness: function() {
        List.Helpers.setCardsSectionMaxHeight();
        addResizeListener(document.getElementById("content"), List.Helpers.setCardsSectionMaxHeight);
    },

    Helpers: {

        setCardsSectionMaxHeight: function() {
            var max_height = document.getElementById("listsContainer").getBoundingClientRect().height - 120;
            if (max_height < 120) { max_height = 120; }
            document.querySelectorAll(".list .cards").forEach((el) => {
                el.style.maxHeight = String(max_height) + "px";
            });
        }
    }
}
