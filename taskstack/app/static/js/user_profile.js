/* edit profile
============================================================================= */

var profilePicCropper = null;

function triggerProfilePicInput() {
  document.getElementById("profilePicInput").click();
}

function loadNewProfilePic() {
  const profilePic = document.getElementById("profilePic");
  const profilePicInput = document.getElementById("profilePicInput");
  const file = profilePicInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.addEventListener("load", function() {
      function resizeProfilePic_and_createProfilePicCropper() {
        const canvas = document.createElement('canvas');
        canvas.height = profilePic.height * (280 / profilePic.width);
        canvas.width = 280;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(profilePic, 0, 0, canvas.width, canvas.height);
        ctx.canvas.toBlob(blob => {
          function createProfilePicCropper() {
            profilePicCropper = new Cropper(profilePic, {
              aspectRatio: 1/1,
              center: false,
              rotatable: false,
              toggleDragModeOnDblclick: false,
              dragMode: "move",
              background: false,
              minContainerWidth: 100
            });
            profilePic.removeEventListener("load", createProfilePicCropper);
          }
          const obj_url = URL.createObjectURL(blob);
          profilePic.removeEventListener("load", resizeProfilePic_and_createProfilePicCropper);
          profilePic.addEventListener("load", createProfilePicCropper);
          profilePic.setAttribute("src", obj_url);
        });
      }
      profilePic.addEventListener("load", resizeProfilePic_and_createProfilePicCropper);
      profilePic.setAttribute("src", this.result);
    });
    reader.readAsDataURL(file);
    profilePic.dataset.changed = "true";
  }
}

function editProfile() {
  document.getElementById("editProfileBtn").style = "display: none;";
  document.getElementById("profileDescInputContainer").style = "display: block;";
  document.getElementById("profileDescInput").value = document.getElementById("profileDesc").innerHTML;
  document.getElementById("profilePic").classList.add("edit");
  document.getElementById("profilePic").addEventListener("click", triggerProfilePicInput);
  document.getElementById("editProfileBtnGroup").style = "display: block;";
}

function cancelEditProfile() {
  profilePic = document.getElementById("profilePic");
  profilePic.classList.remove("edit");
  profilePic.dataset.changed = "false";
  profilePic.setAttribute("src", profilePic.dataset.initialSrc);
  profilePic.removeEventListener("click", triggerProfilePicInput);
  if (profilePicCropper) {  profilePicCropper.destroy(); }
  document.getElementById("profileDescInputContainer").style = "display: none;";
  document.getElementById("editProfileBtnGroup").style = "display: none;";
  document.getElementById("editProfileBtn").style = "display: block;";
}

async function submitEditProfile() {
  if (document.getElementById("profilePic").dataset.changed == "true" && profilePicCropper) {
    var newProfilePic = await canvasToBlob(profilePicCropper.getCroppedCanvas());
    const obj_url = URL.createObjectURL(newProfilePic);
    document.getElementById("profilePic").setAttribute("src", obj_url);
    document.getElementById("currentUserProfilePic").setAttribute("src", obj_url);
  }else {
    var newProfilePic = null;
  }

  const newProfileDesc = document.getElementById("profileDescInput").value;
  if (newProfileDesc.length > 256) {
    document.getElementById("profileDescErrorText").classList.add("active");
  } else {
    document.getElementById("profileDescErrorText").classList.remove("active");
  }

  var fd = new FormData();
  fd.append("submit", "editProfile");
  fd.append("token", token);
  fd.append("newProfilePic", newProfilePic);
  fd.append("newProfileDesc", newProfileDesc);
  
  fetch("/"+username, {
      method: 'POST',
      credentials: "include",
      body: fd
  })
    .then(response => {
      if (response.status == 200) {
        document.getElementById("profileDesc").innerHTML = he.escape(document.getElementById("profileDescInput").value);
        document.getElementById("profileDescInputContainer").style = "display: none;";
        document.getElementById("profilePic").classList.remove("edit");
        document.getElementById("profilePic").removeEventListener("click", triggerProfilePicInput);
        if (profilePicCropper) { profilePicCropper.destroy(); }
        document.getElementById("editProfileBtnGroup").style = "display: none;";
        document.getElementById("editProfileBtn").style = "display: block;";
      }
      else {
        window.alert("Error");
      }
    })
}

function canvasToBlob(canvas) {
  return new Promise(function(resolve) {
    canvas.toBlob(resolve);
  });
}

if (!HTMLCanvasElement.prototype.toBlob) {
  Object.defineProperty(HTMLCanvasElement.prototype, 'toBlob', {
    value: function (callback, type, quality) {
      var canvas = this;
      setTimeout(function() {
        var binStr = atob( canvas.toDataURL(type, quality).split(',')[1] ),
        len = binStr.length,
        arr = new Uint8Array(len);

        for (var i = 0; i < len; i++ ) {
           arr[i] = binStr.charCodeAt(i);
        }

        callback( new Blob( [arr], {type: type || 'image/png'} ) );
      });
    }
 });
}


/* remove friend
============================================================================= */

function removeFriend() {
  var fd = new FormData();
  fd.append("submit", "removeFriend");
  fd.append("id", userId);

  fetch("/"+username, {
    method: 'POST',
    credentials: "include",
    body: fd
  })
  .then(response => {
    if (response.status == 200) {
      Modal.closeById("removeFriendModal");
    }
    else {
      window.alert("Error");
    }
  })
}
