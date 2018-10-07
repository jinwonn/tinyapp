var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");


app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// database for users of website 
const users = { 
  "123456": {
    id: "123456", 
    email: "email@email.com", 
    password: "password"
  },
}

//database for shortened urls
var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

//generates a random alpha numeric string for shortURL assignment
function generateRandomString(length) {
    var randomshort = "";
    var possibilities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < (length); i++)
      randomshort += possibilities.charAt(Math.floor(Math.random() * possibilities.length));
  
    return randomshort;
}

app.get("/", (req, res) => {
  res.send("Hello this is Tinyapp!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

//page to show all shortened urls
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"]};
  res.render("urls_index", templateVars);
});

//page for new URL shortening
app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"]};
  res.render("urls_new", templateVars)
});

//for creation of new short and long URL pair
app.post("/urls", (req, res) => {
  var shortURL = generateRandomString(6)
  let longURL = req.body.longURL
  urlDatabase[shortURL] = longURL

  res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL]
  res.redirect(longURL);
});


//page for specific shortURL
app.get("/urls/:id", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]};
  res.render("urls_show", templateVars);
});

//page for registration
app.get("/register", (req, res) => {
  let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id], username: req.cookies["username"]};
  res.render("register", templateVars);
});

//post for resgistration 
app.post("/register", (req, res) => {
  let newId = generateRandomString(6)
  let email = req.body.email
  let password = req.body.password
  users[newId] = {
    id: newId,
    email: req.body.email,
    password: req.body.password
  };
  res.cookie('user_id', newId)
  res.redirect("/urls");
});

//post for deleting entry pair of shortURL and longURL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});


//post for updating the longURL value of shortURL
app.post("/urls/:id", (req, res) => {
  let shortURL = req.params.id
  let longURL = req.body.longURL
  urlDatabase[shortURL] = longURL
  res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
});

//creates cookie for inputted username
app.post("/login", (req, res) => {
  let username = req.body.username
  res.cookie('username', req.body.username)
  res.redirect(`http://localhost:${PORT}/urls/`);
});

//POST for logout
app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect(`http://localhost:${PORT}/urls/`);
});