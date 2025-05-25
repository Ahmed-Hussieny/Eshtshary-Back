export const globalResponse = (err, req, res, next) => {
    console.error('Error occurred:', err);
    if(err){
        return res.status(err['cause'] || 500).json({
            success: false,
            message: err.message || 'Internal server error',
            status: err.status || 500,
            errLocation: err.stack || 'server'
        });
    }
    // next();
};