/* menu bar
============================================================================= */

const MenuBar = {

    setup: function() {
        function openMenu(menu) {
            for (let _menu of document.getElementsByClassName("menu")) {
                _menu.classList.remove("active");
                _menu.classList.remove("reactToHover");
            }
            menu.classList.add("active");
            menu.classList.add("reactToHover");
        }
    
        function openSubMenu(subMenu) {
            for (let _subMenu of document.getElementsByClassName("subMenu")) {
                _subMenu.classList.remove("active");
                _subMenu.classList.remove("reactToHover");
            }
            for (let child_subMenu of subMenu.getElementsByClassName("subMenu")) {
                child_subMenu.classList.add("reactToHover");
            }
            const menu = DomHelpers.getParent(subMenu, "menu");
            if (! menu.classList.contains("active")) {
                openMenu(menu);
            }
            for (let parent_subMenu of DomHelpers.getParents(subMenu, "subMenu")) {
                parent_subMenu.classList.add("active");
            }
            subMenu.classList.add("active");
            subMenu.classList.add("reactToHover");
        }
    
        function closeSubMenu(subMenu) {
            subMenu.classList.remove("active");
            subMenu.classList.add("reactToHover");
            for (let child_subMenu of subMenu.getElementsByClassName("subMenu")) {
                child_subMenu.classList.remove("active");
                child_subMenu.classList.add("reactToHover");
            }
        }
    
        function closeAllMenus() {
            for (let menu of document.getElementsByClassName("menu")) {
                menu.classList.remove("active");
                menu.classList.add("reactToHover");
            }
            for (let subMenu of document.getElementsByClassName("subMenu")) {
                subMenu.classList.remove("active");
                subMenu.classList.add("reactToHover");
            }
        }
    
        document.addEventListener("click", (e) => {
            if (e.target.classList.contains("menu") && ! e.target.classList.contains("active")) {
                openMenu(e.target);
                return;
            }
    
            else if (e.target.classList.contains("subMenu") && ! e.target.classList.contains("disabled")) {
                if (e.target.classList.contains("active")) {
                    closeSubMenu(e.target)
                } 
                else {
                    openSubMenu(e.target);
                }
                return;
            }
    
            else if (document.getElementById("menuBar").contains(e.target) && e.target.classList.contains("disabled")) {
                return;
            }
    
            setTimeout(closeAllMenus, 200);
        });
    
        for (let menu of document.getElementsByClassName("menu")) {
            menu.classList.add("reactToHover");
        }
    
        for (let subMenu of document.getElementsByClassName("subMenu")) {
            subMenu.classList.add("reactToHover");
        }
    
        // setup menu shortcuts
    
        if (lang == "de") {
            document.addEventListener("keydown", (e) => {
                if (! e.altKey) {
                    return;
                }
                const key_code = e.which || e.keyCode;
                switch (key_code) {
                    case 80:
                        openMenu(document.getElementById("projectMenu"));
                        break;
                    case 65: 
                        openMenu(document.getElementById("viewMenu"));
                        break;
                    case 69:
                        openMenu(document.getElementById("settingsMenu"));
                        break;
                    case 86:
                        openMenu(document.getElementById("historyMenu"));
                        break;
                    case 72:
                        openMenu(document.getElementById("helpMenu"));
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
                        openMenu(document.getElementById("projectMenu"));
                        break;
                    case 86: 
                        openMenu(document.getElementById("viewMenu"));
                        break;
                    case 83:
                        openMenu(document.getElementById("settingsMenu"));
                        break;
                    case 73:
                        openMenu(document.getElementById("historyMenu"));
                        break;
                    case 72:
                        openMenu(document.getElementById("helpMenu"));
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
        } 
        else {
            document.getElementById("addFriendButton").classList.add("disabled");
            document.getElementById("invitePeopleWithLinkButton").classList.add("disabled");
            document.getElementById("editProjectNameAndDescButton").classList.add("disabled");
            document.getElementById("deleteProjectButton").classList.add("disabled");
            document.getElementById("changeOwnerButton").classList.add("disabled");
            document.getElementById("visibilitySettingButton").classList.add("disabled");
            document.getElementById("chatGroupSettingButton").classList.add("disabled");
        }

        if (currentUserIsOwner || currentUserRole == "admin") {
            document.getElementById("newListButton").onclick = newListWin.open;
            document.getElementById("moveListButton").onclick = moveListWin.open;
            document.getElementById("moveCardButton").onclick = moveCardsWin.open;
        } 
        else {
            document.getElementById("newListButton").classList.add("disabled");
            document.getElementById("moveListButton").classList.add("disabled");
            document.getElementById("moveCardButton").classList.add("disabled");
        }

        if (currentUserIsOwner || currentUserIsCollaborator) {
            document.getElementById("historyButton").onclick = historyWin.open;
        } 
        else {
            document.getElementById("historyButton").classList.add("disabled");
        }

        if (currentUserIsCollaborator) {
            document.getElementById("leaveProjectButton").onclick = leaveProjectWin.open;
        } 
        else {
            document.getElementById("leaveProjectButton").classList.add("disabled");
        }

        document.getElementById("filterCardsButton").onclick = filterCardsWin.open;
        document.getElementById("collaboratorsButton").onclick = collabsWin.open;
        /*document.getElementById("filterCardsButton").onclick = filterCardsWin.open;*/
    },

    deactivate: function() {
        for (let menu of document.getElementById("menuBar").children) {
            for (let action of menu.children[1].children) {
                if (action.id != "exitButton") {
                    action.classList.add("disabled");
                    action.onclick = "";
                }
            }
        }
    }
}


/* page-head
============================================================================= */

const PageHead = {

    toggle: function() {
        if (document.getElementById("pageHead").classList.contains("hidden")) {
            PageHead.show();
        } else {
            PageHead.hide();
        }
    },

    show: function() {
        document.getElementById("pageHead").classList.remove("hidden");
        document.getElementById("content").classList.remove("pageHeadHidden");
        document.getElementById("hideIcon").classList.add("active");
        document.getElementById("showIcon").classList.remove("active");
        setTimeout(List.Helpers.setCardsSectionMaxHeight, 500);
    },

    hide: function() {
        document.getElementById("pageHead").classList.add("hidden");
        document.getElementById("content").classList.add("pageHeadHidden");
        document.getElementById("hideIcon").classList.remove("active");
        document.getElementById("showIcon").classList.add("active");
        setTimeout(List.Helpers.setCardsSectionMaxHeight, 500);
    }
}
