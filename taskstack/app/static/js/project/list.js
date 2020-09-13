const List = {
     
    build: function(list_data) {
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
    },

    update: function(data) {
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
                listWinFiles.innerHTML += FileAttachment.getHTML(file[0], file[1]);
            }
            if (listWin.listId == data.id) {
                FileAttachment.uploadBoxAddFile("editListFileUploadBox", file[0], null);
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
                        FileAttachment.uploadBoxRemoveFile(null, _file);
                    } 
                }
            }
        }
    },

    remove: function(data) {
        for (let [cardId, card] of Object.entries(project.lists[data.id])) {
            if (card.filesPopUpTippyInstance) {
                card.filesPopUpTippyInstance.destroy();
            }
            if (card.memberPopUpsTippyInstances) {
                for (let tippyInstance of card.memberPopUpsTippyInstances) {
                    tippyInstance.destroy();
                }
                card.memberPopUpsTippyInstancesSingleton.destroy();
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

    Helpers: {

        getInsertBeforePos: function(x) {
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
        },

        setCardsSectionMaxHeight: function() {
            var subtrahend = 155;
            if (currentUserIsOwner || currentUserRole == "admin") { subtrahend += 45; }
            var max_height = document.getElementById("listsContainer").getBoundingClientRect().height - subtrahend;
            if (max_height < 128) { max_height = 128; }
            document.querySelectorAll(".list .cards").forEach((el) => {
                el.style.maxHeight = String(max_height) + "px";
            });
        }
    }
}
