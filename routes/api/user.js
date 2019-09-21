const mongoose = require('mongoose');
const router = require('express').Router();
const auth = require('../auth');
const Users = mongoose.model('Users');
const Habits = mongoose.model('Habits');

//jwt stuff
const jwt = require("jsonwebtoken");

//passport stuff
const passport = require("passport");
const jwtStrategy  = require("./jwt")

passport.use(jwtStrategy);

router.get('/test', auth.optional, (req, res, next) => {
  res.json(mongoose.modelNames());
})

//POST new user route (optional, everyone has access)
router.post('/', auth.optional, (req, res, next) => {
  // create new user
  const user = req.body;
  if(!user) {
    throw new Error('Empty request');
  }
  Users.findOne({email: user.email})
    .then((user) => {
      if(user) {
        throw new Error('Email already exists');
      }
    }).then(function(){
      console.log('create user');
      if(!user.email) {
        return res.status(422).json({
          errors: {
            email: 'is required',
          },
        });
      }
      if(!user.password) {
        return res.status(422).json({
          errors: {
            password: 'is required',
          },
        });
      }
      const finalUser = new Users(user);

      finalUser.setPassword(user.password);

      return finalUser.save()
        .then(() => res.json({ user: finalUser.toAuthJSON() }));
     }, error => {
      console.error( 'onRejected function called: ' + error.message );
      res.json({status: 'error', message: error.message});
    });
});

// deletes user and all referenced habits
router.delete('/', (req, res, next)  => {  
  if(!req.query.hasOwnProperty("_id")) {
    res.status(404).json({
      message: "Not found"
    })
  }
  console.log({"endpoint": "delete", _id: req.query._id})

  let userId = req.query._id;

  if(!userId) {
    res.status(404).json({
      message: "Not found"
    })
  }

  Users.findById({_id: userId})
    .then((user) => {
      Habits.deleteMany({_id: {$in: user.Habits}})
        .then(() => {
          Users.findByIdAndRemove(userId)
            .then(() => {
              res.status(200).json({
                message: 'User deleted successfully'
              })
            })
        })
        .catch(err => {
          console.log(err)
        }) 
    });
})

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
  let { email, password } = req.body;
  //This lookup would normally be done using a database
  console.log({email: email, password: password});

  Users.findOne({email: email})
    .then((user) => {
      if(!user) {
        throw new Error('User not found');
      }
      if(user.validatePassword(password)) {
        const opts = {}
        opts.expiresIn = 120;  //token expires in 2min
        const secret = "SECRET_KEY" //normally stored in process.env.secret
        const token = jwt.sign({ email }, secret, opts);
        return res.status(200).json({
            message: "Auth Passed",
            userId: user._id,
            token: token
        })
      } else {
        return res.status(401).json({ message: "Auth Failed" })
      }
    }).catch((error) => {
      return res.status(401).json({ message: "Auth Failed" })
    });  
});

// router.get("/protected", (req, res) => {
//     return res.status(200).send("YAY! this is a protected Route")
// })

router.get("/protected", passport.authenticate('jwt', { session: false }), (req, res) => {
    return res.status(200).send("YAY! this is a protected Route")
})

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res, next) => {
  const { payload: { id } } = req;

  return Users.findById(id)
    .then((user) => {
      if(!user) {
        return res.sendStatus(400);
      }

      return res.json({ user: user.toAuthJSON() });
    });
});

module.exports = router;
