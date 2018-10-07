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
  "b2xVn2": { "longu": "http://www.lighthouselabs.ca", "userID": 123456 },
  "9sm5xK": { "longu": "http://www.google.com", "userID": 123457 }
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
  if (req.cookies["user_id"]) {
    let templateVars = { urls: urlDatabase, useremail: users[req.cookies["user_id"]].email, userid: req.cookies["user_id"]};
    res.render("urls_index", templateVars);
    } else {
      res.redirect(`http://localhost:${PORT}/login`);
    }
});

//page for new URL shortening
app.get("/urls/new", (req, res) => {
  if (req.cookies["user_id"]) {
  let templateVars = {useremail: users[req.cookies["user_id"]].email, userid: req.cookies["user_id"]};
  res.render("urls_new", templateVars)
  } else {
    res.redirect(`http://localhost:${PORT}/login`);
  }
});

//for creation of new short and long URL pair
app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    var shortURL = generateRandomString(6)
    let longURL = req.body.longURL
    let user = req.cookies["user_id"]
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
  if (req.cookies["user_id"]) {
    let templateVars = { shortURL: req.params.id, longURL: urlDatabase[req.params.id].longu, userid: req.cookies["user_id"], useremail: users[req.cookies["user_id"]].email};
    res.render("urls_show", templateVars);
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
  for (id in users) {
  if (req.body.email === users[id].email && users[id].password === req.body.password) {
    res.cookie('user_id', id)
  } else {
    res.status(403).send('ERROR!!! Please input correct email and password to login. <a href="/login"> <br> Go Back</a>');
  }
  res.redirect(`http://localhost:${PORT}/urls/`);
  }
});

//POST for logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect(`http://localhost:${PORT}/urls/`);
});