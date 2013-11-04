// Triggers EvalError in certain webkit based browsers.
// Triggers an error in Safari but not in latest Chrome or Firefox
eval.call({}, '1+1');
throw new EvalError('Custom EvalError');
