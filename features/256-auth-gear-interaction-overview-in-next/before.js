const skygear = require('skygear');

function before_update_user_sync(req, res) {
    // req.context.user: the user object in auth gear
    const user = req.context.user;
    
    if (!user.profile.loveCat) {
        res.status(500);
        res.send({ error: "EVERYONE SHOULD LOVE CAT" });
        return;
    }
    
    res.end();
}

module.exports = skygear.auth.before_update_user_sync(before_update_user_sync);