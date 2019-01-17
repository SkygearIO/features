// execute auth handler
resp, err = apiHandler.Handle(payload)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

// execute hooked before save Cloud Function
err = hookHandlers.ExecuteBeforeSaveUserSync(payload)
if err != nil {
    response.Err = skyerr.MakeError(err)
    h.TxContext.RollbackTx()
    return response
}

response.Result = resp
txContext.CommitTx();

// execute hooked after save Cloud Function
go hookHandlers.ExecuteAfterSaveUser(payload)
