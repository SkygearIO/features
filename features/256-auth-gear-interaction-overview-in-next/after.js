const skygear = require('skygear');

/* 
 * user: user object to be saved
 * currentUser: current exection user
 */
function after_XXX(user, currentUser) {    
    console.log(body); // { "loveCat": false }
    console.log(user.profile.loveCat); // true
    
    /*
     * or rasie exception
     * throw new Error("some error");
     */
}

module.exports = skygear.auth.after_XXX(after_XXX);