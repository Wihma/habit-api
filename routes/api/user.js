const mongoose = require('mongoose');
const router = require('express').Router();
const Users = mongoose.model('Users');
const Habits = mongoose.model('Habits');

router.get('/test', (req, res, next) => {
  res.json(mongoose.modelNames());
})

//POST new user route (optional, everyone has access)
router.post('/', (req, res, next) => {
  // create new user
  const reqUser = req.body;
  console.log("in req");
  // validate parameters
  if (!reqUser) {
    return res.status(400).json({
      message: 'Empty request',
    });
  }
  if (!reqUser.email) {
    return res.status(400).json({
      message: 'Email required',
    });
  }
  if (!reqUser.password) {
    return res.status(400).json({
      message: 'Password required',
    });
  }
  if (!reqUser.username) {
    reqUser.username = reqUser.email
  }
  Users.findOne({ email: reqUser.email })
    .exec()
    .then(user => {
      console.log({ message: 'in findone', user: user })
      if (!user || user === null) {
        // create new user        
        const newUser = new Users(reqUser);

        let possiblePromise = newUser.setPassword(reqUser.password);;
        let isPromise = possiblePromise instanceof Promise;

        newUser.setPassword(reqUser.password);
        newUser.save()
          .then(() => res.status(200).json({ message: "User created successfully" }))
          .catch((err) => res.status(500).json(err));

      } else {
        res.status(400).json({ message: "Email already in use" })
      }
    })
    .catch(err => {
      res.status(500).json(err)
    });
});

// deletes user and all referenced habits
router.delete('/', (req, res, next) => {
  if (!req.query.hasOwnProperty("_id")) {
    res.status(404).json({
      message: "Not found"
    })
  }
  console.log({ "endpoint": "delete", _id: req.query._id })

  let userId = req.query._id;

  if (!userId) {
    res.status(404).json({
      message: "Not found"
    })
  }

  Users.findById({ _id: userId })
    .then((user) => {
      Habits.deleteMany({ _id: { $in: user.Habits } })
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
router.post('/login', (req, res, next) => {
  Users.findOne({ email: req.body.email })
    .exec()
    .then((user) => {
      if (!user) {
        res.status(404).json({ message: 'User not fond' })
      }
      if (user.validatePassword(req.body.password)) {
        const token = user.generateJWT();
        return res.status(200).json({
          message: "Auth Passed",
          userId: user._id,
          token: token
        })
      } else {
        return res.status(401).json({ message: "Could not log in" })
      }
    }).catch((error) => {
      return res.status(401).json({ message: "Auth Failed" })
    });
});

module.exports = router;
