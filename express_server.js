var express = require("express");
var app = express();
var PORT = 8080; // default port 8080
var bodyParser = require("body-parser");
var bcrypt = require('bcrypt');
var cookieSession = require('cookie-session')
var express = require('express')

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["secret-k-e-y"],
  maxAge: 24 * 60 * 60 * 1000 
}))

// database for users of website 
var users = { 
  "123456": {
    id: "123456", 
    email: "email@email.com", 
    password: bcrypt.hashSync("password", 10)
  },
  "123457": {
    id: "123457", 
    email: "test@email.com", 
    password: bcrypt.hashSync("password1", 10)
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
    }
  } 
  return useridurlDatabase
}

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//main domain page
app.get("/", (req, res) => {
  if (req.session.user_id) {
      res.redirect(`http://localhost:${PORT}/urls`);
    } else {
      res.redirect(`http://localhost:${PORT}/login`);
    }
});


//page to show all shortened urls
app.get("/urls", (req, res) => {
  if (req.session.user_id) {
    let user = req.session.user_id;
    let urlDatabases = urlsForUser(urlDatabase, user);
    let templateVars = { urls: urlDatabases, userid: req.session.user_id, useremail: users[req.session.user_id].email};
    res.render("urls_index", templateVars);
    } else {
      res.status(401).send('Please login or register to use TinyApp. <br> <a href="/login"><button type="button">Login!</button></a><br> <a href="/register"><button type="button">Register!</button></a>');
    }
});

//page for new URL shortening
app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
  let templateVars = {userid: req.session.user_id, useremail: users[req.session.user_id].email};
  res.render("urls_new", templateVars);
  } else {
    res.redirect(`http://localhost:${PORT}/login`);
  }
});

//page for specific shortURL
app.get("/urls/:id", (req, res) => {
  let user = req.session.user_id;
  let urlDatabases = urlsForUser(urlDatabase, user);
  if (req.session.user_id) {
    if (!urlDatabases[req.params.id]) {
      res.status(401).send('ERROR!!! shortURL does not exist or does not belong to you. <br> <a href="/urls"><button type="button">Go Back!</button></a>');
      } else {
        let templateVars = { shortURL: req.params.id, longURL: urlDatabases[req.params.id].longu, userid: req.session.user_id, useremail: users[req.session.user_id].email };
        res.render("urls_show", templateVars);
      }
    } else {
      res.status(401).send('Please login or register to use TinyApp. <br> <a href="/login"><button type="button">Login!</button></a><br> <a href="/register"><button type="button">Register!</button></a>');
    }
});

//redirects to longURL when shortURL is put in address 
app.get("/u/:shortURL", (req, res) => {
  var shortURL = req.params.shortURL;
  if (shortURL) {
    let longURL = urlDatabase[shortURL].longu;
    res.redirect(longURL);
  } else {
    res.status(303).send('This shortened URL does not exist. Please create a new one. <br> <a href="/urls/new"><button type="button">Go!</button></a>');
  }
});

//for creation of new short and long URL pair
app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    var shortURL = generateRandomString(6);
    let longURL = req.body.longURL;
    let user = req.session.user_id;
    urlDatabase[shortURL] = { longu: longURL,
                              userID: user }
  
    res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
    } else {
      res.status(401).send('Please login or register to use TinyApp. <br> <a href="/login"><button type="button">Login!</button></a><br> <a href="/register"><button type="button">Register!</button></a>');
    }
});

//post for updating the longURL value of shortURL
app.post("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    let shortURL = req.params.id
    let longURL = req.body.longURL
    urlDatabase[shortURL].longu = longURL
    res.redirect(`http://localhost:${PORT}/urls/` + shortURL);
    } else {
      res.status(401).send('Please login or register to use TinyApp. <br> <a href="/login"><button type="button">Login!</button></a><br> <a href="/register"><button type="button">Register!</button></a>');
    }
});

//post for deleting entry pair of shortURL and longURL
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

//page for login
app.get("/login", (req, res) => {
  if (req.session.user_id) {
      res.redirect(`http://localhost:${PORT}/urls/`);
    } else {
      res.render("login");
    }
});

//page for registration
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect(`http://localhost:${PORT}/urls/`);
  } else {
    res.render("register");
  }
});

//creates cookie for inputted username
app.post("/login", (req, res) => {
  for (id in users) {
  if (users[id].email === req.body.email && bcrypt.compareSync(req.body.password, users[id].password)) {
    req.session.user_id = id;
    res.redirect(`http://localhost:${PORT}/urls/`);
    return;
    } 
  }
    res.status(403).send('ERROR!!! Please input correct email and password to login. <br><a href="/login"><button type="button">Go Back!</button></a>');
  });

//post for resgistration 
app.post("/register", (req, res) => {
  if (req.body.email === '' || req.body.password === '') {
    res.status(400).send('ERROR!!! Please input email and password to register. <br> <a href="/register"><button type="button">Go Back!</button></a>');
    } else {
      for (id in users) {
        if (users[id].email === req.body.email) {
          res.status(400).send('ERROR!!! Email already registered. <br> <a href="/register"><button type="button">Go Back!</button></a>');
        } else { 
          let newId = generateRandomString(6).toString()
      let email = req.body.email;
      let password = req.body.password;
      users[newId] = {
        id: newId,
        email: req.body.email,
        password: bcrypt.hashSync(password, 10)
      };
      req.session.user_id = newId;
      res.redirect("/urls");
  } 
}}});

//POST for logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect(`http://localhost:${PORT}/urls/`);
});