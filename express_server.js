var express = require("express");
var cookieParser = require('cookie-parser')
var app = express();
var PORT = 8080; // default port 8080
const bodyParser = require("body-parser");

var cookieSession = require('cookie-session')
var express = require('express')

var app = express()

app.use(cookieSession({
  name: 'session',
  keys: ["secret-k-e-y"],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

const bcrypt = require('bcrypt');
const password = "purple-monkey-dinosaur"; // you will probably this from req.params
const hashedPassword = bcrypt.hashSync(password, 10);

app.set("view engine", "ejs");
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// database for users of website 
var users = { 
  "123456": {
    id: "123456", 
    email: "email@email.com", 
    password: "password"
  }
}

//database for shortened urls
var urlDatabase = {
  "b2xVn2": { "longu": "http://www.lighthouselabs.ca", "userID": 123456 },
  "asdVn2": { "longu": "http://www.hotmail.com", "userID": 123456 },
  "9sm5xK": { "longu": "http://www.google.com", "userID": 123457 }
};

//generates a random alpha numeric string for shortURL assignment
function generateRandomString(length) {
    var randomshort = "";
    var possibilities = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < (length); i++)
      randomshort += possibilities.charAt(Math.floor(Math.random() * possibilities.length)).toString();
  
    return randomshort;
}

//finds urls rreated by specific user
function urlsForUser(urlDatabase, id) {
  var useridurlDatabase = {}
  for (shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID == id) {
      useridurlDatabase[shortURL] = urlDatabase[shortURL]
    };
  } 
  return useridurlDatabase
};

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
  if (req.session.user_id) {
    let user = req.session.user_id
    let urlDatabases = urlsForUser(urlDatabase, user)
    let templateVars = { urls: urlDatabases, userid: req.session.user_id};
    res.render("urls_index", templateVars);
    } else {
      res.redirect(`http://localhost:${PORT}/login`);
    }
});

//page for new URL shortening
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
  let templateVars = {userid: req.session.user_id};
  res.render("urls_new", templateVars)
  } else {
    res.redirect(`http://localhost:${PORT}/login`);
  }
});

//for creation of new short and long URL pair
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    var shortURL = generateRandomString(6)
    let longURL = req.body.longURL
    let user = req.session.user_id
    urlDatabase[shortURL] = { longu: longURL,
                              userID: user }
  
    res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
    // res.send("Ok");         // Respond with 'Ok' (we will replace this)
    } else {
      res.redirect(`http://localhost:${PORT}/login`);
    }
});

//redirects to longURL when shortURL is put in address 
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL
  let longURL = urlDatabase[shortURL].longu
  res.redirect(longURL);
});


//page for specific shortURL
app.get("/urls/:id", (req, res) => {
  let user = req.session.user_id
  let urlDatabases = urlsForUser(urlDatabase, user)
  if (req.session.user_id) {
    if (!urlDatabases[req.params.id]) {
      res.status(406).send('ERROR!!! shortURL does not belong to you. <a href="/urls"> <br> Go Back</a>');
      } else {
        let templateVars = { shortURL: req.params.id, longURL: urlDatabases[req.params.id].longu, userid: req.session.user_id };
        res.render("urls_show", templateVars);
      }
    } else {
      res.redirect(`http://localhost:${PORT}/login`);
    }
});

//page for registration
app.get("/register", (req, res) => {
  res.render("register");
});

//page for login
app.get("/login", (req, res) => {
  res.render("login");
});

//post for resgistration 
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('ERROR!!! Please input email and password to register. <a href="/register"> <br> Go Back</a>');
    } else {
      let newId = generateRandomString(6).toString()
      let email = req.body.email
      let password = req.body.password
      users[newId] = {
        id: newId,
        email: req.body.email,
        password: req.body.password
      };
      req.session.user_id = newId
      console.log(users)
      res.redirect("/urls");
  } 
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
  urlDatabase[shortURL].longu = longURL
  res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
});

//creates cookie for inputted username
app.post("/login", (req, res) => {
  console.log(users)
  console.log(req.body.email)
  console.log(req.body.password)
  for (id in users) {
  if (users[id].email === req.body.email && users[id].password === req.body.password) {
    req.session.user_id = id
    res.redirect(`http://localhost:${PORT}/urls/`);
    return;
    } 
  }
    res.status(403).send('ERROR!!! Please input correct email and password to login. <a href="/login"> <br> Go Back</a>');
  });

//POST for logout
app.post("/logout", (req, res) => {
  req.session.user_id = null
  res.redirect(`http://localhost:${PORT}/urls/`);
});