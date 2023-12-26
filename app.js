const express = require('express');
const app = express();
const port = 3000;
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); // Path to your swagger configuration file

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://zhikangsam0724:2Un24f6Hfk4l1Z1x@cluster0.1jh2xph.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

client.connect().then(res => {
  console.log(res);
});

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Handle login requests
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Perform authentication logic (replace with your actual authentication logic)

    // For demonstration purposes, assume successful login
    if (username === 'admin' && password === 'admin') {
        res.send('Login successful!');
    } else {
        res.status(401).send('Login failed');
    }
});

app.use(express.json());
//security register the user account
app.post('/register/user',verifyToken, async (req, res) => {
  let result = register(
    req.body.username,
    req.body.password,
    req.body.name,
    req.body.email,
  );

  res.send(result);
});

//security login to the security account, if successfully login it will get a token for do other operation the security can do
app.post('/login/security', (req, res) => {
  console.log(req.body);
  login(req.body.username, req.body.password)
    .then(result => {
      if (result.message === 'Correct password') {
        const token = generateToken({ username: req.body.username });
        res.send({ message: 'Successful login', token });
      } else {
        res.send('Login unsuccessful');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

//the security view all the visitor (the token is true)
app.get('/view/visitor/security', verifyToken, async (req, res) => {
  try {
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .find()
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/// security have kuasa to delete the user account after delete the user account all the visitor created by particular user also will delete
app.delete('/delete/user/:username', verifyToken, async (req, res) => {
  const username = req.params.username;

  try {
    // Delete the user
    const deleteUserResult = await client
      .db('benr2423')
      .collection('users')
      .deleteOne({ username });

    if (deleteUserResult.deletedCount === 0) {
      return res.status(404).send('User not found');
    }

    // Delete the user's documents
    const deleteDocumentsResult = await client
      .db('benr2423')
      .collection('documents')
      .deleteMany({ username });

    // Delete the visitors created by the user
    const deleteVisitorsResult = await client
      .db('benr2423')
      .collection('visitor')
      .deleteMany({ createdBy: username });

    res.send('User and associated data deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//user login account 
app.post('/login/user', (req, res) => {
  console.log(req.body);
  loginuser(req.body.username, req.body.password)
    .then(result => {
      if (result.message === 'Correct password') {
        const token = generateToken({ username: req.body.username });
        res.send({ message: 'Successful login', token });
      } else {
        res.send('Login unsuccessful');
      }
    })
    .catch(error => {
      console.error(error);
      res.status(500).send("Internal Server Error");
    });
});

///user create visitor 
app.post('/create/visitor/user', verifyToken, async (req, res) => {
  const createdBy = req.user.username; // Get the username from the decoded token
  let result = createvisitor(
    req.body.visitorname,
    req.body.checkintime,
    req.body.checkouttime,
    req.body.temperature,
    req.body.gender,
    req.body.ethnicity,
    req.body.age,
    req.body.phonenumber,
    createdBy
  );   
  res.send(result);
});

///view visitor that has been create by particular user 
app.get('/view/visitor/user', verifyToken, async (req, res) => {
  try {
    const username = req.user.username; // Get the username from the decoded token
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .find({ createdBy: username }) // Retrieve visitors created by the authenticated user
      .toArray();

    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

/// user delete its visitor
app.delete('/delete/visitor/:visitorname', verifyToken, async (req, res) => {
  const visitorname = req.params.visitorname;
  const username = req.user.username; // Assuming the username is available in the req.user object

  try {
    // Find the visitor by visitorname and createdBy field to ensure the visitor belongs to the user
    const deleteVisitorResult = await client
      .db('benr2423')
      .collection('visitor')
      .deleteOne({ visitorname: visitorname, createdBy: username });

    if (deleteVisitorResult.deletedCount === 0) {
      return res.status(404).send('Visitor not found or unauthorized');
    }

    res.send('Visitor deleted successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});
/// user update its visitor info
app.put('/update/visitor/:visitorname', verifyToken, async (req, res) => {
  const visitorname = req.params.visitorname;
  const username = req.user.username;
  const { checkintime, checkouttime,temperature,gender,ethnicity,age,phonenumber } = req.body;

  try {
    const updateVisitorResult = await client
      .db('benr2423')
      .collection('visitor')
      .updateOne(
        { visitorname, createdBy: username },
        { $set: { checkintime, checkouttime,temperature,gender,ethnicity,age,phonenumber } }
      );

    if (updateVisitorResult.modifiedCount === 0) {
      return res.status(404).send('Visitor not found or unauthorized');
    }

    res.send('Visitor updated successfully');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

/// visitor can view their data by insert their name
app.get('/view/visitor/:visitorName', async (req, res) => {
  const visitorName = req.params.visitorName;

  try {
    const result = await client
      .db('benr2423')
      .collection('visitor')
      .findOne({ visitorname: visitorName });

    if (result) {
      res.send(result);
    } else {
      res.status(404).send('Visitor not found');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});


async function login(reqUsername, reqPassword) {
  let matchUser = await client.db('benr2423').collection('security').findOne({ username: { $eq: reqUsername } });

  if (!matchUser)
    return { message: "User not found!" };

  if (matchUser.password === reqPassword)
    return { message: "Correct password", user: matchUser };
  else
    return { message: "Invalid password" };
}

async function loginuser(reqUsername, reqPassword) {
  let matchUser = await client.db('benr2423').collection('users').findOne({ username: { $eq: reqUsername } });

  if (!matchUser)
    return { message: "User not found!" };

  if (matchUser.password === reqPassword)
    return { message: "Correct password", user: matchUser };
  else
    return { message: "Invalid password" };
}

function register(reqUsername, reqPassword, reqName, reqEmail) {
  client.db('benr2423').collection('users').insertOne({
    "username": reqUsername,
    "password": reqPassword,
    "name": reqName,
    "email": reqEmail,
  });
  return "account created";
}
///create visitor 
function createvisitor(reqVisitorname, reqCheckintime, reqCheckouttime,reqTemperature,reqGender,reqEthnicity,reqAge,ReqPhonenumber, createdBy) {
  client.db('benr2423').collection('visitor').insertOne({
    "visitorname": reqVisitorname,
    "checkintime": reqCheckintime,
    "checkouttime": reqCheckouttime,
    "temperature":reqTemperature,
    "gender":reqGender,
    "ethnicity":reqEthnicity,
    "age":reqAge,
    "phonenumber":ReqPhonenumber,
    "createdBy": createdBy // Add the createdBy field with the username
  });
  return "visitor created";
}

const jwt = require('jsonwebtoken');

function generateToken(userData) {
  const token = jwt.sign(
    userData,
    'mypassword',
    { expiresIn: 60 }
  );

  console.log(token);
  return token;
}

function verifyToken(req, res, next) {
  let header = req.headers.authorization;
  if (!header) {
    res.status(401).send('Unauthorized');
    return;
  }

  let token = header.split(' ')[1];

  jwt.verify(token, 'mypassword', function (err, decoded) {
    if (err) {
      res.status(401).send('Unauthorized');
      return;
    }
    req.user = decoded;
    next();
  });
}

app.listen(3000, () => {
    console.log('Example app listening on port 3000');
  });