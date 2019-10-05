const mongoose = require('mongoose');
const { Schema } = mongoose;
const ObjectId = mongoose.Schema.Types.ObjectId

const HabitPerformed = new Schema({
  amount          :       {type: Number},
  comment         :       {type: String},
  time            :       {
    start : { type: Date },
    stop :  { type: Date}
  }
});

const HabitStatistics = new Schema({
  currentStreak   :       {type: Number},
  longestStreak   :       {type: Number}
});

const HabitsSchema = new Schema({
  name            :       {type: String},
  description     :       {type: String, required: true},
  active          :       {type: Boolean, required: true, default: true},
  selectedWeekdays :       {type: [String], required: true, default:[1,2,3,4,5,6,7]},
  time            :       {type: String, required: true},
  measureTime     :       {type: Boolean, required: true},
  measureWUnit    :       {type: Boolean, required: true},
  measureUnit     :       {type: String},
  daysPerformed   :       [HabitPerformed],
  statistics      :       HabitStatistics
  
});

mongoose.model('Habits', HabitsSchema);
mongoose.model('HabitPerformed', HabitPerformed);
mongoose.model('HabitStatistics', HabitStatistics);
