const skygear = require('skygear');

function after_XXX(req) {
    // 1. req.context.user: the user object from auth gear
    const user = req.context.user;
    // 2. req.body: the original payload from the request
    const body = req.body.json();
    
    console.log(user.disabled); // true
    console.log(body); // { "auth_id": "XXXX", "disabled": true, ... }
}

module.exports = skygear.auth.after_XXX(afterXXX);