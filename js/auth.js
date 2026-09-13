// RentoRide Authentication

const message = document.getElementById("message");


// =========================
// SIGN UP
// =========================

document.getElementById("signupBtn").addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    message.innerText = "Please enter email and password.";
    return;
  }

  message.innerText = "Creating account...";

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  console.log("Signup response:", data, error);

  if (error) {
    message.innerText = error.message;
    return;
  }

  message.innerText = "Signup successful!";
});


// =========================
// LOGIN
// =========================

document.getElementById("loginBtn").addEventListener("click", async () => {

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    message.innerText = "Please enter email and password.";
    return;
  }

  message.innerText = "Logging in...";

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  console.log("Login response:", data, error);

  if (error) {
    message.innerText = error.message;
    return;
  }

  message.innerText = "Login successful!";

  window.location.href = "index.html";

  console.log("Logged in user:", data.user);
});
