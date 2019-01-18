const skygear = require('skygear');

function after_XXX(req) {
    // 1. req.context.user: the user object from auth gear
    const user = req.context.user;
    // 2. req.body: the original payload from the request
    const body = req.body.json();
    
    console.log(body); // { "loveCat": false }
    console.log(user.profile.loveCat); // true
    
    res.status(200);
}

module.exports = skygear.auth.after_XXX(afterXXX);