const mongoose = require('mongoose');
const router = require('express').Router();
const Habits = mongoose.model('Habits');

// this is required to couple a habit to a specific user
const Users = mongoose.model('Users');

const HabitPerformed = mongoose.model('HabitPerformed');

//POST new user route (optional, everyone has access)
router.get('/', (req, res, next) => {
  const id = req.query.id;
  console.log({ id: req.query })

  Habits.findOne({ _id: id })
    .then((habit) => {
      res.json(habit)
    })
    .catch((error) => {
      res.json({ status: 'error', message: error.message });
    })
});

router.get('/all', (req, res, next) => {

  Habits.find()
    .then((habits) => {
      res.json(habits)
    })
    .catch((error) => {
      res.json({ status: 'error', message: error.message });
    })
});

router.get('/getHabitIdsForUser', (req, res, next) => {
  console.log({ endpoint: '/getHabitIdsForUser', userId: req.query.userId });
  if (!req.query.userId || req.query.userId === '' || req.query.userId === null) {
    res.status(200).json([]);
  }
  Users
    .findOne({ _id: req.query.userId })
    .exec()
    .then(user => {
      res.status(200).json(user.habits);
    })
    .catch(err => {
      res.status(500).send(err);
    })
});

router.get('/getAllHabitsForUser', (req, res, next) => {
  console.log({ 'message': 'getAllHabitsForUser', userId: req.query.userId });
  // console.log(req.body);
  if (!req.query.userId || req.query.userId === '' || req.query.userId === null) {
    res.status(200).json([]);
  }

  Users.findOne({ _id: req.query.userId })
    .populate('habits')
    .exec()
    .then(user => {
      res.status(200).json(user.habits);
    })
    .catch(err => {
      res.status(500).send(err);
    });
});


router.delete('/delete', (req, res, next) => {
  console.log({ endpoint: '/delete', _id: req.query._id });
  if (!req.query.hasOwnProperty("_id")) {
    return res.status(404).json({ message: 'not found' })
  }
  if (req.query._id === null) {
    return res.status(404).json({ message: 'not found' })
  }

  Habits.findById(req.query._id, function (err, habit) {
    if (habit) {
      Habits.findByIdAndRemove(req.query._id, (err, habit) => {
        // As always, handle any potential errors:
        if (err) return res.status(500).send(err);
        // We'll create a simple object to send back with a message and the id of the document that was removed
        // You can really do this however you want, though.
        const response = {
          message: "Habit delete successfully"
        };
        return res.status(200).send(response);
      })
        .catch((err) => {
          console.log(err);
          return res.status(500).send(err)
        });
    } else {
      return res.status(404).json({ message: 'not found' })
    }
  })
});


router.post('/new', (req, res, next) => {

  // i need to find the user first
  const userId = req.body.userId;
  const habit = req.body.habit;

  console.log({ route: 'api/habit/new' })

  if (!habit || !userId) {
    throw new Error('Incomplete request');
  }

  console.log({ userId: userId, habit: habit });

  Users.findOne({ _id: userId })
    .then((user) => {

      console.info('found one_2');
      const newHabit = new Habits(habit);
      user.habits.push(newHabit);

      user.save()
        .then(
          () => {
            newHabit.save(() => {
              res.status(200).json({ habit: newHabit });
            });
          },
          (err) => {
            throw Error(err)

            console.error(err);
          }
        )
        .catch((error) => {
          console.error('onRejected function called: ' + error.message);
          res.json({ status: 'error', message: error.message });
        });
    })
    .catch((error) => {
      console.error('could not find user: ' + error.message);
      res.json({ status: 'error', message: error.message });
    });

  //
  // if(!habit) {
  //   throw new Error('Empty request');
  // }
  // const newHabit = new Habits(habit);
  //
  // newHabit.save()
  //   .then(() => {
  //     res.json({ habit: newHabit })
  //   })
  //   .catch((error) => {
  //     console.error( 'onRejected function called: ' + error.message );
  //     res.json({status: 'error', message: error.message});
  //   });
});

// copy of new before playing around with tying habits to user
// router.post('/new', (req, res, next) => {
//   const habit = req.body.habit;
//
//   console.log(habit);
//
//   if(!habit) {
//     throw new Error('Empty request');
//   }
//   const newHabit = new Habits(habit);
//
//   newHabit.save()
//     .then(() => {
//       res.json({ habit: newHabit })
//     })
//     .catch((error) => {
//       console.error( 'onRejected function called: ' + error.message );
//       res.json({status: 'error', message: error.message});
//     });
// });

router.put('/update', (req, res, next) => {
  const updatedHabit = req.body.habit;
  if (!updatedHabit) {
    throw new Error('Empty request');
  }
  Habits.findOne({ _id: updatedHabit._id })
    .then((dbHabit) => {
      console.log('trying to update habit');
      console.log({ dbHabit: dbHabit, updateHabit: updatedHabit });
      Object.assign(dbHabit, updatedHabit);
      dbHabit.save()
        .then(() => {
          res.json({ message: 'updated successfully', habit: dbHabit })
        })
        .catch((error) => {
          console.error('onRejected function called: ' + error.message);
          res.json({ status: 'error', message: error.message });
        });
    });
});

router.post('/habitPerformed', (req, res, next) => {
  const dayPerformed = req.body.dayPerformed;
  const habitId = req.body.habitId;

  if (!dayPerformed || !habitId) {
    throw new Error('Faulty request');
  }

  const newHabitPerformed = new HabitPerformed(dayPerformed);

  Habits.findOne({ _id: habitId })
    .then((habit) => {
      habit.daysPerformed.push(newHabitPerformed);
      habit.save()
        .then(() => {
          res.json({ message: 'added successfully', habit: habit, dayPerformed: newHabitPerformed })
        })
        .catch((error) => {
          res.json({ status: 'error', message: error.message });
        });
    });
});


var updateHabitFieldsfunciton

module.exports = router;
