const skygear = require('skygear');

/* 
 * user: user object to be saved
 * orgUser: original user object
 * currentUser: current exection user
 */
function before_XXX_sync(user, orgUser, currentUser) {
    console.log(user.profile.loveCat); // false
    
    // alter user profile
    user.profile.loveCat = true;
    
    /*
     * or rasie exception
     * throw new Error("some error");
     */

    // return updated user object
    return user;
}

module.exports = skygear.auth.before_XXX_sync(before_XXX_sync);