function submitNewFriendForm() {
    if (document.getElementById("name").value.length == 0) {
        document.getElementById("nameErrorText").innerHTML = lex["Enter username/ email"];
        return false;
    }
    return true;
}
