txContext.BeginTx()

resp, err := handle(payload, &user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

err = hooks.ExecuteBeforeHooks(&user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

// DB operation
err = userStore.update(user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

err = hooks.ExecuteAfterHooks(user)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

response.Result = resp
txContext.CommitTx();

return response