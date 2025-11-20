async function signIn(){
    // get user input
    var usernameInput = document.getElementById("username");
    var passwordInput = document.getElementById("password");
    const username = usernameInput.value;
    const password = passwordInput.value;

    if (username == "" || password == ""){
        // TODO: Add error messages to inputs
        return;
    }

    // interact with authentication server
    await fetch("http://localhost:3001/auth/", {
        method: "POST",
        body: JSON.stringify({
            username: username,
            password: password
        }),
        headers: {
            "Content-Type": 'application/json; charset=UTF-8'
        }
    }).then( (res) => {
        const loginResult = res.json();
        if (loginResult.userID == -1){
            // login failed
            console.error("Login Failed");
            console.error(loginResult.message);
            // TODO: Add text on page
        } else {
            // login success
            localStorage.setItem("userID", loginResult.userID);
            window.location.replace("/");
        }
    });
}

var signInButton = document.getElementById("sign-in-button");

signInButton.addEventListener("click", signIn);
