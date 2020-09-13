const FileAttachment = {

    uploadBoxes: {},
    /*
        {<fileUploadBox-id>: {
                <file-name>: string (binary data) | null (-> don't upload file)
                ... 
        } ...}
    */

    UPLOAD_MAX: 8,

    getHTML: function(file_name, file_url) {
        return '<a name="'+ he.escape(file_name) +'" class="file" href="'+ file_url +'" download>'+
        '<i class="fas fa-file fileIcon"></i>'+
        '<p>'+ he.escape(file_name) +'</p>'+
        '</a>';
    },

    setupUploading: function() {
        for (let fileUploadBox of document.getElementsByClassName("fileUploadBox")) {
            FileAttachment.uploadBoxes[fileUploadBox.id] = {};
        }
    },

    uploadBoxDragOverHandler: function(e) {
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
    },

    processUploadBoxDropInput: async function(e) {
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
            else if (FileAttachment.uploadBoxes[fileUploadBox.id][file.name] !== undefined) {
                fileUploadBoxErrorText.innerHTML = lex["A file with this name has already been selected."];
            }
            else if (Object.keys(FileAttachment.uploadBoxes[fileUploadBox.id]).length >= FileAttachment.UPLOAD_MAX) {
                fileUploadBoxErrorText.innerHTML = "Max. " + FileAttachment.UPLOAD_MAX + " " + lex["files"];
            }
            else {
                FileAttachment.uploadBoxes[fileUploadBox.id][file.name] = file;
                fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file.name) + '" class="file" onclick="FileAttachment.uploadBoxShowRemoveFileIcon(event);">' + 
                '<i class="fas fa-window-close cancelIcon" onclick="FileAttachment.uploadBoxRemoveFile(event);"></i>' +
                '<i class="fas fa-file fileIcon"></i>' +
                '<p>' + he.escape(file.name) + '</p>' +
                '</div>';
                fileUploadBoxErrorText.innerHTML = "";
            }
        }
    },

    processUploadBoxInput: async function(e) {
        const fileUploadBox = DomHelpers.getParent(e.target, "fileUploadBox");
        const fileUploadBox_files = fileUploadBox.getElementsByClassName("files")[0];
        const fileUploadBoxErrorText = fileUploadBox.parentElement.getElementsByClassName("fileUploadBoxErrorText")[0];
    
        for (let file of e.target.files) {
            if (file.size > 8388608) {
                fileUploadBoxErrorText.innerHTML = lex["The file must not be larger than 8 MB."];
            }
            else if (FileAttachment.uploadBoxes[fileUploadBox.id][file.name]) {
                fileUploadBoxErrorText.innerHTML = lex["A file with this name has already been selected."];
            }
            else if (Object.keys(FileAttachment.uploadBoxes[fileUploadBox.id]).length >= FileAttachment.UPLOAD_MAX) {
                fileUploadBoxErrorText.innerHTML = "A maximum of " + FileAttachment.UPLOAD_MAX + " files can be attached.";
            }
            else {
                FileAttachment.uploadBoxes[fileUploadBox.id][file.name] = file;
                fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file.name) + '" class="file" onclick="FileAttachment.uploadBoxShowRemoveFileIcon(event);">' + 
                '<i class="fas fa-window-close cancelIcon" onclick="FileAttachment.uploadBoxRemoveFile(event);"></i>' +
                '<i class="fas fa-file fileIcon"></i>' +
                '<p>' + he.escape(file.name) + '</p>' +
                '</div>';
                fileUploadBoxErrorText.innerHTML = "";
            }
        }
    
        e.target.value = "";
    },

    uploadBoxRemoveFile: function(e=null, file_dom_el=null) {
        if (file_dom_el === null) {
            e.preventDefault();
            e.stopPropagation();
            file_dom_el = DomHelpers.getParent(e.target, "file");
        }

        const fileUploadBox = DomHelpers.getParent(file_dom_el, "fileUploadBox");
        delete FileAttachment.uploadBoxes[fileUploadBox.id][file_dom_el.dataset.name];
        file_dom_el.remove();
    },

    clearUploadBox: function(fileUploadBox_id) {
        const fileUploadBox = document.getElementById(fileUploadBox_id);
        for (let file in FileAttachment.uploadBoxes[fileUploadBox_id]) {
            delete FileAttachment.uploadBoxes[fileUploadBox_id][file];
        }
        fileUploadBox.getElementsByClassName("files")[0].innerHTML = "";
        fileUploadBox.parentElement.getElementsByClassName("fileUploadBoxErrorText")[0].innerHTML = "";        
    },

    uploadBoxAddFile: function(fileUploadBox_id, file_name, file_data) {  // programmatically
        FileAttachment.uploadBoxes[fileUploadBox_id][file_name] = file_data;
        const fileUploadBox_files = document.getElementById(fileUploadBox_id).getElementsByClassName("files")[0];
        fileUploadBox_files.innerHTML += '<div data-name="' + he.escape(file_name) + '" class="file" onclick="FileAttachment.uploadBoxShowRemoveFileIcon(event);">' + 
        '<i class="fas fa-window-close cancelIcon" onclick="FileAttachment.uploadBoxRemoveFile(event);"></i>' +
        '<i class="fas fa-file fileIcon"></i>' +
        '<p>' + he.escape(file_name) + '</p>' +
        '</div>'; 
    },

    uploadBoxShowRemoveFileIcon: function(e) {
        var file = e.target;
        if (! file.classList.contains("file")) {
            file = DomHelpers.getParent(e.target, "file");
        }
        const icon = file.getElementsByClassName("cancelIcon")[0];
        DomHelpers.activate(icon);        
    }
}
